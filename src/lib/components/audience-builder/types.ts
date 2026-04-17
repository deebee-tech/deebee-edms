// ── Audience Builder JSON model ──
//
// This mirrors a future Supabase schema:
//   tag_type   (id, name, description)
//   tag        (id, tag_type_id, value, label)
//   object_tag (object_id, object_type, tag_id)
// Any "object" row (e.g. a person) joins through object_tag.

export type AudienceConditionMode = "has" | "has_not";
export type AudienceGroupLogic = "and" | "or";

/**
 * A single audience condition: "object [HAS | DOES NOT HAVE] this tag".
 *
 * Each condition picks one tag-type and exactly one tag value within that
 * type. Composite "has any/all of these" semantics are intentionally not
 * supported here — express them by adding more conditions to the group and
 * choosing the appropriate group logic (ANY = OR, ALL = AND).
 */
export interface AudienceCondition {
	id: string;
	mode: AudienceConditionMode;
	tagTypeId: string;
	/**
	 * Tag id this condition matches. Stored as a one-element array (rather
	 * than `tagId: string`) so the wire format stays compatible with older
	 * audience JSON that supported multi-tag conditions; only the first id is
	 * ever used by the engine and SQL generator.
	 */
	tagIds: string[];
}

export interface AudienceGroup {
	id: string;
	/** Optional human-friendly group label (shown in builder + per-group reach widgets). */
	name?: string;
	/** AND/OR between conditions inside this group. */
	logic: AudienceGroupLogic;
	conditions: AudienceCondition[];
}

export interface AudienceDefinition {
	id: string;
	name: string;
	description?: string;
	version: number;
	/** What kind of object the audience selects. Defaults to "person" in samples. */
	objectType: string;
	/** Top-level groups are OR'd together (matches filter-builder semantics). */
	groups: AudienceGroup[];
}

// ── Catalog (tag taxonomy) passed into the builder ──

export interface TagTypeMeta {
	id: string;
	name: string;
	description?: string;
}

export interface TagMeta {
	id: string;
	tagTypeId: string;
	value: string;
	label: string;
}

export interface AudienceCatalog {
	tagTypes: TagTypeMeta[];
	tags: TagMeta[];
}

// ── Object/tag link rows used by the in-memory engine ──

export interface ObjectTagLink {
	objectId: string;
	objectType: string;
	tagId: string;
}

// ── Helpers ──

export function createEmptyCondition(tagTypeId: string, firstTagId?: string): AudienceCondition {
	return {
		id: crypto.randomUUID(),
		mode: "has",
		tagTypeId,
		tagIds: firstTagId ? [firstTagId] : [],
	};
}

export function createEmptyGroup(): AudienceGroup {
	return {
		id: crypto.randomUUID(),
		logic: "and",
		conditions: [],
	};
}

export function createEmptyDefinition(name = "Untitled Audience", objectType = "person"): AudienceDefinition {
	return {
		id: crypto.randomUUID(),
		name,
		version: 1,
		objectType,
		groups: [createEmptyGroup()],
	};
}

/**
 * Validate a payload as an `AudienceDefinition`.
 *
 * Tolerates legacy fields (`kind`, `multiMatch`) on conditions so that older
 * exported JSON still loads — those fields are silently dropped at use-time
 * because every row is now a single-tag condition.
 */
export function isValidAudienceDefinition(value: unknown): value is AudienceDefinition {
	if (!value || typeof value !== "object") return false;
	const v = value as Partial<AudienceDefinition>;
	if (typeof v.id !== "string" || !v.id) return false;
	if (typeof v.name !== "string") return false;
	if (typeof v.version !== "number") return false;
	if (typeof v.objectType !== "string" || !v.objectType) return false;
	if (!Array.isArray(v.groups)) return false;
	for (const g of v.groups) {
		if (!g || typeof g !== "object") return false;
		if (typeof g.id !== "string") return false;
		if (g.name !== undefined && typeof g.name !== "string") return false;
		if (g.logic !== "and" && g.logic !== "or") return false;
		if (!Array.isArray(g.conditions)) return false;
		for (const c of g.conditions) {
			if (!c || typeof c !== "object") return false;
			if (typeof c.id !== "string") return false;
			if (c.mode !== "has" && c.mode !== "has_not") return false;
			if (typeof c.tagTypeId !== "string") return false;
			if (!Array.isArray(c.tagIds)) return false;
		}
	}
	return true;
}
