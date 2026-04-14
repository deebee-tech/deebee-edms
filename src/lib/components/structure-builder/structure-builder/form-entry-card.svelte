<script lang="ts">
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { SectionFormEntry } from "../types";

	let {
		entry,
		selected = false,
		onselect,
		onedit,
		ondelete,
	}: {
		entry: SectionFormEntry;
		selected?: boolean;
		onselect: () => void;
		onedit: () => void;
		ondelete: () => void;
	} = $props();

	const fieldCount = $derived(entry.form.fields.length);
	const stepCount = $derived(entry.form.steps?.length ?? 0);
	const hasConditions = $derived(entry.conditions?.visibility && entry.conditions.visibility.length > 0);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50 {selected
		? 'border-primary ring-2 ring-primary/20'
		: 'border-border'}"
	onclick={onselect}
>
	<FileTextIcon class="size-4 shrink-0 text-muted-foreground" />

	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<span class="truncate text-sm font-medium">{entry.form.name}</span>
			{#if hasConditions}
				<Badge variant="outline" class="text-[10px]">Conditional</Badge>
			{/if}
		</div>
		<div class="flex items-center gap-2 text-xs text-muted-foreground">
			<span>{fieldCount} field{fieldCount !== 1 ? "s" : ""}</span>
			{#if stepCount > 0}
				<span>&middot; {stepCount} step{stepCount !== 1 ? "s" : ""}</span>
			{/if}
			<span>&middot; Key: <code class="rounded bg-muted px-1">{entry.stateKey}</code></span>
		</div>
	</div>

	<div class="flex shrink-0 items-center gap-1">
		<Button
			variant="ghost"
			size="icon"
			class="size-7"
			onclick={(e: MouseEvent) => {
				e.stopPropagation();
				onedit();
			}}
		>
			<PencilIcon class="size-3.5" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="size-7 text-muted-foreground hover:text-destructive"
			onclick={(e: MouseEvent) => {
				e.stopPropagation();
				ondelete();
			}}
		>
			<TrashIcon class="size-3.5" />
		</Button>
	</div>
</div>
