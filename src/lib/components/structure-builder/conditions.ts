import type { ConditionRule, SectionDefinition, SectionFormEntry, SectionStatus } from "./types";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	const keys = path.split(".");
	let current: unknown = obj;
	for (const key of keys) {
		if (current == null || typeof current !== "object") return undefined;
		current = (current as Record<string, unknown>)[key];
	}
	return current;
}

export function evaluateCondition(rule: ConditionRule, state: Record<string, Record<string, unknown>>): boolean {
	const flatState = Object.fromEntries(
		Object.entries(state).flatMap(([stateKey, data]) =>
			Object.entries(data).map(([field, value]) => [`${stateKey}.${field}`, value]),
		),
	);

	const value = getNestedValue(flatState, rule.stateKey) ?? getNestedValue(state, rule.stateKey);

	switch (rule.operator) {
		case "exists":
			return value !== undefined && value !== null && value !== "";
		case "not_exists":
			return value === undefined || value === null || value === "";
		case "eq":
			return value === rule.value;
		case "neq":
			return value !== rule.value;
		case "gt":
			return typeof value === "number" && typeof rule.value === "number" && value > rule.value;
		case "gte":
			return typeof value === "number" && typeof rule.value === "number" && value >= rule.value;
		case "lt":
			return typeof value === "number" && typeof rule.value === "number" && value < rule.value;
		case "lte":
			return typeof value === "number" && typeof rule.value === "number" && value <= rule.value;
		case "contains":
			if (typeof value === "string" && typeof rule.value === "string") {
				return value.includes(rule.value);
			}
			if (Array.isArray(value)) {
				return value.includes(rule.value);
			}
			return false;
		case "in":
			if (Array.isArray(rule.value)) {
				return rule.value.includes(value);
			}
			return false;
		default:
			return false;
	}
}

export function evaluateConditions(rules: ConditionRule[], state: Record<string, Record<string, unknown>>): boolean {
	if (rules.length === 0) return true;

	let result = evaluateCondition(rules[0], state);

	for (let i = 1; i < rules.length; i++) {
		const logic = rules[i].logic ?? "and";
		const current = evaluateCondition(rules[i], state);
		if (logic === "and") {
			result = result && current;
		} else {
			result = result || current;
		}
	}

	return result;
}

export function isSectionVisible(section: SectionDefinition, state: Record<string, Record<string, unknown>>): boolean {
	if (!section.conditions?.visibility || section.conditions.visibility.length === 0) return true;
	return evaluateConditions(section.conditions.visibility, state);
}

export function isFormVisible(entry: SectionFormEntry, state: Record<string, Record<string, unknown>>): boolean {
	if (!entry.conditions?.visibility || entry.conditions.visibility.length === 0) return true;
	return evaluateConditions(entry.conditions.visibility, state);
}

export function isSectionBlocked(section: SectionDefinition, sectionStatus: Record<string, SectionStatus>): boolean {
	if (!section.conditions?.prerequisites || section.conditions.prerequisites.length === 0) {
		return false;
	}
	return section.conditions.prerequisites.some((prereqId) => {
		const status = sectionStatus[prereqId];
		return status !== "completed" && status !== "skipped";
	});
}

export function collectAllStateKeys(sections: SectionDefinition[]): string[] {
	const keys: string[] = [];
	function walk(list: SectionDefinition[]) {
		for (const section of list) {
			if (section.forms) {
				for (const entry of section.forms) {
					keys.push(entry.stateKey);
				}
			}
			if (section.children) {
				walk(section.children);
			}
		}
	}
	walk(sections);
	return keys;
}

export function collectAllSectionIds(sections: SectionDefinition[]): string[] {
	const ids: string[] = [];
	function walk(list: SectionDefinition[]) {
		for (const section of list) {
			ids.push(section.id);
			if (section.children) {
				walk(section.children);
			}
		}
	}
	walk(sections);
	return ids;
}

export function flattenSections(sections: SectionDefinition[]): SectionDefinition[] {
	const result: SectionDefinition[] = [];
	function walk(list: SectionDefinition[]) {
		for (const section of list) {
			result.push(section);
			if (section.children) {
				walk(section.children);
			}
		}
	}
	walk(sections);
	return result;
}

export function findSectionById(sections: SectionDefinition[], id: string): SectionDefinition | null {
	for (const section of sections) {
		if (section.id === id) return section;
		if (section.children) {
			const found = findSectionById(section.children, id);
			if (found) return found;
		}
	}
	return null;
}
