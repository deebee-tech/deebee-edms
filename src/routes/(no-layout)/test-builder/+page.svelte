<script lang="ts">
	import { FormBuilder } from "$lib/components/form-builder";
	import { FormRenderer } from "$lib/components/form-renderer";
	import { createValibotSchema, createDefaultValues } from "$lib/forms/schema";
	import { defaults } from "sveltekit-superforms";
	import { valibot } from "sveltekit-superforms/adapters";
	import * as Tabs from "$lib/components/ui/tabs";
	import * as Card from "$lib/components/ui/card";
	import { CopyButton } from "$lib/components/ui/copy-button";
	import type { FormDefinition } from "$lib/forms/types";

	let definition = $state<FormDefinition>({
		id: crypto.randomUUID(),
		name: "Untitled Form",
		fields: [],
	});

	let activeTab = $state("builder");
	let previewKey = $state(0);

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
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between">
						<Card.Title>Form Definition (JSON)</Card.Title>
						<CopyButton text={definitionJson} />
					</div>
					<Card.Description>This JSON can be stored in a database or file to render the form later</Card.Description>
				</Card.Header>
				<Card.Content>
					<pre class="max-h-[600px] overflow-auto rounded-md bg-muted p-4 text-sm"><code>{definitionJson}</code></pre>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>
</div>
