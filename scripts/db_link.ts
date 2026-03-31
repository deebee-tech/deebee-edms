import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getProjectRefFromEnv, linkedProjectRefPath, projectRoot } from "./supabase_project_ref.ts";

/**
 * Records the project ref from PUBLIC_SUPABASE_URL for Supabase CLI defaults
 * (e.g. `supabase branches list` without `--project-ref`). Does not run
 * `supabase link`, which requires `supabase init` / config.toml.
 */
const ref = getProjectRefFromEnv();
const path = linkedProjectRefPath();

mkdirSync(join(projectRoot(), ".supabase"), { recursive: true });
writeFileSync(path, `${ref}\n`, "utf8");

console.log(
	`Wrote ${path} (${ref}) — matches PUBLIC_SUPABASE_URL. For migrations, set SUPABASE_DB_URL and use pnpm db:push.`,
);
