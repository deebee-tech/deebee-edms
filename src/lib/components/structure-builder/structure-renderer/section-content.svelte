<script lang="ts">
	import { createDefaultValues, createValibotSchema, FormRenderer } from "$lib/components/dynamic-forms";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import { DynamicLucideIcon } from "$lib/components/shadcn-svelte/dynamic-lucide-icon";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import LockIcon from "@lucide/svelte/icons/lock";
	import SkipForwardIcon from "@lucide/svelte/icons/skip-forward";
	import { defaults } from "sveltekit-superforms";
	import { valibot } from "sveltekit-superforms/adapters";
	import { getStructureState } from "./structure-state.svelte";

	const structureState = getStructureState();

	let formKey = $state(0);

	const section = $derived(structureState.activeSection);
	const form = $derived(structureState.activeForm);
	const isBlocked = $derived(section ? structureState.isSectionBlockedCheck(section) : false);

	const previewData = $derived.by(() => {
		if (!form || !form.form.fields.length) return null;
		try {
			const schema = createValibotSchema(form.form);
			const defaultVals = createDefaultValues(form.form);
			const existing = structureState.formData[form.stateKey];
			const merged = existing ? { ...defaultVals, ...existing } : defaultVals;
			return defaults(merged, valibot(schema));
		} catch {
			return null;
		}
	});

	function handleSubmit(data: Record<string, unknown>) {
		structureState.submitCurrentForm(data);
		formKey++;
	}

	function handlePrevious() {
		structureState.goPrevious();
		formKey++;
	}

	function handleSkip() {
		structureState.skipSection();
		formKey++;
	}

	function handleNext() {
		structureState.goNext();
		formKey++;
	}
</script>

{#if section}
	<div class="space-y-4">
		<div class="flex items-center gap-3">
			{#if section.icon}
				<DynamicLucideIcon name={section.icon} class="size-5 text-muted-foreground" />
			{/if}
			<div>
				<h2 class="text-lg font-semibold">{section.title}</h2>
				{#if section.description}
					<p class="text-sm text-muted-foreground">{section.description}</p>
				{/if}
			</div>
		</div>

		{#if isBlocked}
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center py-12 text-center">
					<LockIcon class="mb-3 size-10 text-muted-foreground/50" />
					<p class="text-sm font-medium text-muted-foreground">Section Locked</p>
					<p class="mt-1 text-xs text-muted-foreground/75">Complete the prerequisite sections to unlock this one</p>
				</Card.Content>
			</Card.Root>
		{:else if structureState.sectionStatus[section.id] === "completed" && !form}
			<Card.Root>
				<Card.Content class="flex flex-col items-center py-12 text-center">
					<CheckCircleIcon class="mb-3 size-10 text-green-500" />
					<p class="text-sm font-medium">Section Completed</p>
					<p class="mt-1 text-xs text-muted-foreground">You have already completed this section</p>
				</Card.Content>
			</Card.Root>
		{:else if form && previewData}
			{#key formKey}
				<Card.Root>
					<Card.Header>
						<Card.Title>{form.form.name}</Card.Title>
						{#if form.form.description}
							<Card.Description>{form.form.description}</Card.Description>
						{/if}
					</Card.Header>
					<Card.Content>
						<FormRenderer
							definition={form.form}
							data={previewData}
							onsubmit={handleSubmit}
							submitLabel={structureState.isLastItem ? "Complete" : "Save & Continue"}
						/>
					</Card.Content>
				</Card.Root>
			{/key}
		{:else if !form}
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center py-8 text-center">
					<p class="text-sm text-muted-foreground">This section has no forms. Navigate to a child section.</p>
				</Card.Content>
			</Card.Root>
		{/if}

		<div class="flex items-center justify-between pt-2">
			<Button variant="outline" size="sm" disabled={!structureState.canGoPrevious} onclick={handlePrevious}>
				<ChevronLeftIcon class="mr-1 size-4" />
				Previous
			</Button>

			<div class="flex items-center gap-2">
				{#if structureState.canSkip}
					<Button variant="ghost" size="sm" onclick={handleSkip}>
						<SkipForwardIcon class="mr-1 size-4" />
						Skip
					</Button>
				{/if}

				{#if !form && structureState.canGoNext}
					<Button size="sm" onclick={handleNext}>
						Next
						<ChevronRightIcon class="ml-1 size-4" />
					</Button>
				{/if}
			</div>
		</div>
	</div>
{/if}
