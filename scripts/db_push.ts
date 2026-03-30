import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import {
	getProjectRefFromEnv,
	linkedProjectRefPath,
	projectRoot,
	supabaseCliPath,
	tryGetDbPushUrlFromEnv,
} from "./supabase_project_ref.ts";

const root = projectRoot();
const bin = supabaseCliPath();
const extra = process.argv.slice(2);

const dbUrl = tryGetDbPushUrlFromEnv();

let args: string[];
if (dbUrl) {
	args = ["db", "push", "--db-url", dbUrl, ...extra];
} else {
	const ref = getProjectRefFromEnv();
	const linkFile = linkedProjectRefPath();
	if (!existsSync(linkFile)) {
		console.error(
			`No SUPABASE_DB_URL (or DATABASE_URL) in .env, and missing ${linkFile}. Run pnpm db:link, or add a Postgres URI for db push.`,
		);
		process.exit(1);
	}
	const linked = readFileSync(linkFile, "utf8").trim();
	if (linked !== ref) {
		console.error(
			`Linked ref "${linked}" does not match PUBLIC_SUPABASE_URL ref "${ref}". Run pnpm db:link or set SUPABASE_DB_URL.`,
		);
		process.exit(1);
	}
	args = ["db", "push", ...extra];
}

const result = spawnSync(bin, args, { stdio: "inherit", cwd: root });

process.exit(result.status ?? 1);
