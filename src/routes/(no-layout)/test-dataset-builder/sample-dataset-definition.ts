import type { DatasetDefinition } from "$lib/components/dataset-builder/types";
import { FilterOperator } from "$lib/components/filter-builder/types";

export const sampleDatasetDefinition: DatasetDefinition = {
	id: "sample-dataset-1",
	name: "Employee Department Report",
	description: "Lists employees with their department info, filtered to high earners",
	version: 1,
	tables: [
		{
			id: "tbl-employees",
			schema: "public",
			tableName: "employees",
			alias: "employees",
			position: { x: 50, y: 80 },
		},
		{
			id: "tbl-departments",
			schema: "public",
			tableName: "departments",
			alias: "departments",
			position: { x: 400, y: 80 },
		},
	],
	joins: [
		{
			id: "j-emp-dept",
			sourceTableId: "tbl-employees",
			sourceColumn: "department_id",
			targetTableId: "tbl-departments",
			targetColumn: "id",
			joinType: "inner",
		},
	],
	fields: [
		{
			id: "f-first",
			tableId: "tbl-employees",
			columnName: "first_name",
			visible: true,
		},
		{
			id: "f-last",
			tableId: "tbl-employees",
			columnName: "last_name",
			visible: true,
			sortDirection: "asc",
			sortOrder: 1,
		},
		{
			id: "f-email",
			tableId: "tbl-employees",
			columnName: "email",
			visible: true,
		},
		{
			id: "f-dept",
			tableId: "tbl-departments",
			columnName: "name",
			alias: "department",
			visible: true,
		},
		{
			id: "f-salary",
			tableId: "tbl-employees",
			columnName: "salary",
			visible: true,
			sortDirection: "desc",
			sortOrder: 2,
		},
		{
			id: "f-hire",
			tableId: "tbl-employees",
			columnName: "hire_date",
			visible: true,
		},
	],
	filters: [
		{
			logic: "and",
			filters: [
				{
					id: "filter-salary",
					column: "tbl-employees:salary",
					operator: FilterOperator.GreaterThan,
					value: "50000",
				},
				{
					id: "filter-active",
					column: "tbl-employees:is_active",
					operator: FilterOperator.Equals,
					value: "true",
				},
			],
		},
	],
	sort: [],
};
