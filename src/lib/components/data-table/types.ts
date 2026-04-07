// Re-export filter types from the shared filter-builder module
export {
	FilterOperator,
	type ColumnFilter,
	type ColumnMeta,
	type ColumnType,
	type FilterGroup,
	type FilterGroupLogic,
} from "$lib/components/filter-builder/types.js";

// ── Sort types ──

export interface SortSpec {
	column: string;
	ascending: boolean;
}

// ── DataProvider contract ──

export interface DataProviderParams {
	filters: import("$lib/components/filter-builder/types.js").ColumnFilter[];
	filterGroups?: import("$lib/components/filter-builder/types.js").FilterGroup[];
	sort: SortSpec[];
	offset: number;
	limit: number;
}

export interface DataProviderResult<T> {
	rows: T[];
	totalCount: number;
	hasMore: boolean;
}

/**
 * A DataProvider is the single function the table calls to fetch data.
 * Each implementation translates generic filter/sort/pagination params
 * into whatever query mechanism the underlying data source requires.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataProvider<T = any> = (params: DataProviderParams) => Promise<DataProviderResult<T>>;
