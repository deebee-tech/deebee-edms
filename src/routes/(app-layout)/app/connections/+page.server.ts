import { getSupabaseForDynamicTables } from "$lib/database/supabase.client";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

const supabase = getSupabaseForDynamicTables();

export const load: PageServerLoad = async () => {
	const { data: connections, error } = await supabase
		.from("db_connections")
		.select("id, name, description, engine, is_active, created_at, updated_at")
		.order("updated_at", { ascending: false });

	if (error) {
		console.error("Failed to load connections:", error);
		return { connections: [] };
	}

	return { connections: connections ?? [] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const engine = formData.get("engine") as string;
		const host = formData.get("host") as string;
		const port = parseInt(formData.get("port") as string, 10) || 5432;
		const database = formData.get("database") as string;
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;
		const schema = (formData.get("schema") as string) || "public";

		if (!name?.trim()) {
			return fail(400, { error: "Name is required" });
		}

		const connectionConfig = { host, port, database, username, password, schema, ssl: false };

		const { data, error } = await supabase
			.from("db_connections")
			.insert({
				name: name.trim(),
				organization_id: 1,
				engine: engine || "postgres",
				connection_config: connectionConfig,
			})
			.select("id")
			.single();

		if (error) {
			console.error("Failed to create connection:", error);
			return fail(500, { error: "Failed to create connection" });
		}

		redirect(303, `/app/connections/${data.id}`);
	},
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get("id") as string;

		if (!id) {
			return fail(400, { error: "ID is required" });
		}

		const { error } = await supabase.from("db_connections").delete().eq("id", id);

		if (error) {
			console.error("Failed to delete connection:", error);
			return fail(500, { error: "Failed to delete connection" });
		}

		return { success: true };
	},
};
