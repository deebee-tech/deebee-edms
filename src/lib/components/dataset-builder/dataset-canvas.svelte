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

	import TableNode from "./custom-nodes/table-node.svelte";
	import JoinEdge from "./custom-edges/join-edge.svelte";

	let {
		nodes,
		edges,
		onconnect,
		ondrop,
		onnodeclick,
		onedgeclick,
		onpaneclick,
		onnodedragstop,
	}: {
		nodes: Node[];
		edges: Edge[];
		onconnect?: (connection: Connection) => void;
		ondrop?: (tableData: { schema: string; name: string }, position: { x: number; y: number }) => void;
		onnodeclick?: (nodeId: string) => void;
		onedgeclick?: (edgeId: string, clientX: number, clientY: number) => void;
		onpaneclick?: () => void;
		onnodedragstop?: (nodeId: string, position: { x: number; y: number }) => void;
	} = $props();

	const { screenToFlowPosition } = useSvelteFlow();

	const nodeTypes = {
		"dataset-table": TableNode,
	} as NodeTypes;

	const edgeTypes = {
		join: JoinEdge,
	} as EdgeTypes;

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const tableJson = event.dataTransfer?.getData("application/dataset-table");
		if (!tableJson) return;

		try {
			const tableData = JSON.parse(tableJson) as { schema: string; name: string };
			const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
			ondrop?.(tableData, position);
		} catch {
			// invalid data
		}
	}

	function handleNodeClick({ node }: { node: Node }) {
		onnodeclick?.(node.id);
	}

	function handlePaneClick() {
		onpaneclick?.();
	}

	function handleConnect(connection: Connection) {
		onconnect?.(connection);
	}

	function handleEdgeClick({ event, edge }: { event: MouseEvent; edge: Edge }) {
		onedgeclick?.(edge.id, event.clientX, event.clientY);
	}

	function handleNodeDragStop({
		targetNode,
	}: {
		targetNode: Node | null;
		nodes: Node[];
		event: MouseEvent | TouchEvent;
	}) {
		if (targetNode) onnodedragstop?.(targetNode.id, targetNode.position);
	}
</script>

<div class="h-full w-full" role="presentation" ondragover={handleDragOver} ondrop={handleDrop}>
	<SvelteFlow
		{nodes}
		{edges}
		{nodeTypes}
		{edgeTypes}
		defaultEdgeOptions={{ type: "join" }}
		fitView
		snapGrid={[16, 16]}
		onnodeclick={handleNodeClick}
		onedgeclick={handleEdgeClick}
		onpaneclick={handlePaneClick}
		onconnect={handleConnect}
		onnodedragstop={handleNodeDragStop}
		colorMode="system"
		deleteKey="Delete"
		class="bg-background"
	>
		<Background />
		<Controls />
		<MiniMap />
	</SvelteFlow>
</div>
