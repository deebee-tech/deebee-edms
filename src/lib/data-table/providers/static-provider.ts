import { FilterOperator, type ColumnFilter, type DataProvider, type DataProviderParams, type SortSpec } from "../types.js";

export interface StaticProviderConfig {
	defaultSort?: SortSpec[];
}

function matchesFilter(row: Record<string, unknown>, filter: ColumnFilter): boolean {
	const raw = row[filter.column];
	const val = filter.value;

	switch (filter.operator) {
		case FilterOperator.Equals:
			return String(raw) === String(val);
		case FilterOperator.NotEquals:
			return String(raw) !== String(val);
		case FilterOperator.Contains:
			return raw != null && String(raw).toLowerCase().includes(String(val).toLowerCase());
		case FilterOperator.NotContains:
			return raw == null || !String(raw).toLowerCase().includes(String(val).toLowerCase());
		case FilterOperator.StartsWith:
			return raw != null && String(raw).toLowerCase().startsWith(String(val).toLowerCase());
		case FilterOperator.EndsWith:
			return raw != null && String(raw).toLowerCase().endsWith(String(val).toLowerCase());
		case FilterOperator.Regex:
			try {
				return raw != null && new RegExp(String(val), "i").test(String(raw));
			} catch {
				return false;
			}
		case FilterOperator.GreaterThan:
			return raw != null && compareValues(raw, val, true) > 0;
		case FilterOperator.GreaterThanOrEquals:
			return raw != null && compareValues(raw, val, true) >= 0;
		case FilterOperator.LessThan:
			return raw != null && compareValues(raw, val, true) < 0;
		case FilterOperator.LessThanOrEquals:
			return raw != null && compareValues(raw, val, true) <= 0;
		case FilterOperator.Between:
			return raw != null && compareValues(raw, val, true) >= 0 && compareValues(raw, filter.valueTo, true) <= 0;
		case FilterOperator.InList: {
			const list = Array.isArray(val) ? val : String(val).split(",").map((s) => s.trim());
			return list.some((v) => String(v) === String(raw));
		}
		case FilterOperator.IsNull:
			return raw == null || raw === "";
		case FilterOperator.IsNotNull:
			return raw != null && raw !== "";
		default:
			return true;
	}
}

function compareValues(a: unknown, b: unknown, ascending: boolean): number {
	if (a == null && b == null) return 0;
	if (a == null) return ascending ? -1 : 1;
	if (b == null) return ascending ? 1 : -1;

	const dir = ascending ? 1 : -1;

	if (typeof a === "number" && typeof b === "number") return (a - b) * dir;
	if (typeof a === "boolean" && typeof b === "boolean") return (Number(a) - Number(b)) * dir;

	return String(a).localeCompare(String(b)) * dir;
}

export function createStaticProvider<T extends Record<string, unknown> = Record<string, unknown>>(
	data: T[],
	config?: StaticProviderConfig,
): DataProvider<T> {
	return async (params: DataProviderParams) => {
		let filtered = [...data];

		for (const filter of params.filters) {
			filtered = filtered.filter((row) => matchesFilter(row, filter));
		}

		if (params.filterGroups) {
			for (const group of params.filterGroups) {
				if (group.logic === "or") {
					filtered = filtered.filter((row) => group.filters.some((f) => matchesFilter(row, f)));
				} else {
					for (const f of group.filters) {
						filtered = filtered.filter((row) => matchesFilter(row, f));
					}
				}
			}
		}

		const sorts = params.sort.length > 0 ? params.sort : (config?.defaultSort ?? []);
		if (sorts.length > 0) {
			filtered.sort((a, b) => {
				for (const s of sorts) {
					const cmp = compareValues(a[s.column], b[s.column], s.ascending);
					if (cmp !== 0) return cmp;
				}
				return 0;
			});
		}

		const totalCount = filtered.length;
		const rows = filtered.slice(params.offset, params.offset + params.limit);

		return {
			rows,
			totalCount,
			hasMore: params.offset + rows.length < totalCount,
		};
	};
}
