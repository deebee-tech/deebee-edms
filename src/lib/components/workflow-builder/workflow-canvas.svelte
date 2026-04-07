<script lang="ts">
	import {
		Background,
		Controls,
		MiniMap,
		SvelteFlow,
		useSvelteFlow,
		type Connection,
		type Edge,
		type EdgeTypes,
		type Node,
		type NodeTypes,
	} from "@xyflow/svelte";
	import "@xyflow/svelte/dist/style.css";

	import WorkflowEdge from "./custom-edges/workflow-edge.svelte";
	import WorkflowNode from "./custom-nodes/workflow-node.svelte";
	import { nodeRegistry } from "./node-registry";
	import type { NodeType } from "./types";

	let {
		nodes,
		edges,
		onnodeschange,
		onedgeschange,
		onconnect,
		onselect,
		ondrop,
	}: {
		nodes: Node[];
		edges: Edge[];
		onnodeschange?: (nodes: Node[]) => void;
		onedgeschange?: (edges: Edge[]) => void;
		onconnect?: (connection: Connection) => void;
		onselect?: (nodeId: string | null) => void;
		ondrop?: (type: NodeType, position: { x: number; y: number }) => void;
	} = $props();

	const { screenToFlowPosition, getNodes, getEdges } = useSvelteFlow();

	function notifyNodesChanged() {
		onnodeschange?.(getNodes());
	}

	function notifyEdgesChanged() {
		onedgeschange?.(getEdges());
	}

	function handleNodeDragStop() {
		notifyNodesChanged();
	}

	function handleSelectionDragStop() {
		notifyNodesChanged();
	}

	function handleFlowDelete() {
		queueMicrotask(() => {
			notifyNodesChanged();
			notifyEdgesChanged();
		});
	}

	function handleReconnectEnd() {
		notifyEdgesChanged();
	}

	const nodeTypes = {
		"manual-trigger": WorkflowNode,
		"webhook-trigger": WorkflowNode,
		"api-call": WorkflowNode,
		condition: WorkflowNode,
		transform: WorkflowNode,
		delay: WorkflowNode,
		email: WorkflowNode,
		loop: WorkflowNode,
		"supabase-query": WorkflowNode,
		"custom-script": WorkflowNode,
	} as NodeTypes;

	const edgeTypes = {
		workflow: WorkflowEdge,
	} as EdgeTypes;

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const type = event.dataTransfer?.getData("application/workflow-node-type") as NodeType | undefined;
		if (!type || !nodeRegistry[type]) return;

		const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
		ondrop?.(type, position);
	}

	function handleNodeClick({ node }: { node: Node; event: MouseEvent | TouchEvent }) {
		onselect?.(node.id);
	}

	function handlePaneClick() {
		onselect?.(null);
	}

	function handleConnect(connection: Connection) {
		onconnect?.(connection);
	}
</script>

<div class="h-full w-full" role="presentation" ondragover={handleDragOver} ondrop={handleDrop}>
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{edgeTypes}
		defaultEdgeOptions={{ type: "workflow", animated: true }}
		fitView
		snapGrid={[16, 16]}
		onnodeclick={handleNodeClick}
		onpaneclick={handlePaneClick}
		onconnect={handleConnect}
		onnodedragstop={handleNodeDragStop}
		onselectiondragstop={handleSelectionDragStop}
		ondelete={handleFlowDelete}
		onreconnectend={handleReconnectEnd}
		colorMode="system"
		deleteKey="Delete"
		class="bg-background"
	>
		<Background />
		<Controls />
		<MiniMap />
	</SvelteFlow>
</div>
