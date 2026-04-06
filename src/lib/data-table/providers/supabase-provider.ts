// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = { from: (...args: any[]) => any };
import { FilterOperator, type ColumnFilter, type DataProvider, type DataProviderParams, type SortSpec } from "../types.js";

export interface SupabaseProviderConfig {
	table: string;
	columns?: string;
	defaultSort?: SortSpec[];
	/** Supabase client instance. Accepts any Supabase client regardless of schema type. */
	client: AnySupabaseClient;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilter(query: any, filter: ColumnFilter) {
	const col = filter.column;
	const val = filter.value;

	switch (filter.operator) {
		case FilterOperator.Equals:
			return query.eq(col, val);
		case FilterOperator.NotEquals:
			return query.neq(col, val);
		case FilterOperator.Contains:
			return query.ilike(col, `%${val}%`);
		case FilterOperator.NotContains:
			return query.not(col, "ilike", `%${val}%`);
		case FilterOperator.StartsWith:
			return query.ilike(col, `${val}%`);
		case FilterOperator.EndsWith:
			return query.ilike(col, `%${val}`);
		case FilterOperator.Regex:
			return query.filter(col, "~", String(val));
		case FilterOperator.GreaterThan:
			return query.gt(col, val);
		case FilterOperator.GreaterThanOrEquals:
			return query.gte(col, val);
		case FilterOperator.LessThan:
			return query.lt(col, val);
		case FilterOperator.LessThanOrEquals:
			return query.lte(col, val);
		case FilterOperator.Between:
			return query.gte(col, val).lte(col, filter.valueTo);
		case FilterOperator.InList: {
			const list = Array.isArray(val) ? val : String(val).split(",").map((s) => s.trim());
			return query.in(col, list);
		}
		case FilterOperator.IsNull:
			return query.is(col, null);
		case FilterOperator.IsNotNull:
			return query.not(col, "is", null);
		default:
			return query;
	}
}

export function createSupabaseProvider<T>(
	config: SupabaseProviderConfig,
): DataProvider<T> {
	return async (params: DataProviderParams) => {
		const { client, table, columns = "*", defaultSort = [] } = config;

		let query = client.from(table).select(columns, { count: "exact" });

		for (const filter of params.filters) {
			query = applyFilter(query, filter);
		}

		if (params.filterGroups) {
			for (const group of params.filterGroups) {
				if (group.logic === "or" && group.filters.length > 0) {
					const orParts = group.filters.map((f) => {
						switch (f.operator) {
							case FilterOperator.Equals:
								return `${f.column}.eq.${f.value}`;
							case FilterOperator.Contains:
								return `${f.column}.ilike.%${f.value}%`;
							case FilterOperator.Regex:
								return `${f.column}.match.${f.value}`;
							case FilterOperator.IsNull:
								return `${f.column}.is.null`;
							case FilterOperator.IsNotNull:
								return `${f.column}.not.is.null`;
							default:
								return `${f.column}.eq.${f.value}`;
						}
					});
					query = query.or(orParts.join(","));
				} else {
					for (const f of group.filters) {
						query = applyFilter(query, f);
					}
				}
			}
		}

		const sorts = params.sort.length > 0 ? params.sort : defaultSort;
		for (const s of sorts) {
			query = query.order(s.column, { ascending: s.ascending });
		}

		query = query.range(params.offset, params.offset + params.limit - 1);

		const { data, error, count } = await query;

		if (error) {
			throw new Error(`Supabase query failed on "${table}": ${error.message}`);
		}

		const rows = (data ?? []) as unknown as T[];
		const totalCount = count ?? rows.length;

		return {
			rows,
			totalCount,
			hasMore: params.offset + rows.length < totalCount,
		};
	};
}
