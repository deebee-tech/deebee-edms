<script lang="ts">
	import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/svelte";

	let { sourceX, sourceY, targetX, targetY, sourceHandleId, ...rest }: EdgeProps = $props();

	const isFailure = $derived(sourceHandleId === "failure");

	const edgePath = $derived.by(() => {
		const [path, labelX, labelY] = getBezierPath({
			sourceX,
			sourceY,
			targetX,
			targetY,
		});
		return { path, labelX, labelY };
	});
</script>

<BaseEdge
	path={edgePath.path}
	labelX={edgePath.labelX}
	labelY={edgePath.labelY}
	markerStart={rest.markerStart}
	markerEnd={rest.markerEnd}
	interactionWidth={rest.interactionWidth}
	label={rest.label}
	labelStyle={rest.labelStyle}
	style="stroke: {isFailure ? 'var(--color-red-500, #ef4444)' : 'var(--color-emerald-500, #10b981)'}; stroke-width: 2;"
/>
