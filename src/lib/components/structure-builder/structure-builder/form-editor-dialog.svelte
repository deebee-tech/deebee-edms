<script lang="ts">
	import { FormBuilder } from "$lib/components/dynamic-forms";
	import type { FormDefinition } from "$lib/components/dynamic-forms/types";
	import * as Dialog from "$lib/components/shadcn-svelte/dialog";

	let {
		open = $bindable(false),
		definition,
		onsave,
	}: {
		open?: boolean;
		definition: FormDefinition;
		onsave: (updated: FormDefinition) => void;
	} = $props();

	import { untrack } from "svelte";

	function cloneDef(def: FormDefinition): FormDefinition {
		return JSON.parse(JSON.stringify(def));
	}

	let working = $state<FormDefinition>(untrack(() => cloneDef(definition)));

	function handleDefinitionChange(updated: FormDefinition) {
		working = updated;
	}

	function handleSave() {
		onsave(working);
		open = false;
	}

	$effect(() => {
		if (open) {
			working = cloneDef(definition);
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="flex h-[90vh] w-[95vw] max-w-[95vw]! flex-col p-0">
		<Dialog.Header class="shrink-0 px-6 pt-6 pb-2">
			<Dialog.Title>Edit Form: {working.name}</Dialog.Title>
			<Dialog.Description>Use the form builder to design the form for this section</Dialog.Description>
		</Dialog.Header>

		<div class="flex-1 overflow-hidden px-6">
			<div class="h-full">
				<FormBuilder definition={working} ondefinitionchange={handleDefinitionChange} />
			</div>
		</div>

		<Dialog.Footer class="shrink-0 px-6 pt-2 pb-6">
			<button
				class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
				onclick={() => (open = false)}
			>
				Cancel
			</button>
			<button
				class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
				onclick={handleSave}
			>
				Save Form
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
