import sql from "mssql";
import type { DbConnectionConfig, SchemaColumn, SchemaData, SchemaForeignKey, SchemaTable } from "./types";

export async function introspectMssql(config: DbConnectionConfig): Promise<SchemaData> {
	const targetSchema = config.schema || "dbo";

	const pool = await sql.connect({
		server: config.host,
		port: config.port,
		database: config.database,
		user: config.username,
		password: config.password,
		options: {
			encrypt: config.ssl ?? false,
			trustServerCertificate: true,
		},
		connectionTimeout: 10000,
		requestTimeout: 10000,
	});

	try {
		const tablesResult = await pool.request().input("schema", sql.NVarChar, targetSchema).query<{
			table_schema: string;
			table_name: string;
			table_type: string;
		}>(`
			SELECT TABLE_SCHEMA AS table_schema, TABLE_NAME AS table_name, TABLE_TYPE AS table_type
			FROM INFORMATION_SCHEMA.TABLES
			WHERE TABLE_SCHEMA = @schema
			  AND TABLE_TYPE IN ('BASE TABLE', 'VIEW')
			ORDER BY TABLE_TYPE, TABLE_NAME
		`);

		const columnsResult = await pool.request().input("schema", sql.NVarChar, targetSchema).query<{
			table_schema: string;
			table_name: string;
			column_name: string;
			data_type: string;
			is_nullable: string;
			column_default: string | null;
		}>(`
			SELECT TABLE_SCHEMA AS table_schema, TABLE_NAME AS table_name,
			       COLUMN_NAME AS column_name, DATA_TYPE AS data_type,
			       IS_NULLABLE AS is_nullable, COLUMN_DEFAULT AS column_default
			FROM INFORMATION_SCHEMA.COLUMNS
			WHERE TABLE_SCHEMA = @schema
			ORDER BY TABLE_NAME, ORDINAL_POSITION
		`);

		const pkResult = await pool.request().input("schema", sql.NVarChar, targetSchema).query<{
			table_schema: string;
			table_name: string;
			column_name: string;
		}>(`
			SELECT kcu.TABLE_SCHEMA AS table_schema, kcu.TABLE_NAME AS table_name, kcu.COLUMN_NAME AS column_name
			FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
			JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
			  ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
			  AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
			WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
			  AND tc.TABLE_SCHEMA = @schema
		`);

		const fkResult = await pool.request().input("schema", sql.NVarChar, targetSchema).query<{
			table_schema: string;
			table_name: string;
			column_name: string;
			referenced_schema: string;
			referenced_table: string;
			referenced_column: string;
		}>(`
			SELECT
			  s1.name AS table_schema,
			  t1.name AS table_name,
			  c1.name AS column_name,
			  s2.name AS referenced_schema,
			  t2.name AS referenced_table,
			  c2.name AS referenced_column
			FROM sys.foreign_key_columns fkc
			JOIN sys.objects t1 ON fkc.parent_object_id = t1.object_id
			JOIN sys.columns c1 ON fkc.parent_object_id = c1.object_id AND fkc.parent_column_id = c1.column_id
			JOIN sys.objects t2 ON fkc.referenced_object_id = t2.object_id
			JOIN sys.columns c2 ON fkc.referenced_object_id = c2.object_id AND fkc.referenced_column_id = c2.column_id
			JOIN sys.schemas s1 ON t1.schema_id = s1.schema_id
			JOIN sys.schemas s2 ON t2.schema_id = s2.schema_id
			WHERE s1.name = @schema
		`);

		const tables = tablesResult.recordset;
		const columns = columnsResult.recordset;
		const primaryKeys = pkResult.recordset;
		const foreignKeysRaw = fkResult.recordset;

		const pkSet = new Set(primaryKeys.map((pk) => `${pk.table_schema}.${pk.table_name}.${pk.column_name}`));

		const fkMap = new Map<string, SchemaForeignKey[]>();
		for (const fk of foreignKeysRaw) {
			const key = `${fk.table_schema}.${fk.table_name}`;
			const list = fkMap.get(key) ?? [];
			list.push({
				columnName: fk.column_name,
				referencedTable: fk.referenced_table,
				referencedColumn: fk.referenced_column,
				referencedSchema: fk.referenced_schema,
			});
			fkMap.set(key, list);
		}

		const colMap = new Map<string, SchemaColumn[]>();
		for (const col of columns) {
			const key = `${col.table_schema}.${col.table_name}`;
			const list = colMap.get(key) ?? [];
			list.push({
				name: col.column_name,
				dataType: col.data_type,
				nullable: col.is_nullable === "YES",
				isPrimaryKey: pkSet.has(`${col.table_schema}.${col.table_name}.${col.column_name}`),
				defaultValue: col.column_default ?? undefined,
			});
			colMap.set(key, list);
		}

		const result: SchemaTable[] = tables.map((t) => {
			const key = `${t.table_schema}.${t.table_name}`;
			return {
				schema: t.table_schema,
				name: t.table_name,
				type: (t.table_type === "VIEW" ? "view" : "table") as "table" | "view",
				columns: colMap.get(key) ?? [],
				foreignKeys: fkMap.get(key) ?? [],
			};
		});

		return { tables: result };
	} finally {
		await pool.close();
	}
}
