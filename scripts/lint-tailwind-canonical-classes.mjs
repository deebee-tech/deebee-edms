#!/usr/bin/env node
/**
 * Tailwind v4 “canonical class” check (aligned with Tailwind IntelliSense).
 * The bundled CLI exits 0 in --check even when files would change; this
 * wrapper exits 1 when any file would be updated so `pnpm lint` can fail CI.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(root, "node_modules/@laststance/tailwind-suggest-canonical-classes/dist/cli.js");

if (!fs.existsSync(cli)) {
	console.error("Missing @laststance/tailwind-suggest-canonical-classes (devDependency).");
	process.exit(1);
}

const fileGlob = "src/**/*.{astro,css,html,js,jsx,md,mdx,svelte,ts,tsx,vue}";
const cssEntry = "src/routes/layout.css";

const r = spawnSync(process.execPath, [cli, fileGlob, "--css", cssEntry, "--check"], { cwd: root, encoding: "utf8" });

if (r.stdout) process.stdout.write(r.stdout);
if (r.stderr) process.stderr.write(r.stderr);
if (r.error) {
	console.error(r.error.message);
	process.exit(1);
}
if (r.status !== 0 && r.status !== null) {
	process.exit(r.status);
}

const m = /Done\. changed=(\d+)/.exec(r.stdout ?? "");
const changed = m ? Number(m[1], 10) : NaN;
if (!Number.isFinite(changed)) {
	console.error("Could not parse tailwind-suggest-canonical-classes summary.");
	process.exit(1);
}
if (changed > 0) {
	console.error(
		`\n${changed} file(s) would be updated to canonical Tailwind classes. Fix with:\n  pnpm exec tailwind-suggest-canonical-classes "${fileGlob}" --css ./${cssEntry}\n`,
	);
	process.exit(1);
}
