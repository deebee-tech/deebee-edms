<script lang="ts">
	import * as Table from "$lib/components/ui/table";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import * as Select from "$lib/components/ui/select";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import XIcon from "@lucide/svelte/icons/x";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import type { DatasetField, DatasetFilter, DatasetTable } from "$lib/datasets/types";

	let {
		fields,
		filters,
		tables,
		onfieldschange,
		onfilterschange,
	}: {
		fields: DatasetField[];
		filters: DatasetFilter[];
		tables: DatasetTable[];
		onfieldschange: (fields: DatasetField[]) => void;
		onfilterschange: (filters: DatasetFilter[]) => void;
	} = $props();

	const aggregationOptions = [
		{ value: "", label: "None" },
		{ value: "count", label: "COUNT" },
		{ value: "sum", label: "SUM" },
		{ value: "avg", label: "AVG" },
		{ value: "min", label: "MIN" },
		{ value: "max", label: "MAX" },
	];

	const sortOptions = [
		{ value: "", label: "None" },
		{ value: "asc", label: "ASC" },
		{ value: "desc", label: "DESC" },
	];

	const operatorOptions = [
		{ value: "eq", label: "=" },
		{ value: "neq", label: "!=" },
		{ value: "gt", label: ">" },
		{ value: "gte", label: ">=" },
		{ value: "lt", label: "<" },
		{ value: "lte", label: "<=" },
		{ value: "contains", label: "LIKE" },
		{ value: "is_null", label: "IS NULL" },
		{ value: "is_not_null", label: "IS NOT NULL" },
	];

	function getTableName(tableId: string): string {
		const table = tables.find((t) => t.id === tableId);
		return table?.alias || table?.tableName || tableId;
	}

	function updateField(index: number, updates: Partial<DatasetField>) {
		const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
		onfieldschange(updated);
	}

	function removeField(index: number) {
		const fieldId = fields[index].id;
		onfieldschange(fields.filter((_, i) => i !== index));
		onfilterschange(filters.filter((f) => !(f.tableId === fields[index].tableId && f.columnName === fields[index].columnName)));
	}

	function addEmptyField() {
		const newField: DatasetField = {
			id: crypto.randomUUID(),
			tableId: tables[0]?.id ?? "",
			columnName: "",
			visible: true,
		};
		onfieldschange([...fields, newField]);
	}

	function getFilter(field: DatasetField): DatasetFilter | undefined {
		return filters.find((f) => f.tableId === field.tableId && f.columnName === field.columnName);
	}

	function updateFilter(field: DatasetField, operator: string, value: string) {
		const existing = filters.findIndex(
			(f) => f.tableId === field.tableId && f.columnName === field.columnName,
		);

		if (!operator && !value) {
			if (existing >= 0) {
				onfilterschange(filters.filter((_, i) => i !== existing));
			}
			return;
		}

		const filter: DatasetFilter = {
			id: existing >= 0 ? filters[existing].id : crypto.randomUUID(),
			tableId: field.tableId,
			columnName: field.columnName,
			operator: operator || "eq",
			value,
			logic: "and",
		};

		if (existing >= 0) {
			onfilterschange(filters.map((f, i) => (i === existing ? filter : f)));
		} else {
			onfilterschange([...filters, filter]);
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "copy";
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		const columnJson = event.dataTransfer?.getData("application/dataset-column");
		if (!columnJson) return;
		try {
			const colData = JSON.parse(columnJson) as {
				schema: string;
				tableName: string;
				columnName: string;
			};
			const table = tables.find((t) => t.tableName === colData.tableName && t.schema === colData.schema);
			if (!table) return;

			const alreadyExists = fields.some(
				(f) => f.tableId === table.id && f.columnName === colData.columnName,
			);
			if (alreadyExists) return;

			const newField: DatasetField = {
				id: crypto.randomUUID(),
				tableId: table.id,
				columnName: colData.columnName,
				visible: true,
			};
			onfieldschange([...fields, newField]);
		} catch {
			// invalid data
		}
	}
</script>

<div
	class="flex h-full flex-col"
	role="presentation"
	ondragover={handleDragOver}
	ondrop={handleDrop}
>
	<div class="flex items-center justify-between border-b px-3 py-1.5">
		<h4 class="text-xs font-semibold">Fields</h4>
		<Button variant="ghost" size="sm" class="h-6 text-xs" onclick={addEmptyField}>
			<PlusIcon class="mr-1 size-3" />
			Add
		</Button>
	</div>
	<ScrollArea class="flex-1" orientation="both">
		<Table.Root class="text-xs">
			<Table.Header>
				<Table.Row class="h-7">
					<Table.Head class="w-6 px-1"></Table.Head>
					<Table.Head class="min-w-[140px]">Field</Table.Head>
					<Table.Head class="min-w-[100px]">Table</Table.Head>
					<Table.Head class="min-w-[100px]">Alias</Table.Head>
					<Table.Head class="w-12 text-center">Show</Table.Head>
					<Table.Head class="min-w-[80px]">Sort</Table.Head>
					<Table.Head class="min-w-[80px]">Aggregate</Table.Head>
					<Table.Head class="min-w-[70px]">Operator</Table.Head>
					<Table.Head class="min-w-[100px]">Criteria</Table.Head>
					<Table.Head class="w-8"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each fields as field, i (field.id)}
					{@const filter = getFilter(field)}
					<Table.Row class="h-8">
						<Table.Cell class="px-1">
							<GripVerticalIcon class="size-3 cursor-grab text-muted-foreground/40" />
						</Table.Cell>
						<Table.Cell class="p-1">
							<Input
								class="h-6 text-xs"
								value={field.columnName}
								placeholder="column"
								oninput={(e) => updateField(i, { columnName: e.currentTarget.value })}
							/>
						</Table.Cell>
						<Table.Cell class="p-1">
							<span class="truncate text-muted-foreground">{getTableName(field.tableId)}</span>
						</Table.Cell>
						<Table.Cell class="p-1">
							<Input
								class="h-6 text-xs"
								value={field.alias ?? ""}
								placeholder="alias"
								oninput={(e) => updateField(i, { alias: e.currentTarget.value || undefined })}
							/>
						</Table.Cell>
						<Table.Cell class="p-1 text-center">
							<Checkbox
								checked={field.visible}
								onCheckedChange={(checked) => updateField(i, { visible: checked === true })}
							/>
						</Table.Cell>
						<Table.Cell class="p-1">
							<Select.Root
								type="single"
								value={field.sortDirection ?? ""}
								onValueChange={(val) =>
									updateField(i, {
										sortDirection: val === "" ? undefined : (val as "asc" | "desc"),
									})}
							>
								<Select.Trigger class="h-6 text-xs">
									{sortOptions.find((o) => o.value === (field.sortDirection ?? ""))?.label ?? "None"}
								</Select.Trigger>
								<Select.Content>
									{#each sortOptions as opt (opt.value)}
										<Select.Item value={opt.value} class="text-xs">{opt.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Table.Cell>
						<Table.Cell class="p-1">
							<Select.Root
								type="single"
								value={field.aggregation ?? ""}
								onValueChange={(val) =>
									updateField(i, {
										aggregation: val === "" ? undefined : (val as DatasetField["aggregation"]),
									})}
							>
								<Select.Trigger class="h-6 text-xs">
									{aggregationOptions.find((o) => o.value === (field.aggregation ?? ""))?.label ?? "None"}
								</Select.Trigger>
								<Select.Content>
									{#each aggregationOptions as opt (opt.value)}
										<Select.Item value={opt.value} class="text-xs">{opt.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Table.Cell>
						<Table.Cell class="p-1">
							<Select.Root
								type="single"
								value={filter?.operator ?? ""}
								onValueChange={(val) => updateFilter(field, val, filter?.value ?? "")}
							>
								<Select.Trigger class="h-6 text-xs">
									{operatorOptions.find((o) => o.value === (filter?.operator ?? ""))?.label ?? "--"}
								</Select.Trigger>
								<Select.Content>
									{#each operatorOptions as opt (opt.value)}
										<Select.Item value={opt.value} class="text-xs">{opt.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Table.Cell>
						<Table.Cell class="p-1">
							<Input
								class="h-6 text-xs"
								value={filter?.value ?? ""}
								placeholder="value"
								oninput={(e) => updateFilter(field, filter?.operator ?? "eq", e.currentTarget.value)}
							/>
						</Table.Cell>
						<Table.Cell class="p-1">
							<Button
								variant="ghost"
								size="icon"
								class="size-6 text-destructive hover:text-destructive"
								onclick={() => removeField(i)}
							>
								<XIcon class="size-3" />
							</Button>
						</Table.Cell>
					</Table.Row>
				{/each}
				{#if fields.length === 0}
					<Table.Row>
						<Table.Cell colspan={10} class="py-6 text-center text-muted-foreground">
							Double-click columns on the canvas or drag them here to add fields
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</Table.Root>
	</ScrollArea>
</div>
