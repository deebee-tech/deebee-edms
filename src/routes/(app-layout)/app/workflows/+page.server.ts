import { createSupabaseProvider } from "$lib/components/data-table/providers/supabase-provider.js";
import { deserializeTableState } from "$lib/components/data-table/url-state.js";
import { supabase } from "$lib/database/supabase.client";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const provider = createSupabaseProvider({
	table: "workflows",
	columns: "id, name, description, version, is_active, created_at, updated_at",
	defaultSort: [{ column: "updated_at", ascending: false }],
	client: supabase,
});

export const load: PageServerLoad = async ({ url }) => {
	const tableState = deserializeTableState(url.searchParams);

	try {
		const initialData = await provider({
			filters: tableState.filters,
			sort: tableState.sort,
			offset: 0,
			limit: 50,
		});
		return { initialData };
	} catch (e) {
		console.error("Failed to load workflows:", e);
		return {
			initialData: { rows: [], totalCount: 0, hasMore: false },
		};
	}
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
			globalState: [],
			nodes: [],
			edges: [],
		};

		const { data, error } = await supabase
			.from("workflows")
			.insert({
				name: name.trim(),
				organization_id: 1,
				definition,
				version: 1,
			})
			.select("id")
			.single();

		if (error) {
			console.error("Failed to create workflow:", error);
			return fail(500, { error: "Failed to create workflow" });
		}

		redirect(303, `/app/workflows/${data.id}`);
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;

		if (!id) {
			return fail(400, { error: "ID is required" });
		}

		const { error } = await supabase.from("workflows").delete().eq("id", id);

		if (error) {
			console.error("Failed to delete workflow:", error);
			return fail(500, { error: "Failed to delete workflow" });
		}

		return { success: true };
	},
};
