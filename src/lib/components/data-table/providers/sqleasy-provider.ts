import {
	OrderByDirection,
	WhereOperator,
	type IBuilder,
	type ISqlEasy,
	type RuntimeConfiguration,
} from "@deebeetech/sqleasy";
import {
	FilterOperator,
	type ColumnFilter,
	type DataProvider,
	type DataProviderParams,
	type SortSpec,
} from "../types.js";

/**
 * Executes a built SQL query. Receives the parameterized SQL, the raw SQL
 * (values inlined), and the ordered parameter values.
 */
export type QueryExecutor<T> = (query: {
	sql: string;
	rawSql: string;
	params: unknown[];
}) => Promise<{ rows: T[]; totalCount: number }>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySqlEasy = ISqlEasy<any, any, any, any>;
type AnySqlEasyConstructor = new (rc?: RuntimeConfiguration) => AnySqlEasy;

export interface SqlEasyProviderConfig<T> {
	/** The SQLEasy dialect class (PostgresSqlEasy, MysqlSqlEasy, etc.). */
	dialect: AnySqlEasyConstructor;
	table: string;
	/** Column names to select. */
	columns: string[];
	/** Optional schema/owner for the table. */
	schema?: string;
	/** Table alias used in generated SQL. Defaults to "t". */
	alias?: string;
	defaultSort?: SortSpec[];
	executor: QueryExecutor<T>;
}

function mapFilterOperator(op: FilterOperator): WhereOperator | null {
	switch (op) {
		case FilterOperator.Equals:
			return WhereOperator.Equals;
		case FilterOperator.NotEquals:
			return WhereOperator.NotEquals;
		case FilterOperator.GreaterThan:
			return WhereOperator.GreaterThan;
		case FilterOperator.GreaterThanOrEquals:
			return WhereOperator.GreaterThanOrEquals;
		case FilterOperator.LessThan:
			return WhereOperator.LessThan;
		case FilterOperator.LessThanOrEquals:
			return WhereOperator.LessThanOrEquals;
		default:
			return null;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBuilder = IBuilder<any, any, any>;

function applyFilter(builder: AnyBuilder, alias: string, filter: ColumnFilter, params: unknown[]): void {
	const col = filter.column;
	const val = filter.value;
	const mapped = mapFilterOperator(filter.operator);

	if (mapped !== null) {
		builder.where(alias, col, mapped, val);
		params.push(val);
		return;
	}

	switch (filter.operator) {
		case FilterOperator.Contains:
			builder.whereRaw(`"${alias}"."${col}" ILIKE '%${String(val).replace(/'/g, "''")}%'`);
			params.push(`%${val}%`);
			break;
		case FilterOperator.NotContains:
			builder.whereRaw(`"${alias}"."${col}" NOT ILIKE '%${String(val).replace(/'/g, "''")}%'`);
			params.push(`%${val}%`);
			break;
		case FilterOperator.StartsWith:
			builder.whereRaw(`"${alias}"."${col}" ILIKE '${String(val).replace(/'/g, "''")}%'`);
			params.push(`${val}%`);
			break;
		case FilterOperator.EndsWith:
			builder.whereRaw(`"${alias}"."${col}" ILIKE '%${String(val).replace(/'/g, "''")}'`);
			params.push(`%${val}`);
			break;
		case FilterOperator.Regex:
			builder.whereRaw(`"${alias}"."${col}" ~ '${String(val).replace(/'/g, "''")}'`);
			params.push(val);
			break;
		case FilterOperator.Between:
			builder.whereBetween(alias, col, val, filter.valueTo);
			params.push(val, filter.valueTo);
			break;
		case FilterOperator.InList: {
			const list = Array.isArray(val)
				? val
				: String(val)
						.split(",")
						.map((s) => s.trim());
			builder.whereInValues(alias, col, list);
			params.push(...list);
			break;
		}
		case FilterOperator.IsNull:
			builder.whereNull(alias, col);
			break;
		case FilterOperator.IsNotNull:
			builder.whereNotNull(alias, col);
			break;
	}
}

export function createSqlEasyProvider<T>(config: SqlEasyProviderConfig<T>): DataProvider<T> {
	return async (params: DataProviderParams) => {
		const { dialect: Dialect, table, columns, schema, alias = "t", defaultSort = [], executor } = config;
		const sqlEasy = new Dialect();
		const builder = sqlEasy.newBuilder();
		const trackedParams: unknown[] = [];

		if (schema) {
			builder.fromTableWithOwner(schema, table, alias);
		} else {
			builder.fromTable(table, alias);
		}

		for (const col of columns) {
			builder.selectColumn(alias, col, "");
		}

		for (const filter of params.filters) {
			applyFilter(builder, alias, filter, trackedParams);
		}

		if (params.filterGroups) {
			for (const group of params.filterGroups) {
				if (group.logic === "or" && group.filters.length > 0) {
					builder.whereGroup((gb: AnyBuilder) => {
						group.filters.forEach((f, i) => {
							if (i > 0) gb.or();
							applyFilter(gb, alias, f, trackedParams);
						});
					});
				} else {
					for (const f of group.filters) {
						applyFilter(builder, alias, f, trackedParams);
					}
				}
			}
		}

		const sorts = params.sort.length > 0 ? params.sort : defaultSort;
		for (const s of sorts) {
			builder.orderByColumn(alias, s.column, s.ascending ? OrderByDirection.Ascending : OrderByDirection.Descending);
		}

		builder.limit(params.limit);
		builder.offset(params.offset);

		const sql = builder.parse();
		const rawSql = builder.parseRaw();

		const countBuilder = sqlEasy.newBuilder();
		if (schema) {
			countBuilder.fromTableWithOwner(schema, table, alias);
		} else {
			countBuilder.fromTable(table, alias);
		}
		countBuilder.selectRaw("COUNT(*) AS total_count");

		const countParams: unknown[] = [];
		for (const filter of params.filters) {
			applyFilter(countBuilder, alias, filter, countParams);
		}
		if (params.filterGroups) {
			for (const group of params.filterGroups) {
				if (group.logic === "or" && group.filters.length > 0) {
					countBuilder.whereGroup((gb: AnyBuilder) => {
						group.filters.forEach((f, i) => {
							if (i > 0) gb.or();
							applyFilter(gb, alias, f, countParams);
						});
					});
				} else {
					for (const f of group.filters) {
						applyFilter(countBuilder, alias, f, countParams);
					}
				}
			}
		}

		const countSql = countBuilder.parse();
		const countRawSql = countBuilder.parseRaw();

		const result = await executor({
			sql: `${sql}\n--COUNT_QUERY--\n${countSql}`,
			rawSql: `${rawSql}\n--COUNT_QUERY--\n${countRawSql}`,
			params: [...trackedParams, ...countParams],
		});

		return {
			rows: result.rows,
			totalCount: result.totalCount,
			hasMore: params.offset + result.rows.length < result.totalCount,
		};
	};
}
