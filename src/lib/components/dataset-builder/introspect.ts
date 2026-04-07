import type { DbEngine, DbConnectionConfig, SchemaData } from "./types";
import { introspectPostgres } from "./introspect-postgres";
import { introspectMysql } from "./introspect-mysql";
import { introspectMssql } from "./introspect-mssql";
import { introspectSqlite } from "./introspect-sqlite";

export { introspectPostgres } from "./introspect-postgres";
export { introspectMysql } from "./introspect-mysql";
export { introspectMssql } from "./introspect-mssql";
export { introspectSqlite } from "./introspect-sqlite";

export async function introspect(engine: DbEngine, config: DbConnectionConfig): Promise<SchemaData> {
	switch (engine) {
		case "postgres":
			return introspectPostgres(config);
		case "mysql":
			return introspectMysql(config);
		case "mssql":
			return introspectMssql(config);
		case "sqlite":
			return introspectSqlite(config);
	}
}
