<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
	import { Button } from "$lib/components/ui/button";
	import { getOperatorLabel } from "$lib/data-table/filter-operators.js";
	import type { ColumnFilter, ColumnMeta } from "$lib/data-table/types.js";
	import XIcon from "@lucide/svelte/icons/x";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";

	interface Props {
		filters: ColumnFilter[];
		columns: ColumnMeta[];
		onRemove: (filterId: string) => void;
		onClearAll: () => void;
	}

	let { filters, columns, onRemove, onClearAll }: Props = $props();

	function getColumnLabel(key: string): string {
		return columns.find((c) => c.key === key)?.label ?? key;
	}

	function formatValue(filter: ColumnFilter): string {
		if (filter.value === null || filter.value === undefined || filter.value === "") return "";
		if (filter.valueTo !== undefined) return `${filter.value} - ${filter.valueTo}`;
		return String(filter.value);
	}
</script>

{#if filters.length > 0}
	<div class="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
		<span class="mr-1 text-xs font-medium text-muted-foreground">Filters:</span>
		{#each filters as filter (filter.id)}
			<Badge variant="secondary" class="gap-1 pr-1 text-xs font-normal">
				<span class="font-medium">{getColumnLabel(filter.column)}</span>
				<span class="text-muted-foreground">{getOperatorLabel(filter.operator)}</span>
				{#if formatValue(filter)}
					<span>"{formatValue(filter)}"</span>
				{/if}
				<button
					class="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
					onclick={() => onRemove(filter.id)}
				>
					<XIcon class="size-3" />
				</button>
			</Badge>
		{/each}
		<Button variant="ghost" size="sm" class="h-6 text-xs text-muted-foreground" onclick={onClearAll}>
			<Trash2Icon class="mr-1 size-3" />
			Clear all
		</Button>
	</div>
{/if}
