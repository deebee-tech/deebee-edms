<script lang="ts">
	import { DatasetBuilder } from "$lib/components/dataset-builder";
	import { generateSql } from "$lib/components/dataset-builder/sql-generator";
	import type { DatasetDefinition } from "$lib/components/dataset-builder/types";
	import { formatDisplaySql } from "$lib/format-display-sql";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import * as Code from "$lib/components/shadcn-svelte/code";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import { sampleDatasetDefinition } from "./sample-dataset-definition";
	import { sampleSchema } from "./sample-schema";

	let definition = $state<DatasetDefinition>({ ...sampleDatasetDefinition });
	let activeTab = $state("builder");
	let importText = $state("");
	let importError = $state("");

	const definitionJson = $derived(JSON.stringify(definition, null, 2));
	const generatedSql = $derived(generateSql(definition));
	const formattedGeneratedSql = $derived(
		formatDisplaySql(generatedSql.sql, definition.engine ?? "postgres"),
	);

	function handleDefinitionChange(updated: DatasetDefinition) {
		definition = updated;
	}

	function loadDefinitionFromJson() {
		importError = "";
		try {
			const parsed = JSON.parse(importText) as DatasetDefinition;
			if (
				!parsed.id ||
				!parsed.name ||
				typeof parsed.version !== "number" ||
				!Array.isArray(parsed.tables) ||
				!Array.isArray(parsed.joins) ||
				!Array.isArray(parsed.fields) ||
				!Array.isArray(parsed.filters) ||
				!Array.isArray(parsed.sort)
			) {
				importError =
					"Invalid dataset JSON: missing required fields (id, name, version, tables, joins, fields, filters, sort)";
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
					<div class="relative min-h-[min(20rem,50vh)] overflow-hidden rounded-lg border">
						<Code.Root code={formattedGeneratedSql} lang="sql" hideLines class="max-h-[min(28rem,55vh)] border-0" />
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="json" class="mt-4">
			<div class="grid gap-4 lg:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<DownloadIcon class="size-4 text-muted-foreground" />
								<Card.Title>Dataset Definition (JSON)</Card.Title>
							</div>
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

				<Card.Root>
					<Card.Header>
						<div class="flex items-center gap-2">
							<UploadIcon class="size-4 text-muted-foreground" />
							<Card.Title>Load Dataset Definition</Card.Title>
						</div>
						<Card.Description>Paste a dataset definition JSON to load it into the builder</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Textarea
								class="min-h-[300px] font-mono text-xs"
								placeholder="Paste dataset definition JSON here..."
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
