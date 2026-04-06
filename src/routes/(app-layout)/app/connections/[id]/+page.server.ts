import { getSupabaseForDynamicTables } from "$lib/database/supabase.client";
import { error, fail } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import type { DbConnectionConfig } from "$lib/datasets/types";

const supabase = getSupabaseForDynamicTables();

export const load: PageServerLoad = async ({ params }) => {
	const { data: connection, error: dbError } = await supabase
		.from("db_connections")
		.select("*")
		.eq("id", params.id)
		.single();

	if (dbError || !connection) {
		error(404, "Connection not found");
	}

	const config = connection.connection_config as unknown as DbConnectionConfig;

	return {
		connection: {
			id: connection.id as string,
			name: connection.name as string,
			description: (connection.description as string) ?? "",
			engine: connection.engine as string,
			is_active: connection.is_active as boolean,
			config,
		},
	};
};

export const actions: Actions = {
	save: async ({ request, params }) => {
		const formData = await request.formData();
		const name = formData.get("name") as string;
		const description = formData.get("description") as string;
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

		const connectionConfig: DbConnectionConfig = {
			host,
			port,
			database,
			username,
			password,
			schema,
			ssl: false,
		};

		const { error: dbError } = await supabase
			.from("db_connections")
			.update({
				name: name.trim(),
				description: description?.trim() || null,
				engine,
				connection_config: connectionConfig,
				updated_at: new Date().toISOString(),
			})
			.eq("id", params.id);

		if (dbError) {
			console.error("Failed to save connection:", dbError);
			return fail(500, { error: "Failed to save connection" });
		}

		return { success: true };
	},
};
