<script lang="ts">
	import FullscreenContainer from "$lib/components/fullscreen-container.svelte";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import LayoutListIcon from "@lucide/svelte/icons/layout-list";
	import MaximizeIcon from "@lucide/svelte/icons/maximize";
	import MinimizeIcon from "@lucide/svelte/icons/minimize";
	import { collectAllSectionIds, collectAllStateKeys, findSectionById } from "../conditions";
	import type { SectionDefinition, SectionFormEntry, StructureDefinition } from "../types";
	import FormEditorDialog from "./form-editor-dialog.svelte";
	import FormEntryConfig from "./form-entry-config.svelte";
	import SectionCanvas from "./section-canvas.svelte";
	import SectionConfig from "./section-config.svelte";
	import SectionTree from "./section-tree.svelte";

	const VIRTUAL_ROOT_ID = "__structure_virtual_root__";

	let {
		definition = $bindable(),
	}: {
		definition: StructureDefinition;
	} = $props();

	let selectedSectionId = $state<string | null>(VIRTUAL_ROOT_ID);
	let selectedFormId = $state<string | null>(null);
	let editingFormEntry = $state<SectionFormEntry | null>(null);
	let formEditorOpen = $state(false);

	const allSectionIds = $derived(collectAllSectionIds(definition.sections));
	const allStateKeys = $derived(collectAllStateKeys(definition.sections));

	const virtualRoot: SectionDefinition = $derived({
		id: VIRTUAL_ROOT_ID,
		title: definition.name?.trim() ? definition.name : "Structure",
		children: definition.sections,
	});

	const treeSections = $derived([virtualRoot]);

	const selectedSection = $derived.by(() => {
		if (!selectedSectionId) return null;
		if (selectedSectionId === VIRTUAL_ROOT_ID) return virtualRoot;
		return findSectionById(definition.sections, selectedSectionId);
	});

	const isVirtualRootSelected = $derived(selectedSectionId === VIRTUAL_ROOT_ID);

	const selectedFormEntry = $derived.by((): SectionFormEntry | null => {
		if (!selectedFormId || !selectedSectionId || selectedSectionId === VIRTUAL_ROOT_ID) return null;
		const section = findSectionById(definition.sections, selectedSectionId);
		if (!section?.forms) return null;
		return section.forms.find((f) => f.id === selectedFormId) ?? null;
	});

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
		const num = definition.sections.length + 1;
		const newSection: SectionDefinition = {
			id,
			title: `Section ${num}`,
		};
		definition.sections = [...definition.sections, newSection];
		selectedSectionId = id;
		selectedFormId = null;
	}

	function addChildSection(parentId: string) {
		if (parentId === VIRTUAL_ROOT_ID) {
			addRootSection();
			return;
		}
		const parent = findSectionById(definition.sections, parentId);
		if (!parent) return;
		const id = crypto.randomUUID();
		const num = (parent.children?.length ?? 0) + 1;
		const newChild: SectionDefinition = {
			id,
			title: `${parent.title} — Child ${num}`,
		};
		parent.children = [...(parent.children ?? []), newChild];
		selectedSectionId = id;
		selectedFormId = null;
	}

	function deleteSection(id: string) {
		if (id === VIRTUAL_ROOT_ID) return;
		function removeFrom(list: SectionDefinition[]): SectionDefinition[] {
			return list
				.filter((s) => s.id !== id)
				.map((s) => ({
					...s,
					children: s.children ? removeFrom(s.children) : undefined,
				}));
		}
		definition.sections = removeFrom(definition.sections);
		if (selectedSectionId === id) {
			selectedSectionId = VIRTUAL_ROOT_ID;
			selectedFormId = null;
		}
	}

	function moveChildUp(parentId: string, index: number) {
		if (parentId === VIRTUAL_ROOT_ID) {
			moveRootSectionUp(index);
			return;
		}
		const parent = findSectionById(definition.sections, parentId);
		if (!parent?.children || index <= 0) return;
		const copy = [...parent.children];
		[copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
		parent.children = copy;
	}

	function moveChildDown(parentId: string, index: number) {
		if (parentId === VIRTUAL_ROOT_ID) {
			moveRootSectionDown(index);
			return;
		}
		const parent = findSectionById(definition.sections, parentId);
		if (!parent?.children || index >= parent.children.length - 1) return;
		const copy = [...parent.children];
		[copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
		parent.children = copy;
	}

	function moveRootSectionUp(index: number) {
		if (index <= 0) return;
		const copy = [...definition.sections];
		[copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
		definition.sections = copy;
	}

	function moveRootSectionDown(index: number) {
		if (index >= definition.sections.length - 1) return;
		const copy = [...definition.sections];
		[copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
		definition.sections = copy;
	}

	function addFormToSection(sectionId: string) {
		if (sectionId === VIRTUAL_ROOT_ID) return;
		const section = findSectionById(definition.sections, sectionId);
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
		section.forms = [...(section.forms ?? []), newEntry];
		selectedFormId = id;
	}

	function deleteFormFromSection(sectionId: string, formId: string) {
		const section = findSectionById(definition.sections, sectionId);
		if (!section?.forms) return;
		section.forms = section.forms.filter((f) => f.id !== formId);
		if (selectedFormId === formId) selectedFormId = null;
	}

	function openFormEditor(sectionId: string, formId: string) {
		const section = findSectionById(definition.sections, sectionId);
		if (!section?.forms) return;
		const entry = section.forms.find((f) => f.id === formId);
		if (!entry) return;
		editingFormEntry = entry;
		formEditorOpen = true;
	}

	function handleFormSave(updated: import("$lib/components/dynamic-forms/types").FormDefinition) {
		if (!editingFormEntry) return;
		const targetId = editingFormEntry.id;
		function updateInSections(list: SectionDefinition[]): SectionDefinition[] {
			return list.map((s) => ({
				...s,
				forms: s.forms?.map((f) => (f.id === targetId ? { ...f, form: updated } : f)),
				children: s.children ? updateInSections(s.children) : undefined,
			}));
		}
		definition.sections = updateInSections(definition.sections);
		editingFormEntry = null;
	}

	function updateFormEntry(updated: SectionFormEntry) {
		function replaceIn(list: SectionDefinition[]): SectionDefinition[] {
			return list.map((s) => ({
				...s,
				forms: s.forms?.map((f) => (f.id === updated.id ? updated : f)),
				children: s.children ? replaceIn(s.children) : undefined,
			}));
		}
		definition.sections = replaceIn(definition.sections);
	}
</script>

<FullscreenContainer>
	{#snippet children({ isFullscreen, toggle })}
		<div class="flex h-full overflow-hidden bg-background {isFullscreen ? '' : 'min-h-[600px] rounded-lg border'}">
			<!-- Left: Section Tree -->
			<div class="w-60 shrink-0 border-r">
				<div class="border-b px-3 py-2.5">
					<h3 class="text-sm font-semibold">Sections</h3>
				</div>
				<ScrollArea class="h-[calc(100%-41px)]">
					<div class="p-2">
						<SectionTree
							sections={treeSections}
							{selectedSectionId}
							{selectedFormId}
							virtualRootId={VIRTUAL_ROOT_ID}
							onselect={selectSection}
							onselectform={selectForm}
						/>
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
							bind:value={definition.name}
							placeholder="Untitled Structure"
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
								isVirtualRoot={isVirtualRootSelected}
								onselectform={(formId) => selectForm(selectedSectionId!, formId)}
								oneditform={(formId) => openFormEditor(selectedSectionId!, formId)}
								ondeleteform={(formId) => deleteFormFromSection(selectedSectionId!, formId)}
								onaddform={() => addFormToSection(selectedSectionId!)}
								onaddchild={() => addChildSection(selectedSectionId!)}
								onselectchild={selectSection}
								ondeletechild={deleteSection}
								onmovechildup={(i) => moveChildUp(selectedSectionId!, i)}
								onmovechilddown={(i) => moveChildDown(selectedSectionId!, i)}
								ondeletesection={() => deleteSection(selectedSectionId!)}
							/>
						{:else}
							<div
								class="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center"
							>
								<LayoutListIcon class="mb-3 size-10 text-muted-foreground/50" />
								<p class="text-sm font-medium text-muted-foreground">Select a section from the tree</p>
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
						{:else if isVirtualRootSelected}
							<div class="flex flex-col items-center justify-center py-12 text-center">
								<LayersIcon class="mb-3 size-8 text-muted-foreground/50" />
								<p class="text-sm font-medium text-muted-foreground">Structure root</p>
								<p class="mt-1 text-xs text-muted-foreground/75">
									This is a builder-only container. Sections you add here become the top-level steps of your structure
									and won't appear as a section in the preview.
								</p>
							</div>
						{:else if selectedSection}
							<SectionConfig section={selectedSection} {allSectionIds} {allStateKeys} />
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
