<script lang="ts">
	import { StructureBuilder, StructureRenderer } from "$lib/components/structure-builder";
	import type { StructureAnswers, StructureDefinition } from "$lib/components/structure-builder/types";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import { sampleStructureDefinition } from "./sample-structure-definition";

	let definition = $state<StructureDefinition>(JSON.parse(JSON.stringify(sampleStructureDefinition)));

	let activeTab = $state("builder");
	let previewKey = $state(0);
	let currentAnswers = $state<StructureAnswers | undefined>(undefined);
	let loadedAnswers = $state<StructureAnswers | undefined>(undefined);
	let importAnswersText = $state("");
	let importError = $state("");
	let importStructureText = $state("");
	let importStructureError = $state("");

	const definitionJson = $derived(JSON.stringify(definition, null, 2));
	const answersJson = $derived(currentAnswers ? JSON.stringify(currentAnswers, null, 2) : "{}");
	const hasSections = $derived(definition.sections.length > 0);
	const hasAnswers = $derived(currentAnswers !== undefined && Object.keys(currentAnswers.formData).length > 0);

	function handleComplete(data: Record<string, Record<string, unknown>>) {
		console.log("Structure completed!", data);
	}

	function handleAnswersChange(answers: StructureAnswers) {
		currentAnswers = answers;
	}

	function loadAnswers() {
		importError = "";
		try {
			const parsed = JSON.parse(importAnswersText) as StructureAnswers;
			if (!parsed.structureId || !parsed.sectionStatus || !parsed.formData) {
				importError = "Invalid answers JSON: missing required fields (structureId, sectionStatus, formData)";
				return;
			}
			loadedAnswers = parsed;
			previewKey++;
			activeTab = "preview";
			importAnswersText = "";
		} catch {
			importError = "Invalid JSON";
		}
	}

	function loadStructure() {
		importStructureError = "";
		try {
			const parsed = JSON.parse(importStructureText) as StructureDefinition;
			if (!parsed.id || !parsed.name || !Array.isArray(parsed.sections)) {
				importStructureError = "Invalid structure JSON: missing required fields (id, name, sections)";
				return;
			}
			definition = parsed;
			loadedAnswers = undefined;
			currentAnswers = undefined;
			previewKey++;
			activeTab = "builder";
			importStructureText = "";
		} catch {
			importStructureError = "Invalid JSON";
		}
	}

	function resetPreview() {
		loadedAnswers = undefined;
		currentAnswers = undefined;
		previewKey++;
	}
</script>

<div class="container mx-auto max-w-[1600px] py-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Structure Builder</h1>
		<p class="text-muted-foreground">Design multi-section, multi-form experiences — then preview or export</p>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="builder">Builder</Tabs.Trigger>
			<Tabs.Trigger value="preview" disabled={!hasSections}>Preview</Tabs.Trigger>
			<Tabs.Trigger value="structure-json">Structure JSON</Tabs.Trigger>
			<Tabs.Trigger value="answers-json">Answers JSON</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="builder" class="mt-4">
			<div class="h-[calc(100vh-220px)] min-h-[600px]">
				<StructureBuilder bind:definition />
			</div>
		</Tabs.Content>

		<Tabs.Content value="preview" class="mt-4">
			{#if hasSections}
				<div class="mb-3 flex items-center justify-end gap-2">
					{#if hasAnswers}
						<Button variant="outline" size="sm" onclick={resetPreview}>Reset Preview</Button>
					{/if}
				</div>
				{#key previewKey}
					<div class="h-[calc(100vh-260px)] min-h-[500px]">
						<StructureRenderer
							{definition}
							answers={loadedAnswers}
							oncomplete={handleComplete}
							onanswerschange={handleAnswersChange}
						/>
					</div>
				{/key}
			{:else}
				<div class="py-20 text-center text-muted-foreground">Add some sections in the Builder tab first</div>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="structure-json" class="mt-4">
			<div class="grid gap-4 lg:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<DownloadIcon class="size-4 text-muted-foreground" />
								<Card.Title>Current Structure</Card.Title>
							</div>
							<CopyButton text={definitionJson} />
						</div>
						<Card.Description>
							The structure blueprint — defines sections, forms, conditions, and prerequisites
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
							<Card.Title>Load Structure</Card.Title>
						</div>
						<Card.Description>Paste a structure definition JSON to load it into the builder</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Textarea
								class="min-h-[300px] font-mono text-xs"
								placeholder="Paste structure JSON here..."
								bind:value={importStructureText}
							/>
							{#if importStructureError}
								<p class="text-sm text-destructive">{importStructureError}</p>
							{/if}
							<Button onclick={loadStructure} disabled={!importStructureText.trim()} class="w-full">
								<UploadIcon class="mr-2 size-4" />
								Load Structure into Builder
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>

		<Tabs.Content value="answers-json" class="mt-4">
			<div class="grid gap-4 lg:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<DownloadIcon class="size-4 text-muted-foreground" />
								<Card.Title>Current Answers</Card.Title>
							</div>
							<CopyButton text={answersJson} />
						</div>
						<Card.Description>
							Live snapshot of all form answers and section progress — copy this to save the state
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if hasAnswers}
							<pre class="max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-sm"><code>{answersJson}</code></pre>
						{:else}
							<div class="flex flex-col items-center py-12 text-center">
								<p class="text-sm text-muted-foreground">
									No answers yet — fill out forms in the Preview tab to generate answers
								</p>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<div class="flex items-center gap-2">
							<UploadIcon class="size-4 text-muted-foreground" />
							<Card.Title>Load Answers</Card.Title>
						</div>
						<Card.Description>Paste previously saved answers JSON to restore state in the preview</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Textarea
								class="min-h-[300px] font-mono text-xs"
								placeholder="Paste answers JSON here..."
								bind:value={importAnswersText}
							/>
							{#if importError}
								<p class="text-sm text-destructive">{importError}</p>
							{/if}
							<Button onclick={loadAnswers} disabled={!importAnswersText.trim()} class="w-full">
								<UploadIcon class="mr-2 size-4" />
								Load Answers into Preview
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
