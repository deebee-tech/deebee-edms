<script lang="ts">
	import { untrack } from "svelte";
	import { SvelteFlowProvider, type Node, type Edge, type Connection } from "@xyflow/svelte";
	import NodePalette from "./node-palette.svelte";
	import NodeConfig from "./node-config.svelte";
	import GlobalStateEditor from "./global-state-editor.svelte";
	import WorkflowCanvas from "./workflow-canvas.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Button } from "$lib/components/ui/button";
	import { nodeRegistry } from "$lib/workflows/node-registry";
	import type {
		WorkflowDefinition,
		WorkflowNodeDefinition,
		WorkflowEdgeDefinition,
		NodeType,
		GlobalVariable,
	} from "$lib/workflows/types";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import NetworkIcon from "@lucide/svelte/icons/network";

	let {
		definition,
		ondefinitionchange,
	}: {
		definition: WorkflowDefinition;
		ondefinitionchange?: (definition: WorkflowDefinition) => void;
	} = $props();

	let workflowNodes = $state.raw<WorkflowNodeDefinition[]>(untrack(() => [...definition.nodes]));
	let workflowEdges = $state.raw<WorkflowEdgeDefinition[]>(untrack(() => [...definition.edges]));
	let globalState = $state.raw<GlobalVariable[]>(untrack(() => [...definition.globalState]));
	let workflowName = $state(untrack(() => definition.name));
	let selectedNodeId = $state<string | null>(null);
	let showGlobalState = $state(false);

	let changeCounter = $state(0);

	const selectedNode = $derived(workflowNodes.find((n) => n.id === selectedNodeId) ?? null);

	// Convert WorkflowNodeDefinition[] to Svelte Flow Node[]
	const flowNodes = $derived<Node[]>(
		workflowNodes.map((n) => ({
			id: n.id,
			type: n.type,
			position: n.position,
			data: { label: n.label, config: n.config },
			selected: n.id === selectedNodeId,
		})),
	);

	// Convert WorkflowEdgeDefinition[] to Svelte Flow Edge[]
	const flowEdges = $derived<Edge[]>(
		workflowEdges.map((e) => ({
			id: e.id,
			source: e.source,
			target: e.target,
			sourceHandle: e.sourceHandle,
			type: "workflow",
			label: e.label,
			data: { sourceHandle: e.sourceHandle },
		})),
	);

	$effect(() => {
		const _count = changeCounter;
		const snapshot: WorkflowDefinition = {
			id: untrack(() => definition.id),
			name: workflowName,
			description: untrack(() => definition.description),
			version: untrack(() => definition.version),
			globalState: globalState.map((v) => ({ ...v })),
			nodes: workflowNodes.map((n) => ({ ...n, config: { ...n.config } })),
			edges: workflowEdges.map((e) => ({ ...e })),
		};
		if (_count === 0) return;
		untrack(() => ondefinitionchange?.(snapshot));
	});

	function notifyChange() {
		changeCounter++;
	}

	function addNode(type: NodeType, position?: { x: number; y: number }) {
		const entry = nodeRegistry[type];
		const id = crypto.randomUUID();
		const count = workflowNodes.filter((n) => n.type === type).length + 1;

		const newNode: WorkflowNodeDefinition = {
			id,
			type,
			label: `${entry.label}${count > 1 ? ` ${count}` : ""}`,
			position: position ?? { x: 250, y: workflowNodes.length * 150 + 50 },
			config: { ...entry.defaultConfig },
		};

		workflowNodes = [...workflowNodes, newNode];
		selectedNodeId = id;
		showGlobalState = false;
		notifyChange();
	}

	function handleDrop(type: NodeType, position: { x: number; y: number }) {
		addNode(type, position);
	}

	function handleConnect(connection: Connection) {
		const id = `e-${connection.source}-${connection.sourceHandle}-${connection.target}`;

		// Prevent duplicate edges
		if (workflowEdges.some((e) => e.id === id)) return;

		const newEdge: WorkflowEdgeDefinition = {
			id,
			source: connection.source!,
			target: connection.target!,
			sourceHandle: (connection.sourceHandle as "success" | "failure") ?? "success",
		};

		workflowEdges = [...workflowEdges, newEdge];
		notifyChange();
	}

	function handleSelect(nodeId: string | null) {
		selectedNodeId = nodeId;
		if (nodeId) showGlobalState = false;
	}

	function updateNode(updated: WorkflowNodeDefinition) {
		workflowNodes = workflowNodes.map((n) => (n.id === updated.id ? updated : n));
		notifyChange();
	}

	function deleteNode(nodeId: string) {
		workflowNodes = workflowNodes.filter((n) => n.id !== nodeId);
		workflowEdges = workflowEdges.filter((e) => e.source !== nodeId && e.target !== nodeId);
		if (selectedNodeId === nodeId) selectedNodeId = null;
		notifyChange();
	}

	function updateGlobalState(variables: GlobalVariable[]) {
		globalState = variables;
		notifyChange();
	}
</script>

<div class="flex h-full min-h-[600px] overflow-hidden rounded-lg border bg-background">
	<!-- Left: Node Palette -->
	<div class="w-56 shrink-0 border-r">
		<div class="border-b px-3 py-2.5">
			<h3 class="text-sm font-semibold">Components</h3>
		</div>
		<ScrollArea class="h-[calc(100%-41px)]">
			<div class="p-3">
				<NodePalette onadd={(type) => addNode(type)} />
			</div>
		</ScrollArea>
	</div>

	<!-- Center: Canvas -->
	<div class="flex flex-1 flex-col">
		<div class="flex items-center gap-4 border-b px-4 py-2.5">
			<div class="flex min-w-0 flex-1 items-center gap-2">
				<label for="workflow-name-input" class="shrink-0 text-xs font-medium text-muted-foreground"> Workflow </label>
				<input
					id="workflow-name-input"
					class="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm font-semibold transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
					bind:value={workflowName}
					placeholder="Untitled Workflow"
					oninput={notifyChange}
				/>
			</div>
		</div>

		<div class="relative flex-1">
			<SvelteFlowProvider>
				<WorkflowCanvas
					nodes={flowNodes}
					edges={flowEdges}
					onconnect={handleConnect}
					onselect={handleSelect}
					ondrop={handleDrop}
				/>
			</SvelteFlowProvider>
		</div>
	</div>

	<!-- Right: Properties -->
	<div class="w-72 shrink-0 border-l">
		<div class="flex items-center justify-between border-b px-3 py-2.5">
			<h3 class="text-sm font-semibold">
				{showGlobalState ? "Global State" : "Properties"}
			</h3>
			<Button
				variant={showGlobalState ? "secondary" : "ghost"}
				size="icon"
				class="size-7"
				onclick={() => {
					showGlobalState = !showGlobalState;
					if (showGlobalState) selectedNodeId = null;
				}}
				title="Global State"
			>
				<SettingsIcon class="size-3.5" />
			</Button>
		</div>
		<ScrollArea class="h-[calc(100%-41px)]">
			<div class="p-3">
				{#if showGlobalState}
					<GlobalStateEditor variables={globalState} onchange={updateGlobalState} />
				{:else if selectedNode}
					<NodeConfig node={selectedNode} onchange={updateNode} ondelete={deleteNode} />
				{:else}
					<div class="flex flex-col items-center justify-center py-12 text-center">
						<NetworkIcon class="mb-3 size-8 text-muted-foreground/40" />
						<p class="text-sm text-muted-foreground">Select a node to edit its properties</p>
						<p class="mt-1 text-xs text-muted-foreground/75">or click the gear icon to manage global state</p>
					</div>
				{/if}
			</div>
		</ScrollArea>
	</div>
</div>
