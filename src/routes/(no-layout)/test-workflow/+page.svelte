<script lang="ts">
	import { WorkflowBuilder } from "$lib/components/workflow-builder";
	import * as Tabs from "$lib/components/ui/tabs";
	import * as Card from "$lib/components/ui/card";
	import { CopyButton } from "$lib/components/ui/copy-button";
	import type { WorkflowDefinition } from "$lib/workflows/types";
	import { sampleWorkflowDefinition } from "./sample-workflow-definition";

	let definition = $state<WorkflowDefinition>({ ...sampleWorkflowDefinition });
	let activeTab = $state("builder");

	const definitionJson = $derived(JSON.stringify(definition, null, 2));

	function handleDefinitionChange(updated: WorkflowDefinition) {
		definition = updated;
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
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title>Workflow Definition (JSON)</Card.Title>
						<CopyButton text={definitionJson} />
					</div>
					<Card.Description>
						This JSON defines the complete workflow and can be stored in a database or file
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<pre class="max-h-[600px] overflow-auto rounded-md bg-muted p-4 text-sm"><code>{definitionJson}</code></pre>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
