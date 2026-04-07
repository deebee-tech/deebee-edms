// ── Schema introspection types ──

export type DbEngine = "postgres" | "mysql" | "mssql" | "sqlite";

export interface DbConnectionConfig {
	host: string;
	port: number;
	database: string;
	username: string;
	password: string;
	schema?: string;
	ssl?: boolean;
}

export interface SchemaColumn {
	name: string;
	dataType: string;
	nullable: boolean;
	isPrimaryKey: boolean;
	defaultValue?: string;
}

export interface SchemaForeignKey {
	columnName: string;
	referencedTable: string;
	referencedColumn: string;
	referencedSchema?: string;
}

export interface SchemaTable {
	schema: string;
	name: string;
	type: "table" | "view";
	columns: SchemaColumn[];
	foreignKeys: SchemaForeignKey[];
}

export interface SchemaData {
	tables: SchemaTable[];
}

// ── Dataset definition types ──

export type JoinType = "inner" | "left" | "right" | "full";
export type AggregationType = "count" | "sum" | "avg" | "min" | "max";
export type SortDirection = "asc" | "desc";

export interface DatasetTable {
	id: string;
	schema: string;
	tableName: string;
	alias: string;
	position: { x: number; y: number };
}

export interface DatasetJoin {
	id: string;
	sourceTableId: string;
	sourceColumn: string;
	targetTableId: string;
	targetColumn: string;
	joinType: JoinType;
}

export interface DatasetField {
	id: string;
	tableId: string;
	columnName: string;
	alias?: string;
	visible: boolean;
	aggregation?: AggregationType;
	sortDirection?: SortDirection;
	sortOrder?: number;
}

export type { FilterGroup } from "$lib/components/filter-builder/types.js";

/** @deprecated Use `FilterGroup` from the shared filter-builder module instead. */
export interface LegacyDatasetFilter {
	id: string;
	tableId: string;
	columnName: string;
	operator: string;
	value: string;
	logic: "and" | "or";
}

export interface DatasetSort {
	fieldId: string;
	direction: SortDirection;
	order: number;
}

export interface DatasetDefinition {
	id: string;
	name: string;
	description?: string;
	version: number;
	engine?: DbEngine;
	tables: DatasetTable[];
	joins: DatasetJoin[];
	fields: DatasetField[];
	filters: import("$lib/components/filter-builder/types.js").FilterGroup[];
	sort: DatasetSort[];
	viewport?: { x: number; y: number; zoom: number };
}
