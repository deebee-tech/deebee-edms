import { FilterOperator, type ColumnType } from "./types.js";

export interface FilterOperatorDescriptor {
	key: FilterOperator;
	label: string;
	/** Which column types this operator applies to. */
	applicableTypes: ColumnType[];
	/** How many values the operator needs: 0 (null checks), 1 (default), 2 (between). */
	valueCount: 0 | 1 | 2;
}

export const FILTER_OPERATORS: FilterOperatorDescriptor[] = [
	{
		key: FilterOperator.Equals,
		label: "Equals",
		applicableTypes: ["text", "number", "date", "boolean"],
		valueCount: 1,
	},
	{
		key: FilterOperator.NotEquals,
		label: "Not equals",
		applicableTypes: ["text", "number", "date", "boolean"],
		valueCount: 1,
	},
	{
		key: FilterOperator.Contains,
		label: "Contains",
		applicableTypes: ["text"],
		valueCount: 1,
	},
	{
		key: FilterOperator.NotContains,
		label: "Does not contain",
		applicableTypes: ["text"],
		valueCount: 1,
	},
	{
		key: FilterOperator.StartsWith,
		label: "Starts with",
		applicableTypes: ["text"],
		valueCount: 1,
	},
	{
		key: FilterOperator.EndsWith,
		label: "Ends with",
		applicableTypes: ["text"],
		valueCount: 1,
	},
	{
		key: FilterOperator.Regex,
		label: "Matches regex",
		applicableTypes: ["text"],
		valueCount: 1,
	},
	{
		key: FilterOperator.GreaterThan,
		label: "Greater than",
		applicableTypes: ["number", "date"],
		valueCount: 1,
	},
	{
		key: FilterOperator.GreaterThanOrEquals,
		label: "Greater than or equals",
		applicableTypes: ["number", "date"],
		valueCount: 1,
	},
	{
		key: FilterOperator.LessThan,
		label: "Less than",
		applicableTypes: ["number", "date"],
		valueCount: 1,
	},
	{
		key: FilterOperator.LessThanOrEquals,
		label: "Less than or equals",
		applicableTypes: ["number", "date"],
		valueCount: 1,
	},
	{
		key: FilterOperator.Between,
		label: "Between",
		applicableTypes: ["number", "date"],
		valueCount: 2,
	},
	{
		key: FilterOperator.InList,
		label: "In list",
		applicableTypes: ["text", "number"],
		valueCount: 1,
	},
	{
		key: FilterOperator.IsNull,
		label: "Is empty",
		applicableTypes: ["text", "number", "date", "boolean"],
		valueCount: 0,
	},
	{
		key: FilterOperator.IsNotNull,
		label: "Is not empty",
		applicableTypes: ["text", "number", "date", "boolean"],
		valueCount: 0,
	},
];

const operatorMap = new Map(FILTER_OPERATORS.map((op) => [op.key, op]));

export function getOperatorDescriptor(key: FilterOperator): FilterOperatorDescriptor | undefined {
	return operatorMap.get(key);
}

export function getOperatorsForType(type: ColumnType): FilterOperatorDescriptor[] {
	return FILTER_OPERATORS.filter((op) => op.applicableTypes.includes(type));
}

export function getOperatorLabel(key: FilterOperator): string {
	return operatorMap.get(key)?.label ?? key;
}
