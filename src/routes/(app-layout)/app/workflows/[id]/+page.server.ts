import { supabase } from "$lib/database/supabase.client";
import type { Json } from "$lib/database/supabase.types";
import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import type { WorkflowDefinition } from "$lib/workflows/types";

export const load: PageServerLoad = async ({ params }) => {
	const { data: workflow, error: dbError } = await supabase.from("workflows").select("*").eq("id", params.id).single();

	if (dbError || !workflow) {
		error(404, "Workflow not found");
	}

	return {
		workflow: {
			id: workflow.id,
			name: workflow.name,
			description: workflow.description,
			definition: workflow.definition as unknown as WorkflowDefinition,
			version: workflow.version,
			is_active: workflow.is_active,
		},
	};
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const formData = await request.formData();
		const definitionJson = formData.get("definition") as string;

		if (!definitionJson) {
			return fail(400, { error: "Definition is required" });
		}

		let definition: WorkflowDefinition;
		try {
			definition = JSON.parse(definitionJson);
		} catch {
			return fail(400, { error: "Invalid JSON" });
		}

		const { error: dbError } = await supabase
			.from("workflows")
			.update({
				name: definition.name,
				description: definition.description,
				definition: definition as unknown as Json,
				version: definition.version,
				updated_at: new Date().toISOString(),
			})
			.eq("id", params.id);

		if (dbError) {
			console.error("Failed to save workflow:", dbError);
			return fail(500, { error: "Failed to save workflow" });
		}

		return { success: true };
	},
};
