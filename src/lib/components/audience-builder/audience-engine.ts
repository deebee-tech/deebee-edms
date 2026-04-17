import type { AudienceCatalog, AudienceCondition, AudienceDefinition, AudienceGroup, ObjectTagLink } from "./types.js";

/**
 * Build an index from object id -> set of tag ids that the object has,
 * scoped to a particular object_type.
 */
export function indexObjectTags(links: ObjectTagLink[], objectType: string): Map<string, Set<string>> {
	const out = new Map<string, Set<string>>();
	for (const link of links) {
		if (link.objectType !== objectType) continue;
		let s = out.get(link.objectId);
		if (!s) {
			s = new Set<string>();
			out.set(link.objectId, s);
		}
		s.add(link.tagId);
	}
	return out;
}

function evaluateCondition(condition: AudienceCondition, ownedTagIds: Set<string>): boolean {
	const tagId = condition.tagIds[0];
	if (!tagId) return true;
	const hasIt = ownedTagIds.has(tagId);
	return condition.mode === "has" ? hasIt : !hasIt;
}

function evaluateGroup(group: AudienceGroup, ownedTagIds: Set<string>): boolean {
	const conditions = group.conditions.filter((c) => c.tagIds.length > 0);
	if (conditions.length === 0) return false;

	if (group.logic === "or") {
		return conditions.some((c) => evaluateCondition(c, ownedTagIds));
	}
	return conditions.every((c) => evaluateCondition(c, ownedTagIds));
}

function definitionHasConditions(def: AudienceDefinition): boolean {
	return def.groups.some((g) => g.conditions.some((c) => c.tagIds.length > 0));
}

/**
 * Evaluate an audience definition against an in-memory population and the
 * supplied object_tag links. Returns the subset of `objects` whose tags satisfy
 * the audience expression.
 *
 * Semantics:
 *   - Top-level groups are OR'd together.
 *   - Conditions inside a group are AND'd or OR'd according to `group.logic`.
 *   - An empty definition (no real conditions) matches the entire population.
 */
export function evaluateAudience<T extends { id: string }>(
	def: AudienceDefinition,
	objects: T[],
	links: ObjectTagLink[],
): T[] {
	if (!definitionHasConditions(def)) return [...objects];

	const tagIndex = indexObjectTags(links, def.objectType);
	const empty = new Set<string>();

	return objects.filter((obj) => {
		const owned = tagIndex.get(obj.id) ?? empty;
		return def.groups.some((g) => evaluateGroup(g, owned));
	});
}

export interface AudienceSummary {
	/** Total population considered (objects of `def.objectType`). */
	totalPopulation: number;
	/** Audience size after applying the full definition. */
	matchedCount: number;
	/** Percentage of population matched (0..100). */
	matchedPct: number;
	/** Match counts per group (each evaluated independently against the full population). */
	perGroupCounts: { groupId: string; count: number }[];
	/** Distribution of matched objects across tag-types (how many matched objects own at least one tag in that type). */
	perTagTypeCounts: { tagTypeId: string; count: number }[];
}

export function audienceSummary<T extends { id: string }>(
	def: AudienceDefinition,
	catalog: AudienceCatalog,
	objects: T[],
	links: ObjectTagLink[],
): AudienceSummary {
	const tagIndex = indexObjectTags(links, def.objectType);
	const empty = new Set<string>();

	const matched = evaluateAudience(def, objects, links);
	const matchedIds = new Set(matched.map((m) => m.id));

	const perGroupCounts = def.groups.map((group) => {
		let count = 0;
		for (const obj of objects) {
			const owned = tagIndex.get(obj.id) ?? empty;
			if (evaluateGroup(group, owned)) count++;
		}
		return { groupId: group.id, count };
	});

	// Build tagId -> tagTypeId map for fast lookup
	const tagToType = new Map<string, string>();
	for (const t of catalog.tags) tagToType.set(t.id, t.tagTypeId);

	const perTagTypeCounts = catalog.tagTypes.map((tt) => {
		let count = 0;
		for (const objId of matchedIds) {
			const owned = tagIndex.get(objId);
			if (!owned) continue;
			let touchesType = false;
			for (const tagId of owned) {
				if (tagToType.get(tagId) === tt.id) {
					touchesType = true;
					break;
				}
			}
			if (touchesType) count++;
		}
		return { tagTypeId: tt.id, count };
	});

	const totalPopulation = objects.length;
	const matchedCount = matched.length;
	const matchedPct = totalPopulation === 0 ? 0 : Math.round((matchedCount / totalPopulation) * 1000) / 10;

	return {
		totalPopulation,
		matchedCount,
		matchedPct,
		perGroupCounts,
		perTagTypeCounts,
	};
}
