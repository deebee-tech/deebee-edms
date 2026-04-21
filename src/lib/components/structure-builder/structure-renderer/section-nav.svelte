<script lang="ts">
	import { DynamicLucideIcon } from "$lib/components/dynamic-lucide-icon";
	import CheckCircleIcon from "@lucide/svelte/icons/check-circle";
	import CircleDotIcon from "@lucide/svelte/icons/circle-dot";
	import CircleIcon from "@lucide/svelte/icons/circle";
	import LockIcon from "@lucide/svelte/icons/lock";
	import SkipForwardIcon from "@lucide/svelte/icons/skip-forward";
	import type { SectionDefinition, SectionStatus } from "../types";
	import { getStructureState } from "./structure-state.svelte";
	import SectionNavSelf from "./section-nav.svelte";

	let {
		sections,
		depth = 0,
	}: {
		sections: SectionDefinition[];
		/** Nesting depth — controls whether to wrap children in an indent guide. */
		depth?: number;
	} = $props();

	const structureState = getStructureState();

	function statusIcon(status: SectionStatus) {
		switch (status) {
			case "completed":
				return CheckCircleIcon;
			case "in_progress":
				return CircleDotIcon;
			case "skipped":
				return SkipForwardIcon;
			case "blocked":
				return LockIcon;
			default:
				return CircleIcon;
		}
	}

	function statusColor(status: SectionStatus): string {
		switch (status) {
			case "completed":
				return "text-green-500";
			case "in_progress":
				return "text-primary";
			case "skipped":
				return "text-yellow-500";
			case "blocked":
				return "text-muted-foreground/50";
			default:
				return "text-muted-foreground";
		}
	}
</script>

{#each sections as section (section.id)}
	{#if structureState.isSectionVisibleCheck(section)}
		{@const status = structureState.getEffectiveStatus(section)}
		{@const isActive = structureState.activeSectionId === section.id}
		{@const isBlocked = status === "blocked" || structureState.isSectionBlockedCheck(section)}
		{@const StatusIcon = statusIcon(status)}

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors {isActive
				? 'bg-accent font-medium text-accent-foreground'
				: isBlocked
					? 'cursor-not-allowed opacity-50'
					: 'cursor-pointer hover:bg-accent/50'}"
			onclick={() => {
				if (!isBlocked) structureState.navigateTo(section.id);
			}}
		>
			<DynamicLucideIcon name={section.icon} class="size-4 shrink-0 {statusColor(status)}">
				{#snippet fallback()}
					<StatusIcon class="size-4 shrink-0 {statusColor(status)}" />
				{/snippet}
			</DynamicLucideIcon>

			<span class="min-w-0 truncate">{section.title}</span>

			{#if section.conditions?.skippable && status !== "completed" && status !== "skipped"}
				<span class="ml-auto text-[10px] text-muted-foreground">optional</span>
			{/if}
		</div>

		{#if section.children && section.children.length > 0}
			<div class="ml-3 border-l border-border/60 pl-1.5">
				<SectionNavSelf sections={section.children} depth={depth + 1} />
			</div>
		{/if}
	{/if}
{/each}
