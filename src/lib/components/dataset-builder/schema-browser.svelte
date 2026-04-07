<script lang="ts">
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import * as TreeView from "$lib/components/shadcn-svelte/tree-view";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import KeyIcon from "@lucide/svelte/icons/key";
	import LinkIcon from "@lucide/svelte/icons/link";
	import SearchIcon from "@lucide/svelte/icons/search";
	import TableIcon from "@lucide/svelte/icons/table";
	import type { SchemaColumn, SchemaTable } from "./types";

	let {
		tables,
		onaddfield,
	}: {
		tables: SchemaTable[];
		onaddfield?: (tableName: string, schema: string, columnName: string) => void;
	} = $props();

	let search = $state("");

	const filteredTables = $derived.by(() => {
		if (!search.trim()) return tables;
		const q = search.toLowerCase();
		return tables.filter(
			(t) => t.name.toLowerCase().includes(q) || t.columns.some((c) => c.name.toLowerCase().includes(q)),
		);
	});

	const tablesByType = $derived.by(() => {
		const tables = filteredTables.filter((t) => t.type === "table");
		const views = filteredTables.filter((t) => t.type === "view");
		return { tables: tables, views };
	});

	function handleDragStart(event: DragEvent, table: SchemaTable) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData("application/dataset-table", JSON.stringify({ schema: table.schema, name: table.name }));
		event.dataTransfer.effectAllowed = "move";
	}

	function handleColumnDragStart(event: DragEvent, table: SchemaTable, column: SchemaColumn) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData(
			"application/dataset-column",
			JSON.stringify({ schema: table.schema, tableName: table.name, columnName: column.name }),
		);
		event.dataTransfer.effectAllowed = "copy";
	}

	function getFkTarget(table: SchemaTable, column: SchemaColumn): string | undefined {
		const fk = table.foreignKeys.find((f) => f.columnName === column.name);
		return fk ? `${fk.referencedTable}.${fk.referencedColumn}` : undefined;
	}

	function getTypeAbbrev(dataType: string): string {
		const map: Record<string, string> = {
			// Postgres
			"character varying": "varchar",
			"timestamp with time zone": "timestamptz",
			"timestamp without time zone": "timestamp",
			"double precision": "float8",
			boolean: "bool",
			integer: "int4",
			bigint: "int8",
			smallint: "int2",
			text: "text",
			uuid: "uuid",
			jsonb: "jsonb",
			json: "json",
			date: "date",
			numeric: "numeric",
			real: "float4",
			// MySQL
			varchar: "varchar",
			int: "int",
			tinyint: "tinyint",
			mediumint: "medint",
			float: "float",
			double: "double",
			decimal: "decimal",
			datetime: "datetime",
			timestamp: "timestamp",
			char: "char",
			longtext: "longtext",
			mediumtext: "medtext",
			tinytext: "tinytext",
			enum: "enum",
			set: "set",
			blob: "blob",
			longblob: "longblob",
			// MSSQL
			nvarchar: "nvarchar",
			nchar: "nchar",
			ntext: "ntext",
			datetime2: "datetime2",
			datetimeoffset: "dtoffset",
			smalldatetime: "smalldt",
			bit: "bit",
			money: "money",
			smallmoney: "smallmoney",
			uniqueidentifier: "uuid",
			varbinary: "varbinary",
			image: "image",
			xml: "xml",
			sql_variant: "variant",
			// SQLite
			INTEGER: "int",
			REAL: "real",
			TEXT: "text",
			BLOB: "blob",
			NUMERIC: "numeric",
		};
		return map[dataType] ?? dataType;
	}
</script>

<div class="flex h-full flex-col">
	<div class="relative px-3 pt-3 pb-2">
		<SearchIcon class="absolute top-1/2 left-5.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
		<Input placeholder="Search tables..." class="h-8 pl-8 text-xs" bind:value={search} />
	</div>
	<ScrollArea class="flex-1">
		<div class="px-3 pb-3">
			<TreeView.Root class="text-xs">
				{#if tablesByType.tables.length > 0}
					<TreeView.Folder name="Tables ({tablesByType.tables.length})">
						{#snippet icon({ open })}
							<ChevronDownIcon
								class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 {open
									? ''
									: '-rotate-90'}"
							/>
							<TableIcon class="size-3.5 text-blue-500" />
						{/snippet}
						{#each tablesByType.tables as table (table.name)}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="my-0.5 cursor-grab rounded border border-transparent px-1 py-0.5 hover:border-border hover:bg-accent active:cursor-grabbing"
								draggable="true"
								ondragstart={(e) => handleDragStart(e, table)}
							>
								<TreeView.Folder name={table.name}>
									{#snippet icon({ open })}
										<ChevronDownIcon
											class="size-3 shrink-0 text-muted-foreground transition-transform duration-200 {open
												? ''
												: '-rotate-90'}"
										/>
										<TableIcon class="size-3 text-muted-foreground" />
									{/snippet}
									{#each table.columns as col (col.name)}
										{@const fkTarget = getFkTarget(table, col)}
										<button
											class="flex w-full cursor-grab items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-accent active:cursor-grabbing"
											draggable="true"
											ondragstart={(e) => {
												e.stopPropagation();
												handleColumnDragStart(e, table, col);
											}}
											ondblclick={() => onaddfield?.(table.name, table.schema, col.name)}
											type="button"
										>
											{#if col.isPrimaryKey}
												<KeyIcon class="size-3 shrink-0 text-amber-500" />
											{:else if fkTarget}
												<LinkIcon class="size-3 shrink-0 text-violet-500" />
											{:else}
												<span class="size-3 shrink-0"></span>
											{/if}
											<span class="flex-1 truncate">{col.name}</span>
											<Badge variant="outline" class="h-4 px-1 text-[9px] font-normal">
												{getTypeAbbrev(col.dataType)}
											</Badge>
										</button>
									{/each}
								</TreeView.Folder>
							</div>
						{/each}
					</TreeView.Folder>
				{/if}
				{#if tablesByType.views.length > 0}
					<TreeView.Folder name="Views ({tablesByType.views.length})">
						{#snippet icon({ open })}
							<ChevronDownIcon
								class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 {open
									? ''
									: '-rotate-90'}"
							/>
							<EyeIcon class="size-3.5 text-emerald-500" />
						{/snippet}
						{#each tablesByType.views as view (view.name)}
							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="my-0.5 cursor-grab rounded border border-transparent px-1 py-0.5 hover:border-border hover:bg-accent active:cursor-grabbing"
								draggable="true"
								ondragstart={(e) => handleDragStart(e, view)}
							>
								<TreeView.Folder name={view.name}>
									{#snippet icon({ open })}
										<ChevronDownIcon
											class="size-3 shrink-0 text-muted-foreground transition-transform duration-200 {open
												? ''
												: '-rotate-90'}"
										/>
										<EyeIcon class="size-3 text-muted-foreground" />
									{/snippet}
									{#each view.columns as col (col.name)}
										<button
											class="flex w-full cursor-grab items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-accent active:cursor-grabbing"
											draggable="true"
											ondragstart={(e) => {
												e.stopPropagation();
												handleColumnDragStart(e, view, col);
											}}
											ondblclick={() => onaddfield?.(view.name, view.schema, col.name)}
											type="button"
										>
											<span class="size-3 shrink-0"></span>
											<span class="flex-1 truncate">{col.name}</span>
											<Badge variant="outline" class="h-4 px-1 text-[9px] font-normal">
												{getTypeAbbrev(col.dataType)}
											</Badge>
										</button>
									{/each}
								</TreeView.Folder>
							</div>
						{/each}
					</TreeView.Folder>
				{/if}
			</TreeView.Root>
		</div>
	</ScrollArea>
</div>
