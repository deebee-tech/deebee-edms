<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import * as Select from "$lib/components/ui/select";
	import { getOperatorsForType, getOperatorDescriptor } from "$lib/data-table/filter-operators.js";
	import {
		FilterOperator,
		type ColumnFilter,
		type ColumnMeta,
		type FilterGroup,
		type FilterGroupLogic,
	} from "$lib/data-table/types.js";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";

	interface Props {
		columns: ColumnMeta[];
		onApply: (groups: FilterGroup[]) => void;
		existingGroups?: FilterGroup[];
	}

	let { columns, onApply, existingGroups = [] }: Props = $props();

	let open = $state(false);

	interface EditableRow {
		id: string;
		column: string;
		operator: FilterOperator;
		value: string;
		valueTo: string;
	}

	interface EditableGroup {
		id: string;
		logic: FilterGroupLogic;
		rows: EditableRow[];
	}

	let groups = $state<EditableGroup[]>([]);

	function resetFromExisting() {
		if (existingGroups.length > 0) {
			groups = existingGroups.map((g) => ({
				id: crypto.randomUUID(),
				logic: g.logic,
				rows: g.filters.map((f) => ({
					id: f.id,
					column: f.column,
					operator: f.operator,
					value: String(f.value ?? ""),
					valueTo: String(f.valueTo ?? ""),
				})),
			}));
		} else {
			groups = [createEmptyGroup()];
		}
	}

	function createEmptyGroup(): EditableGroup {
		const firstCol = filterableColumns[0];
		return {
			id: crypto.randomUUID(),
			logic: "and",
			rows: [createEmptyRow(firstCol?.key ?? "")],
		};
	}

	function createEmptyRow(column: string): EditableRow {
		const col = columns.find((c) => c.key === column);
		const ops = col ? getOperatorsForType(col.type) : [];
		return {
			id: crypto.randomUUID(),
			column,
			operator: ops[0]?.key ?? FilterOperator.Equals,
			value: "",
			valueTo: "",
		};
	}

	const filterableColumns = $derived(columns.filter((c) => c.filterable !== false));

	function addRow(groupIdx: number) {
		const firstCol = filterableColumns[0];
		groups[groupIdx].rows.push(createEmptyRow(firstCol?.key ?? ""));
	}

	function removeRow(groupIdx: number, rowIdx: number) {
		groups[groupIdx].rows.splice(rowIdx, 1);
		if (groups[groupIdx].rows.length === 0) {
			groups.splice(groupIdx, 1);
		}
		if (groups.length === 0) {
			groups = [createEmptyGroup()];
		}
	}

	function addGroup() {
		groups.push(createEmptyGroup());
	}

	function handleColumnChange(groupIdx: number, rowIdx: number, value: string | undefined) {
		if (!value) return;
		const row = groups[groupIdx].rows[rowIdx];
		row.column = value;
		const col = columns.find((c) => c.key === value);
		const ops = col ? getOperatorsForType(col.type) : [];
		if (!ops.some((op) => op.key === row.operator)) {
			row.operator = ops[0]?.key ?? FilterOperator.Equals;
		}
	}

	function handleApply() {
		const result: FilterGroup[] = groups
			.filter((g) => g.rows.length > 0)
			.map((g) => ({
				logic: g.logic,
				filters: g.rows
					.filter((r) => {
						const desc = getOperatorDescriptor(r.operator);
						return desc?.valueCount === 0 || r.value !== "";
					})
					.map(
						(r): ColumnFilter => ({
							id: r.id,
							column: r.column,
							operator: r.operator,
							value: r.value,
							valueTo: r.valueTo || undefined,
						}),
					),
			}))
			.filter((g) => g.filters.length > 0);

		onApply(result);
		open = false;
	}
</script>

<Dialog.Root bind:open onOpenChange={(o) => { if (o) resetFromExisting(); }}>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button variant="outline" size="sm" {...props}>
				<SlidersHorizontalIcon class="mr-2 size-4" />
				Filter Builder
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title>Advanced Filter Builder</Dialog.Title>
			<Dialog.Description>Build compound filter expressions with AND/OR logic.</Dialog.Description>
		</Dialog.Header>

		<div class="max-h-96 space-y-4 overflow-y-auto py-4">
			{#each groups as group, groupIdx (group.id)}
				{#if groupIdx > 0}
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<div class="h-px flex-1 bg-border"></div>
						<span class="font-medium">OR</span>
						<div class="h-px flex-1 bg-border"></div>
					</div>
				{/if}

				<div class="rounded-lg border p-3">
					<div class="mb-2 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-xs font-medium text-muted-foreground">Match</span>
							<Select.Root type="single" value={group.logic} onValueChange={(v) => { if (v) group.logic = v as FilterGroupLogic; }}>
								<Select.Trigger class="h-7 w-20 text-xs">
									{group.logic === "and" ? "ALL" : "ANY"}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="and">ALL</Select.Item>
									<Select.Item value="or">ANY</Select.Item>
								</Select.Content>
							</Select.Root>
							<span class="text-xs text-muted-foreground">of the following:</span>
						</div>
					</div>

					<div class="space-y-2">
						{#each group.rows as row, rowIdx (row.id)}
							{@const col = columns.find((c) => c.key === row.column)}
							{@const ops = col ? getOperatorsForType(col.type) : []}
							{@const desc = getOperatorDescriptor(row.operator)}

							<div class="flex items-center gap-2">
								<Select.Root type="single" value={row.column} onValueChange={(v) => handleColumnChange(groupIdx, rowIdx, v)}>
									<Select.Trigger class="h-8 w-32 text-xs">
										{col?.label ?? "Column"}
									</Select.Trigger>
									<Select.Content>
										{#each filterableColumns as c (c.key)}
											<Select.Item value={c.key}>{c.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>

								<Select.Root type="single" value={row.operator} onValueChange={(v) => { if (v) row.operator = v as FilterOperator; }}>
									<Select.Trigger class="h-8 w-40 text-xs">
										{desc?.label ?? "Operator"}
									</Select.Trigger>
									<Select.Content>
										{#each ops as op (op.key)}
											<Select.Item value={op.key}>{op.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>

								{#if desc && desc.valueCount > 0}
									<Input
										class="h-8 flex-1 text-xs"
										placeholder="Value..."
										bind:value={row.value}
									/>
									{#if desc.valueCount === 2}
										<Input
											class="h-8 w-24 text-xs"
											placeholder="To..."
											bind:value={row.valueTo}
										/>
									{/if}
								{/if}

								<Button
									variant="ghost"
									size="sm"
									class="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive"
									onclick={() => removeRow(groupIdx, rowIdx)}
								>
									<TrashIcon class="size-3.5" />
								</Button>
							</div>
						{/each}
					</div>

					<Button variant="ghost" size="sm" class="mt-2 h-7 text-xs" onclick={() => addRow(groupIdx)}>
						<PlusIcon class="mr-1 size-3" />
						Add condition
					</Button>
				</div>
			{/each}
		</div>

		<div class="flex items-center justify-between">
			<Button variant="outline" size="sm" onclick={addGroup}>
				<PlusIcon class="mr-1 size-3.5" />
				Add OR group
			</Button>
			<div class="flex gap-2">
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button onclick={handleApply}>Apply Filters</Button>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
