import postgres from "postgres";
import type { DbConnectionConfig, SchemaData, SchemaTable, SchemaColumn, SchemaForeignKey } from "./types";

export async function introspectPostgres(config: DbConnectionConfig): Promise<SchemaData> {
	const targetSchema = config.schema || "public";

	const sql = postgres({
		host: config.host,
		port: config.port,
		database: config.database,
		username: config.username,
		password: config.password,
		ssl: config.ssl ? { rejectUnauthorized: false } : false,
		max: 1,
		idle_timeout: 10,
		connect_timeout: 10,
	});

	try {
		const tables = await sql<{ table_schema: string; table_name: string; table_type: string }[]>`
			SELECT table_schema, table_name, table_type
			FROM information_schema.tables
			WHERE table_schema = ${targetSchema}
			  AND table_type IN ('BASE TABLE', 'VIEW')
			ORDER BY table_type, table_name
		`;

		const columns = await sql<
			{
				table_schema: string;
				table_name: string;
				column_name: string;
				data_type: string;
				is_nullable: string;
				column_default: string | null;
			}[]
		>`
			SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
			FROM information_schema.columns
			WHERE table_schema = ${targetSchema}
			ORDER BY table_name, ordinal_position
		`;

		const primaryKeys = await sql<
			{
				table_schema: string;
				table_name: string;
				column_name: string;
			}[]
		>`
			SELECT kcu.table_schema, kcu.table_name, kcu.column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu
			  ON tc.constraint_name = kcu.constraint_name
			  AND tc.table_schema = kcu.table_schema
			WHERE tc.constraint_type = 'PRIMARY KEY'
			  AND tc.table_schema = ${targetSchema}
		`;

		const foreignKeys = await sql<
			{
				table_schema: string;
				table_name: string;
				column_name: string;
				referenced_table_schema: string;
				referenced_table_name: string;
				referenced_column_name: string;
			}[]
		>`
			SELECT
			  kcu.table_schema,
			  kcu.table_name,
			  kcu.column_name,
			  ccu.table_schema AS referenced_table_schema,
			  ccu.table_name AS referenced_table_name,
			  ccu.column_name AS referenced_column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu
			  ON tc.constraint_name = kcu.constraint_name
			  AND tc.table_schema = kcu.table_schema
			JOIN information_schema.constraint_column_usage ccu
			  ON tc.constraint_name = ccu.constraint_name
			  AND tc.table_schema = ccu.table_schema
			WHERE tc.constraint_type = 'FOREIGN KEY'
			  AND tc.table_schema = ${targetSchema}
		`;

		const pkSet = new Set(primaryKeys.map((pk) => `${pk.table_schema}.${pk.table_name}.${pk.column_name}`));

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
				schema: t.table_schema,
				name: t.table_name,
				type: t.table_type === "VIEW" ? "view" : "table",
				columns: colMap.get(key) ?? [],
				foreignKeys: fkMap.get(key) ?? [],
			};
		});

		return { tables: result };
	} finally {
		await sql.end();
	}
}
