import { superValidate, type SuperValidated } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import { createValibotSchema, createDefaultValues } from "./schema";
import type { FormDefinition } from "./types";

export async function validateDynamicForm(
	definition: FormDefinition,
	request?: Request,
): Promise<SuperValidated<Record<string, unknown>>> {
	const schema = createValibotSchema(definition);
	const defaults = createDefaultValues(definition);

	if (request) {
		return superValidate(request, valibot(schema));
	}
	return superValidate(defaults, valibot(schema));
}
