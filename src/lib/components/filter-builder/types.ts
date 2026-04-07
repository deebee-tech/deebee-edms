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
