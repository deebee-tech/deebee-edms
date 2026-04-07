<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { Checkbox } from "$lib/components/shadcn-svelte/checkbox";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import * as Table from "$lib/components/shadcn-svelte/table";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import XIcon from "@lucide/svelte/icons/x";
	import type { DatasetField, DatasetTable } from "./types";

	let {
		fields,
		tables,
		onfieldschange,
	}: {
		fields: DatasetField[];
		tables: DatasetTable[];
		onfieldschange: (fields: DatasetField[]) => void;
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

	function getTableName(tableId: string): string {
		const table = tables.find((t) => t.id === tableId);
		return table?.alias || table?.tableName || tableId;
	}

	function fieldQualifiedLabel(field: DatasetField): string {
		const tablePart = getTableName(field.tableId);
		return field.columnName ? `${tablePart}.${field.columnName}` : "";
	}

	function updateField(index: number, updates: Partial<DatasetField>) {
		const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
		onfieldschange(updated);
	}

	function removeField(index: number) {
		onfieldschange(fields.filter((_, i) => i !== index));
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

			const alreadyExists = fields.some((f) => f.tableId === table.id && f.columnName === colData.columnName);
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

<div class="flex h-full min-h-0 flex-col overflow-hidden" role="presentation" ondragover={handleDragOver} ondrop={handleDrop}>
	<div class="flex shrink-0 items-center justify-between border-b px-3 py-1.5">
		<h4 class="text-xs font-semibold">Fields</h4>
		<Button variant="ghost" size="sm" class="h-6 text-xs" onclick={addEmptyField}>
			<PlusIcon class="mr-1 size-3" />
			Add
		</Button>
	</div>
	<div class="min-h-0 flex-1 overflow-auto">
		<table class="w-full caption-bottom text-xs">
			<thead class="sticky top-0 z-10 border-b bg-background [&_tr]:border-b">
				<tr class="h-7">
					<th class="w-6 px-1 text-left text-xs font-medium text-muted-foreground"></th>
					<th class="min-w-[160px] px-2 text-left text-xs font-medium text-muted-foreground">Field</th>
					<th class="min-w-[100px] px-2 text-left text-xs font-medium text-muted-foreground">Alias</th>
					<th class="w-12 px-2 text-xs font-medium text-muted-foreground">
						<div class="flex w-full justify-center">Show</div>
					</th>
					<th class="min-w-[100px] px-2 text-xs font-medium text-muted-foreground">
						<div class="flex w-full justify-center">Sort</div>
					</th>
					<th class="min-w-[100px] px-2 text-xs font-medium text-muted-foreground">
						<div class="flex w-full justify-center">Aggregate</div>
					</th>
					<th class="w-8"></th>
				</tr>
			</thead>
			<Table.Body>
				{#each fields as field, i (field.id)}
					{@const qualifiedFieldLabel = fieldQualifiedLabel(field)}
					<Table.Row class="h-8">
						<Table.Cell class="px-1">
							<GripVerticalIcon class="size-3 cursor-grab text-muted-foreground/40" />
						</Table.Cell>
						<Table.Cell class="p-1">
							<span class="block truncate text-xs" title={qualifiedFieldLabel || undefined}>
								{#if qualifiedFieldLabel}
									{qualifiedFieldLabel}
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</span>
						</Table.Cell>
						<Table.Cell class="p-1">
							<Input
								class="h-6 text-xs"
								value={field.alias ?? ""}
								placeholder="alias"
								oninput={(e) => updateField(i, { alias: e.currentTarget.value || undefined })}
							/>
						</Table.Cell>
						<Table.Cell class="p-1">
							<div class="flex w-full justify-center">
								<Checkbox
									checked={field.visible}
									onCheckedChange={(checked) => updateField(i, { visible: checked === true })}
								/>
							</div>
						</Table.Cell>
						<Table.Cell class="p-1 align-middle">
							<div class="flex w-full justify-center">
								<Select.Root
									type="single"
									value={field.sortDirection ?? ""}
									onValueChange={(val) =>
										updateField(i, {
											sortDirection: val === "" ? undefined : (val as "asc" | "desc"),
										})}
								>
									<Select.Trigger class="h-6 w-[80%] min-w-0 max-w-full justify-between text-xs">
										{sortOptions.find((o) => o.value === (field.sortDirection ?? ""))?.label ?? "None"}
									</Select.Trigger>
									<Select.Content>
										{#each sortOptions as opt (opt.value)}
											<Select.Item value={opt.value} class="text-xs">{opt.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						</Table.Cell>
						<Table.Cell class="p-1 align-middle">
							<div class="flex w-full justify-center">
								<Select.Root
									type="single"
									value={field.aggregation ?? ""}
									onValueChange={(val) =>
										updateField(i, {
											aggregation: val === "" ? undefined : (val as DatasetField["aggregation"]),
										})}
								>
									<Select.Trigger class="h-6 w-[80%] min-w-0 max-w-full justify-between text-xs">
										{aggregationOptions.find((o) => o.value === (field.aggregation ?? ""))?.label ?? "None"}
									</Select.Trigger>
									<Select.Content>
										{#each aggregationOptions as opt (opt.value)}
											<Select.Item value={opt.value} class="text-xs">{opt.label}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
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
						<Table.Cell colspan={7} class="py-6 text-center text-muted-foreground">
							Double-click columns on the canvas or drag them here to add fields
						</Table.Cell>
					</Table.Row>
				{/if}
			</Table.Body>
		</table>
	</div>
</div>
