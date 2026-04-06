// ── Column type hints (used by filter UI to show appropriate operators) ──

export type ColumnType = "text" | "number" | "date" | "boolean";

export interface ColumnMeta {
	/** The key/accessor used to look up the value in a row object. */
	key: string;
	/** Human-readable column label (used in filter chips, builder). */
	label: string;
	/** Determines which filter operators are offered. */
	type: ColumnType;
	/** Whether this column is filterable at all. Defaults to `true`. */
	filterable?: boolean;
	/** Whether this column is sortable. Defaults to `true`. */
	sortable?: boolean;
}

// ── Filter types ──

export enum FilterOperator {
	Equals = "eq",
	NotEquals = "neq",
	Contains = "contains",
	NotContains = "not_contains",
	StartsWith = "starts_with",
	EndsWith = "ends_with",
	Regex = "regex",
	GreaterThan = "gt",
	GreaterThanOrEquals = "gte",
	LessThan = "lt",
	LessThanOrEquals = "lte",
	Between = "between",
	InList = "in",
	IsNull = "is_null",
	IsNotNull = "is_not_null",
}

export interface ColumnFilter {
	id: string;
	column: string;
	operator: FilterOperator;
	value: unknown;
	/** Second value for range operators like `between`. */
	valueTo?: unknown;
}

export type FilterGroupLogic = "and" | "or";

export interface FilterGroup {
	logic: FilterGroupLogic;
	filters: ColumnFilter[];
}

// ── Sort types ──

export interface SortSpec {
	column: string;
	ascending: boolean;
}

// ── DataProvider contract ──

export interface DataProviderParams {
	filters: ColumnFilter[];
	filterGroups?: FilterGroup[];
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
