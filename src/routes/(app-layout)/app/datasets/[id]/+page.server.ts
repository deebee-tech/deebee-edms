import { getSupabaseForDynamicTables } from "$lib/database/supabase.client";
import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import type { DatasetDefinition, SchemaData } from "$lib/datasets/types";

const supabase = getSupabaseForDynamicTables();

export const load: PageServerLoad = async ({ params }) => {
	const { data: dataset, error: dbError } = await supabase
		.from("datasets")
		.select("*")
		.eq("id", params.id)
		.single();

	if (dbError || !dataset) {
		error(404, "Dataset not found");
	}

	let schemaData: SchemaData = { tables: [] };

	if (dataset.db_connection_id) {
		const { data: cachedSchema } = await supabase
			.from("db_connection_schemas")
			.select("schema_data")
			.eq("db_connection_id", dataset.db_connection_id)
			.order("introspected_at", { ascending: false })
			.limit(1)
			.single();

		if (cachedSchema?.schema_data) {
			schemaData = cachedSchema.schema_data as unknown as SchemaData;
		}
	}

	return {
		dataset: {
			id: dataset.id as string,
			name: dataset.name as string,
			description: (dataset.description as string) ?? "",
			definition: dataset.definition as unknown as DatasetDefinition,
			version: dataset.version as number,
			is_active: dataset.is_active as boolean,
			db_connection_id: dataset.db_connection_id as string | null,
		},
		schema: schemaData,
	};
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const formData = await request.formData();
		const definitionJson = formData.get("definition") as string;

		if (!definitionJson) {
			return fail(400, { error: "Definition is required" });
		}

		let definition: DatasetDefinition;
		try {
			definition = JSON.parse(definitionJson);
		} catch {
			return fail(400, { error: "Invalid JSON" });
		}

		const { error: dbError } = await supabase
			.from("datasets")
			.update({
				name: definition.name,
				description: definition.description,
				definition,
				version: definition.version,
				updated_at: new Date().toISOString(),
			})
			.eq("id", params.id);

		if (dbError) {
			console.error("Failed to save dataset:", dbError);
			return fail(500, { error: "Failed to save dataset" });
		}

		return { success: true };
	},
};
