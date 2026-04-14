<script lang="ts">
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import { Separator } from "$lib/components/shadcn-svelte/separator";
	import { Switch } from "$lib/components/shadcn-svelte/switch";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import type { ConditionRule, SectionDefinition } from "../types";
	import ConditionEditor from "./condition-editor.svelte";

	let {
		section = $bindable(),
		allSectionIds = [],
		allStateKeys = [],
	}: {
		section: SectionDefinition;
		allSectionIds?: string[];
		allStateKeys?: string[];
	} = $props();

	const otherSectionIds = $derived(allSectionIds.filter((id) => id !== section.id));

	function ensureConditions() {
		if (!section.conditions) {
			section.conditions = {};
		}
	}

	function updateVisibility(rules: ConditionRule[]) {
		ensureConditions();
		section.conditions = { ...section.conditions!, visibility: rules };
	}

	function togglePrerequisite(id: string) {
		ensureConditions();
		const current = section.conditions!.prerequisites ?? [];
		if (current.includes(id)) {
			section.conditions = {
				...section.conditions!,
				prerequisites: current.filter((p) => p !== id),
			};
		} else {
			section.conditions = {
				...section.conditions!,
				prerequisites: [...current, id],
			};
		}
	}
</script>

<div class="space-y-4">
	<h4 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Section Properties</h4>

	<Field.Field>
		<Field.Label class="text-xs">Title</Field.Label>
		<Input class="h-8 text-sm" bind:value={section.title} placeholder="Section title" />
	</Field.Field>

	<Field.Field>
		<Field.Label class="text-xs">Description</Field.Label>
		<Textarea class="min-h-[60px] text-sm" bind:value={section.description} placeholder="Optional description" />
	</Field.Field>

	<Field.Field>
		<Field.Label class="text-xs">Icon (Lucide name)</Field.Label>
		<Input class="h-8 text-sm" bind:value={section.icon} placeholder="e.g. user, calendar-days" />
	</Field.Field>

	<Separator />

	<Field.Field orientation="horizontal" class="gap-2">
		<Switch
			checked={section.conditions?.skippable ?? false}
			onCheckedChange={(checked) => {
				ensureConditions();
				section.conditions = { ...section.conditions!, skippable: checked };
			}}
			size="sm"
		/>
		<Field.Label class="text-xs">Skippable</Field.Label>
	</Field.Field>

	<Field.Field orientation="horizontal" class="gap-2">
		<Switch
			checked={section.conditions?.repeatable ?? false}
			onCheckedChange={(checked) => {
				ensureConditions();
				section.conditions = { ...section.conditions!, repeatable: checked };
			}}
			size="sm"
		/>
		<Field.Label class="text-xs">Repeatable</Field.Label>
	</Field.Field>

	<Separator />

	{#if otherSectionIds.length > 0}
		<div class="space-y-2">
			<span class="text-xs font-medium text-muted-foreground">Prerequisites</span>
			<p class="text-[10px] text-muted-foreground/75">Sections that must be completed before this one is unlocked</p>
			{#each otherSectionIds as id (id)}
				{@const isPrereq = section.conditions?.prerequisites?.includes(id) ?? false}
				<Field.Field orientation="horizontal" class="gap-2">
					<Switch checked={isPrereq} onCheckedChange={() => togglePrerequisite(id)} size="sm" />
					<Field.Label class="text-xs">{id}</Field.Label>
				</Field.Field>
			{/each}
		</div>

		<Separator />
	{/if}

	<ConditionEditor
		bind:rules={() => section.conditions?.visibility ?? [], (v) => updateVisibility(v)}
		stateKeys={allStateKeys}
		label="Visibility Rules"
	/>
</div>
