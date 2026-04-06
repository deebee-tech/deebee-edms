<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import { fieldRegistry } from "$lib/forms/field-registry";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { FormFieldDefinition } from "$lib/forms/types";

	let {
		field,
		selected = false,
		onselect,
		ondelete,
	}: {
		field: FormFieldDefinition;
		selected?: boolean;
		onselect: () => void;
		ondelete: () => void;
	} = $props();

	const entry = $derived(fieldRegistry[field.type]);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="flex items-center gap-2 rounded-md border bg-card p-3 transition-colors hover:bg-accent/50 {selected
		? 'border-primary ring-2 ring-primary/20'
		: 'border-border'}"
	onclick={onselect}
>
	<div class="cursor-grab text-muted-foreground" aria-label="Drag to reorder">
		<GripVerticalIcon class="size-4" />
	</div>

	<div class="flex items-center gap-2">
		<entry.icon class="size-4 text-muted-foreground" />
	</div>

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<span class="truncate text-sm font-medium">{field.label}</span>
			{#if field.required}
				<Badge variant="secondary" class="px-1 py-0 text-[10px]">Required</Badge>
			{/if}
		</div>
		<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
			<span>{entry.label}</span>
			<span class="text-border">|</span>
			<code class="font-mono">{field.name}</code>
		</div>
	</div>

	<Button
		variant="ghost"
		size="icon"
		class="size-7 shrink-0 text-muted-foreground hover:text-destructive"
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
			ondelete();
		}}
	>
		<TrashIcon class="size-3.5" />
	</Button>
</div>
