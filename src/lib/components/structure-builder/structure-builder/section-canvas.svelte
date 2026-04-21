<script lang="ts">
	import { DynamicLucideIcon } from "$lib/components/dynamic-lucide-icon";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderPlusIcon from "@lucide/svelte/icons/folder-plus";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import LayoutListIcon from "@lucide/svelte/icons/layout-list";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { SectionDefinition } from "../types";
	import FormEntryCard from "./form-entry-card.svelte";

	let {
		section,
		selectedFormId,
		isVirtualRoot = false,
		onselectform,
		oneditform,
		ondeleteform,
		onaddform,
		onaddchild,
		onselectchild,
		ondeletechild,
		onmovechildup,
		onmovechilddown,
		ondeletesection,
	}: {
		section: SectionDefinition;
		selectedFormId: string | null;
		/** When true, this section is the builder-only virtual root; hides delete + forms and re-labels child controls. */
		isVirtualRoot?: boolean;
		onselectform: (formId: string) => void;
		oneditform: (formId: string) => void;
		ondeleteform: (formId: string) => void;
		onaddform: () => void;
		onaddchild: () => void;
		onselectchild: (childId: string) => void;
		ondeletechild: (childId: string) => void;
		onmovechildup: (index: number) => void;
		onmovechilddown: (index: number) => void;
		ondeletesection: () => void;
	} = $props();

	const hasConditions = $derived(
		(section.conditions?.visibility && section.conditions.visibility.length > 0) ||
			(section.conditions?.prerequisites && section.conditions.prerequisites.length > 0),
	);

	const childListLabel = $derived(isVirtualRoot ? "Sections" : "Child Sections");
	const addChildLabel = $derived(isVirtualRoot ? "Add Section" : "Add Child");
	const addChildEmptyLabel = $derived(isVirtualRoot ? "Add Section" : "Add Child Section");
</script>

<div class="space-y-4">
	<div class="flex items-center gap-3">
		{#if isVirtualRoot}
			<LayersIcon class="size-5 text-muted-foreground" />
		{:else if section.icon}
			<DynamicLucideIcon name={section.icon} class="size-5 text-muted-foreground" />
		{/if}
		<div class="min-w-0 flex-1">
			<h3 class="text-lg font-semibold {isVirtualRoot ? 'text-muted-foreground italic' : ''}">
				{section.title}
			</h3>
			{#if isVirtualRoot}
				<p class="text-sm text-muted-foreground">Structure root — manage your top-level sections below</p>
			{:else if section.description}
				<p class="text-sm text-muted-foreground">{section.description}</p>
			{/if}
		</div>
		<div class="flex items-center gap-1.5">
			{#if !isVirtualRoot}
				{#if section.conditions?.skippable}
					<Badge variant="secondary" class="text-[10px]">Skippable</Badge>
				{/if}
				{#if section.conditions?.repeatable}
					<Badge variant="secondary" class="text-[10px]">Repeatable</Badge>
				{/if}
				{#if hasConditions}
					<Badge variant="outline" class="text-[10px]">Conditional</Badge>
				{/if}
				<Button
					variant="outline"
					size="sm"
					class="h-7 text-xs text-muted-foreground hover:border-destructive hover:text-destructive"
					onclick={ondeletesection}
				>
					<TrashIcon class="mr-1.5 size-3" />
					Delete Section
				</Button>
			{/if}
		</div>
	</div>

	{#if section.children && section.children.length > 0}
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<h4 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{childListLabel}</h4>
				<Button variant="outline" size="sm" class="h-7 text-xs" onclick={onaddchild}>
					<FolderPlusIcon class="mr-1.5 size-3" />
					{addChildLabel}
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
							title="Move up"
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
							title="Move down"
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
							title="Delete section"
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
		<div class="flex items-center justify-between rounded-md border border-dashed px-3 py-3">
			<span class="text-xs text-muted-foreground">
				{isVirtualRoot ? "No sections yet" : "No child sections"}
			</span>
			<Button variant="outline" size="sm" class="h-7 text-xs" onclick={onaddchild}>
				<FolderPlusIcon class="mr-1.5 size-3" />
				{addChildEmptyLabel}
			</Button>
		</div>
	{/if}

	{#if !isVirtualRoot}
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
	{/if}
</div>
