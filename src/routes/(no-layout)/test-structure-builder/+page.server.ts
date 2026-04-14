import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import * as v from "valibot";
import type { Actions, PageServerLoad } from "./$types";

const emptySchema = v.object({});

export const load: PageServerLoad = async () => {
	const form = await superValidate(valibot(emptySchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const data = Object.fromEntries(formData);
		console.log("[Structure Builder] Form submitted:", data);
		const form = await superValidate(valibot(emptySchema));
		return { form };
	},
};
