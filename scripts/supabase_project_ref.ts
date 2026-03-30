import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

/** Minimal .env parser (no multiline values). */
export function loadDotEnv(filePath: string): Record<string, string> {
	const raw = readFileSync(filePath, "utf8");
	const out: Record<string, string> = {};
	for (const line of raw.split("\n")) {
		const t = line.trim();
		if (!t || t.startsWith("#")) continue;
		const eq = t.indexOf("=");
		if (eq === -1) continue;
		const key = t.slice(0, eq).trim();
		let val = t.slice(eq + 1).trim();
		if (
			(val.startsWith('"') && val.endsWith('"')) ||
			(val.startsWith("'") && val.endsWith("'"))
		) {
			val = val.slice(1, -1);
		}
		out[key] = val;
	}
	return out;
}

/**
 * Resolves the Supabase project ref from PUBLIC_SUPABASE_URL (e.g. https://abcd.supabase.co).
 */
export function getProjectRefFromEnv(): string {
	const envPath = join(root, ".env");
	let url: string;
	try {
		const env = loadDotEnv(envPath);
		url = env.PUBLIC_SUPABASE_URL ?? "";
	} catch (e) {
		const err = e as NodeJS.ErrnoException;
		if (err.code === "ENOENT") {
			console.error(`Missing .env at ${envPath}`);
			process.exit(1);
		}
		throw e;
	}
	if (!url.trim()) {
		console.error("PUBLIC_SUPABASE_URL is missing or empty in .env");
		process.exit(1);
	}
	let hostname: string;
	try {
		hostname = new URL(url.trim()).hostname;
	} catch {
		console.error(`PUBLIC_SUPABASE_URL is not a valid URL: ${url}`);
		process.exit(1);
	}
	const m = /^([a-z0-9]{20})\.supabase\.co$/i.exec(hostname);
	if (!m) {
		console.error(
			`Expected PUBLIC_SUPABASE_URL host like <project-ref>.supabase.co (20-char ref), got: ${hostname}`,
		);
		process.exit(1);
	}
	return m[1].toLowerCase();
}

export function projectRoot(): string {
	return root;
}

export function supabaseCliPath(): string {
	const name = process.platform === "win32" ? "supabase.cmd" : "supabase";
	return join(root, "node_modules", ".bin", name);
}

export function linkedProjectRefPath(): string {
	return join(root, ".supabase", "project-ref");
}

/**
 * Postgres URI for `supabase db push --db-url` when set.
 * Prefer SUPABASE_DB_URL; falls back to DATABASE_URL.
 * Returns null if unset so callers can use linked `db push` instead.
 */
export function tryGetDbPushUrlFromEnv(): string | null {
	const envPath = join(root, ".env");
	let env: Record<string, string>;
	try {
		env = loadDotEnv(envPath);
	} catch (e) {
		const err = e as NodeJS.ErrnoException;
		if (err.code === "ENOENT") return null;
		throw e;
	}
	const url = (env.SUPABASE_DB_URL ?? env.DATABASE_URL ?? "").trim();
	if (!url) return null;
	if (!/^postgres(ql)?:\/\//i.test(url)) {
		console.error(
			"SUPABASE_DB_URL / DATABASE_URL must be a postgres:// or postgresql:// connection string.",
		);
		process.exit(1);
	}
	return url;
}
