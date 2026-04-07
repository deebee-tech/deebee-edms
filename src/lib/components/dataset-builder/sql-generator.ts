import {
	DatabaseType,
	JoinOperator,
	OrderByDirection,
	JoinType as SqlEasyJoinType,
	WhereOperator,
} from "@deebeetech/sqleasy";
import { FilterOperator, type ColumnFilter, type FilterGroup } from "$lib/components/filter-builder/types.js";
import { createDialect } from "./dialect-factory";
import type { DatasetDefinition, DatasetField, DatasetTable, DbEngine, JoinType } from "./types";

export interface GeneratedSql {
	sql: string;
	rawSql: string;
	params: unknown[];
}

const joinTypeMap: Record<JoinType, SqlEasyJoinType> = {
	inner: SqlEasyJoinType.Inner,
	left: SqlEasyJoinType.Left,
	right: SqlEasyJoinType.Right,
	full: SqlEasyJoinType.FullOuter,
};

const filterOperatorMap: Record<string, WhereOperator | null> = {
	[FilterOperator.Equals]: WhereOperator.Equals,
	[FilterOperator.NotEquals]: WhereOperator.NotEquals,
	[FilterOperator.GreaterThan]: WhereOperator.GreaterThan,
	[FilterOperator.GreaterThanOrEquals]: WhereOperator.GreaterThanOrEquals,
	[FilterOperator.LessThan]: WhereOperator.LessThan,
	[FilterOperator.LessThanOrEquals]: WhereOperator.LessThanOrEquals,
};

function resolveAlias(field: DatasetField, tables: DatasetTable[]): string {
	const table = tables.find((t) => t.id === field.tableId);
	return table?.alias || table?.tableName || field.tableId;
}

function quoteIdentifier(name: string, delimiters: { begin: string; end: string }): string {
	return `${delimiters.begin}${name}${delimiters.end}`;
}

function resolveFilterColumn(
	compositeKey: string,
	tables: DatasetTable[],
): { alias: string; column: string } {
	const sepIdx = compositeKey.indexOf(":");
	if (sepIdx === -1) return { alias: compositeKey, column: compositeKey };
	const tableId = compositeKey.slice(0, sepIdx);
	const columnName = compositeKey.slice(sepIdx + 1);
	const table = tables.find((t) => t.id === tableId);
	return {
		alias: table?.alias || table?.tableName || tableId,
		column: columnName,
	};
}

function applyColumnFilter(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	builder: any,
	filter: ColumnFilter,
	tables: DatasetTable[],
	dbType: DatabaseType,
	delimiters: { begin: string; end: string },
	params: unknown[],
): void {
	const { alias, column: col } = resolveFilterColumn(filter.column, tables);
	const val = filter.value;
	const escaped = () => String(val).replace(/'/g, "''");
	const quotedCol = () =>
		`${quoteIdentifier(alias, delimiters)}.${quoteIdentifier(col, delimiters)}`;
	const likeOp = dbType === DatabaseType.Postgres ? "ILIKE" : "LIKE";

	const mapped = filterOperatorMap[filter.operator] ?? null;
	if (mapped !== null) {
		builder.where(alias, col, mapped, val);
		params.push(val);
		return;
	}

	switch (filter.operator) {
		case FilterOperator.Contains:
			builder.whereRaw(`${quotedCol()} ${likeOp} '%${escaped()}%'`);
			params.push(`%${val}%`);
			break;
		case FilterOperator.NotContains:
			builder.whereRaw(`${quotedCol()} NOT ${likeOp} '%${escaped()}%'`);
			params.push(`%${val}%`);
			break;
		case FilterOperator.StartsWith:
			builder.whereRaw(`${quotedCol()} ${likeOp} '${escaped()}%'`);
			params.push(`${val}%`);
			break;
		case FilterOperator.EndsWith:
			builder.whereRaw(`${quotedCol()} ${likeOp} '%${escaped()}'`);
			params.push(`%${val}`);
			break;
		case FilterOperator.Regex: {
			const regexOp = dbType === DatabaseType.Postgres ? "~" : "REGEXP";
			builder.whereRaw(`${quotedCol()} ${regexOp} '${escaped()}'`);
			params.push(val);
			break;
		}
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
		default:
			builder.where(alias, col, WhereOperator.Equals, val);
			params.push(val);
			break;
	}
}

function applyFilterGroups(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	builder: any,
	filterGroups: FilterGroup[],
	tables: DatasetTable[],
	dbType: DatabaseType,
	delimiters: { begin: string; end: string },
	params: unknown[],
): void {
	for (const group of filterGroups) {
		if (group.filters.length === 0) continue;

		if (group.logic === "or") {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			builder.whereGroup((gb: any) => {
				group.filters.forEach((f, i) => {
					if (i > 0) gb.or();
					applyColumnFilter(gb, f, tables, dbType, delimiters, params);
				});
			});
		} else {
			for (const f of group.filters) {
				applyColumnFilter(builder, f, tables, dbType, delimiters, params);
			}
		}
	}
}

export function generateSql(definition: DatasetDefinition): GeneratedSql {
	const { tables, joins, fields, filters } = definition;
	const engine: DbEngine = definition.engine ?? "postgres";

	if (tables.length === 0) {
		return { sql: "-- No tables selected", rawSql: "-- No tables selected", params: [] };
	}

	const sqlEasy = createDialect(engine);
	const builder = sqlEasy.newBuilder();
	const config = sqlEasy.configuration();
	const dbType = config.databaseType();
	const delimiters = config.identifierDelimiters();
	const params: unknown[] = [];

	const baseTable = tables[0];
	if (baseTable.schema) {
		builder.fromTableWithOwner(baseTable.schema, baseTable.tableName, baseTable.alias);
	} else {
		builder.fromTable(baseTable.tableName, baseTable.alias);
	}

	const joinedTableIds = new Set<string>([baseTable.id]);

	for (const join of joins) {
		const sourceTable = tables.find((t) => t.id === join.sourceTableId);
		const targetTable = tables.find((t) => t.id === join.targetTableId);
		if (!sourceTable || !targetTable) continue;

		joinedTableIds.add(join.sourceTableId);
		joinedTableIds.add(join.targetTableId);

		const sqleasyJoinType = joinTypeMap[join.joinType] ?? SqlEasyJoinType.Inner;
		const srcAlias = sourceTable.alias || sourceTable.tableName;
		const tgtAlias = targetTable.alias || targetTable.tableName;

		if (targetTable.schema) {
			builder.joinTableWithOwner(
				sqleasyJoinType,
				targetTable.schema,
				targetTable.tableName,
				tgtAlias,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(onBuilder: any) => {
					onBuilder.on(srcAlias, join.sourceColumn, JoinOperator.Equals, tgtAlias, join.targetColumn);
				},
			);
		} else {
			builder.joinTable(
				sqleasyJoinType,
				targetTable.tableName,
				tgtAlias,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(onBuilder: any) => {
					onBuilder.on(srcAlias, join.sourceColumn, JoinOperator.Equals, tgtAlias, join.targetColumn);
				},
			);
		}
	}

	for (const table of tables) {
		if (joinedTableIds.has(table.id)) continue;
		if (table.schema) {
			builder.fromTableWithOwner(table.schema, table.tableName, table.alias);
		} else {
			builder.fromTable(table.tableName, table.alias);
		}
		joinedTableIds.add(table.id);
	}

	const visibleFields = fields.filter((f) => f.visible);
	const hasAggregation = visibleFields.some((f) => f.aggregation);

	if (visibleFields.length === 0) {
		builder.selectAll();
	} else {
		for (const f of visibleFields) {
			const tableAlias = resolveAlias(f, tables);
			if (f.aggregation) {
				const aggFn = f.aggregation.toUpperCase();
				const colRef = `${quoteIdentifier(tableAlias, delimiters)}.${quoteIdentifier(f.columnName, delimiters)}`;
				const aliasExpr = f.alias ? ` AS ${quoteIdentifier(f.alias, delimiters)}` : "";
				builder.selectRaw(`${aggFn}(${colRef})${aliasExpr}`);
			} else {
				builder.selectColumn(tableAlias, f.columnName, f.alias ?? "");
			}
		}
	}

	applyFilterGroups(builder, filters, tables, dbType, delimiters, params);

	if (hasAggregation) {
		const nonAggFields = visibleFields.filter((f) => !f.aggregation);
		for (const f of nonAggFields) {
			const tableAlias = resolveAlias(f, tables);
			builder.groupByColumn(tableAlias, f.columnName);
		}
	}

	const sortedFields = visibleFields
		.filter((f) => f.sortDirection)
		.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	for (const f of sortedFields) {
		const tableAlias = resolveAlias(f, tables);
		const direction = f.sortDirection === "desc" ? OrderByDirection.Descending : OrderByDirection.Ascending;
		if (f.alias) {
			const orderRef = quoteIdentifier(f.alias, delimiters);
			builder.orderByRaw(`${orderRef} ${f.sortDirection === "desc" ? "DESC" : "ASC"}`);
		} else {
			builder.orderByColumn(tableAlias, f.columnName, direction);
		}
	}

	return {
		sql: builder.parse(),
		rawSql: builder.parseRaw(),
		params,
	};
}
