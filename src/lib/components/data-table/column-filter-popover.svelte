<script lang="ts">
	import * as Popover from "$lib/components/ui/popover";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import * as Select from "$lib/components/ui/select";
	import { getOperatorsForType, getOperatorDescriptor } from "$lib/data-table/filter-operators.js";
	import { FilterOperator, type ColumnFilter, type ColumnMeta } from "$lib/data-table/types.js";
	import FilterIcon from "@lucide/svelte/icons/filter";
	import XIcon from "@lucide/svelte/icons/x";

	interface Props {
		column: ColumnMeta;
		activeFilters: ColumnFilter[];
		onApply: (filter: ColumnFilter) => void;
		onRemove: (filterId: string) => void;
	}

	let { column, activeFilters, onApply, onRemove }: Props = $props();

	let open = $state(false);
	let selectedOperator = $state<FilterOperator>(FilterOperator.Contains);
	let filterValue = $state("");
	let filterValueTo = $state("");

	const operators = $derived(getOperatorsForType(column.type));
	const currentDescriptor = $derived(getOperatorDescriptor(selectedOperator));
	const hasActiveFilter = $derived(activeFilters.some((f) => f.column === column.key));

	$effect(() => {
		if (column.type === "text") {
			selectedOperator = FilterOperator.Contains;
		} else if (column.type === "number" || column.type === "date") {
			selectedOperator = FilterOperator.Equals;
		} else if (column.type === "boolean") {
			selectedOperator = FilterOperator.Equals;
		}
	});

	function handleApply() {
		const filter: ColumnFilter = {
			id: `${column.key}-${selectedOperator}-${Date.now()}`,
			column: column.key,
			operator: selectedOperator,
			value: column.type === "number" ? Number(filterValue) : filterValue,
			valueTo: currentDescriptor?.valueCount === 2
				? (column.type === "number" ? Number(filterValueTo) : filterValueTo)
				: undefined,
		};
		onApply(filter);
		filterValue = "";
		filterValueTo = "";
		open = false;
	}

	function handleClear() {
		for (const f of activeFilters.filter((f) => f.column === column.key)) {
			onRemove(f.id);
		}
		open = false;
	}

	function handleOperatorChange(value: string | undefined) {
		if (value) {
			selectedOperator = value as FilterOperator;
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				class="ml-1 inline-flex size-4 shrink-0 items-center justify-center rounded opacity-50 hover:opacity-100"
				class:text-primary={hasActiveFilter}
				class:opacity-100={hasActiveFilter}
			>
				<FilterIcon class="size-3" />
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-72 p-3" align="start">
		<div class="space-y-3">
			<p class="text-sm font-medium">Filter: {column.label}</p>

			<Select.Root type="single" value={selectedOperator} onValueChange={handleOperatorChange}>
				<Select.Trigger class="h-8 text-xs">
					{currentDescriptor?.label ?? "Select operator"}
				</Select.Trigger>
				<Select.Content>
					{#each operators as op (op.key)}
						<Select.Item value={op.key}>{op.label}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>

			{#if currentDescriptor && currentDescriptor.valueCount > 0}
				{#if column.type === "boolean"}
					<Select.Root type="single" value={filterValue} onValueChange={(v) => { if (v) filterValue = v; }}>
						<Select.Trigger class="h-8 text-xs">
							{filterValue === "true" ? "Yes" : filterValue === "false" ? "No" : "Select..."}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="true">Yes</Select.Item>
							<Select.Item value="false">No</Select.Item>
						</Select.Content>
					</Select.Root>
				{:else}
					<Input
						class="h-8 text-xs"
						type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
						placeholder={selectedOperator === FilterOperator.Regex ? "Regex pattern..." : "Value..."}
						bind:value={filterValue}
						onkeydown={(e) => { if (e.key === "Enter" && filterValue) handleApply(); }}
					/>
				{/if}

				{#if currentDescriptor.valueCount === 2}
					<Input
						class="h-8 text-xs"
						type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
						placeholder="To value..."
						bind:value={filterValueTo}
					/>
				{/if}
			{/if}

			<div class="flex justify-between gap-2">
				{#if hasActiveFilter}
					<Button variant="ghost" size="sm" class="h-7 text-xs" onclick={handleClear}>
						<XIcon class="mr-1 size-3" />
						Clear
					</Button>
				{:else}
					<div></div>
				{/if}
				<Button
					size="sm"
					class="h-7 text-xs"
					disabled={currentDescriptor?.valueCount !== 0 && !filterValue}
					onclick={handleApply}
				>
					Apply
				</Button>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
