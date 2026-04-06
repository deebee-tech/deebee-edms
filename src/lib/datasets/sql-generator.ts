import type { DatasetDefinition, DatasetTable, DatasetJoin, DatasetField, DatasetFilter } from "./types";

export interface GeneratedSql {
	sql: string;
	params: unknown[];
}

function quoteId(name: string): string {
	return `"${name.replace(/"/g, '""')}"`;
}

function escapeValue(val: string): string {
	return val.replace(/'/g, "''");
}

function getTableRef(table: DatasetTable): string {
	const schemaPrefix = table.schema ? `${quoteId(table.schema)}.` : "";
	const alias = table.alias !== table.tableName ? ` AS ${quoteId(table.alias)}` : "";
	return `${schemaPrefix}${quoteId(table.tableName)}${alias}`;
}

function getColumnRef(field: DatasetField, tables: DatasetTable[]): string {
	const table = tables.find((t) => t.id === field.tableId);
	const tableAlias = table ? quoteId(table.alias || table.tableName) : quoteId(field.tableId);
	return `${tableAlias}.${quoteId(field.columnName)}`;
}

function buildJoinClause(join: DatasetJoin, tables: DatasetTable[]): string {
	const sourceTable = tables.find((t) => t.id === join.sourceTableId);
	const targetTable = tables.find((t) => t.id === join.targetTableId);
	if (!sourceTable || !targetTable) return "";

	const joinTypeMap: Record<string, string> = {
		inner: "INNER JOIN",
		left: "LEFT JOIN",
		right: "RIGHT JOIN",
		full: "FULL OUTER JOIN",
	};

	const joinKeyword = joinTypeMap[join.joinType] || "INNER JOIN";
	const targetRef = getTableRef(targetTable);
	const sourceAlias = quoteId(sourceTable.alias || sourceTable.tableName);
	const targetAlias = quoteId(targetTable.alias || targetTable.tableName);

	return `${joinKeyword} ${targetRef} ON ${sourceAlias}.${quoteId(join.sourceColumn)} = ${targetAlias}.${quoteId(join.targetColumn)}`;
}

function buildFilterClause(filter: DatasetFilter, tables: DatasetTable[]): string {
	const table = tables.find((t) => t.id === filter.tableId);
	const tableAlias = table ? quoteId(table.alias || table.tableName) : quoteId(filter.tableId);
	const col = `${tableAlias}.${quoteId(filter.columnName)}`;
	const val = `'${escapeValue(filter.value)}'`;

	switch (filter.operator) {
		case "eq":
			return `${col} = ${val}`;
		case "neq":
			return `${col} != ${val}`;
		case "gt":
			return `${col} > ${val}`;
		case "gte":
			return `${col} >= ${val}`;
		case "lt":
			return `${col} < ${val}`;
		case "lte":
			return `${col} <= ${val}`;
		case "contains":
			return `${col} ILIKE '%${escapeValue(filter.value)}%'`;
		case "is_null":
			return `${col} IS NULL`;
		case "is_not_null":
			return `${col} IS NOT NULL`;
		default:
			return `${col} = ${val}`;
	}
}

export function generateSql(definition: DatasetDefinition): GeneratedSql {
	const { tables, joins, fields, filters } = definition;

	if (tables.length === 0) {
		return { sql: "-- No tables selected", params: [] };
	}

	const visibleFields = fields.filter((f) => f.visible);
	const hasAggregation = visibleFields.some((f) => f.aggregation);

	// SELECT clause
	let selectParts: string[];
	if (visibleFields.length === 0) {
		selectParts = ["*"];
	} else {
		selectParts = visibleFields.map((f) => {
			const colRef = getColumnRef(f, tables);
			let expr = colRef;

			if (f.aggregation) {
				expr = `${f.aggregation.toUpperCase()}(${colRef})`;
			}

			if (f.alias) {
				expr += ` AS ${quoteId(f.alias)}`;
			}

			return expr;
		});
	}

	const selectClause = `SELECT\n  ${selectParts.join(",\n  ")}`;

	// FROM clause - first table is the base
	const baseTable = tables[0];
	const fromClause = `FROM ${getTableRef(baseTable)}`;

	// JOIN clauses
	const joinedTableIds = new Set<string>([baseTable.id]);
	const joinClauses: string[] = [];

	for (const join of joins) {
		const targetId =
			joinedTableIds.has(join.sourceTableId) ? join.targetTableId : join.sourceTableId;
		joinedTableIds.add(join.sourceTableId);
		joinedTableIds.add(targetId);
		joinClauses.push(buildJoinClause(join, tables));
	}

	// Add any tables that aren't joined (cross join / comma-separated)
	for (const table of tables) {
		if (!joinedTableIds.has(table.id)) {
			joinClauses.push(`, ${getTableRef(table)}`);
			joinedTableIds.add(table.id);
		}
	}

	// WHERE clause
	const whereParts: string[] = [];
	const andFilters = filters.filter((f) => f.logic === "and");
	const orFilters = filters.filter((f) => f.logic === "or");

	for (const f of andFilters) {
		whereParts.push(buildFilterClause(f, tables));
	}

	if (orFilters.length > 0) {
		const orParts = orFilters.map((f) => buildFilterClause(f, tables));
		whereParts.push(`(${orParts.join(" OR ")})`);
	}

	const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join("\n  AND ")}` : "";

	// GROUP BY clause (needed when mixing aggregated and non-aggregated fields)
	let groupByClause = "";
	if (hasAggregation) {
		const nonAggFields = visibleFields.filter((f) => !f.aggregation);
		if (nonAggFields.length > 0) {
			const groupByCols = nonAggFields.map((f) => getColumnRef(f, tables));
			groupByClause = `GROUP BY ${groupByCols.join(", ")}`;
		}
	}

	// ORDER BY clause
	const sortedFields = visibleFields
		.filter((f) => f.sortDirection)
		.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

	let orderByClause = "";
	if (sortedFields.length > 0) {
		const orderParts = sortedFields.map((f) => {
			const colRef = f.alias ? quoteId(f.alias) : getColumnRef(f, tables);
			return `${colRef} ${f.sortDirection?.toUpperCase() ?? "ASC"}`;
		});
		orderByClause = `ORDER BY ${orderParts.join(", ")}`;
	}

	const parts = [selectClause, fromClause, ...joinClauses, whereClause, groupByClause, orderByClause].filter(Boolean);

	return {
		sql: parts.join("\n"),
		params: [],
	};
}
