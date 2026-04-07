import { introspect } from "$lib/components/dataset-builder/introspect";
import type { DbConnectionConfig, DbEngine } from "$lib/components/dataset-builder/types";
import { getSupabaseForDynamicTables } from "$lib/database/supabase.client";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

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

	try {
		const schemaData = await introspect(engine, config);

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
