import * as v from "valibot";
import type { FormDefinition, FormFieldDefinition, FormStepDefinition } from "./types";
import { isFieldNonInteractive } from "./types";

type AnySchema = v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>;

export function isMultiStep(definition: FormDefinition): boolean {
	return Array.isArray(definition.steps) && definition.steps.length > 0;
}

export function getAllFields(definition: FormDefinition): FormFieldDefinition[] {
	if (isMultiStep(definition)) {
		return definition.steps!.flatMap((s) => s.fields);
	}
	return definition.fields;
}

function buildFieldSchema(field: FormFieldDefinition): AnySchema {
	const val = field.validation;

	switch (field.type) {
		case "text":
		case "password":
		case "textarea":
		case "phone":
		case "color":
		case "richtext":
		case "code":
		case "date": {
			const pipes: v.PipeItem<string, string, v.BaseIssue<unknown>>[] = [];
			if (field.required) pipes.push(v.minLength(1, `${field.label} is required`));
			if (val?.minLength) pipes.push(v.minLength(val.minLength));
			if (val?.maxLength) pipes.push(v.maxLength(val.maxLength));
			if (val?.pattern) pipes.push(v.regex(new RegExp(val.pattern)));
			const schema = pipes.length > 0 ? v.pipe(v.string(), ...pipes) : v.string();
			return field.required ? schema : v.optional(schema, "");
		}

		case "email": {
			const pipes: v.PipeItem<string, string, v.BaseIssue<unknown>>[] = [v.email("Please enter a valid email")];
			if (val?.minLength) pipes.push(v.minLength(val.minLength));
			if (val?.maxLength) pipes.push(v.maxLength(val.maxLength));
			const schema = v.pipe(v.string(), ...pipes);
			return field.required ? schema : v.optional(schema, "");
		}

		case "number":
		case "slider": {
			const pipes: v.PipeItem<number, number, v.BaseIssue<unknown>>[] = [];
			if (val?.min != null) pipes.push(v.minValue(val.min));
			if (val?.max != null) pipes.push(v.maxValue(val.max));
			const schema = pipes.length > 0 ? v.pipe(v.number(), ...pipes) : v.number();
			return field.required ? schema : v.optional(schema, 0);
		}

		case "checkbox":
		case "switch":
			return v.boolean();

		case "select":
		case "radio": {
			if (field.options?.length) {
				const values = field.options.map((o) => o.value) as [string, ...string[]];
				const schema = v.picklist(values);
				return field.required ? schema : v.optional(schema, "");
			}
			return field.required ? v.string() : v.optional(v.string(), "");
		}

		case "tags":
			return v.optional(v.array(v.string()), []);

		case "otp": {
			const pipes: v.PipeItem<string, string, v.BaseIssue<unknown>>[] = [];
			if (val?.minLength) pipes.push(v.minLength(val.minLength));
			if (val?.maxLength) pipes.push(v.maxLength(val.maxLength));
			const schema = pipes.length > 0 ? v.pipe(v.string(), ...pipes) : v.string();
			return field.required ? schema : v.optional(schema, "");
		}

		case "file":
			return v.optional(v.any());

		case "video": {
			const threshold = ((field.config?.watchThreshold as number) ?? 95) / 100;
			return v.object({
				progress: v.pipe(
					v.number(),
					v.minValue(threshold, `Please watch at least ${Math.round(threshold * 100)}% of the video`),
				),
				ended: v.boolean(),
				watchedSeconds: v.number(),
				totalSeconds: v.number(),
			});
		}

		default:
			return v.optional(v.string(), "");
	}
}

export function createValibotSchema(definition: FormDefinition) {
	const shape: Record<string, AnySchema> = {};
	for (const field of getAllFields(definition)) {
		if (isFieldNonInteractive(field)) continue;
		shape[field.name] = buildFieldSchema(field);
	}
	return v.object(shape);
}

export function createStepValibotSchema(step: FormStepDefinition) {
	const shape: Record<string, AnySchema> = {};
	for (const field of step.fields) {
		if (isFieldNonInteractive(field)) continue;
		shape[field.name] = buildFieldSchema(field);
	}
	return v.object(shape);
}

export function createDefaultValues(definition: FormDefinition): Record<string, unknown> {
	const defaults: Record<string, unknown> = {};
	for (const field of getAllFields(definition)) {
		if (isFieldNonInteractive(field)) continue;
		if (field.defaultValue !== undefined) {
			defaults[field.name] = field.defaultValue;
			continue;
		}
		switch (field.type) {
			case "checkbox":
			case "switch":
				defaults[field.name] = false;
				break;
			case "number":
			case "slider":
				defaults[field.name] = field.validation?.min ?? 0;
				break;
			case "tags":
				defaults[field.name] = [];
				break;
			case "video":
				defaults[field.name] = { progress: 0, ended: false, watchedSeconds: 0, totalSeconds: 0 };
				break;
			default:
				defaults[field.name] = "";
		}
	}
	return defaults;
}
