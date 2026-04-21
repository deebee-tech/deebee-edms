<script lang="ts">
	import { DynamicLucideIcon } from "$lib/components/dynamic-lucide-icon";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import { untrack } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import type { SectionDefinition } from "../types";
	import SectionTreeSelf from "./section-tree.svelte";

	let {
		sections,
		selectedSectionId,
		selectedFormId,
		virtualRootId,
		onselect,
		onselectform,
	}: {
		sections: SectionDefinition[];
		selectedSectionId: string | null;
		selectedFormId: string | null;
		/** Optional id treated as the virtual root container; rendered with a different icon. */
		virtualRootId?: string;
		onselect: (id: string) => void;
		onselectform: (sectionId: string, formId: string) => void;
	} = $props();

	let expandedIds = new SvelteSet<string>(untrack(() => sections.map((s) => s.id)));

	function toggleExpand(id: string) {
		if (expandedIds.has(id)) {
			expandedIds.delete(id);
		} else {
			expandedIds.add(id);
		}
	}

	const hasChildren = (s: SectionDefinition) =>
		(s.children && s.children.length > 0) || (s.forms && s.forms.length > 0);
</script>

{#each sections as section (section.id)}
	{@const expanded = expandedIds.has(section.id)}
	{@const isSelected = selectedSectionId === section.id && !selectedFormId}
	{@const isVirtualRoot = virtualRootId !== undefined && section.id === virtualRootId}
	<div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-accent {isSelected
				? 'bg-accent font-medium text-accent-foreground'
				: 'text-muted-foreground'}"
			onclick={() => onselect(section.id)}
		>
			{#if hasChildren(section)}
				<Button
					variant="ghost"
					size="icon"
					class="size-5 shrink-0"
					onclick={(e: MouseEvent) => {
						e.stopPropagation();
						toggleExpand(section.id);
					}}
				>
					{#if expanded}
						<ChevronDownIcon class="size-3" />
					{:else}
						<ChevronRightIcon class="size-3" />
					{/if}
				</Button>
			{:else}
				<span class="inline-block size-5 shrink-0"></span>
			{/if}

			{#if isVirtualRoot}
				<LayersIcon class="size-3.5 shrink-0" />
			{:else if section.icon}
				<DynamicLucideIcon name={section.icon} class="size-3.5 shrink-0" />
			{:else}
				<FolderIcon class="size-3.5 shrink-0" />
			{/if}

			<span class="min-w-0 flex-1 truncate {isVirtualRoot ? 'italic' : ''}">{section.title}</span>
		</div>

		{#if expanded && (section.forms?.length || section.children?.length)}
			<div class="ml-3 border-l border-border/60 pl-1.5">
				{#if section.forms && section.forms.length > 0}
					{#each section.forms as entry (entry.id)}
						{@const isFormSelected = selectedFormId === entry.id}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="flex cursor-pointer items-center gap-1 rounded-md py-1 pr-1.5 pl-6 text-sm transition-colors hover:bg-accent {isFormSelected
								? 'bg-accent font-medium text-accent-foreground'
								: 'text-muted-foreground'}"
							onclick={() => onselectform(section.id, entry.id)}
						>
							<FileTextIcon class="size-3.5 shrink-0" />
							<span class="min-w-0 truncate">{entry.form.name}</span>
						</div>
					{/each}
				{/if}

				{#if section.children && section.children.length > 0}
					<SectionTreeSelf
						sections={section.children}
						{selectedSectionId}
						{selectedFormId}
						{virtualRootId}
						{onselect}
						{onselectform}
					/>
				{/if}
			</div>
		{/if}
	</div>
{/each}
