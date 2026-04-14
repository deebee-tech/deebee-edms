<script lang="ts">
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { DynamicLucideIcon } from "$lib/components/shadcn-svelte/dynamic-lucide-icon";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderPlusIcon from "@lucide/svelte/icons/folder-plus";
	import LayoutListIcon from "@lucide/svelte/icons/layout-list";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { SectionDefinition } from "../types";
	import FormEntryCard from "./form-entry-card.svelte";

	let {
		section,
		selectedFormId,
		onselectform,
		oneditform,
		ondeleteform,
		onaddform,
		onaddchild,
		onselectchild,
		ondeletechild,
		onmovechildup,
		onmovechilddown,
	}: {
		section: SectionDefinition;
		selectedFormId: string | null;
		onselectform: (formId: string) => void;
		oneditform: (formId: string) => void;
		ondeleteform: (formId: string) => void;
		onaddform: () => void;
		onaddchild: () => void;
		onselectchild: (childId: string) => void;
		ondeletechild: (childId: string) => void;
		onmovechildup: (index: number) => void;
		onmovechilddown: (index: number) => void;
	} = $props();

	const hasConditions = $derived(
		(section.conditions?.visibility && section.conditions.visibility.length > 0) ||
			(section.conditions?.prerequisites && section.conditions.prerequisites.length > 0),
	);
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		{#if section.icon}
			<DynamicLucideIcon name={section.icon} class="size-5 text-muted-foreground" />
		{/if}
		<div class="min-w-0 flex-1">
			<h3 class="text-lg font-semibold">{section.title}</h3>
			{#if section.description}
				<p class="text-sm text-muted-foreground">{section.description}</p>
			{/if}
		</div>
		<div class="flex items-center gap-1">
			{#if section.conditions?.skippable}
				<Badge variant="secondary" class="text-[10px]">Skippable</Badge>
			{/if}
			{#if section.conditions?.repeatable}
				<Badge variant="secondary" class="text-[10px]">Repeatable</Badge>
			{/if}
			{#if hasConditions}
				<Badge variant="outline" class="text-[10px]">Conditional</Badge>
			{/if}
		</div>
	</div>

	{#if section.children && section.children.length > 0}
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<h4 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Child Sections</h4>
				<Button variant="outline" size="sm" class="h-7 text-xs" onclick={onaddchild}>
					<FolderPlusIcon class="mr-1.5 size-3" />
					Add Child
				</Button>
			</div>
			{#each section.children as child, i (child.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<div
					class="flex items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/50"
					onclick={() => onselectchild(child.id)}
				>
					{#if child.icon}
						<DynamicLucideIcon name={child.icon} class="size-4 shrink-0 text-muted-foreground" />
					{:else}
						<LayoutListIcon class="size-4 shrink-0 text-muted-foreground" />
					{/if}
					<div class="min-w-0 flex-1">
						<span class="text-sm font-medium">{child.title}</span>
						{#if child.description}
							<span class="ml-2 text-xs text-muted-foreground">{child.description}</span>
						{/if}
					</div>
					<div class="flex shrink-0 items-center gap-0.5">
						<Button
							variant="ghost"
							size="icon"
							class="size-6 text-muted-foreground"
							disabled={i === 0}
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								onmovechildup(i);
							}}
						>
							<ArrowUpIcon class="size-3" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							class="size-6 text-muted-foreground"
							disabled={i === (section.children?.length ?? 0) - 1}
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								onmovechilddown(i);
							}}
						>
							<ArrowDownIcon class="size-3" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							class="size-6 text-muted-foreground hover:text-destructive"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								ondeletechild(child.id);
							}}
						>
							<TrashIcon class="size-3" />
						</Button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="flex justify-end">
			<Button variant="outline" size="sm" class="h-7 text-xs" onclick={onaddchild}>
				<FolderPlusIcon class="mr-1.5 size-3" />
				Add Child Section
			</Button>
		</div>
	{/if}

	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<h4 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Forms</h4>
			<Button variant="outline" size="sm" class="h-7 text-xs" onclick={onaddform}>
				<PlusIcon class="mr-1.5 size-3" />
				Add Form
			</Button>
		</div>
		{#if section.forms && section.forms.length > 0}
			{#each section.forms as entry (entry.id)}
				<FormEntryCard
					{entry}
					selected={selectedFormId === entry.id}
					onselect={() => onselectform(entry.id)}
					onedit={() => oneditform(entry.id)}
					ondelete={() => ondeleteform(entry.id)}
				/>
			{/each}
		{:else}
			<div
				class="flex min-h-[100px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center"
			>
				<FileTextIcon class="mb-2 size-8 text-muted-foreground/50" />
				<p class="text-xs text-muted-foreground">No forms yet</p>
				<p class="mt-1 text-[10px] text-muted-foreground/75">Add a form to collect data in this section</p>
			</div>
		{/if}
	</div>
</div>
