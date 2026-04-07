<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { AppDataTable } from "$lib/components/data-table";
	import { createSupabaseProvider } from "$lib/components/data-table/providers/supabase-provider.js";
	import type { ColumnMeta } from "$lib/components/data-table/types.js";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { renderSnippet } from "$lib/components/shadcn-svelte/data-table";
	import * as Dialog from "$lib/components/shadcn-svelte/dialog";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import { supabase } from "$lib/database/supabase.client";
	import NetworkIcon from "@lucide/svelte/icons/network";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import { createColumnHelper } from "@tanstack/table-core";

	let { data } = $props();

	let showCreateDialog = $state(false);
	let newWorkflowName = $state("");

	interface WorkflowRow {
		[key: string]: unknown;
		id: string;
		name: string;
		description: string | null;
		version: number;
		is_active: boolean;
		created_at: string;
		updated_at: string;
	}

	const provider = createSupabaseProvider<WorkflowRow>({
		table: "workflows",
		columns: "id, name, description, version, is_active, created_at, updated_at",
		defaultSort: [{ column: "updated_at", ascending: false }],
		client: supabase,
	});

	const columnMeta: ColumnMeta[] = [
		{ key: "name", label: "Name", type: "text" },
		{ key: "description", label: "Description", type: "text" },
		{ key: "version", label: "Version", type: "number" },
		{ key: "is_active", label: "Status", type: "boolean" },
		{ key: "updated_at", label: "Updated", type: "date" },
	];

	const columnHelper = createColumnHelper<WorkflowRow>();

	const columnDefs = [
		columnHelper.accessor("name", {
			header: "Name",
			size: 200,
		}),
		columnHelper.accessor("description", {
			header: "Description",
			size: 280,
			cell: (info) => renderSnippet(descSnippet, { value: info.getValue() }),
		}),
		columnHelper.accessor("version", {
			header: "Version",
			size: 80,
			cell: (info) => `v${info.getValue()}`,
		}),
		columnHelper.accessor("is_active", {
			header: "Status",
			size: 100,
			cell: (info) => renderSnippet(statusSnippet, { value: info.getValue() }),
		}),
		columnHelper.accessor("updated_at", {
			header: "Updated",
			size: 140,
			cell: (info) => renderSnippet(dateSnippet, { value: info.getValue() }),
		}),
	];
</script>

{#snippet descSnippet({ value }: { value: string | null })}
	{#if value}
		<span class="line-clamp-1 text-xs">{value}</span>
	{:else}
		<span class="text-xs text-muted-foreground/50">--</span>
	{/if}
{/snippet}

{#snippet statusSnippet({ value }: { value: boolean })}
	<Badge variant={value ? "default" : "secondary"} class="text-[10px]">
		{value ? "Active" : "Inactive"}
	</Badge>
{/snippet}

{#snippet dateSnippet({ value }: { value: string })}
	<span class="text-xs">{new Date(value).toLocaleDateString()}</span>
{/snippet}

{#snippet actionsSnippet(row: WorkflowRow)}
	<div class="flex items-center gap-1">
		<a href={resolve(`/app/workflows/${String(row.id)}` as Pathname)}>
			<Button variant="outline" size="sm" class="h-7">
				<PencilIcon class="mr-1 size-3" />
				Edit
			</Button>
		</a>
		<form method="POST" action="?/delete" use:enhance>
			<input type="hidden" name="id" value={row.id} />
			<Button variant="ghost" size="sm" type="submit" class="h-7 text-destructive hover:text-destructive">
				<TrashIcon class="size-3" />
			</Button>
		</form>
	</div>
{/snippet}

{#snippet emptySnippet()}
	<div class="flex flex-col items-center justify-center py-16">
		<NetworkIcon class="mb-4 size-12 text-muted-foreground/40" />
		<h3 class="mb-2 text-lg font-semibold text-muted-foreground">No workflows yet</h3>
		<p class="mb-4 text-sm text-muted-foreground">Create your first workflow to get started</p>
		<Button onclick={() => (showCreateDialog = true)}>
			<PlusIcon class="mr-2 size-4" />
			Create Workflow
		</Button>
	</div>
{/snippet}

{#snippet toolbarSnippet()}
	<Dialog.Root bind:open={showCreateDialog}>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button size="sm" {...props}>
					<PlusIcon class="mr-2 size-4" />
					New Workflow
				</Button>
			{/snippet}
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Create Workflow</Dialog.Title>
				<Dialog.Description>Give your workflow a name to get started.</Dialog.Description>
			</Dialog.Header>
			<form method="POST" action="?/create" use:enhance>
				<div class="space-y-4 py-4">
					<Input name="name" placeholder="My Workflow" bind:value={newWorkflowName} required />
				</div>
				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (showCreateDialog = false)}>Cancel</Button>
					<Button type="submit" disabled={!newWorkflowName.trim()}>Create</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/snippet}

<div class="container mx-auto max-w-5xl py-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Workflows</h1>
		<p class="text-muted-foreground">Build and manage automated workflows</p>
	</div>

	<AppDataTable
		{provider}
		{columnDefs}
		{columnMeta}
		initialData={data.initialData as import("$lib/components/data-table/types.js").DataProviderResult<WorkflowRow>}
		pageSize={50}
		tableHeight="500px"
		actions={actionsSnippet}
		empty={emptySnippet}
		toolbar={toolbarSnippet}
	/>
</div>
