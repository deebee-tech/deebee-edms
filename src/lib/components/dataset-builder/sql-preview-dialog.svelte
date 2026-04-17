<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Code from "$lib/components/shadcn-svelte/code";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Dialog from "$lib/components/shadcn-svelte/dialog";
	import { formatDisplaySql } from "$lib/format-display-sql";
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
	const formattedRawSql = $derived(
		formatDisplaySql(generated.rawSql, definition.engine ?? "postgres"),
	);
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
		<div class="relative space-y-2">
			<div class="flex justify-end">
				<CopyButton text={generated.rawSql} />
			</div>
			<div class="overflow-hidden rounded-lg border">
				<Code.Root code={formattedRawSql} lang="sql" hideLines class="max-h-[min(24rem,50vh)] border-0" />
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (open = false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
