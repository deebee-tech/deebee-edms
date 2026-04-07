<script lang="ts">
	import FullscreenContainer from "$lib/components/fullscreen-container.svelte";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import { Switch } from "$lib/components/shadcn-svelte/switch";
	import LayoutListIcon from "@lucide/svelte/icons/layout-list";
	import MaximizeIcon from "@lucide/svelte/icons/maximize";
	import MinimizeIcon from "@lucide/svelte/icons/minimize";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import { untrack } from "svelte";
	import { dndzone } from "svelte-dnd-action";
	import { flip } from "svelte/animate";
	import { SvelteSet } from "svelte/reactivity";
	import { fieldRegistry } from "../field-registry";
	import { isMultiStep } from "../schema";
	import type { FieldType, FormDefinition, FormFieldDefinition, FormStepDefinition } from "../types";
	import FieldConfig from "./field-config.svelte";
	import FieldItem from "./field-item.svelte";
	import FieldPalette from "./field-palette.svelte";
	import StepConfig from "./step-config.svelte";
	import StepHeader from "./step-header.svelte";

	let {
		definition,
		ondefinitionchange,
	}: {
		definition: FormDefinition;
		ondefinitionchange?: (definition: FormDefinition) => void;
	} = $props();

	let multiStepMode = $state(untrack(() => isMultiStep(definition)));
	let fields = $state<FormFieldDefinition[]>(untrack(() => (isMultiStep(definition) ? [] : [...definition.fields])));
	let steps = $state<FormStepDefinition[]>(
		untrack(() => (isMultiStep(definition) ? definition.steps!.map((s) => ({ ...s, fields: [...s.fields] })) : [])),
	);
	let formName = $state(untrack(() => definition.name));
	let selectedFieldId = $state<string | null>(null);
	let selectedStepId = $state<string | null>(null);
	let expandedSteps = new SvelteSet<string>(
		untrack(() => (isMultiStep(definition) ? definition.steps!.map((s) => s.id) : [])),
	);
	const flipDurationMs = 150;

	const selectedField = $derived.by(() => {
		if (!selectedFieldId) return null;
		if (multiStepMode) {
			for (const step of steps) {
				const found = step.fields.find((f) => f.id === selectedFieldId);
				if (found) return found;
			}
			return null;
		}
		return fields.find((f) => f.id === selectedFieldId) ?? null;
	});

	const selectedStep = $derived(multiStepMode ? (steps.find((s) => s.id === selectedStepId) ?? null) : null);

	let changeCounter = $state(0);

	$effect(() => {
		const _count = changeCounter;
		const snapshot: FormDefinition = {
			id: untrack(() => definition.id),
			name: formName,
			description: untrack(() => definition.description),
			fields: multiStepMode ? steps.flatMap((s) => s.fields.map((f) => ({ ...f }))) : fields.map((f) => ({ ...f })),
			steps: multiStepMode
				? steps.map((s) => ({
						id: s.id,
						title: s.title,
						description: s.description,
						icon: s.icon,
						fields: s.fields.map((f) => ({ ...f })),
					}))
				: undefined,
		};
		if (_count === 0) return;
		untrack(() => ondefinitionchange?.(snapshot));
	});

	function notifyChange() {
		changeCounter++;
	}

	function allFields(): FormFieldDefinition[] {
		if (multiStepMode) {
			return steps.flatMap((s) => s.fields);
		}
		return fields;
	}

	function addField(type: FieldType) {
		const entry = fieldRegistry[type];
		const id = crypto.randomUUID();
		const all = allFields();
		const count = all.filter((f) => f.type === type).length + 1;
		const name = `${type}${count > 1 ? `_${count}` : ""}`;

		const newField: FormFieldDefinition = {
			id,
			name,
			type,
			label: `${entry.label}${count > 1 ? ` ${count}` : ""}`,
			...entry.defaults,
		};

		if (multiStepMode) {
			const targetStepId = selectedStepId ?? steps[steps.length - 1]?.id;
			const stepIdx = steps.findIndex((s) => s.id === targetStepId);
			if (stepIdx >= 0) {
				steps[stepIdx].fields = [...steps[stepIdx].fields, newField];
				expandedSteps.add(steps[stepIdx].id);
			}
		} else {
			fields = [...fields, newField];
		}
		selectedFieldId = id;
		selectedStepId = null;
		notifyChange();
	}

	function removeField(id: string) {
		if (multiStepMode) {
			for (let i = 0; i < steps.length; i++) {
				const idx = steps[i].fields.findIndex((f) => f.id === id);
				if (idx >= 0) {
					steps[i].fields = steps[i].fields.filter((f) => f.id !== id);
					break;
				}
			}
		} else {
			fields = fields.filter((f) => f.id !== id);
		}
		if (selectedFieldId === id) selectedFieldId = null;
		notifyChange();
	}

	function updateField(updated: FormFieldDefinition) {
		if (multiStepMode) {
			for (let i = 0; i < steps.length; i++) {
				const idx = steps[i].fields.findIndex((f) => f.id === updated.id);
				if (idx >= 0) {
					steps[i].fields = steps[i].fields.map((f) => (f.id === updated.id ? updated : f));
					break;
				}
			}
		} else {
			fields = fields.map((f) => (f.id === updated.id ? updated : f));
		}
		notifyChange();
	}

	function updateStep(updated: FormStepDefinition) {
		steps = steps.map((s) => (s.id === updated.id ? { ...updated, fields: s.fields } : s));
		notifyChange();
	}

	// Flat mode DnD
	function onconsider(e: CustomEvent<{ items: FormFieldDefinition[] }>) {
		fields = e.detail.items;
	}

	function onfinalize(e: CustomEvent<{ items: FormFieldDefinition[] }>) {
		fields = e.detail.items;
		notifyChange();
	}

	// Multi-step DnD per step
	function stepConsider(stepId: string, e: CustomEvent<{ items: FormFieldDefinition[] }>) {
		const idx = steps.findIndex((s) => s.id === stepId);
		if (idx >= 0) steps[idx].fields = e.detail.items;
	}

	function stepFinalize(stepId: string, e: CustomEvent<{ items: FormFieldDefinition[] }>) {
		const idx = steps.findIndex((s) => s.id === stepId);
		if (idx >= 0) steps[idx].fields = e.detail.items;
		notifyChange();
	}

	// Step CRUD
	function addStep() {
		const id = crypto.randomUUID();
		const num = steps.length + 1;
		const newStep: FormStepDefinition = {
			id,
			title: `Step ${num}`,
			fields: [],
		};
		steps = [...steps, newStep];
		expandedSteps.add(id);
		selectedStepId = id;
		selectedFieldId = null;
		notifyChange();
	}

	function removeStep(id: string) {
		steps = steps.filter((s) => s.id !== id);
		if (selectedStepId === id) selectedStepId = null;
		notifyChange();
	}

	function moveStepUp(idx: number) {
		if (idx <= 0) return;
		const copy = [...steps];
		[copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
		steps = copy;
		notifyChange();
	}

	function moveStepDown(idx: number) {
		if (idx >= steps.length - 1) return;
		const copy = [...steps];
		[copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
		steps = copy;
		notifyChange();
	}

	function toggleStepExpanded(id: string) {
		if (expandedSteps.has(id)) {
			expandedSteps.delete(id);
		} else {
			expandedSteps.add(id);
		}
	}

	function selectStep(id: string) {
		selectedStepId = id;
		selectedFieldId = null;
	}

	function selectField(id: string) {
		selectedFieldId = id;
		selectedStepId = null;
	}

	// Mode toggle
	function toggleMultiStep(checked: boolean) {
		if (checked && !multiStepMode) {
			const id = crypto.randomUUID();
			steps = [
				{
					id,
					title: "Step 1",
					fields: [...fields],
				},
			];
			fields = [];
			expandedSteps.clear();
			expandedSteps.add(id);
			selectedFieldId = null;
			selectedStepId = null;
		} else if (!checked && multiStepMode) {
			fields = steps.flatMap((s) => [...s.fields]);
			steps = [];
			expandedSteps.clear();
			selectedFieldId = null;
			selectedStepId = null;
		}
		multiStepMode = checked;
		notifyChange();
	}
</script>

<FullscreenContainer>
	{#snippet children({ isFullscreen, toggle })}
		<div class="flex h-full overflow-hidden bg-background {isFullscreen ? '' : 'min-h-[600px] rounded-lg border'}">
			<!-- Left: Field Palette -->
			<div class="w-56 shrink-0 border-r">
				<div class="border-b px-3 py-2.5">
					<h3 class="text-sm font-semibold">Fields</h3>
				</div>
				<ScrollArea class="h-[calc(100%-41px)]">
					<div class="p-3">
						<FieldPalette onadd={addField} />
					</div>
				</ScrollArea>
			</div>

			<!-- Center: Canvas -->
			<div class="flex flex-1 flex-col">
				<div class="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b px-4 py-2.5">
					<div class="flex min-w-0 items-center gap-2">
						<label for="form-name-input" class="shrink-0 text-xs font-medium text-muted-foreground"> Form name </label>
						<input
							id="form-name-input"
							class="min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm font-semibold transition-colors outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30"
							bind:value={formName}
							placeholder="Untitled Form"
							oninput={notifyChange}
						/>
					</div>
					<Field.Field orientation="horizontal" class="gap-2">
						<Switch checked={multiStepMode} onCheckedChange={toggleMultiStep} size="sm" />
						<Field.Label class="text-xs whitespace-nowrap">Multi-step</Field.Label>
					</Field.Field>
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
						{#if multiStepMode}
							<!-- Multi-step canvas -->
							{#if steps.length === 0}
								<div
									class="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center"
								>
									<LayoutListIcon class="mb-3 size-10 text-muted-foreground/50" />
									<p class="text-sm font-medium text-muted-foreground">No steps yet</p>
									<p class="mt-1 mb-4 text-xs text-muted-foreground/75">
										Add a step to start building your multi-step form
									</p>
									<Button variant="outline" size="sm" onclick={addStep}>
										<PlusIcon class="mr-2 size-4" />
										Add Step
									</Button>
								</div>
							{:else}
								<div class="space-y-4">
									{#each steps as step, i (step.id)}
										<div>
											<StepHeader
												{step}
												index={i}
												selected={selectedStepId === step.id}
												expanded={expandedSteps.has(step.id)}
												canMoveUp={i > 0}
												canMoveDown={i < steps.length - 1}
												canDelete={steps.length > 1}
												onselect={() => selectStep(step.id)}
												ontoggle={() => toggleStepExpanded(step.id)}
												onmoveup={() => moveStepUp(i)}
												onmovedown={() => moveStepDown(i)}
												ondelete={() => removeStep(step.id)}
											/>
											{#if expandedSteps.has(step.id)}
												<div
													class="rounded-b-md border border-t-0 p-3 {selectedStepId === step.id
														? 'border-primary'
														: 'border-border'}"
												>
													{#if step.fields.length === 0}
														<div
															class="flex min-h-[80px] flex-col items-center justify-center rounded border-2 border-dashed border-muted-foreground/25 p-4 text-center"
															use:dndzone={{
																items: step.fields,
																flipDurationMs,
																type: "form-fields",
															}}
															onconsider={(e) => stepConsider(step.id, e)}
															onfinalize={(e) => stepFinalize(step.id, e)}
														>
															<p class="text-xs text-muted-foreground">Drag fields here or add from the palette</p>
														</div>
													{:else}
														<div
															class="space-y-2"
															use:dndzone={{
																items: step.fields,
																flipDurationMs,
																type: "form-fields",
															}}
															onconsider={(e) => stepConsider(step.id, e)}
															onfinalize={(e) => stepFinalize(step.id, e)}
														>
															{#each step.fields as field (field.id)}
																<div animate:flip={{ duration: flipDurationMs }}>
																	<FieldItem
																		{field}
																		selected={selectedFieldId === field.id}
																		onselect={() => selectField(field.id)}
																		ondelete={() => removeField(field.id)}
																	/>
																</div>
															{/each}
														</div>
													{/if}
												</div>
											{/if}
										</div>
									{/each}
								</div>
								<div class="mt-4 flex justify-center">
									<Button variant="outline" size="sm" onclick={addStep}>
										<PlusIcon class="mr-2 size-4" />
										Add Step
									</Button>
								</div>
							{/if}
						{:else}
							<!-- Flat canvas (original) -->
							{#if fields.length === 0}
								<div
									class="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center"
								>
									<LayoutListIcon class="mb-3 size-10 text-muted-foreground/50" />
									<p class="text-sm font-medium text-muted-foreground">No fields yet</p>
									<p class="mt-1 text-xs text-muted-foreground/75">Click a field type from the left panel to add it</p>
								</div>
							{:else}
								<div
									class="space-y-2"
									use:dndzone={{
										items: fields,
										flipDurationMs,
										type: "form-fields",
									}}
									{onconsider}
									{onfinalize}
								>
									{#each fields as field (field.id)}
										<div animate:flip={{ duration: flipDurationMs }}>
											<FieldItem
												{field}
												selected={selectedFieldId === field.id}
												onselect={() => selectField(field.id)}
												ondelete={() => removeField(field.id)}
											/>
										</div>
									{/each}
								</div>
							{/if}
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
						{#if selectedField}
							<FieldConfig bind:field={() => selectedField, (v) => updateField(v)} />
						{:else if selectedStep}
							<StepConfig bind:step={() => selectedStep, (v) => updateStep(v)} />
						{:else}
							<div class="flex flex-col items-center justify-center py-12 text-center">
								<p class="text-sm text-muted-foreground">
									{#if multiStepMode}
										Select a step or field to edit its properties
									{:else}
										Select a field to edit its properties
									{/if}
								</p>
							</div>
						{/if}
					</div>
				</ScrollArea>
			</div>
		</div>
	{/snippet}
</FullscreenContainer>
