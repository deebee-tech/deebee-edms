<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import SearchIcon from "@lucide/svelte/icons/search";
	import TagIcon from "@lucide/svelte/icons/tag";
	import TagsIcon from "@lucide/svelte/icons/tags";
	import { SvelteSet } from "svelte/reactivity";
	import type { AudienceCatalog, TagMeta } from "./types.js";

	let {
		catalog,
		ondoubleclick,
	}: {
		catalog: AudienceCatalog;
		/** Fired when the user double-clicks a tag in the palette. */
		ondoubleclick?: (tagTypeId: string, tagId: string) => void;
	} = $props();

	let search = $state("");
	const collapsed = new SvelteSet<string>();

	const query = $derived(search.trim().toLowerCase());

	const sections = $derived.by(() => {
		return catalog.tagTypes
			.map((tt) => {
				const allTags = catalog.tags.filter((t) => t.tagTypeId === tt.id);
				const typeMatches = !query || tt.name.toLowerCase().includes(query);
				const tags = query
					? allTags.filter((t) => typeMatches || t.label.toLowerCase().includes(query))
					: allTags;
				return { tagType: tt, allTagsCount: allTags.length, tags };
			})
			.filter((section) => section.tags.length > 0);
	});

	function isCollapsed(typeId: string): boolean {
		// While searching, force every visible section open so all matches are shown.
		if (query) return false;
		return collapsed.has(typeId);
	}

	function toggleSection(typeId: string) {
		if (collapsed.has(typeId)) collapsed.delete(typeId);
		else collapsed.add(typeId);
	}

	function handleDragStart(event: DragEvent, tag: TagMeta) {
		if (!event.dataTransfer) return;
		event.dataTransfer.setData(
			"application/audience-tag",
			JSON.stringify({ tagTypeId: tag.tagTypeId, tagId: tag.id }),
		);
		event.dataTransfer.effectAllowed = "copy";
	}

	function expandAll() {
		collapsed.clear();
	}

	function collapseAll() {
		for (const tt of catalog.tagTypes) collapsed.add(tt.id);
	}
</script>

<div class="flex h-full flex-col">
	<div class="border-b px-3 py-2.5">
		<div class="flex items-center justify-between gap-2">
			<div class="flex items-center gap-2">
				<TagsIcon class="size-4 text-muted-foreground" />
				<h3 class="text-sm font-semibold">Tags</h3>
			</div>
			<div class="flex items-center gap-1">
				<Button variant="ghost" size="sm" class="h-6 px-1.5 text-[10px]" onclick={expandAll}>Expand</Button>
				<Button variant="ghost" size="sm" class="h-6 px-1.5 text-[10px]" onclick={collapseAll}>Collapse</Button>
			</div>
		</div>
		<p class="mt-0.5 text-[11px] text-muted-foreground">
			Drag a tag onto a match group, or double-click to add it to the last group.
		</p>
	</div>

	<div class="relative shrink-0 px-3 pt-3 pb-2">
		<SearchIcon class="absolute top-1/2 left-5.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
		<Input placeholder="Search tag types or tags…" class="h-8 pl-8 text-xs" bind:value={search} />
	</div>

	<ScrollArea class="min-h-0 flex-1">
		<div class="space-y-2 px-3 pb-3">
			{#if sections.length === 0}
				<p class="px-2 py-6 text-center text-xs text-muted-foreground">No tags match.</p>
			{:else}
				{#each sections as section (section.tagType.id)}
					{@const open = !isCollapsed(section.tagType.id)}
					<div class="overflow-hidden rounded-md border bg-card/50">
						<button
							type="button"
							class="flex w-full items-center gap-1.5 border-b bg-muted/30 px-2 py-1.5 text-left text-xs font-semibold transition-colors hover:bg-muted/60 {open
								? ''
								: 'border-b-transparent'}"
							onclick={() => toggleSection(section.tagType.id)}
							title={section.tagType.description ?? section.tagType.name}
						>
							{#if open}
								<ChevronDownIcon class="size-3.5 shrink-0 text-muted-foreground" />
							{:else}
								<ChevronRightIcon class="size-3.5 shrink-0 text-muted-foreground" />
							{/if}
							<TagsIcon class="size-3.5 shrink-0 text-primary/70" />
							<span class="flex-1 truncate">{section.tagType.name}</span>
							<span
								class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums"
							>
								{query ? `${section.tags.length}/${section.allTagsCount}` : section.allTagsCount}
							</span>
						</button>

						{#if open}
							<ul class="divide-y">
								{#each section.tags as tag (tag.id)}
									<li
										class="group/tag flex cursor-grab items-center gap-2 px-2 py-1.5 text-xs transition-colors hover:bg-accent active:cursor-grabbing"
										draggable="true"
										ondragstart={(e) => handleDragStart(e, tag)}
										ondblclick={() => ondoubleclick?.(tag.tagTypeId, tag.id)}
									>
										<GripVerticalIcon
											class="size-3 shrink-0 text-muted-foreground/40 transition-colors group-hover/tag:text-muted-foreground"
										/>
										<span class="ml-4 flex min-w-0 flex-1 items-center gap-2 border-l border-border/60 pl-3">
											<TagIcon class="size-3 shrink-0 text-muted-foreground/60" />
											<span class="flex-1 truncate">{tag.label}</span>
										</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</ScrollArea>
</div>
