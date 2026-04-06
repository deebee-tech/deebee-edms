import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from "$env/static/public";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.types";

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
	db: { schema: "deebee_edms" },
});

/**
 * Widened `Database` shape for the same schema so `.from(name)` accepts any runtime `string`.
 * The generated `Database` uses a fixed table union; PostgREST still accepts any exposed table.
 * Use this at boundaries like workflow config — keep using `supabase` for normal typed queries.
 */
export type WorkflowDynamicDatabase = {
	__InternalSupabase: Database["__InternalSupabase"];
	deebee_edms: {
		Tables: Record<
			string,
			{
				Row: Record<string, unknown>;
				Insert: Record<string, unknown>;
				Update: Record<string, unknown>;
				Relationships: [];
			}
		>;
		Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>;
		Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
		Enums: Record<string, never>;
		CompositeTypes: Record<string, never>;
	};
};

export function getSupabaseForDynamicTables(): SupabaseClient<WorkflowDynamicDatabase> {
	return supabase as unknown as SupabaseClient<WorkflowDynamicDatabase>;
}
