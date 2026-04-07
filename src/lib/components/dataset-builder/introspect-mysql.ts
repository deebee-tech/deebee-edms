import mysql from "mysql2/promise";
import type { DbConnectionConfig, SchemaData, SchemaTable, SchemaColumn, SchemaForeignKey } from "./types";

export async function introspectMysql(config: DbConnectionConfig): Promise<SchemaData> {
	const targetSchema = config.schema || config.database;

	const connection = await mysql.createConnection({
		host: config.host,
		port: config.port,
		database: config.database,
		user: config.username,
		password: config.password,
		ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
		connectTimeout: 10000,
	});

	try {
		const [tables] = await connection.query<mysql.RowDataPacket[]>(
			`SELECT table_schema, table_name, table_type
			 FROM information_schema.tables
			 WHERE table_schema = ?
			   AND table_type IN ('BASE TABLE', 'VIEW')
			 ORDER BY table_type, table_name`,
			[targetSchema],
		);

		const [columns] = await connection.query<mysql.RowDataPacket[]>(
			`SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default, column_key
			 FROM information_schema.columns
			 WHERE table_schema = ?
			 ORDER BY table_name, ordinal_position`,
			[targetSchema],
		);

		const [foreignKeys] = await connection.query<mysql.RowDataPacket[]>(
			`SELECT
			   kcu.table_schema,
			   kcu.table_name,
			   kcu.column_name,
			   kcu.referenced_table_schema,
			   kcu.referenced_table_name,
			   kcu.referenced_column_name
			 FROM information_schema.key_column_usage kcu
			 WHERE kcu.table_schema = ?
			   AND kcu.referenced_table_name IS NOT NULL`,
			[targetSchema],
		);

		const pkSet = new Set(
			columns.filter((c) => c.column_key === "PRI").map((c) => `${c.table_schema}.${c.table_name}.${c.column_name}`),
		);

		const fkMap = new Map<string, SchemaForeignKey[]>();
		for (const fk of foreignKeys) {
			const key = `${fk.table_schema}.${fk.table_name}`;
			const list = fkMap.get(key) ?? [];
			list.push({
				columnName: fk.column_name,
				referencedTable: fk.referenced_table_name,
				referencedColumn: fk.referenced_column_name,
				referencedSchema: fk.referenced_table_schema,
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
				schema: t.table_schema as string,
				name: t.table_name as string,
				type: (t.table_type === "VIEW" ? "view" : "table") as "table" | "view",
				columns: colMap.get(key) ?? [],
				foreignKeys: fkMap.get(key) ?? [],
			};
		});

		return { tables: result };
	} finally {
		await connection.end();
	}
}
