<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { fieldCategories, fieldRegistry, type FieldCategory, type FieldRegistryEntry } from "../field-registry";
	import { FIELD_TYPES, type FieldType } from "../types";

	let {
		onadd,
	}: {
		onadd: (type: FieldType) => void;
	} = $props();

	type PaletteItem = { type: FieldType; entry: FieldRegistryEntry };

	const grouped = $derived.by(() => {
		const groups = {} as Record<FieldCategory, PaletteItem[]>;
		for (const cat of Object.keys(fieldCategories) as FieldCategory[]) {
			groups[cat] = [];
		}
		for (const type of FIELD_TYPES) {
			const entry = fieldRegistry[type];
			groups[entry.category].push({ type, entry });
		}
		return groups;
	});
</script>

<div class="space-y-4">
	{#each Object.entries(grouped) as [category, items] (category)}
		<div>
			<h4 class="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
				{fieldCategories[category as FieldCategory]}
			</h4>
			<div class="grid grid-cols-2 gap-1.5">
				{#each items as { type, entry } (type)}
					<Button
						variant="outline"
						size="sm"
						class="h-auto justify-start gap-2 px-2.5 py-2 text-xs"
						onclick={() => onadd(type)}
					>
						<entry.icon class="size-3.5 shrink-0 text-muted-foreground" />
						<span class="truncate">{entry.label}</span>
					</Button>
				{/each}
			</div>
		</div>
	{/each}
</div>
