export const FIELD_TYPES = [
	"text",
	"email",
	"password",
	"number",
	"textarea",
	"select",
	"checkbox",
	"switch",
	"radio",
	"date",
	"phone",
	"tags",
	"file",
	"slider",
	"otp",
	"color",
	"richtext",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export interface FieldOption {
	label: string;
	value: string;
}

export interface FieldValidation {
	min?: number;
	max?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	step?: number;
}

export interface FormFieldDefinition {
	id: string;
	name: string;
	type: FieldType;
	label: string;
	placeholder?: string;
	description?: string;
	required?: boolean;
	disabled?: boolean;
	defaultValue?: unknown;
	options?: FieldOption[];
	validation?: FieldValidation;
	width?: "full" | "half" | "1/3" | "2/3" | "1/4" | "3/4";
}

export interface FormStepDefinition {
	id: string;
	title: string;
	description?: string;
	icon?: string;
	fields: FormFieldDefinition[];
}

export interface FormDefinition {
	id: string;
	name: string;
	description?: string;
	fields: FormFieldDefinition[];
	steps?: FormStepDefinition[];
}
