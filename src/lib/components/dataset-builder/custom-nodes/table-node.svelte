<script lang="ts">
	import KeyIcon from "@lucide/svelte/icons/key";
	import LinkIcon from "@lucide/svelte/icons/link";
	import TableIcon from "@lucide/svelte/icons/table";
	import { Handle, Position, type NodeProps } from "@xyflow/svelte";
	import type { SchemaColumn, SchemaForeignKey } from "../types";

	let { data, id, selected }: NodeProps = $props();

	const tableName = $derived((data?.tableName as string) ?? "Table");
	const alias = $derived((data?.alias as string) ?? "");
	const columns = $derived((data?.columns as SchemaColumn[]) ?? []);
	const foreignKeys = $derived((data?.foreignKeys as SchemaForeignKey[]) ?? []);

	function isFk(colName: string): boolean {
		return foreignKeys.some((fk) => fk.columnName === colName);
	}

	function handleColumnDblClick(colName: string) {
		const onaddfield = data?.onaddfield as ((tableId: string, colName: string) => void) | undefined;
		onaddfield?.(id, colName);
	}
</script>

<div
	data-node-id={id}
	class="max-w-[280px] min-w-[200px] overflow-hidden rounded-lg border shadow-sm transition-shadow {selected
		? 'border-primary/50 shadow-md ring-2 ring-primary/50'
		: 'border-border shadow-sm'} bg-background"
>
	<div class="flex items-center gap-2 bg-blue-500 px-3 py-1.5 text-white">
		<TableIcon class="size-3.5 shrink-0" />
		<span class="truncate text-xs font-semibold">{tableName}</span>
		{#if alias && alias !== tableName}
			<span class="truncate text-[10px] opacity-75">({alias})</span>
		{/if}
	</div>

	<div class="max-h-[240px] overflow-y-auto">
		{#each columns as col, i (i)}
			<button
				class="flex w-full items-center gap-1.5 border-b border-border/30 px-3 py-1 text-left text-[11px] last:border-b-0 hover:bg-accent"
				ondblclick={() => handleColumnDblClick(col.name)}
				type="button"
			>
				{#if col.isPrimaryKey}
					<KeyIcon class="size-3 shrink-0 text-amber-500" />
				{:else if isFk(col.name)}
					<LinkIcon class="size-3 shrink-0 text-violet-500" />
				{:else}
					<span class="size-3 shrink-0"></span>
				{/if}
				<span class="flex-1 truncate font-medium">{col.name}</span>
				<span class="shrink-0 text-[9px] text-muted-foreground">{col.dataType}</span>
				<Handle
					type="source"
					position={Position.Right}
					id="col-{col.name}"
					class="h-2! w-2! border! border-background! bg-muted-foreground!"
					style="top: auto; right: -4px; position: absolute;"
				/>
				<Handle
					type="target"
					position={Position.Left}
					id="col-target-{col.name}"
					class="h-2! w-2! border! border-background! bg-muted-foreground!"
					style="top: auto; left: -4px; position: absolute;"
				/>
			</button>
		{/each}
	</div>
</div>
