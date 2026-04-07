<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Code from "$lib/components/shadcn-svelte/code";
	import * as Dialog from "$lib/components/shadcn-svelte/dialog";
	import CodeIcon from "@lucide/svelte/icons/code";
	import { generateSql } from "./sql-generator";
	import type { DatasetDefinition } from "./types";

	let {
		definition,
		open = $bindable(false),
	}: {
		definition: DatasetDefinition;
		open?: boolean;
	} = $props();

	const generated = $derived(generateSql(definition));
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button variant="outline" size="sm" {...props}>
				<CodeIcon class="mr-2 size-3.5" />
				SQL
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Generated SQL</Dialog.Title>
			<Dialog.Description>SQL query generated from the current dataset definition</Dialog.Description>
		</Dialog.Header>
		<div class="relative max-h-[500px] overflow-auto">
			<Code.Root code={generated.rawSql} lang="sql" hideLines>
				<Code.CopyButton class="absolute top-2 right-2" />
			</Code.Root>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
