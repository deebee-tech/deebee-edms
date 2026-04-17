import type { DbEngine } from "$lib/components/dataset-builder/types";
import { format, type SqlLanguage } from "sql-formatter";

const engineToSqlFormatterLanguage: Record<DbEngine, SqlLanguage> = {
	postgres: "postgresql",
	mysql: "mysql",
	mssql: "transactsql",
	sqlite: "sqlite",
};

/**
 * Pretty-prints SQL for read-only UI (test pages, preview dialogs).
 * On parse failure, returns the original string unchanged.
 */
export function formatDisplaySql(sql: string, engine: DbEngine = "postgres"): string {
	const trimmed = sql.trim();
	if (!trimmed) return sql;
	try {
		return format(sql, {
			language: engineToSqlFormatterLanguage[engine],
			keywordCase: "upper",
		});
	} catch {
		return sql;
	}
}
