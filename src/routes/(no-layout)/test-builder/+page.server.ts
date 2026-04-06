import { superValidate } from "sveltekit-superforms";
import { valibot } from "sveltekit-superforms/adapters";
import * as v from "valibot";
import type { PageServerLoad } from "./$types";

const emptySchema = v.object({});

export const load: PageServerLoad = async () => {
	const form = await superValidate(valibot(emptySchema));
	return { form };
};
