import type { FormDefinition } from "../dynamic-forms/types";

export const CONDITION_OPERATORS = [
	"eq",
	"neq",
	"gt",
	"gte",
	"lt",
	"lte",
	"contains",
	"exists",
	"not_exists",
	"in",
] as const;

export type ConditionOperator = (typeof CONDITION_OPERATORS)[number];

export const CONDITION_OPERATOR_LABELS: Record<ConditionOperator, string> = {
	eq: "equals",
	neq: "not equals",
	gt: "greater than",
	gte: "greater than or equal",
	lt: "less than",
	lte: "less than or equal",
	contains: "contains",
	exists: "exists",
	not_exists: "does not exist",
	in: "is one of",
};

export type ConditionLogic = "and" | "or";

export interface ConditionRule {
	stateKey: string;
	operator: ConditionOperator;
	value?: unknown;
	logic?: ConditionLogic;
}

export interface SectionConditions {
	visibility?: ConditionRule[];
	prerequisites?: string[];
	skippable?: boolean;
	repeatable?: boolean;
}

export interface SectionFormEntry {
	id: string;
	stateKey: string;
	form: FormDefinition;
	conditions?: {
		visibility?: ConditionRule[];
	};
}

export interface SectionDefinition {
	id: string;
	title: string;
	description?: string | null;
	icon?: string;
	children?: SectionDefinition[];
	forms?: SectionFormEntry[];
	conditions?: SectionConditions;
}

export interface StructureDefinition {
	id: string;
	name: string;
	description?: string | null;
	sections: SectionDefinition[];
}

export type SectionStatus = "pending" | "in_progress" | "completed" | "skipped" | "blocked";

export interface StructureAnswers {
	structureId: string;
	sectionStatus: Record<string, SectionStatus>;
	formData: Record<string, Record<string, unknown>>;
	completed: boolean;
}
