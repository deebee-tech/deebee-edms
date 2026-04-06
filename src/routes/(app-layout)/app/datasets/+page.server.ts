import { getSupabaseForDynamicTables } from "$lib/database/supabase.client";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const supabase = getSupabaseForDynamicTables();

export const load: PageServerLoad = async () => {
	const { data: datasets, error } = await supabase
		.from("datasets")
		.select("id, name, description, version, is_active, created_at, updated_at")
		.order("updated_at", { ascending: false });

	if (error) {
		console.error("Failed to load datasets:", error);
		return { datasets: [] };
	}

	return { datasets: datasets ?? [] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;

		if (!name?.trim()) {
			return fail(400, { error: "Name is required" });
		}

		const definition = {
			id: crypto.randomUUID(),
			name: name.trim(),
			version: 1,
			tables: [],
			joins: [],
			fields: [],
			filters: [],
			sort: [],
		};

		const { data, error } = await supabase
			.from("datasets")
			.insert({
				name: name.trim(),
				organization_id: 1,
				definition,
				version: 1,
			})
			.select("id")
			.single();

		if (error) {
			console.error("Failed to create dataset:", error);
			return fail(500, { error: "Failed to create dataset" });
		}

		redirect(303, `/app/datasets/${data.id}`);
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;

		if (!id) {
			return fail(400, { error: "ID is required" });
		}

		const { error } = await supabase.from("datasets").delete().eq("id", id);

		if (error) {
			console.error("Failed to delete dataset:", error);
			return fail(500, { error: "Failed to delete dataset" });
		}

		return { success: true };
	},
};
