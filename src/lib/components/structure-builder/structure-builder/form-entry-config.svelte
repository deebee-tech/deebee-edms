<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import { Separator } from "$lib/components/shadcn-svelte/separator";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import type { ConditionRule, SectionFormEntry } from "../types";
	import ConditionEditor from "./condition-editor.svelte";

	let {
		entry = $bindable(),
		allStateKeys = [],
		onedit,
	}: {
		entry: SectionFormEntry;
		allStateKeys?: string[];
		onedit: () => void;
	} = $props();

	function updateVisibility(rules: ConditionRule[]) {
		if (!entry.conditions) {
			entry.conditions = {};
		}
		entry.conditions = { ...entry.conditions, visibility: rules };
	}
</script>

<div class="space-y-4">
	<h4 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Form Properties</h4>

	<Field.Field>
		<Field.Label class="text-xs">Form Name</Field.Label>
		<Input class="h-8 text-sm" bind:value={entry.form.name} placeholder="Form name" />
	</Field.Field>

	<Field.Field>
		<Field.Label class="text-xs">State Key</Field.Label>
		<Input class="h-8 text-sm" bind:value={entry.stateKey} placeholder="e.g. attendee" />
		<Field.Description class="text-[10px]">Key used to store this form's data in the structure state</Field.Description>
	</Field.Field>

	<div class="flex items-center gap-2 rounded-md border border-dashed p-3">
		<div class="min-w-0 flex-1">
			<p class="text-xs font-medium">{entry.form.fields.length} fields</p>
			{#if entry.form.steps && entry.form.steps.length > 0}
				<p class="text-[10px] text-muted-foreground">{entry.form.steps.length} steps</p>
			{/if}
		</div>
		<Button variant="outline" size="sm" class="h-7 text-xs" onclick={onedit}>
			<PencilIcon class="mr-1.5 size-3" />
			Edit Form
		</Button>
	</div>

	<Separator />

	<ConditionEditor
		bind:rules={() => entry.conditions?.visibility ?? [], (v) => updateVisibility(v)}
		stateKeys={allStateKeys}
		label="Visibility Rules"
	/>
</div>
