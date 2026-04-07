import { validateDynamicForm } from "$lib/components/dynamic-forms";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { sampleFormDefinition } from "./sample-definition";

export const load: PageServerLoad = async () => {
	const form = await validateDynamicForm(sampleFormDefinition);
	return { form, definition: sampleFormDefinition };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await validateDynamicForm(sampleFormDefinition, request);

		if (!form.valid) {
			return fail(400, { form });
		}

		console.log("Form submitted:", form.data);
		return { form };
	},
};
