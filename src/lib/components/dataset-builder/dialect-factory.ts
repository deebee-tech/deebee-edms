import { PostgresSqlEasy, MysqlSqlEasy, MssqlSqlEasy, SqliteSqlEasy, DatabaseType } from "@deebeetech/sqleasy";
import type { DbEngine } from "./types";

const dialectMap = {
	postgres: PostgresSqlEasy,
	mysql: MysqlSqlEasy,
	mssql: MssqlSqlEasy,
	sqlite: SqliteSqlEasy,
} as const;

const databaseTypeMap: Record<DbEngine, DatabaseType> = {
	postgres: DatabaseType.Postgres,
	mysql: DatabaseType.Mysql,
	mssql: DatabaseType.Mssql,
	sqlite: DatabaseType.Sqlite,
};

export function createDialect(engine: DbEngine = "postgres") {
	const Dialect = dialectMap[engine];
	return new Dialect();
}

export function getDatabaseType(engine: DbEngine): DatabaseType {
	return databaseTypeMap[engine];
}
