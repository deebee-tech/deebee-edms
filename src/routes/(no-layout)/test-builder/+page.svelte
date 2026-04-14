<script lang="ts">
	import {
		createDefaultValues,
		createValibotSchema,
		FormBuilder,
		FormRenderer,
		type FormDefinition,
	} from "$lib/components/dynamic-forms";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import { defaults } from "sveltekit-superforms";
	import { valibot } from "sveltekit-superforms/adapters";

	let definition = $state<FormDefinition>({
		id: crypto.randomUUID(),
		name: "Untitled Form",
		fields: [],
	});

	let activeTab = $state("builder");
	let previewKey = $state(0);
	let importText = $state("");
	let importError = $state("");

	const definitionJson = $derived(JSON.stringify(definition, null, 2));
	const hasFields = $derived(definition.fields.length > 0);

	const previewData = $derived.by(() => {
		if (!hasFields) return null;
		try {
			const schema = createValibotSchema(definition);
			return defaults(createDefaultValues(definition), valibot(schema));
		} catch {
			return null;
		}
	});

	function handleDefinitionChange(updated: FormDefinition) {
		definition = updated;
		previewKey++;
	}

	function loadDefinitionFromJson() {
		importError = "";
		try {
			const parsed = JSON.parse(importText) as FormDefinition;
			if (!parsed.id || !parsed.name || !Array.isArray(parsed.fields)) {
				importError = "Invalid form JSON: missing required fields (id, name, fields)";
				return;
			}
			definition = parsed;
			previewKey++;
			importText = "";
			activeTab = "builder";
		} catch {
			importError = "Invalid JSON";
		}
	}
</script>

<div class="container mx-auto max-w-[1400px] py-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Form Builder</h1>
		<p class="text-muted-foreground">Design your form, then preview or export it</p>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="builder">Builder</Tabs.Trigger>
			<Tabs.Trigger value="preview" disabled={!previewData}>Preview</Tabs.Trigger>
			<Tabs.Trigger value="json">JSON</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="builder" class="mt-4">
			<FormBuilder {definition} ondefinitionchange={handleDefinitionChange} />
		</Tabs.Content>

		<Tabs.Content value="preview" class="mt-4">
			{#if previewData}
				{#key previewKey}
					<Card.Root class="mx-auto max-w-2xl">
						<Card.Header>
							<Card.Title>{definition.name}</Card.Title>
							{#if definition.description}
								<Card.Description>{definition.description}</Card.Description>
							{/if}
						</Card.Header>
						<Card.Content>
							<FormRenderer {definition} data={previewData} />
						</Card.Content>
					</Card.Root>
				{/key}
			{:else}
				<div class="py-20 text-center text-muted-foreground">Add some fields in the Builder tab first</div>
			{/if}
		</Tabs.Content>

		<Tabs.Content value="json" class="mt-4">
			<div class="grid gap-4 lg:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<DownloadIcon class="size-4 text-muted-foreground" />
								<Card.Title>Form Definition (JSON)</Card.Title>
							</div>
							<CopyButton text={definitionJson} />
						</div>
						<Card.Description>This JSON can be stored in a database or file to render the form later</Card.Description>
					</Card.Header>
					<Card.Content>
						<pre class="max-h-[500px] overflow-auto rounded-md bg-muted p-4 text-sm"><code>{definitionJson}</code></pre>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<div class="flex items-center gap-2">
							<UploadIcon class="size-4 text-muted-foreground" />
							<Card.Title>Load Form Definition</Card.Title>
						</div>
						<Card.Description>Paste a form definition JSON to load it into the builder</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Textarea
								class="min-h-[300px] font-mono text-xs"
								placeholder="Paste form definition JSON here..."
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
