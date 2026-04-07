import { createStaticProvider } from "$lib/components/data-table/providers/static-provider.js";
import {
	FilterOperator,
	type ColumnFilter,
	type DataProviderParams,
	type FilterGroup,
	type SortSpec,
} from "$lib/components/data-table/types.js";
import { OrderByDirection, PostgresSqlEasy, WhereOperator } from "@deebeetech/sqleasy";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { generateEmployees, type Employee } from "./sample-data.js";

const employees = generateEmployees(500);
const staticProvider = createStaticProvider<Employee>(employees);

function parseFilters(raw: unknown[]): ColumnFilter[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((f, i) => ({
		id: (f as ColumnFilter).id ?? `f-${i}`,
		column: (f as ColumnFilter).column ?? "",
		operator: (f as ColumnFilter).operator ?? FilterOperator.Equals,
		value: (f as ColumnFilter).value,
		valueTo: (f as ColumnFilter).valueTo,
	}));
}

function parseSorts(raw: unknown[]): SortSpec[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((s) => ({
		column: (s as SortSpec).column ?? "",
		ascending: (s as SortSpec).ascending ?? true,
	}));
}

function parseFilterGroups(raw: unknown[] | undefined): FilterGroup[] | undefined {
	if (!Array.isArray(raw) || raw.length === 0) return undefined;
	return raw.map((g) => ({
		logic: (g as FilterGroup).logic ?? "and",
		filters: parseFilters((g as FilterGroup).filters as unknown as unknown[]),
	}));
}

/**
 * Builds and returns the SQL that a SQLEasy provider would generate for this query.
 * Does NOT execute anything against a database -- purely for demonstration.
 */
function buildDemoSql(params: DataProviderParams): { dataSql: string; countSql: string } {
	const sqlEasy = new PostgresSqlEasy();
	const builder = sqlEasy.newBuilder();
	const alias = "e";

	builder
		.fromTable("employees", alias)
		.selectColumn(alias, "id", "")
		.selectColumn(alias, "name", "")
		.selectColumn(alias, "email", "")
		.selectColumn(alias, "department", "")
		.selectColumn(alias, "salary", "")
		.selectColumn(alias, "hire_date", "")
		.selectColumn(alias, "is_active", "")
		.selectColumn(alias, "notes", "");

	for (const f of params.filters) {
		applyFilterToBuilder(builder, alias, f);
	}

	for (const s of params.sort.length > 0 ? params.sort : [{ column: "id", ascending: true }]) {
		builder.orderByColumn(alias, s.column, s.ascending ? OrderByDirection.Ascending : OrderByDirection.Descending);
	}

	builder.limit(params.limit);
	builder.offset(params.offset);

	const countBuilder = sqlEasy.newBuilder();
	countBuilder.fromTable("employees", alias).selectRaw("COUNT(*) AS total_count");
	for (const f of params.filters) {
		applyFilterToBuilder(countBuilder, alias, f);
	}

	return {
		dataSql: builder.parseRaw(),
		countSql: countBuilder.parseRaw(),
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilterToBuilder(builder: any, alias: string, f: ColumnFilter) {
	switch (f.operator) {
		case FilterOperator.Equals:
			builder.where(alias, f.column, WhereOperator.Equals, f.value);
			break;
		case FilterOperator.NotEquals:
			builder.where(alias, f.column, WhereOperator.NotEquals, f.value);
			break;
		case FilterOperator.GreaterThan:
			builder.where(alias, f.column, WhereOperator.GreaterThan, f.value);
			break;
		case FilterOperator.LessThan:
			builder.where(alias, f.column, WhereOperator.LessThan, f.value);
			break;
		case FilterOperator.Contains:
			builder.whereRaw(`"${alias}"."${f.column}" ILIKE '%${String(f.value).replace(/'/g, "''")}%'`);
			break;
		case FilterOperator.Regex:
			builder.whereRaw(`"${alias}"."${f.column}" ~ '${String(f.value).replace(/'/g, "''")}'`);
			break;
		case FilterOperator.Between:
			builder.whereBetween(alias, f.column, f.value, f.valueTo);
			break;
		case FilterOperator.IsNull:
			builder.whereNull(alias, f.column);
			break;
		case FilterOperator.IsNotNull:
			builder.whereNotNull(alias, f.column);
			break;
		case FilterOperator.InList: {
			const list = Array.isArray(f.value)
				? f.value
				: String(f.value)
						.split(",")
						.map((s: string) => s.trim());
			builder.whereInValues(alias, f.column, list);
			break;
		}
	}
}

export const POST: RequestHandler = async ({ request, url }) => {
	const body = await request.json();
	const mode = url.searchParams.get("mode") ?? "api";

	const params: DataProviderParams = {
		filters: parseFilters(body.filters ?? []),
		filterGroups: parseFilterGroups(body.filterGroups),
		sort: parseSorts(body.sort ?? []),
		offset: Number(body.offset) || 0,
		limit: Number(body.limit) || 50,
	};

	const result = await staticProvider(params);

	if (mode === "sqleasy") {
		const sql = buildDemoSql(params);
		return json({
			...result,
			_sql: sql,
		});
	}

	return json(result);
};
