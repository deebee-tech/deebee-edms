import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getSupabaseForDynamicTables } from "$lib/database/supabase.client";
import { introspectPostgres } from "$lib/datasets/introspect";
import type { DbConnectionConfig, DbEngine } from "$lib/datasets/types";

const supabase = getSupabaseForDynamicTables();

export const POST: RequestHandler = async ({ params }) => {
	const { data: connection, error: dbError } = await supabase
		.from("db_connections")
		.select("*")
		.eq("id", params.id)
		.single();

	if (dbError || !connection) {
		error(404, "Connection not found");
	}

	const config = connection.connection_config as unknown as DbConnectionConfig;
	const engine = connection.engine as DbEngine;

	if (engine !== "postgres") {
		error(400, `Introspection for ${engine} is not yet supported`);
	}

	try {
		const schemaData = await introspectPostgres(config);

		await supabase.from("db_connection_schemas").upsert(
			{
				db_connection_id: params.id,
				schema_data: schemaData,
				introspected_at: new Date().toISOString(),
			},
			{ onConflict: "db_connection_id" },
		);

		return json({ success: true, schema: schemaData });
	} catch (e) {
		console.error("Introspection failed:", e);
		const message = e instanceof Error ? e.message : "Unknown error";
		error(500, `Introspection failed: ${message}`);
	}
};
