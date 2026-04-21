// ── Audit Log Viewer JSON model ──
//
// This mirrors a future Supabase schema:
//   audit_log_entry (id, record_id, record_type, action, changed_at,
//                    changed_by_id, changed_by_name, changed_by_email,
//                    reason, before, after)
// where `before` and `after` are JSONB snapshots of the record at that point
// in time. The component is JSON-in / callback-out so it has no opinion on
// where the rows actually live.

export type AuditValue = string | number | boolean | null;

/**
 * A flat snapshot of a record. Nested objects and arrays are deliberately
 * out of scope for the v1 viewer — every diff cell is a single primitive.
 */
export type AuditRecord = Record<string, AuditValue>;

export type AuditAction = "create" | "update" | "delete";

export interface AuditActor {
	id: string;
	name: string;
	email?: string;
}

/**
 * A single mutation captured in the audit log.
 *
 * - `create` entries should have `before === null` and a populated `after`.
 * - `delete` entries should have a populated `before` and `after === null`.
 * - `update` entries should have both populated; the diff engine still
 *   tolerates one-sided entries by falling back to whichever side is present.
 */
export interface AuditLogEntry {
	id: string;
	recordId: string;
	recordType: string;
	action: AuditAction;
	/** ISO 8601 timestamp. */
	changedAt: string;
	changedBy: AuditActor;
	/** Optional commit-message-style note. */
	reason?: string;
	before: AuditRecord | null;
	after: AuditRecord | null;
}

/**
 * The full audit trail for a single record. Entries can be in any order; the
 * viewer sorts them descending by `changedAt` for display.
 */
export interface AuditLog {
	recordId: string;
	recordType: string;
	entries: AuditLogEntry[];
}

// ── Diff shape produced by the engine for the side-by-side view ──

export type FieldStatus = "unchanged" | "changed" | "added" | "removed";

export interface FieldDiff {
	field: string;
	status: FieldStatus;
	/** `undefined` means the key is absent on that side entirely. */
	left: AuditValue | undefined;
	right: AuditValue | undefined;
}

// ── Helpers ──

export function createEmptyAuditLog(recordId = "record-1", recordType = "record"): AuditLog {
	return {
		recordId,
		recordType,
		entries: [],
	};
}

function isAuditValue(value: unknown): value is AuditValue {
	return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isAuditRecord(value: unknown): value is AuditRecord {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	for (const v of Object.values(value as Record<string, unknown>)) {
		if (!isAuditValue(v)) return false;
	}
	return true;
}

function isAuditActor(value: unknown): value is AuditActor {
	if (!value || typeof value !== "object") return false;
	const a = value as Partial<AuditActor>;
	if (typeof a.id !== "string" || !a.id) return false;
	if (typeof a.name !== "string") return false;
	if (a.email !== undefined && typeof a.email !== "string") return false;
	return true;
}

function isAuditLogEntry(value: unknown): value is AuditLogEntry {
	if (!value || typeof value !== "object") return false;
	const e = value as Partial<AuditLogEntry>;
	if (typeof e.id !== "string" || !e.id) return false;
	if (typeof e.recordId !== "string" || !e.recordId) return false;
	if (typeof e.recordType !== "string" || !e.recordType) return false;
	if (e.action !== "create" && e.action !== "update" && e.action !== "delete") return false;
	if (typeof e.changedAt !== "string" || !e.changedAt) return false;
	if (!isAuditActor(e.changedBy)) return false;
	if (e.reason !== undefined && typeof e.reason !== "string") return false;
	if (e.before !== null && !isAuditRecord(e.before)) return false;
	if (e.after !== null && !isAuditRecord(e.after)) return false;
	return true;
}

/**
 * Validate a payload as an `AuditLog`.
 */
export function isValidAuditLog(value: unknown): value is AuditLog {
	if (!value || typeof value !== "object") return false;
	const v = value as Partial<AuditLog>;
	if (typeof v.recordId !== "string" || !v.recordId) return false;
	if (typeof v.recordType !== "string" || !v.recordType) return false;
	if (!Array.isArray(v.entries)) return false;
	for (const e of v.entries) {
		if (!isAuditLogEntry(e)) return false;
	}
	return true;
}
