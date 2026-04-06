<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { DatasetBuilder } from "$lib/components/dataset-builder";
	import SqlPreviewDialog from "$lib/components/dataset-builder/sql-preview-dialog.svelte";
	import { Button } from "$lib/components/ui/button";
	import SaveIcon from "@lucide/svelte/icons/save";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import type { DatasetDefinition } from "$lib/datasets/types";

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let definition = $state<DatasetDefinition>(data.dataset.definition);
	let definitionJson = $derived(JSON.stringify(definition, null, 2));
	let hasUnsavedChanges = $state(false);
	let formEl: HTMLFormElement | undefined = $state();

	let lastSyncedDatasetId: string | null = null;

	$effect.pre(() => {
		const id = data.dataset.id;
		if (lastSyncedDatasetId === id) return;
		lastSyncedDatasetId = id;
		definition = data.dataset.definition;
		hasUnsavedChanges = false;
	});

	function handleDefinitionChange(updated: DatasetDefinition) {
		definition = updated;
		hasUnsavedChanges = true;
	}

	function handleSave() {
		formEl?.requestSubmit();
	}
</script>

<div class="flex h-screen flex-col">
	<header class="flex items-center justify-between border-b px-4 py-2">
		<div class="flex items-center gap-3">
			<a href={resolve("/app/datasets" as Pathname)}>
				<Button variant="ghost" size="icon" class="size-8">
					<ArrowLeftIcon class="size-4" />
				</Button>
			</a>
			<div>
				<h1 class="text-sm font-semibold">{definition.name}</h1>
				<p class="text-xs text-muted-foreground">
					{hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<SqlPreviewDialog {definition} />
			<form
				method="POST"
				action="?/save"
				bind:this={formEl}
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === "success") {
							hasUnsavedChanges = false;
						}
					};
				}}
			>
				<input type="hidden" name="definition" value={definitionJson} />
				<Button type="button" size="sm" disabled={!hasUnsavedChanges} onclick={handleSave}>
					<SaveIcon class="mr-2 size-3.5" />
					Save
				</Button>
			</form>
		</div>
	</header>

	<div class="flex-1 overflow-hidden">
		<DatasetBuilder
			{definition}
			schema={data.schema.tables}
			ondefinitionchange={handleDefinitionChange}
		/>
	</div>
</div>
