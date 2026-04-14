<script lang="ts">
	import FullscreenContainer from "$lib/components/fullscreen-container.svelte";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import FolderPlusIcon from "@lucide/svelte/icons/folder-plus";
	import LayoutListIcon from "@lucide/svelte/icons/layout-list";
	import MaximizeIcon from "@lucide/svelte/icons/maximize";
	import MinimizeIcon from "@lucide/svelte/icons/minimize";
	import { untrack } from "svelte";
	import { collectAllSectionIds, collectAllStateKeys, findSectionById } from "../conditions";
	import type { SectionDefinition, SectionFormEntry, StructureDefinition } from "../types";
	import FormEditorDialog from "./form-editor-dialog.svelte";
	import FormEntryConfig from "./form-entry-config.svelte";
	import SectionCanvas from "./section-canvas.svelte";
	import SectionConfig from "./section-config.svelte";
	import SectionTree from "./section-tree.svelte";

	let {
		definition,
		ondefinitionchange,
	}: {
		definition: StructureDefinition;
		ondefinitionchange?: (definition: StructureDefinition) => void;
	} = $props();

	let sections = $state<SectionDefinition[]>(untrack(() => JSON.parse(JSON.stringify(definition.sections))));
	let structureName = $state(untrack(() => definition.name));
	let selectedSectionId = $state<string | null>(null);
	let selectedFormId = $state<string | null>(null);
	let editingFormEntry = $state<SectionFormEntry | null>(null);
	let formEditorOpen = $state(false);

	let changeCounter = $state(0);

	const allSectionIds = $derived(collectAllSectionIds(sections));
	const allStateKeys = $derived(collectAllStateKeys(sections));

	const selectedSection = $derived.by(() => {
		if (!selectedSectionId) return null;
		return findSectionById(sections, selectedSectionId);
	});

	const selectedFormEntry = $derived.by((): SectionFormEntry | null => {
		if (!selectedFormId || !selectedSectionId) return null;
		const section = findSectionById(sections, selectedSectionId);
		if (!section?.forms) return null;
		return section.forms.find((f) => f.id === selectedFormId) ?? null;
	});

	$effect(() => {
		const _count = changeCounter;
		const snapshot: StructureDefinition = {
			id: untrack(() => definition.id),
			name: structureName,
			description: untrack(() => definition.description),
			sections: JSON.parse(JSON.stringify(sections)),
		};
		if (_count === 0) return;
		untrack(() => ondefinitionchange?.(snapshot));
	});

	function notifyChange() {
		changeCounter++;
	}

	function selectSection(id: string) {
		selectedSectionId = id;
		selectedFormId = null;
	}

	function selectForm(sectionId: string, formId: string) {
		selectedSectionId = sectionId;
		selectedFormId = formId;
	}

	function addRootSection() {
		const id = crypto.randomUUID();
		const num = sections.length + 1;
		const newSection: SectionDefinition = {
			id,
			title: `Section ${num}`,
		};
		sections = [...sections, newSection];
		selectedSectionId = id;
		selectedFormId = null;
		notifyChange();
	}

	function addChildSection(parentId: string) {
		const parent = findSectionById(sections, parentId);
		if (!parent) return;
		const id = crypto.randomUUID();
		const num = (parent.children?.length ?? 0) + 1;
		const newChild: SectionDefinition = {
			id,
			title: `${parent.title} — Child ${num}`,
		};
		if (!parent.children) parent.children = [];
		parent.children = [...parent.children, newChild];
		sections = [...sections];
		selectedSectionId = id;
		selectedFormId = null;
		notifyChange();
	}

	function deleteSection(id: string) {
		function removeFrom(list: SectionDefinition[]): SectionDefinition[] {
			return list
				.filter((s) => s.id !== id)
				.map((s) => ({
					...s,
					children: s.children ? removeFrom(s.children) : undefined,
				}));
		}
		sections = removeFrom(sections);
		if (selectedSectionId === id) {
			selectedSectionId = null;
			selectedFormId = null;
		}
		notifyChange();
	}

	function moveChildUp(parentId: string, index: number) {
		const parent = findSectionById(sections, parentId);
		if (!parent?.children || index <= 0) return;
		const copy = [...parent.children];
		[copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
		parent.children = copy;
		sections = [...sections];
		notifyChange();
	}

	function moveChildDown(parentId: string, index: number) {
		const parent = findSectionById(sections, parentId);
		if (!parent?.children || index >= parent.children.length - 1) return;
		const copy = [...parent.children];
		[copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
		parent.children = copy;
		sections = [...sections];
		notifyChange();
	}

	function moveRootSectionUp(index: number) {
		if (index <= 0) return;
		const copy = [...sections];
		[copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
		sections = copy;
		notifyChange();
	}

	function moveRootSectionDown(index: number) {
		if (index >= sections.length - 1) return;
		const copy = [...sections];
		[copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
		sections = copy;
		notifyChange();
	}

	function moveSectionInTree(args: { parentId: string | null; index: number }, direction: "up" | "down") {
		if (args.parentId === null) {
			if (direction === "up") moveRootSectionUp(args.index);
			else moveRootSectionDown(args.index);
		} else {
			if (direction === "up") moveChildUp(args.parentId, args.index);
			else moveChildDown(args.parentId, args.index);
		}
	}

	function addFormToSection(sectionId: string) {
		const section = findSectionById(sections, sectionId);
		if (!section) return;
		const id = crypto.randomUUID();
		const num = (section.forms?.length ?? 0) + 1;
		const stateKey = `${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_form${num > 1 ? `_${num}` : ""}`;
		const newEntry: SectionFormEntry = {
			id,
			stateKey,
			form: {
				id: crypto.randomUUID(),
				name: `Form ${num}`,
				fields: [],
			},
		};
		if (!section.forms) section.forms = [];
		section.forms = [...section.forms, newEntry];
		sections = [...sections];
		selectedFormId = id;
		notifyChange();
	}

	function deleteFormFromSection(sectionId: string, formId: string) {
		const section = findSectionById(sections, sectionId);
		if (!section?.forms) return;
		section.forms = section.forms.filter((f) => f.id !== formId);
		sections = [...sections];
		if (selectedFormId === formId) selectedFormId = null;
		notifyChange();
	}

	function openFormEditor(sectionId: string, formId: string) {
		const section = findSectionById(sections, sectionId);
		if (!section?.forms) return;
		const entry = section.forms.find((f) => f.id === formId);
		if (!entry) return;
		editingFormEntry = entry;
		formEditorOpen = true;
	}

	function handleFormSave(updated: import("$lib/components/dynamic-forms/types").FormDefinition) {
		if (!editingFormEntry) return;
		function updateInSections(list: SectionDefinition[]): SectionDefinition[] {
			return list.map((s) => ({
				...s,
				forms: s.forms?.map((f) => (f.id === editingFormEntry!.id ? { ...f, form: updated } : f)),
				children: s.children ? updateInSections(s.children) : undefined,
			}));
		}
		sections = updateInSections(sections);
		editingFormEntry = null;
		notifyChange();
	}

	function updateSection(updated: SectionDefinition) {
		function replaceIn(list: SectionDefinition[]): SectionDefinition[] {
			return list.map((s) =>
				s.id === updated.id
					? { ...updated, children: s.children, forms: s.forms }
					: { ...s, children: s.children ? replaceIn(s.children) : undefined },
			);
		}
		sections = replaceIn(sections);
		notifyChange();
	}

	function updateFormEntry(updated: SectionFormEntry) {
		function replaceIn(list: SectionDefinition[]): SectionDefinition[] {
			return list.map((s) => ({
				...s,
				forms: s.forms?.map((f) => (f.id === updated.id ? updated : f)),
				children: s.children ? replaceIn(s.children) : undefined,
			}));
		}
		sections = replaceIn(sections);
		notifyChange();
	}
</script>

<FullscreenContainer>
	{#snippet children({ isFullscreen, toggle })}
		<div class="flex h-full overflow-hidden bg-background {isFullscreen ? '' : 'min-h-[600px] rounded-lg border'}">
			<!-- Left: Section Tree -->
			<div class="w-60 shrink-0 border-r">
				<div class="flex items-center justify-between border-b px-3 py-2.5">
					<h3 class="text-sm font-semibold">Sections</h3>
					<Button variant="ghost" size="icon" class="size-7" onclick={addRootSection}>
						<FolderPlusIcon class="size-3.5" />
					</Button>
				</div>
				<ScrollArea class="h-[calc(100%-41px)]">
					<div class="p-2">
						{#if sections.length === 0}
							<div class="flex flex-col items-center py-8 text-center">
								<LayoutListIcon class="mb-2 size-8 text-muted-foreground/50" />
								<p class="text-xs text-muted-foreground">No sections yet</p>
								<Button variant="outline" size="sm" class="mt-3 h-7 text-xs" onclick={addRootSection}>
									<FolderPlusIcon class="mr-1.5 size-3" />
									Add Section
								</Button>
							</div>
						{:else}
							<SectionTree
								{sections}
								{selectedSectionId}
								{selectedFormId}
								onselect={selectSection}
								onselectform={selectForm}
								onmovesectionup={(args) => moveSectionInTree(args, "up")}
								onmovesectiondown={(args) => moveSectionInTree(args, "down")}
							/>
						{/if}
					</div>
				</ScrollArea>
			</div>

			<!-- Center: Canvas -->
			<div class="flex flex-1 flex-col">
				<div class="grid grid-cols-[1fr_auto] items-center gap-4 border-b px-4 py-2.5">
					<div class="flex min-w-0 items-center gap-2">
						<label for="structure-name-input" class="shrink-0 text-xs font-medium text-muted-foreground"> Name </label>
						<input
							id="structure-name-input"
							class="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm font-semibold transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
							bind:value={structureName}
							placeholder="Untitled Structure"
							oninput={notifyChange}
						/>
					</div>
					<Button
						variant="ghost"
						size="icon"
						class="size-7"
						onclick={toggle}
						title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
					>
						{#if isFullscreen}
							<MinimizeIcon class="size-3.5" />
						{:else}
							<MaximizeIcon class="size-3.5" />
						{/if}
					</Button>
				</div>

				<ScrollArea class="flex-1">
					<div class="p-4">
						{#if selectedSection}
							<SectionCanvas
								section={selectedSection}
								{selectedFormId}
								onselectform={(formId) => selectForm(selectedSectionId!, formId)}
								oneditform={(formId) => openFormEditor(selectedSectionId!, formId)}
								ondeleteform={(formId) => deleteFormFromSection(selectedSectionId!, formId)}
								onaddform={() => addFormToSection(selectedSectionId!)}
								onaddchild={() => addChildSection(selectedSectionId!)}
								onselectchild={selectSection}
								ondeletechild={deleteSection}
								onmovechildup={(i) => moveChildUp(selectedSectionId!, i)}
								onmovechilddown={(i) => moveChildDown(selectedSectionId!, i)}
							/>
						{:else}
							<div
								class="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center"
							>
								<LayoutListIcon class="mb-3 size-10 text-muted-foreground/50" />
								<p class="text-sm font-medium text-muted-foreground">Select a section from the tree</p>
								<p class="mt-1 text-xs text-muted-foreground/75">Or add a new section to get started</p>
								{#if sections.length === 0}
									<Button variant="outline" size="sm" class="mt-4" onclick={addRootSection}>
										<FolderPlusIcon class="mr-2 size-4" />
										Add Section
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				</ScrollArea>
			</div>

			<!-- Right: Properties -->
			<div class="w-72 shrink-0 border-l">
				<div class="border-b px-3 py-2.5">
					<h3 class="text-sm font-semibold">Properties</h3>
				</div>
				<ScrollArea class="h-[calc(100%-41px)]">
					<div class="p-3">
						{#if selectedFormEntry}
							<FormEntryConfig
								bind:entry={() => selectedFormEntry!, (v) => updateFormEntry(v)}
								{allStateKeys}
								onedit={() => openFormEditor(selectedSectionId!, selectedFormId!)}
							/>
						{:else if selectedSection}
							<SectionConfig
								bind:section={() => selectedSection!, (v) => updateSection(v)}
								{allSectionIds}
								{allStateKeys}
							/>
						{:else}
							<div class="flex flex-col items-center justify-center py-12 text-center">
								<p class="text-sm text-muted-foreground">Select a section or form to edit its properties</p>
							</div>
						{/if}
					</div>
				</ScrollArea>
			</div>
		</div>
	{/snippet}
</FullscreenContainer>

{#if editingFormEntry}
	<FormEditorDialog bind:open={formEditorOpen} definition={editingFormEntry.form} onsave={handleFormSave} />
{/if}
