<script lang="ts">
	import { untrack } from "svelte";
	import {
		SvelteFlowProvider,
		type Node,
		type Edge,
		type Connection,
	} from "@xyflow/svelte";
	import { Pane, PaneGroup, Handle } from "$lib/components/ui/resizable";
	import SchemaBrowser from "./schema-browser.svelte";
	import DatasetCanvas from "./dataset-canvas.svelte";
	import FieldGrid from "./field-grid.svelte";
	import type {
		DatasetDefinition,
		DatasetTable,
		DatasetJoin,
		DatasetField,
		DatasetFilter,
		SchemaTable,
		JoinType,
	} from "$lib/datasets/types";
	import { setJoinMenuContext } from "./join-menu-store.svelte.js";

	let {
		definition,
		schema,
		ondefinitionchange,
	}: {
		definition: DatasetDefinition;
		schema: SchemaTable[];
		ondefinitionchange?: (definition: DatasetDefinition) => void;
	} = $props();

	let datasetTables = $state.raw<DatasetTable[]>(untrack(() => [...definition.tables]));
	let datasetJoins = $state.raw<DatasetJoin[]>(untrack(() => [...definition.joins]));
	let datasetFields = $state.raw<DatasetField[]>(untrack(() => [...definition.fields]));
	let datasetFilters = $state.raw<DatasetFilter[]>(untrack(() => [...definition.filters]));

	let changeCounter = $state(0);

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

	$effect(() => {
		const _count = changeCounter;
		const snapshot: DatasetDefinition = {
			id: untrack(() => definition.id),
			name: untrack(() => definition.name),
			description: untrack(() => definition.description),
			version: untrack(() => definition.version),
			tables: datasetTables.map((t) => ({ ...t, position: { ...t.position } })),
			joins: datasetJoins.map((j) => ({ ...j })),
			fields: datasetFields.map((f) => ({ ...f })),
			filters: datasetFilters.map((f) => ({ ...f })),
			sort: untrack(() => [...definition.sort]),
		};
		if (_count === 0) return;
		untrack(() => ondefinitionchange?.(snapshot));
	});

	function notifyChange() {
		changeCounter++;
	}

	function handleJoinTypeChange(edgeId: string, newType: string) {
		datasetJoins = datasetJoins.map((j) =>
			j.id === edgeId ? { ...j, joinType: newType as JoinType } : j,
		);
		notifyChange();
	}

	function handleDropTable(
		tableData: { schema: string; name: string },
		position: { x: number; y: number },
	) {
		const existingCount = datasetTables.filter((t) => t.tableName === tableData.name).length;
		const alias = existingCount > 0 ? `${tableData.name}_${existingCount + 1}` : tableData.name;

		const newTable: DatasetTable = {
			id: crypto.randomUUID(),
			schema: tableData.schema,
			tableName: tableData.name,
			alias,
			position,
		};

		datasetTables = [...datasetTables, newTable];

		autoDetectJoins(newTable);
		notifyChange();
	}

	function autoDetectJoins(newTable: DatasetTable) {
		const schemaTable = getSchemaTable(newTable.tableName, newTable.schema);
		if (!schemaTable) return;

		for (const fk of schemaTable.foreignKeys) {
			const targetTable = datasetTables.find(
				(t) =>
					t.id !== newTable.id &&
					t.tableName === fk.referencedTable &&
					(fk.referencedSchema ? t.schema === fk.referencedSchema : true),
			);
			if (targetTable) {
				const joinId = `j-${newTable.id}-${targetTable.id}-${fk.columnName}`;
				if (!datasetJoins.some((j) => j.id === joinId)) {
					datasetJoins = [
						...datasetJoins,
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

		for (const existing of datasetTables) {
			if (existing.id === newTable.id) continue;
			const existingSchema = getSchemaTable(existing.tableName, existing.schema);
			if (!existingSchema) continue;

			for (const fk of existingSchema.foreignKeys) {
				if (
					fk.referencedTable === newTable.tableName &&
					(!fk.referencedSchema || fk.referencedSchema === newTable.schema)
				) {
					const joinId = `j-${existing.id}-${newTable.id}-${fk.columnName}`;
					if (!datasetJoins.some((j) => j.id === joinId)) {
						datasetJoins = [
							...datasetJoins,
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
		if (datasetJoins.some((j) => j.id === joinId)) return;

		datasetJoins = [
			...datasetJoins,
			{
				id: joinId,
				sourceTableId: connection.source,
				sourceColumn: sourceCol,
				targetTableId: connection.target,
				targetColumn: targetCol,
				joinType: "inner" as JoinType,
			},
		];
		notifyChange();
	}

	function handleAddFieldFromCanvas(tableId: string, columnName: string) {
		const alreadyExists = datasetFields.some(
			(f) => f.tableId === tableId && f.columnName === columnName,
		);
		if (alreadyExists) return;

		datasetFields = [
			...datasetFields,
			{
				id: crypto.randomUUID(),
				tableId,
				columnName,
				visible: true,
			},
		];
		notifyChange();
	}

	function handleAddFieldFromBrowser(tableName: string, tableSchema: string, columnName: string) {
		const table = datasetTables.find(
			(t) => t.tableName === tableName && t.schema === tableSchema,
		);
		if (!table) return;
		handleAddFieldFromCanvas(table.id, columnName);
	}

	function handleFieldsChange(updated: DatasetField[]) {
		datasetFields = updated;
		notifyChange();
	}

	function handleFiltersChange(updated: DatasetFilter[]) {
		datasetFilters = updated;
		notifyChange();
	}

	function handleNodeDragStop(nodeId: string, position: { x: number; y: number }) {
		datasetTables = datasetTables.map((t) =>
			t.id === nodeId ? { ...t, position } : t,
		);
		notifyChange();
	}
</script>

<div class="flex h-full min-h-[500px] overflow-hidden rounded-lg border bg-background">
	<PaneGroup direction="horizontal">
		<Pane defaultSize={25} minSize={15} maxSize={40}>
			<div class="h-full border-r">
				<div class="border-b px-3 py-2.5">
					<h3 class="text-sm font-semibold">Tables</h3>
				</div>
				<div class="h-[calc(100%-41px)]">
					<SchemaBrowser tables={schema} onaddfield={handleAddFieldFromBrowser} />
				</div>
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
					<FieldGrid
						fields={datasetFields}
						filters={datasetFilters}
						tables={datasetTables}
						onfieldschange={handleFieldsChange}
						onfilterschange={handleFiltersChange}
					/>
				</Pane>
			</PaneGroup>
		</Pane>
	</PaneGroup>
</div>

{#if joinMenu}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
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
			{#each [{ value: "inner", label: "INNER JOIN" }, { value: "left", label: "LEFT JOIN" }, { value: "right", label: "RIGHT JOIN" }, { value: "full", label: "FULL JOIN" }] as option}
				<button
					type="button"
					class="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground {activeJoinType === option.value ? 'bg-accent font-medium' : ''}"
					onclick={() => selectJoinType(option.value as JoinType)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>
{/if}
