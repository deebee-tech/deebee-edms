import { validateDynamicForm } from "$lib/forms/server";
import { fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { sampleMultistepDefinition } from "./sample-multistep-definition";

export const load: PageServerLoad = async () => {
	const form = await validateDynamicForm(sampleMultistepDefinition);
	return { form, definition: sampleMultistepDefinition };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await validateDynamicForm(sampleMultistepDefinition, request);

		if (!form.valid) {
			return fail(400, { form });
		}

		console.log("Multi-step form submitted:", form.data);
		return { form };
	},
};
