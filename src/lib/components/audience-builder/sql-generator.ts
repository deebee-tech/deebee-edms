import {
	MssqlSqlEasy,
	MysqlSqlEasy,
	PostgresSqlEasy,
	SqliteSqlEasy,
	WhereOperator,
	type IBuilder,
	type IConfiguration,
	type IJoinOnBuilder,
	type IParser,
	type ISqlEasy,
} from "@deebeetech/sqleasy";
import type { AudienceCatalog, AudienceCondition, AudienceDefinition, TagMeta } from "./types.js";

// ── Engine plumbing ──

export type DbEngine = "postgres" | "mysql" | "mssql" | "sqlite";

export const SUPPORTED_DB_ENGINES: readonly DbEngine[] = ["postgres", "mysql", "mssql", "sqlite"] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySqlEasy = ISqlEasy<any, any, any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBuilder = IBuilder<any, IJoinOnBuilder<any>, IParser>;

const dialectMap: Record<DbEngine, new () => AnySqlEasy> = {
	postgres: PostgresSqlEasy as unknown as new () => AnySqlEasy,
	mysql: MysqlSqlEasy as unknown as new () => AnySqlEasy,
	mssql: MssqlSqlEasy as unknown as new () => AnySqlEasy,
	sqlite: SqliteSqlEasy as unknown as new () => AnySqlEasy,
};

function defaultSchemaFor(engine: DbEngine): string {
	switch (engine) {
		case "postgres":
			return "public";
		case "mssql":
			return "dbo";
		default:
			return "";
	}
}

// ── Public API ──

export interface GeneratedAudienceSql {
	/** Prepared SQL with dialect-specific placeholders (`$1` for postgres, `?` for others). */
	sql: string;
	/** SQL with values inlined — handy for the test page and for debugging. */
	rawSql: string;
	/** The engine the SQL was generated for. */
	engine: DbEngine;
}

export interface AudienceSqlOptions {
	/** Target SQL dialect. Defaults to "postgres". */
	engine?: DbEngine;
	/** Table name for the base object (e.g. "person"). Defaults to `def.objectType`. */
	objectTable?: string;
	/** Schema/owner for the object/object_tag tables. Defaults vary by engine ("public" / "dbo" / ""). */
	schema?: string;
	/** Column on the object table that joins to object_tag.object_id. Defaults to "id". */
	objectIdColumn?: string;
	/** Alias used for the base object table inside the generated SQL. Defaults to "o". */
	objectAlias?: string;
	/** Alias used for object_tag inside each EXISTS subquery. Defaults to "ot". */
	objectTagAlias?: string;
}

interface ResolvedOpts {
	engine: DbEngine;
	objectTable: string;
	schema: string;
	objectIdColumn: string;
	objectAlias: string;
	objectTagAlias: string;
}

function resolveOpts(def: AudienceDefinition, options: AudienceSqlOptions): ResolvedOpts {
	const engine = options.engine ?? "postgres";
	return {
		engine,
		objectTable: options.objectTable ?? def.objectType,
		schema: options.schema ?? defaultSchemaFor(engine),
		objectIdColumn: options.objectIdColumn ?? "id",
		objectAlias: options.objectAlias ?? "o",
		objectTagAlias: options.objectTagAlias ?? "ot",
	};
}

function quoteIdent(config: IConfiguration, name: string): string {
	const d = config.identifierDelimiters();
	return `${d.begin}${name}${d.end}`;
}

function fromTableMaybeOwner(builder: AnyBuilder, schema: string, table: string, alias: string) {
	if (schema) builder.fromTableWithOwner(schema, table, alias);
	else builder.fromTable(table, alias);
}

function validTagIdFor(condition: AudienceCondition, tagsByType: Map<string, TagMeta[]>): string | null {
	const valid = tagsByType.get(condition.tagTypeId) ?? [];
	const validIdSet = new Set(valid.map((t) => t.id));
	const tagId = condition.tagIds[0];
	return tagId && validIdSet.has(tagId) ? tagId : null;
}

// ── Subquery + condition emission ──

/** Emit one EXISTS / NOT EXISTS subquery against object_tag for a single tag id. */
function emitExists(
	builder: AnyBuilder,
	config: IConfiguration,
	opts: ResolvedOpts,
	tagId: string,
	negate: boolean,
	objectType: string,
) {
	const subCallback = (s: AnyBuilder) => {
		fromTableMaybeOwner(s, opts.schema, "object_tag", opts.objectTagAlias);
		s.selectRaw("1");
		s.whereRaw(
			`${quoteIdent(config, opts.objectTagAlias)}.${quoteIdent(config, "object_id")} = ${quoteIdent(config, opts.objectAlias)}.${quoteIdent(config, opts.objectIdColumn)}`,
		);
		s.and();
		s.where(opts.objectTagAlias, "object_type", WhereOperator.Equals, objectType);
		s.and();
		s.where(opts.objectTagAlias, "tag_id", WhereOperator.Equals, tagId);
	};

	if (negate) {
		builder.whereNotExistsWithBuilder(opts.objectAlias, opts.objectIdColumn, subCallback);
	} else {
		builder.whereExistsWithBuilder(opts.objectAlias, opts.objectIdColumn, subCallback);
	}
}

/** Emit a single audience condition. Returns true if anything was written. */
function emitCondition(
	builder: AnyBuilder,
	config: IConfiguration,
	opts: ResolvedOpts,
	condition: AudienceCondition,
	tagsByType: Map<string, TagMeta[]>,
	objectType: string,
): boolean {
	const tagId = validTagIdFor(condition, tagsByType);
	if (!tagId) return false;
	emitExists(builder, config, opts, tagId, condition.mode === "has_not", objectType);
	return true;
}

// ── Main entry point ──

/**
 * Generate dialect-specific SQL for an audience definition by driving the
 * SQLEasy query builder. Top-level groups are OR'd together; conditions inside
 * each group are joined with the group's `logic` (AND/OR). Each condition
 * compiles to one or more EXISTS / NOT EXISTS subqueries against the
 * `object_tag` link table, with the outer object referenced via a correlated
 * `ot.object_id = o.id` predicate.
 */
export function generateAudienceSql(
	def: AudienceDefinition,
	catalog: AudienceCatalog,
	options: AudienceSqlOptions = {},
): GeneratedAudienceSql {
	const opts = resolveOpts(def, options);
	const Dialect = dialectMap[opts.engine];
	const sqlEasy = new Dialect();
	const config = sqlEasy.configuration();
	const builder = sqlEasy.newBuilder() as AnyBuilder;

	fromTableMaybeOwner(builder, opts.schema, opts.objectTable, opts.objectAlias);
	builder.selectAll();

	const tagsByType = new Map<string, TagMeta[]>();
	for (const t of catalog.tags) {
		const arr = tagsByType.get(t.tagTypeId) ?? [];
		arr.push(t);
		tagsByType.set(t.tagTypeId, arr);
	}

	// Filter to groups that will actually emit something so we don't end up
	// with `() OR ()` placeholders in the SQL.
	const liveGroups = def.groups
		.map((g) => ({
			group: g,
			liveConditions: g.conditions.filter((c) => validTagIdFor(c, tagsByType) !== null),
		}))
		.filter((g) => g.liveConditions.length > 0);

	liveGroups.forEach(({ group, liveConditions }, gi) => {
		if (gi > 0) builder.or();
		// Wrap each top-level group in parens so that mixed AND/OR group logic
		// composes unambiguously regardless of the precedence of internal ops.
		builder.whereRaw("(");
		liveConditions.forEach((condition, ci) => {
			if (ci > 0) {
				if (group.logic === "or") builder.or();
				else builder.and();
			}
			emitCondition(builder, config, opts, condition, tagsByType, def.objectType);
		});
		builder.whereRaw(")");
	});

	return {
		sql: builder.parse(),
		rawSql: builder.parseRaw(),
		engine: opts.engine,
	};
}
