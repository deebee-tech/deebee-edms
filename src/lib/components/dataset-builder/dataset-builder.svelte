<script lang="ts">
	import {
		FilterBuilderDialog,
		type ColumnMeta,
		type ColumnType,
		type FilterGroup,
	} from "$lib/components/filter-builder";
	import FullscreenContainer from "$lib/components/fullscreen-container.svelte";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { Handle, Pane, PaneGroup } from "$lib/components/shadcn-svelte/resizable";
	import MaximizeIcon from "@lucide/svelte/icons/maximize";
	import MinimizeIcon from "@lucide/svelte/icons/minimize";
	import PanelLeftCloseIcon from "@lucide/svelte/icons/panel-left-close";
	import PanelLeftOpenIcon from "@lucide/svelte/icons/panel-left-open";
	import { SvelteFlowProvider, type Connection, type Edge, type Node } from "@xyflow/svelte";
	import DatasetCanvas from "./dataset-canvas.svelte";
	import FieldGrid from "./field-grid.svelte";
	import { setJoinMenuContext } from "./join-menu-store.svelte.js";
	import SchemaBrowser from "./schema-browser.svelte";
	import type { DatasetDefinition, DatasetField, DatasetTable, JoinType, SchemaTable } from "./types";

	let {
		definition = $bindable(),
		schema,
	}: {
		definition: DatasetDefinition;
		schema: SchemaTable[];
	} = $props();

	const datasetTables = $derived(definition.tables);
	const datasetJoins = $derived(definition.joins);
	const datasetFields = $derived(definition.fields);
	const datasetFilters = $derived(definition.filters);

	function inferColumnType(dataType: string): ColumnType {
		const dt = dataType.toLowerCase();
		if (/^(int|integer|smallint|bigint|numeric|decimal|real|double|float|serial|money)/.test(dt)) return "number";
		if (/^(date|time|timestamp|datetime|interval)/.test(dt)) return "date";
		if (/^(bool|boolean|bit)/.test(dt)) return "boolean";
		return "text";
	}

	const filterColumns = $derived<ColumnMeta[]>(
		datasetTables.flatMap((table) => {
			const schemaTable = schema.find((s) => s.name === table.tableName && s.schema === table.schema);
			if (!schemaTable) return [];
			return schemaTable.columns.map((col) => ({
				key: `${table.id}:${col.name}`,
				label: `${table.alias || table.tableName}.${col.name}`,
				type: inferColumnType(col.dataType),
			}));
		}),
	);

	function getSchemaTable(tableName: string, tableSchema: string): SchemaTable | undefined {
		return schema.find((t) => t.name === tableName && t.schema === tableSchema);
	}

	const flowNodes = $derived<Node[]>(
		datasetTables.map((t) => {
			const schemaTable = getSchemaTable(t.tableName, t.schema);
			return {
				id: t.id,
				type: "dataset-table",
				position: t.position,
				data: {
					tableName: t.tableName,
					alias: t.alias,
					columns: schemaTable?.columns ?? [],
					foreignKeys: schemaTable?.foreignKeys ?? [],
					onaddfield: handleAddFieldFromCanvas,
				},
			};
		}),
	);

	const flowEdges = $derived<Edge[]>(
		datasetJoins.map((j) => ({
			id: j.id,
			source: j.sourceTableId,
			target: j.targetTableId,
			sourceHandle: `col-${j.sourceColumn}`,
			targetHandle: `col-target-${j.targetColumn}`,
			type: "join",
			data: { joinType: j.joinType },
		})),
	);

	let joinMenu = $state<{ edgeId: string; x: number; y: number } | null>(null);

	let schemaTablesPane = $state<{
		collapse: () => void;
		expand: () => void;
		isCollapsed: () => boolean;
	} | null>(null);
	let schemaSidebarCollapsed = $state(false);

	function toggleSchemaSidebar() {
		const p = schemaTablesPane;
		if (!p) return;
		if (p.isCollapsed()) p.expand();
		else p.collapse();
	}
	const activeJoinType = $derived.by(() => {
		const menu = joinMenu;
		if (!menu) return undefined;
		return datasetJoins.find((j) => j.id === menu.edgeId)?.joinType;
	});

	setJoinMenuContext((edgeId: string, x: number, y: number) => {
		joinMenu = { edgeId, x, y };
	});

	function handleEdgeClick(edgeId: string, clientX: number, clientY: number) {
		joinMenu = { edgeId, x: clientX, y: clientY };
	}

	function selectJoinType(type: JoinType) {
		if (!joinMenu) return;
		handleJoinTypeChange(joinMenu.edgeId, type);
		joinMenu = null;
	}

	function closeJoinMenu() {
		joinMenu = null;
	}

	function handleJoinTypeChange(edgeId: string, newType: string) {
		definition.joins = definition.joins.map((j) => (j.id === edgeId ? { ...j, joinType: newType as JoinType } : j));
	}

	function handleDropTable(tableData: { schema: string; name: string }, position: { x: number; y: number }) {
		const existingCount = definition.tables.filter((t) => t.tableName === tableData.name).length;
		const alias = existingCount > 0 ? `${tableData.name}_${existingCount + 1}` : tableData.name;

		const newTable: DatasetTable = {
			id: crypto.randomUUID(),
			schema: tableData.schema,
			tableName: tableData.name,
			alias,
			position,
		};

		definition.tables = [...definition.tables, newTable];

		autoDetectJoins(newTable);
	}

	function autoDetectJoins(newTable: DatasetTable) {
		const schemaTable = getSchemaTable(newTable.tableName, newTable.schema);
		if (!schemaTable) return;

		for (const fk of schemaTable.foreignKeys) {
			const targetTable = definition.tables.find(
				(t) =>
					t.id !== newTable.id &&
					t.tableName === fk.referencedTable &&
					(fk.referencedSchema ? t.schema === fk.referencedSchema : true),
			);
			if (targetTable) {
				const joinId = `j-${newTable.id}-${targetTable.id}-${fk.columnName}`;
				if (!definition.joins.some((j) => j.id === joinId)) {
					definition.joins = [
						...definition.joins,
						{
							id: joinId,
							sourceTableId: newTable.id,
							sourceColumn: fk.columnName,
							targetTableId: targetTable.id,
							targetColumn: fk.referencedColumn,
							joinType: "inner" as JoinType,
						},
					];
				}
			}
		}

		for (const existing of definition.tables) {
			if (existing.id === newTable.id) continue;
			const existingSchema = getSchemaTable(existing.tableName, existing.schema);
			if (!existingSchema) continue;

			for (const fk of existingSchema.foreignKeys) {
				if (
					fk.referencedTable === newTable.tableName &&
					(!fk.referencedSchema || fk.referencedSchema === newTable.schema)
				) {
					const joinId = `j-${existing.id}-${newTable.id}-${fk.columnName}`;
					if (!definition.joins.some((j) => j.id === joinId)) {
						definition.joins = [
							...definition.joins,
							{
								id: joinId,
								sourceTableId: existing.id,
								sourceColumn: fk.columnName,
								targetTableId: newTable.id,
								targetColumn: fk.referencedColumn,
								joinType: "inner" as JoinType,
							},
						];
					}
				}
			}
		}
	}

	function handleConnect(connection: Connection) {
		if (!connection.source || !connection.target) return;

		const sourceCol = connection.sourceHandle?.replace("col-", "") ?? "";
		const targetCol = connection.targetHandle?.replace("col-target-", "") ?? "";

		if (!sourceCol || !targetCol) return;

		const joinId = `j-${connection.source}-${connection.target}-${sourceCol}`;
		if (definition.joins.some((j) => j.id === joinId)) return;

		definition.joins = [
			...definition.joins,
			{
				id: joinId,
				sourceTableId: connection.source,
				sourceColumn: sourceCol,
				targetTableId: connection.target,
				targetColumn: targetCol,
				joinType: "inner" as JoinType,
			},
		];
	}

	function handleAddFieldFromCanvas(tableId: string, columnName: string) {
		const alreadyExists = definition.fields.some((f) => f.tableId === tableId && f.columnName === columnName);
		if (alreadyExists) return;

		definition.fields = [
			...definition.fields,
			{
				id: crypto.randomUUID(),
				tableId,
				columnName,
				visible: true,
			},
		];
	}

	function handleAddFieldFromBrowser(tableName: string, tableSchema: string, columnName: string) {
		const table = definition.tables.find((t) => t.tableName === tableName && t.schema === tableSchema);
		if (!table) return;
		handleAddFieldFromCanvas(table.id, columnName);
	}

	function handleFieldsChange(updated: DatasetField[]) {
		definition.fields = updated;
	}

	function handleFilterBuilderApply(groups: FilterGroup[]) {
		definition.filters = groups;
	}

	function handleNodeDragStop(nodeId: string, position: { x: number; y: number }) {
		definition.tables = definition.tables.map((t) => (t.id === nodeId ? { ...t, position } : t));
	}
</script>

<FullscreenContainer>
	{#snippet children({ isFullscreen, toggle })}
		<div class="flex h-full overflow-hidden bg-background {isFullscreen ? '' : 'min-h-[500px] rounded-lg border'}">
			<PaneGroup direction="horizontal">
				<Pane
					bind:this={schemaTablesPane}
					collapsible
					collapsedSize={5}
					defaultSize={25}
					maxSize={40}
					minSize={15}
					onCollapse={() => {
						schemaSidebarCollapsed = true;
					}}
					onExpand={() => {
						schemaSidebarCollapsed = false;
					}}
				>
					<div class="flex h-full min-h-0 flex-col border-r">
						{#if schemaSidebarCollapsed}
							<div class="flex h-full flex-col items-center gap-1 border-b p-1 pt-2">
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={toggle}
									title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
								>
									{#if isFullscreen}
										<MinimizeIcon class="size-4" />
									{:else}
										<MaximizeIcon class="size-4" />
									{/if}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={toggleSchemaSidebar}
									aria-label="Show schema browser"
								>
									<PanelLeftOpenIcon class="size-4" />
								</Button>
							</div>
						{:else}
							<div class="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2.5">
								<h3 class="text-sm font-semibold">Tables</h3>
								<div class="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										class="size-7 shrink-0"
										onclick={toggle}
										title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
									>
										{#if isFullscreen}
											<MinimizeIcon class="size-3.5" />
										{:else}
											<MaximizeIcon class="size-3.5" />
										{/if}
									</Button>
									<Button
										variant="ghost"
										size="icon"
										class="size-7 shrink-0"
										onclick={toggleSchemaSidebar}
										aria-label="Hide schema browser"
									>
										<PanelLeftCloseIcon class="size-4" />
									</Button>
								</div>
							</div>
							<div class="min-h-0 flex-1">
								<SchemaBrowser tables={schema} onaddfield={handleAddFieldFromBrowser} />
							</div>
						{/if}
					</div>
				</Pane>
				<Handle withHandle />
				<Pane defaultSize={75}>
					<PaneGroup direction="vertical">
						<Pane defaultSize={60} minSize={30}>
							<div class="h-full">
								<SvelteFlowProvider>
									<DatasetCanvas
										nodes={flowNodes}
										edges={flowEdges}
										onconnect={handleConnect}
										ondrop={handleDropTable}
										onedgeclick={handleEdgeClick}
										onpaneclick={closeJoinMenu}
										onnodedragstop={handleNodeDragStop}
									/>
								</SvelteFlowProvider>
							</div>
						</Pane>
						<Handle withHandle />
						<Pane defaultSize={40} minSize={15}>
							<div class="relative h-full overflow-hidden">
								<div class="absolute inset-0 flex flex-col">
									<div class="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
										<FilterBuilderDialog
											columns={filterColumns}
											onApply={handleFilterBuilderApply}
											existingGroups={datasetFilters}
										/>
										{#if datasetFilters.length > 0}
											<span class="text-xs text-muted-foreground">
												{datasetFilters.reduce((n, g) => n + g.filters.length, 0)} filter(s) active
											</span>
										{/if}
									</div>
									<div class="min-h-0 flex-1">
										<FieldGrid fields={datasetFields} tables={datasetTables} onfieldschange={handleFieldsChange} />
									</div>
								</div>
							</div>
						</Pane>
					</PaneGroup>
				</Pane>
			</PaneGroup>
		</div>
	{/snippet}
</FullscreenContainer>

{#if joinMenu}
	<div
		class="fixed inset-0 z-50"
		onclick={closeJoinMenu}
		onkeydown={(e) => e.key === "Escape" && closeJoinMenu()}
		role="presentation"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div
			class="absolute min-w-28 rounded-md border bg-popover p-1 shadow-md"
			style="left: {joinMenu.x}px; top: {joinMenu.y}px;"
			role="menu"
			onclick={(e) => e.stopPropagation()}
		>
			<p class="px-2 py-1 text-xs font-medium text-muted-foreground">Join Type</p>
			{#each [{ value: "inner", label: "INNER JOIN" }, { value: "left", label: "LEFT JOIN" }, { value: "right", label: "RIGHT JOIN" }, { value: "full", label: "FULL JOIN" }] as option (option.value)}
				<button
					type="button"
					class="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground {activeJoinType ===
					option.value
						? 'bg-accent font-medium'
						: ''}"
					onclick={() => selectJoinType(option.value as JoinType)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>
{/if}
