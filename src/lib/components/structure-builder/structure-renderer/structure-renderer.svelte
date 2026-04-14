<script lang="ts">
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import { untrack } from "svelte";
	import type { StructureAnswers, StructureDefinition } from "../types";
	import CompletionScreen from "./completion-screen.svelte";
	import SectionContent from "./section-content.svelte";
	import SectionNav from "./section-nav.svelte";
	import { StructureState, setStructureState } from "./structure-state.svelte";

	let {
		definition,
		answers,
		oncomplete,
		onanswerschange,
	}: {
		definition: StructureDefinition;
		answers?: StructureAnswers;
		oncomplete?: (data: Record<string, Record<string, unknown>>) => void;
		onanswerschange?: (answers: StructureAnswers) => void;
	} = $props();

	const structureState = untrack(() => new StructureState(definition, answers));
	setStructureState(structureState);

	$effect(() => {
		const snapshot = structureState.toAnswers();
		if (onanswerschange) {
			onanswerschange(snapshot);
		}
		const items = structureState.getNavigableItems();
		const allDone =
			items.length > 0 &&
			items.every((item) => {
				const status = structureState.sectionStatus[item.sectionId];
				return status === "completed" || status === "skipped";
			});
		if (allDone && oncomplete) {
			oncomplete(structureState.allFormData);
		}
	});
</script>

<div class="flex h-full min-h-[500px] overflow-hidden rounded-lg border bg-background">
	<!-- Left Nav -->
	<div class="w-64 shrink-0 border-r">
		<div class="border-b px-4 py-3">
			<h3 class="text-sm font-semibold">{definition.name}</h3>
			{#if definition.description}
				<p class="mt-0.5 text-xs text-muted-foreground">{definition.description}</p>
			{/if}
		</div>
		<ScrollArea class="h-[calc(100%-65px)]">
			<div class="p-2">
				<SectionNav sections={definition.sections} />
			</div>
		</ScrollArea>
	</div>

	<!-- Content Area -->
	<div class="flex-1">
		<ScrollArea class="h-full">
			<div class="mx-auto max-w-2xl p-6">
				{#if structureState.completed}
					<CompletionScreen name={definition.name} formData={structureState.allFormData} />
				{:else}
					<SectionContent />
				{/if}
			</div>
		</ScrollArea>
	</div>
</div>
