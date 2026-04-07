<script lang="ts">
	import { DatasetBuilder } from "$lib/components/dataset-builder";
	import { generateSql } from "$lib/components/dataset-builder/sql-generator";
	import type { DatasetDefinition } from "$lib/components/dataset-builder/types";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import * as Code from "$lib/components/shadcn-svelte/code";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import { sampleDatasetDefinition } from "./sample-dataset-definition";
	import { sampleSchema } from "./sample-schema";

	let definition = $state<DatasetDefinition>({ ...sampleDatasetDefinition });
	let activeTab = $state("builder");

	const definitionJson = $derived(JSON.stringify(definition, null, 2));
	const generatedSql = $derived(generateSql(definition));

	function handleDefinitionChange(updated: DatasetDefinition) {
		definition = updated;
	}
</script>

<div class="container mx-auto max-w-[1600px] py-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Dataset Builder</h1>
		<p class="text-muted-foreground">
			Visual query designer — drag tables onto the canvas, define joins, and select output fields
		</p>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="builder">Builder</Tabs.Trigger>
			<Tabs.Trigger value="sql">SQL</Tabs.Trigger>
			<Tabs.Trigger value="json">JSON</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="builder" class="mt-4">
			<div class="h-[calc(100vh-220px)] min-h-[600px]">
				<DatasetBuilder {definition} schema={sampleSchema} ondefinitionchange={handleDefinitionChange} />
			</div>
		</Tabs.Content>

		<Tabs.Content value="sql" class="mt-4">
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title>Generated SQL</Card.Title>
						<CopyButton text={generatedSql.sql} />
					</div>
					<Card.Description>This SQL is generated in real time from the dataset definition above</Card.Description>
				</Card.Header>
				<Card.Content>
					<Code.Root code={generatedSql.sql} lang="sql" hideLines>
						<Code.CopyButton class="absolute top-2 right-2" />
					</Code.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="json" class="mt-4">
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title>Dataset Definition (JSON)</Card.Title>
						<CopyButton text={definitionJson} />
					</div>
					<Card.Description>
						This JSON defines the complete dataset and can be stored in a database or file
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<Code.Root code={definitionJson} lang="json" hideLines>
						<Code.CopyButton class="absolute top-2 right-2" />
					</Code.Root>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
