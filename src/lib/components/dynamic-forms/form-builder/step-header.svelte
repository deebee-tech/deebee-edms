<script lang="ts">
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { DynamicLucideIcon } from "$lib/components/shadcn-svelte/dynamic-lucide-icon";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { FormStepDefinition } from "../types";

	let {
		step,
		index,
		selected = false,
		expanded = true,
		canMoveUp = false,
		canMoveDown = false,
		canDelete = true,
		onselect,
		ontoggle,
		onmoveup,
		onmovedown,
		ondelete,
	}: {
		step: FormStepDefinition;
		index: number;
		selected?: boolean;
		expanded?: boolean;
		canMoveUp?: boolean;
		canMoveDown?: boolean;
		canDelete?: boolean;
		onselect: () => void;
		ontoggle: () => void;
		onmoveup: () => void;
		onmovedown: () => void;
		ondelete: () => void;
	} = $props();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="flex items-center gap-2 rounded-t-md border bg-muted/50 px-3 py-2 transition-colors hover:bg-muted {selected
		? 'border-primary ring-2 ring-primary/20'
		: 'border-border'} {!expanded ? 'rounded-b-md' : 'border-b-0'}"
	onclick={onselect}
>
	<Button
		variant="ghost"
		size="icon"
		class="size-6 shrink-0"
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
			ontoggle();
		}}
	>
		{#if expanded}
			<ChevronDownIcon class="size-3.5" />
		{:else}
			<ChevronUpIcon class="size-3.5" />
		{/if}
	</Button>

	<Badge variant="outline" class="flex shrink-0 items-center justify-center px-1.5 py-0 font-mono text-[10px]">
		{#if step.icon}
			<DynamicLucideIcon name={step.icon} class="size-3" />
		{:else}
			{index + 1}
		{/if}
	</Badge>

	<div class="min-w-0 flex-1">
		<span class="truncate text-sm font-medium">{step.title}</span>
		{#if step.description}
			<span class="ml-2 truncate text-xs text-muted-foreground">{step.description}</span>
		{/if}
	</div>

	<div class="flex shrink-0 items-center gap-0.5">
		<Button
			variant="ghost"
			size="icon"
			class="size-6 text-muted-foreground"
			disabled={!canMoveUp}
			onclick={(e: MouseEvent) => {
				e.stopPropagation();
				onmoveup();
			}}
		>
			<ArrowUpIcon class="size-3" />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="size-6 text-muted-foreground"
			disabled={!canMoveDown}
			onclick={(e: MouseEvent) => {
				e.stopPropagation();
				onmovedown();
			}}
		>
			<ArrowDownIcon class="size-3" />
		</Button>
		{#if canDelete}
			<Button
				variant="ghost"
				size="icon"
				class="size-6 text-muted-foreground hover:text-destructive"
				onclick={(e: MouseEvent) => {
					e.stopPropagation();
					ondelete();
				}}
			>
				<TrashIcon class="size-3" />
			</Button>
		{/if}
	</div>
</div>
