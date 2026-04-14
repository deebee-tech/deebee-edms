<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import { WorkflowBuilder } from "$lib/components/workflow-builder";
	import type { WorkflowDefinition } from "$lib/components/workflow-builder/types";
	import { sampleWorkflowDefinition } from "./sample-workflow-definition";

	let definition = $state<WorkflowDefinition>({ ...sampleWorkflowDefinition });
	let activeTab = $state("builder");
	let importText = $state("");
	let importError = $state("");

	const definitionJson = $derived(JSON.stringify(definition, null, 2));

	function handleDefinitionChange(updated: WorkflowDefinition) {
		definition = updated;
	}

	function loadDefinitionFromJson() {
		importError = "";
		try {
			const parsed = JSON.parse(importText) as WorkflowDefinition;
			if (
				!parsed.id ||
				!parsed.name ||
				typeof parsed.version !== "number" ||
				!Array.isArray(parsed.globalState) ||
				!Array.isArray(parsed.nodes) ||
				!Array.isArray(parsed.edges)
			) {
				importError = "Invalid workflow JSON: missing required fields (id, name, version, globalState, nodes, edges)";
				return;
			}
			definition = parsed;
			importText = "";
			activeTab = "builder";
		} catch {
			importError = "Invalid JSON";
		}
	}
</script>

<div class="container mx-auto max-w-[1600px] py-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Workflow Builder</h1>
		<p class="text-muted-foreground">Design workflows by connecting components on the canvas</p>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="builder">Builder</Tabs.Trigger>
			<Tabs.Trigger value="json">JSON</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="builder" class="mt-4">
			<div class="h-[calc(100vh-220px)] min-h-[600px]">
				<WorkflowBuilder {definition} ondefinitionchange={handleDefinitionChange} />
			</div>
		</Tabs.Content>

		<Tabs.Content value="json" class="mt-4">
			<div class="grid gap-4 lg:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<DownloadIcon class="size-4 text-muted-foreground" />
								<Card.Title>Workflow Definition (JSON)</Card.Title>
							</div>
							<CopyButton text={definitionJson} />
						</div>
						<Card.Description>
							This JSON defines the complete workflow and can be stored in a database or file
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<pre class="max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-sm"><code>{definitionJson}</code></pre>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<div class="flex items-center gap-2">
							<UploadIcon class="size-4 text-muted-foreground" />
							<Card.Title>Load Workflow Definition</Card.Title>
						</div>
						<Card.Description>Paste a workflow definition JSON to load it into the builder</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Textarea
								class="min-h-[300px] font-mono text-xs"
								placeholder="Paste workflow definition JSON here..."
								bind:value={importText}
							/>
							{#if importError}
								<p class="text-sm text-destructive">{importError}</p>
							{/if}
							<Button onclick={loadDefinitionFromJson} disabled={!importText.trim()} class="w-full">
								<UploadIcon class="mr-2 size-4" />
								Load into Builder
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
