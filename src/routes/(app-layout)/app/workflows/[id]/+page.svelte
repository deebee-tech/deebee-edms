<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { WorkflowBuilder } from "$lib/components/workflow-builder";
	import type { WorkflowDefinition } from "$lib/components/workflow-builder/types";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import SaveIcon from "@lucide/svelte/icons/save";

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let definition = $state<WorkflowDefinition>(data.workflow.definition);
	let definitionJson = $derived(JSON.stringify(definition, null, 2));
	let formEl: HTMLFormElement | undefined = $state();

	let lastSyncedWorkflowId: string | null = null;
	// svelte-ignore state_referenced_locally
	let savedJson = $state<string>(JSON.stringify(data.workflow.definition, null, 2));

	const hasUnsavedChanges = $derived(definitionJson !== savedJson);

	$effect.pre(() => {
		const id = data.workflow.id;
		if (lastSyncedWorkflowId === id) return;
		lastSyncedWorkflowId = id;
		definition = data.workflow.definition;
		savedJson = JSON.stringify(data.workflow.definition, null, 2);
	});

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
						savedJson = definitionJson;
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
		<WorkflowBuilder bind:definition />
	</div>
</div>
