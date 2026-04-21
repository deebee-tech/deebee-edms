import type { AuditLogEntry, AuditRecord, AuditValue, FieldDiff, FieldStatus } from "./types.js";

/**
 * The "state of the record at this point in time" as captured by the entry.
 * For `update` and `create` entries this is `after`. For `delete` entries —
 * where `after` is null — we fall back to `before` so the user can still see
 * the last known state of the record.
 */
export function snapshotForEntry(entry: AuditLogEntry): AuditRecord {
	return entry.after ?? entry.before ?? {};
}

/**
 * Strict-ish equality for `AuditValue`s. `NaN === NaN` is treated as true so
 * NaN-tainted numeric snapshots don't false-positive as a change every time.
 */
function valuesEqual(a: AuditValue | undefined, b: AuditValue | undefined): boolean {
	if (a === b) return true;
	if (typeof a === "number" && typeof b === "number" && Number.isNaN(a) && Number.isNaN(b)) return true;
	return false;
}

const STATUS_ORDER: Record<FieldStatus, number> = {
	changed: 0,
	added: 1,
	removed: 2,
	unchanged: 3,
};

/**
 * Diff two flat snapshots. The result is the union of keys, classified per
 * `FieldStatus`, and stable-sorted: changed → added → removed → unchanged,
 * then alphabetical inside each bucket.
 */
export function diffSnapshots(left: AuditRecord, right: AuditRecord): FieldDiff[] {
	const keys = new Set<string>();
	for (const k of Object.keys(left)) keys.add(k);
	for (const k of Object.keys(right)) keys.add(k);

	const diffs: FieldDiff[] = [];
	for (const field of keys) {
		const hasLeft = Object.prototype.hasOwnProperty.call(left, field);
		const hasRight = Object.prototype.hasOwnProperty.call(right, field);
		const leftValue = hasLeft ? left[field] : undefined;
		const rightValue = hasRight ? right[field] : undefined;

		let status: FieldStatus;
		if (hasLeft && hasRight) {
			status = valuesEqual(leftValue, rightValue) ? "unchanged" : "changed";
		} else if (hasRight) {
			status = "added";
		} else {
			status = "removed";
		}

		diffs.push({ field, status, left: leftValue, right: rightValue });
	}

	diffs.sort((a, b) => {
		const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
		if (byStatus !== 0) return byStatus;
		return a.field.localeCompare(b.field);
	});

	return diffs;
}

export interface DiffSummary {
	changed: number;
	added: number;
	removed: number;
	unchanged: number;
	/** Sum of changed + added + removed — useful for badge counts. */
	totalChanges: number;
}

export function summarizeDiff(diffs: FieldDiff[]): DiffSummary {
	const out: DiffSummary = { changed: 0, added: 0, removed: 0, unchanged: 0, totalChanges: 0 };
	for (const d of diffs) out[d.status]++;
	out.totalChanges = out.changed + out.added + out.removed;
	return out;
}

/**
 * Returns the number of fields that differ between an entry's `before` and
 * `after` snapshots. Useful for the activity table.
 */
export function fieldsChangedInEntry(entry: AuditLogEntry): number {
	const before = entry.before ?? {};
	const after = entry.after ?? {};
	return summarizeDiff(diffSnapshots(before, after)).totalChanges;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Stringify an `AuditValue` for display. `null`/missing renders as a faint
 * sentinel; ISO date strings are normalized to `YYYY-MM-DD HH:mm` when they
 * carry a time. Booleans render as `true`/`false`.
 */
export function formatValue(value: AuditValue | undefined): string {
	if (value === undefined) return "—";
	if (value === null) return "null";
	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "number") return Number.isFinite(value) ? String(value) : String(value);
	if (typeof value === "string") {
		if (value === "") return '""';
		if (ISO_DATE_RE.test(value)) {
			const d = new Date(value);
			if (!Number.isNaN(d.getTime())) {
				const pad = (n: number) => n.toString().padStart(2, "0");
				const y = d.getFullYear();
				const m = pad(d.getMonth() + 1);
				const day = pad(d.getDate());
				const hasTime = /[T ]\d{2}:\d{2}/.test(value);
				if (!hasTime) return `${y}-${m}-${day}`;
				return `${y}-${m}-${day} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
			}
		}
		return value;
	}
	return String(value);
}

/**
 * Sort entries newest-first by `changedAt`. Stable for equal timestamps.
 */
export function sortEntriesNewestFirst(entries: AuditLogEntry[]): AuditLogEntry[] {
	return [...entries].sort((a, b) => {
		const at = Date.parse(a.changedAt);
		const bt = Date.parse(b.changedAt);
		if (Number.isFinite(at) && Number.isFinite(bt) && at !== bt) return bt - at;
		return b.changedAt.localeCompare(a.changedAt);
	});
}
