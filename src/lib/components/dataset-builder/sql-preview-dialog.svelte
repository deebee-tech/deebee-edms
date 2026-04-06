<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Code from "$lib/components/ui/code";
	import { Button } from "$lib/components/ui/button";
	import { generateSql } from "$lib/datasets/sql-generator";
	import type { DatasetDefinition } from "$lib/datasets/types";
	import CodeIcon from "@lucide/svelte/icons/code";

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
			<Dialog.Description>
				SQL query generated from the current dataset definition
			</Dialog.Description>
		</Dialog.Header>
		<div class="relative max-h-[500px] overflow-auto">
			<Code.Root code={generated.sql} lang="sql" hideLines>
				<Code.CopyButton class="absolute top-2 right-2" />
			</Code.Root>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
