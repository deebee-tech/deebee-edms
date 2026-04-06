<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { WorkflowBuilder } from "$lib/components/workflow-builder";
	import { Button } from "$lib/components/ui/button";
	import SaveIcon from "@lucide/svelte/icons/save";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import type { WorkflowDefinition } from "$lib/workflows/types";

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let definition = $state<WorkflowDefinition>(data.workflow.definition);
	let definitionJson = $derived(JSON.stringify(definition, null, 2));
	let hasUnsavedChanges = $state(false);
	let formEl: HTMLFormElement | undefined = $state();

	let lastSyncedWorkflowId: string | null = null;

	$effect.pre(() => {
		const id = data.workflow.id;
		if (lastSyncedWorkflowId === id) return;
		lastSyncedWorkflowId = id;
		definition = data.workflow.definition;
		hasUnsavedChanges = false;
	});

	function handleDefinitionChange(updated: WorkflowDefinition) {
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
			<a href={resolve("/app/workflows" as Pathname)}>
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
	</header>

	<div class="flex-1 overflow-hidden">
		<WorkflowBuilder {definition} ondefinitionchange={handleDefinitionChange} />
	</div>
</div>
