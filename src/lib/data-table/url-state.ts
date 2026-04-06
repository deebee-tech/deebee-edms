import { FilterOperator, type ColumnFilter, type DataProviderParams, type SortSpec } from "./types.js";

const FILTER_PREFIX = "f.";
const SORT_KEY = "sort";
const OFFSET_KEY = "offset";

/**
 * Serializes table state (filters + sort + offset) into URL search params.
 * Filter params: `f.column=operator:value` (e.g., `f.name=contains:test`)
 * Sort params: `sort=column:asc` or `sort=column:desc` (comma-separated for multi-sort)
 * Offset param: `offset=50`
 */
export function serializeTableState(
	params: Pick<DataProviderParams, "filters" | "sort" | "offset">,
	searchParams?: URLSearchParams,
): URLSearchParams {
	const sp = searchParams ? new URLSearchParams(searchParams) : new URLSearchParams();

	for (const key of [...sp.keys()]) {
		if (key.startsWith(FILTER_PREFIX) || key === SORT_KEY || key === OFFSET_KEY) {
			sp.delete(key);
		}
	}

	for (const filter of params.filters) {
		const key = `${FILTER_PREFIX}${filter.column}`;
		let value = `${filter.operator}:${filter.value ?? ""}`;
		if (filter.valueTo !== undefined) {
			value += `:${filter.valueTo}`;
		}
		sp.append(key, value);
	}

	if (params.sort.length > 0) {
		sp.set(
			SORT_KEY,
			params.sort.map((s) => `${s.column}:${s.ascending ? "asc" : "desc"}`).join(","),
		);
	}

	if (params.offset > 0) {
		sp.set(OFFSET_KEY, String(params.offset));
	}

	return sp;
}

/**
 * Deserializes table state from URL search params.
 * Returns filters, sort, and offset. Limit is not stored in URL (component decides).
 */
export function deserializeTableState(searchParams: URLSearchParams): Pick<DataProviderParams, "filters" | "sort" | "offset"> {
	const filters: ColumnFilter[] = [];
	const sort: SortSpec[] = [];

	for (const [key, raw] of searchParams.entries()) {
		if (!key.startsWith(FILTER_PREFIX)) continue;

		const column = key.slice(FILTER_PREFIX.length);
		const colonIdx = raw.indexOf(":");
		if (colonIdx === -1) continue;

		const operator = raw.slice(0, colonIdx) as FilterOperator;
		if (!Object.values(FilterOperator).includes(operator)) continue;

		const rest = raw.slice(colonIdx + 1);
		const parts = rest.split(":");
		const value = parts[0] ?? "";
		const valueTo = parts.length > 1 ? parts[1] : undefined;

		filters.push({
			id: `${column}-${operator}-${filters.length}`,
			column,
			operator,
			value,
			valueTo,
		});
	}

	const sortParam = searchParams.get(SORT_KEY);
	if (sortParam) {
		for (const part of sortParam.split(",")) {
			const [column, dir] = part.split(":");
			if (column) {
				sort.push({ column, ascending: dir !== "desc" });
			}
		}
	}

	const offset = parseInt(searchParams.get(OFFSET_KEY) ?? "0", 10) || 0;

	return { filters, sort, offset };
}
