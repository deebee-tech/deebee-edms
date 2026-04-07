export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	// Allows to automatically instantiate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: "14.1";
	};
	deebee_edms: {
		Tables: {
			dual: {
				Row: {
					dummy: string;
				};
				Insert: {
					dummy: string;
				};
				Update: {
					dummy?: string;
				};
				Relationships: [];
			};
			organization_settings: {
				Row: {
					id: number;
					organization_id: number;
					settings_key: string;
					settings_value: string;
				};
				Insert: {
					id?: number;
					organization_id: number;
					settings_key: string;
					settings_value: string;
				};
				Update: {
					id?: number;
					organization_id?: number;
					settings_key?: string;
					settings_value?: string;
				};
				Relationships: [
					{
						foreignKeyName: "organization_settings_organizations";
						columns: ["organization_id"];
						isOneToOne: false;
						referencedRelation: "organizations";
						referencedColumns: ["id"];
					},
				];
			};
			organizations: {
				Row: {
					id: number;
					organization_identifier: string;
				};
				Insert: {
					id?: number;
					organization_identifier: string;
				};
				Update: {
					id?: number;
					organization_identifier?: string;
				};
				Relationships: [];
			};
			workflow_run_steps: {
				Row: {
					completed_at: string | null;
					error: string | null;
					id: string;
					input: Json | null;
					node_id: string;
					node_type: string;
					output: Json | null;
					run_id: string;
					started_at: string;
					status: string;
				};
				Insert: {
					completed_at?: string | null;
					error?: string | null;
					id?: string;
					input?: Json | null;
					node_id: string;
					node_type: string;
					output?: Json | null;
					run_id: string;
					started_at?: string;
					status?: string;
				};
				Update: {
					completed_at?: string | null;
					error?: string | null;
					id?: string;
					input?: Json | null;
					node_id?: string;
					node_type?: string;
					output?: Json | null;
					run_id?: string;
					started_at?: string;
					status?: string;
				};
				Relationships: [
					{
						foreignKeyName: "workflow_run_steps_runs";
						columns: ["run_id"];
						isOneToOne: false;
						referencedRelation: "workflow_runs";
						referencedColumns: ["id"];
					},
				];
			};
			workflow_runs: {
				Row: {
					completed_at: string | null;
					error: string | null;
					global_state: Json;
					id: string;
					started_at: string;
					status: string;
					workflow_id: string;
				};
				Insert: {
					completed_at?: string | null;
					error?: string | null;
					global_state?: Json;
					id?: string;
					started_at?: string;
					status?: string;
					workflow_id: string;
				};
				Update: {
					completed_at?: string | null;
					error?: string | null;
					global_state?: Json;
					id?: string;
					started_at?: string;
					status?: string;
					workflow_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "workflow_runs_workflows";
						columns: ["workflow_id"];
						isOneToOne: false;
						referencedRelation: "workflows";
						referencedColumns: ["id"];
					},
				];
			};
			workflows: {
				Row: {
					created_at: string;
					definition: Json;
					description: string | null;
					id: string;
					is_active: boolean;
					name: string;
					organization_id: number;
					updated_at: string;
					version: number;
				};
				Insert: {
					created_at?: string;
					definition?: Json;
					description?: string | null;
					id?: string;
					is_active?: boolean;
					name: string;
					organization_id: number;
					updated_at?: string;
					version?: number;
				};
				Update: {
					created_at?: string;
					definition?: Json;
					description?: string | null;
					id?: string;
					is_active?: boolean;
					name?: string;
					organization_id?: number;
					updated_at?: string;
					version?: number;
				};
				Relationships: [
					{
						foreignKeyName: "workflows_organizations";
						columns: ["organization_id"];
						isOneToOne: false;
						referencedRelation: "organizations";
						referencedColumns: ["id"];
					},
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	deebee_edms: {
		Enums: {},
	},
} as const;
