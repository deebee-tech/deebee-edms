<script lang="ts">
	import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/svelte";
	import { getJoinMenuContext } from "../join-menu-store.svelte.js";

	let { id, sourceX, sourceY, targetX, targetY, data, ...rest }: EdgeProps = $props();

	const openMenu = getJoinMenuContext();

	const joinType = $derived((data?.joinType as string) ?? "inner");

	const joinLabel = $derived.by(() => {
		const labels: Record<string, string> = {
			inner: "INNER",
			left: "LEFT",
			right: "RIGHT",
			full: "FULL",
		};
		return labels[joinType] ?? "JOIN";
	});

	const edgePath = $derived.by(() => {
		const [path, labelX, labelY] = getBezierPath({
			sourceX,
			sourceY,
			targetX,
			targetY,
		});
		return { path, labelX, labelY };
	});

	function handleLabelClick(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		openMenu?.(id, event.clientX, event.clientY);
	}
</script>

<BaseEdge
	path={edgePath.path}
	markerStart={rest.markerStart}
	markerEnd={rest.markerEnd}
	interactionWidth={rest.interactionWidth}
	style="stroke: var(--color-blue-500, #3b82f6); stroke-width: 2;"
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<g
	class="nopan nodrag"
	onclick={handleLabelClick}
	onpointerdown={(e) => e.stopPropagation()}
	onmousedown={(e) => e.stopPropagation()}
>
	<rect
		x={edgePath.labelX - 26}
		y={edgePath.labelY - 10}
		width="52"
		height="20"
		rx="4"
		fill="var(--color-background, #fff)"
		stroke="var(--color-blue-500, #3b82f6)"
		stroke-width="1"
		class="cursor-pointer"
	/>
	<text
		x={edgePath.labelX}
		y={edgePath.labelY + 4}
		text-anchor="middle"
		class="cursor-pointer select-none"
		style="font-size: 10px; font-weight: 600; fill: var(--color-blue-500, #3b82f6);"
	>
		{joinLabel}
	</text>
</g>
