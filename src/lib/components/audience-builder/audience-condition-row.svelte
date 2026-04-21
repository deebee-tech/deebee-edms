<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import TagIcon from "@lucide/svelte/icons/tag";
	import TagsIcon from "@lucide/svelte/icons/tags";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { AudienceCatalog, AudienceCondition, AudienceConditionMode, TagMeta } from "./types.js";

	let {
		condition,
		catalog,
		onchange,
		ondelete,
	}: {
		condition: AudienceCondition;
		catalog: AudienceCatalog;
		onchange: (next: AudienceCondition) => void;
		ondelete: () => void;
	} = $props();

	const tagType = $derived(catalog.tagTypes.find((t) => t.id === condition.tagTypeId));
	const tagsForType = $derived<TagMeta[]>(catalog.tags.filter((t) => t.tagTypeId === condition.tagTypeId));
	const selectedTag = $derived<TagMeta | undefined>(tagsForType.find((t) => t.id === (condition.tagIds[0] ?? "")));

	function update(patch: Partial<AudienceCondition>) {
		onchange({ ...condition, ...patch });
	}

	function setMode(value: string | undefined) {
		if (value === "has" || value === "has_not") update({ mode: value as AudienceConditionMode });
	}

	const modeLabels: Record<AudienceConditionMode, string> = {
		has: "HAS",
		has_not: "DOES NOT HAVE",
	};
</script>

<div
	class="group/row grid items-center gap-2 rounded-md border bg-card px-2 py-1.5 shadow-xs transition-colors hover:border-primary/30"
	style="grid-template-columns: 16px 168px 184px minmax(0, 1fr) 28px;"
>
	<div class="flex h-7 cursor-grab items-center text-muted-foreground/50 active:cursor-grabbing">
		<GripVerticalIcon class="size-4" />
	</div>

	<Select.Root type="single" value={condition.mode} onValueChange={setMode}>
		<Select.Trigger class="h-7 w-full text-xs font-semibold">
			<span class="truncate">{modeLabels[condition.mode]}</span>
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="has">HAS</Select.Item>
			<Select.Item value="has_not">DOES NOT HAVE</Select.Item>
		</Select.Content>
	</Select.Root>

	<!-- Tag type (read-only display, set by drag/drop or "Add condition") -->
	<div
		class="flex h-7 w-full items-center gap-1.5 rounded-md border border-dashed border-input bg-muted/40 px-2 text-xs text-muted-foreground"
		title={tagType?.description ?? tagType?.name ?? ""}
	>
		<TagsIcon class="size-3 shrink-0 text-primary/70" />
		<span class="truncate">{tagType?.name ?? "—"}</span>
	</div>

	<!-- Tag (read-only display) -->
	<div
		class="flex h-7 w-full items-center gap-1.5 rounded-md border border-dashed border-input bg-muted/40 px-2 text-xs"
		title={selectedTag?.label ?? ""}
	>
		<TagIcon class="size-3 shrink-0 text-muted-foreground/70" />
		<span class="truncate {selectedTag ? 'font-medium' : 'text-muted-foreground'}">
			{selectedTag?.label ?? (tagsForType.length === 0 ? "(no tags in type)" : "—")}
		</span>
	</div>

	<Button
		variant="ghost"
		size="sm"
		class="h-7 w-7 justify-self-end p-0 text-muted-foreground hover:text-destructive"
		onclick={ondelete}
		aria-label="Remove condition"
	>
		<TrashIcon class="size-3.5" />
	</Button>
</div>
