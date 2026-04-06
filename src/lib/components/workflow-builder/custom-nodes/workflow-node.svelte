<script lang="ts">
	import { Handle, Position, type NodeProps } from "@xyflow/svelte";
	import { nodeRegistry } from "$lib/workflows/node-registry";
	import type { NodeType } from "$lib/workflows/types";

	let { data, id, selected, type: nodeType }: NodeProps = $props();

	const registryEntry = $derived(nodeRegistry[nodeType as NodeType]);

	const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
		emerald: {
			bg: "bg-emerald-500/10",
			border: "border-emerald-500/50",
			text: "text-emerald-700 dark:text-emerald-400",
		},
		blue: {
			bg: "bg-blue-500/10",
			border: "border-blue-500/50",
			text: "text-blue-700 dark:text-blue-400",
		},
		amber: {
			bg: "bg-amber-500/10",
			border: "border-amber-500/50",
			text: "text-amber-700 dark:text-amber-400",
		},
		violet: {
			bg: "bg-violet-500/10",
			border: "border-violet-500/50",
			text: "text-violet-700 dark:text-violet-400",
		},
	};

	const headerColorClasses: Record<string, string> = {
		emerald: "bg-emerald-500",
		blue: "bg-blue-500",
		amber: "bg-amber-500",
		violet: "bg-violet-500",
	};

	const colors = $derived(colorClasses[registryEntry?.color ?? "blue"]);
	const headerColor = $derived(headerColorClasses[registryEntry?.color ?? "blue"]);
	const isTrigger = $derived(registryEntry?.category === "trigger");
	const hasFailure = $derived(registryEntry?.hasFailureOutput ?? true);
	const Icon = $derived(registryEntry?.icon);
</script>

<div
	data-node-id={id}
	class="min-w-[180px] overflow-hidden rounded-lg border shadow-sm transition-shadow {colors.border} {selected
		? 'shadow-md ring-2 ring-primary/50'
		: 'shadow-sm'} bg-background"
>
	{#if !isTrigger}
		<Handle
			type="target"
			position={Position.Top}
			class="h-2.5! w-2.5! border-2! border-background! bg-muted-foreground!"
		/>
	{/if}

	<div class="flex items-center gap-2 px-3 py-2 {headerColor} text-white">
		{#if Icon}
			<Icon class="size-3.5 shrink-0" />
		{/if}
		<span class="truncate text-xs font-semibold">{data?.label ?? registryEntry?.label ?? nodeType}</span>
	</div>

	<div class="px-3 py-2 {colors.bg}">
		<p class="text-[10px] leading-tight text-muted-foreground">{registryEntry?.description ?? ""}</p>
	</div>

	<div class="relative flex items-center px-3 pb-1">
		<Handle
			type="source"
			position={Position.Bottom}
			id="success"
			class="h-3! w-3! border-2! border-background! bg-emerald-500!"
			style="left: {hasFailure ? '30%' : '50%'};"
		/>
		{#if hasFailure}
			<Handle
				type="source"
				position={Position.Bottom}
				id="failure"
				class="h-3! w-3! border-2! border-background! bg-red-500!"
				style="left: 70%;"
			/>
		{/if}
	</div>
</div>
