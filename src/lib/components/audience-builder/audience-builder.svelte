<script lang="ts">
	import FullscreenContainer from "$lib/components/fullscreen-container.svelte";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { Handle, Pane, PaneGroup } from "$lib/components/shadcn-svelte/resizable";
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import MaximizeIcon from "@lucide/svelte/icons/maximize";
	import MinimizeIcon from "@lucide/svelte/icons/minimize";
	import PanelLeftCloseIcon from "@lucide/svelte/icons/panel-left-close";
	import PanelLeftOpenIcon from "@lucide/svelte/icons/panel-left-open";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import UsersIcon from "@lucide/svelte/icons/users";
	import AudienceGroupComponent from "./audience-group.svelte";
	import TagTypePalette from "./tag-type-palette.svelte";
	import {
		createEmptyCondition,
		createEmptyGroup,
		type AudienceCatalog,
		type AudienceDefinition,
		type AudienceGroup,
	} from "./types.js";

	let {
		definition = $bindable(),
		catalog,
		matchedCount,
		totalCount,
	}: {
		definition: AudienceDefinition;
		catalog: AudienceCatalog;
		/** Optional live audience-size hint shown in the header. */
		matchedCount?: number;
		totalCount?: number;
	} = $props();

	const groups = $derived(definition.groups);

	let palettePane = $state<{ collapse: () => void; expand: () => void; isCollapsed: () => boolean } | null>(null);
	let paletteCollapsed = $state(false);

	function ensureNonEmptyGroups() {
		if (definition.groups.length === 0) {
			definition.groups = [createEmptyGroup()];
		}
	}

	$effect(() => {
		ensureNonEmptyGroups();
	});

	function updateGroup(next: AudienceGroup) {
		definition.groups = definition.groups.map((g) => (g.id === next.id ? next : g));
	}

	function deleteGroup(id: string) {
		definition.groups = definition.groups.filter((g) => g.id !== id);
		if (definition.groups.length === 0) definition.groups = [createEmptyGroup()];
	}

	function addGroup() {
		definition.groups = [...definition.groups, createEmptyGroup()];
	}

	function addConditionToLastGroup(tagTypeId: string, tagId?: string) {
		if (definition.groups.length === 0) definition.groups = [createEmptyGroup()];
		const lastIdx = definition.groups.length - 1;
		const last = definition.groups[lastIdx];
		const resolvedTagId = tagId ?? catalog.tags.find((t) => t.tagTypeId === tagTypeId)?.id;
		const newCond = createEmptyCondition(tagTypeId, resolvedTagId);
		const updated: AudienceGroup = { ...last, conditions: [...last.conditions, newCond] };
		definition.groups = [...definition.groups.slice(0, lastIdx), updated];
	}

	function togglePalette() {
		const p = palettePane;
		if (!p) return;
		if (p.isCollapsed()) p.expand();
		else p.collapse();
	}

	const totalConditions = $derived(groups.reduce((n, g) => n + g.conditions.length, 0));
	const hasMatchInfo = $derived(matchedCount !== undefined && totalCount !== undefined);
</script>

<FullscreenContainer>
	{#snippet children({ isFullscreen, toggle })}
		<div class="flex h-full overflow-hidden bg-background {isFullscreen ? '' : 'min-h-[600px] rounded-lg border'}">
			<PaneGroup direction="horizontal">
				<Pane
					bind:this={palettePane}
					collapsible
					collapsedSize={5}
					defaultSize={22}
					maxSize={35}
					minSize={15}
					onCollapse={() => (paletteCollapsed = true)}
					onExpand={() => (paletteCollapsed = false)}
				>
					<div class="flex h-full min-h-0 flex-col border-r">
						{#if paletteCollapsed}
							<div class="flex h-full flex-col items-center gap-1 border-b p-1 pt-2">
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={toggle}
									title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
								>
									{#if isFullscreen}
										<MinimizeIcon class="size-4" />
									{:else}
										<MaximizeIcon class="size-4" />
									{/if}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={togglePalette}
									aria-label="Show palette"
								>
									<PanelLeftOpenIcon class="size-4" />
								</Button>
							</div>
						{:else}
							<div class="flex shrink-0 items-center justify-end gap-1 border-b px-2 py-1">
								<Button
									variant="ghost"
									size="icon"
									class="size-7 shrink-0"
									onclick={toggle}
									title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
								>
									{#if isFullscreen}
										<MinimizeIcon class="size-3.5" />
									{:else}
										<MaximizeIcon class="size-3.5" />
									{/if}
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="size-7 shrink-0"
									onclick={togglePalette}
									aria-label="Hide palette"
								>
									<PanelLeftCloseIcon class="size-4" />
								</Button>
							</div>
							<div class="min-h-0 flex-1">
								<TagTypePalette {catalog} ondoubleclick={addConditionToLastGroup} />
							</div>
						{/if}
					</div>
				</Pane>

				<Handle withHandle />

				<Pane defaultSize={78}>
					<div class="flex h-full min-h-0 flex-col">
						<!-- Header -->
						<div class="flex shrink-0 flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-2.5">
							<div class="flex min-w-0 flex-1 items-center gap-2">
								<UsersIcon class="size-4 shrink-0 text-muted-foreground" />
								<label
									for="audience-name-input"
									class="shrink-0 text-xs font-semibold tracking-wider text-muted-foreground uppercase"
								>
									Audience Name
								</label>
								<input
									id="audience-name-input"
									class="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-semibold shadow-xs transition-colors outline-none placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
									bind:value={definition.name}
									placeholder="Untitled Audience"
								/>
							</div>

							<div class="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
								<Badge variant="outline" class="text-[10px]">
									Object: {definition.objectType}
								</Badge>
								<Badge variant="outline" class="text-[10px]">
									{groups.length} group{groups.length === 1 ? "" : "s"}
								</Badge>
								<Badge variant="outline" class="text-[10px]">
									{totalConditions} condition{totalConditions === 1 ? "" : "s"}
								</Badge>
								{#if hasMatchInfo}
									<Badge variant="default" class="text-[10px]">
										{matchedCount?.toLocaleString()} / {totalCount?.toLocaleString()} matched
									</Badge>
								{/if}
							</div>
						</div>

						<!-- Canvas -->
						<ScrollArea class="min-h-0 flex-1">
							<div class="space-y-4 p-4">
								{#each groups as group, gi (group.id)}
									{#if gi > 0}
										<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
											<div class="h-px flex-1 bg-border"></div>
											<span class="rounded-full bg-primary/10 px-4 py-1 text-sm font-bold tracking-wider text-primary">
												OR
											</span>
											<div class="h-px flex-1 bg-border"></div>
										</div>
									{/if}
									<AudienceGroupComponent
										{group}
										{catalog}
										canDelete={groups.length > 1}
										defaultName="Group {gi + 1}"
										onchange={updateGroup}
										ondelete={() => deleteGroup(group.id)}
									/>
								{/each}

								<div class="flex justify-center pt-2">
									<Button variant="outline" size="sm" onclick={addGroup}>
										<PlusIcon class="mr-1.5 size-3.5" />
										Add OR group
									</Button>
								</div>
							</div>
						</ScrollArea>
					</div>
				</Pane>
			</PaneGroup>
		</div>
	{/snippet}
</FullscreenContainer>
