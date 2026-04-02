import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getProjectRefFromEnv, projectRoot, supabaseCliPath } from "./supabase_project_ref.ts";

/** Postgres schemas to include (PostgREST `Database` types). Add more `--schema` entries if needed. */
const SCHEMAS = ["deebee_edms"];

const ref = getProjectRefFromEnv();
const bin = supabaseCliPath();
const outFile = join(projectRoot(), "src", "lib", "database", "supabase.types.ts");

const schemaArgs = SCHEMAS.flatMap((s) => ["--schema", s]);
const result = spawnSync(bin, ["gen", "types", "typescript", "--project-id", ref, ...schemaArgs], {
	encoding: "utf8",
	maxBuffer: 64 * 1024 * 1024,
});

if (result.error) {
	console.error(result.error);
	process.exit(1);
}
if (result.status !== 0) {
	if (result.stderr) console.error(result.stderr);
	process.exit(result.status ?? 1);
}

writeFileSync(outFile, result.stdout, "utf8");
console.log(`Wrote ${outFile} (project ${ref})`);
