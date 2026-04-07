import Database from "better-sqlite3";
import type { DbConnectionConfig, SchemaColumn, SchemaData, SchemaForeignKey, SchemaTable } from "./types";

interface SqliteMasterRow {
	name: string;
	type: string;
}

interface PragmaTableInfoRow {
	cid: number;
	name: string;
	type: string;
	notnull: number;
	dflt_value: string | null;
	pk: number;
}

interface PragmaForeignKeyRow {
	id: number;
	seq: number;
	table: string;
	from: string;
	to: string;
}

export async function introspectSqlite(config: DbConnectionConfig): Promise<SchemaData> {
	const db = new Database(config.database, { readonly: true });

	try {
		const rawTables = db
			.prepare(
				`SELECT name, type FROM sqlite_master
				 WHERE type IN ('table', 'view')
				   AND name NOT LIKE 'sqlite_%'
				 ORDER BY type, name`,
			)
			.all() as SqliteMasterRow[];

		const result: SchemaTable[] = rawTables.map((t) => {
			const colRows = db.prepare(`PRAGMA table_info("${t.name.replace(/"/g, '""')}")`).all() as PragmaTableInfoRow[];
			const fkRows = db
				.prepare(`PRAGMA foreign_key_list("${t.name.replace(/"/g, '""')}")`)
				.all() as PragmaForeignKeyRow[];

			const columns: SchemaColumn[] = colRows.map((col) => ({
				name: col.name,
				dataType: col.type || "TEXT",
				nullable: col.notnull === 0 && col.pk === 0,
				isPrimaryKey: col.pk > 0,
				defaultValue: col.dflt_value ?? undefined,
			}));

			const foreignKeys: SchemaForeignKey[] = fkRows.map((fk) => ({
				columnName: fk.from,
				referencedTable: fk.table,
				referencedColumn: fk.to,
			}));

			return {
				schema: "main",
				name: t.name,
				type: (t.type === "view" ? "view" : "table") as "table" | "view",
				columns,
				foreignKeys,
			};
		});

		return { tables: result };
	} finally {
		db.close();
	}
}
