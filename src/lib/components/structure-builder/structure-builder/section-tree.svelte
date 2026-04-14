<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { DynamicLucideIcon } from "$lib/components/shadcn-svelte/dynamic-lucide-icon";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import { untrack } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import type { SectionDefinition } from "../types";
	import SectionTreeSelf from "./section-tree.svelte";

	let {
		sections,
		selectedSectionId,
		selectedFormId,
		depth = 0,
		parentId = null,
		onselect,
		onselectform,
		onmovesectionup,
		onmovesectiondown,
	}: {
		sections: SectionDefinition[];
		selectedSectionId: string | null;
		selectedFormId: string | null;
		depth?: number;
		/** Parent section id when rendering a child list; null for root sections */
		parentId?: string | null;
		onselect: (id: string) => void;
		onselectform: (sectionId: string, formId: string) => void;
		onmovesectionup?: (args: { parentId: string | null; index: number }) => void;
		onmovesectiondown?: (args: { parentId: string | null; index: number }) => void;
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

{#each sections as section, index (section.id)}
	{@const expanded = expandedIds.has(section.id)}
	{@const isSelected = selectedSectionId === section.id && !selectedFormId}
	<div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-accent {isSelected
				? 'bg-accent font-medium text-accent-foreground'
				: 'text-muted-foreground'}"
			style:padding-left="{depth * 12 + 4}px"
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

			{#if section.icon}
				<DynamicLucideIcon name={section.icon} class="size-3.5 shrink-0" />
			{:else}
				<FolderIcon class="size-3.5 shrink-0" />
			{/if}

			<span class="min-w-0 flex-1 truncate">{section.title}</span>
			{#if onmovesectionup && onmovesectiondown}
				<div class="flex shrink-0 items-center gap-0.5">
					<Button
						variant="ghost"
						size="icon"
						class="size-5 text-muted-foreground"
						disabled={index === 0}
						title="Move section up"
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							onmovesectionup({ parentId, index });
						}}
					>
						<ArrowUpIcon class="size-3" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="size-5 text-muted-foreground"
						disabled={index === sections.length - 1}
						title="Move section down"
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							onmovesectiondown({ parentId, index });
						}}
					>
						<ArrowDownIcon class="size-3" />
					</Button>
				</div>
			{/if}
		</div>

		{#if expanded}
			{#if section.forms && section.forms.length > 0}
				{#each section.forms as entry (entry.id)}
					{@const isFormSelected = selectedFormId === entry.id}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-accent {isFormSelected
							? 'bg-accent font-medium text-accent-foreground'
							: 'text-muted-foreground'}"
						style:padding-left="{(depth + 1) * 12 + 24}px"
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
					depth={depth + 1}
					parentId={section.id}
					{onselect}
					{onselectform}
					{onmovesectionup}
					{onmovesectiondown}
				/>
			{/if}
		{/if}
	</div>
{/each}
