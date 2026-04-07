<script lang="ts">
	import { nodeCategories, nodeRegistry, type NodeRegistryEntry } from "./node-registry";
	import { NODE_TYPES, type NodeCategory, type NodeType } from "./types";

	let {
		onadd,
	}: {
		onadd: (type: NodeType) => void;
	} = $props();

	const grouped = $derived.by(() => {
		const groups: Record<NodeCategory, { type: NodeType; entry: NodeRegistryEntry }[]> = {
			trigger: [],
			action: [],
			logic: [],
			integration: [],
		};
		for (const type of NODE_TYPES) {
			const entry = nodeRegistry[type];
			groups[entry.category].push({ type, entry });
		}
		return groups;
	});

	function handleDragStart(event: DragEvent, type: NodeType) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData("application/workflow-node-type", type);
		event.dataTransfer.effectAllowed = "move";
	}
</script>

<div class="space-y-4">
	{#each Object.entries(grouped) as [category, items] (category)}
		<div>
			<h4 class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
				{nodeCategories[category as NodeCategory]}
			</h4>
			<div class="space-y-1">
				{#each items as { type, entry } (type)}
					<button
						class="flex w-full cursor-grab items-center gap-2.5 rounded-md border border-border/50 bg-card px-2.5 py-2 text-left text-xs transition-colors hover:border-border hover:bg-accent active:cursor-grabbing"
						draggable="true"
						ondragstart={(e) => handleDragStart(e, type)}
						onclick={() => onadd(type)}
					>
						<entry.icon class="size-3.5 shrink-0 text-muted-foreground" />
						<div class="min-w-0 flex-1">
							<span class="block truncate font-medium">{entry.label}</span>
							<span class="block truncate text-[10px] text-muted-foreground">{entry.description}</span>
						</div>
					</button>
				{/each}
			</div>
		</div>
	{/each}
</div>
