<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Dialog from "$lib/components/shadcn-svelte/dialog";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import * as Table from "$lib/components/shadcn-svelte/table";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";

	let { data } = $props();

	let showCreateDialog = $state(false);
	let newDatasetName = $state("");
</script>

<div class="container mx-auto max-w-5xl py-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Datasets</h1>
			<p class="text-muted-foreground">Build and manage query definitions</p>
		</div>
		<Dialog.Root bind:open={showCreateDialog}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button size="sm" {...props}>
						<PlusIcon class="mr-2 size-4" />
						New Dataset
					</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Header>
					<Dialog.Title>Create Dataset</Dialog.Title>
					<Dialog.Description>Give your dataset a name to get started.</Dialog.Description>
				</Dialog.Header>
				<form method="POST" action="?/create" use:enhance>
					<div class="space-y-4 py-4">
						<Input name="name" placeholder="My Dataset" bind:value={newDatasetName} required />
					</div>
					<Dialog.Footer>
						<Button type="button" variant="outline" onclick={() => (showCreateDialog = false)}>Cancel</Button>
						<Button type="submit" disabled={!newDatasetName.trim()}>Create</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	{#if data.datasets.length === 0}
		<div class="flex flex-col items-center justify-center rounded-lg border py-16">
			<LayersIcon class="mb-4 size-12 text-muted-foreground/40" />
			<h3 class="mb-2 text-lg font-semibold text-muted-foreground">No datasets yet</h3>
			<p class="mb-4 text-sm text-muted-foreground">Create your first dataset to get started</p>
			<Button onclick={() => (showCreateDialog = true)}>
				<PlusIcon class="mr-2 size-4" />
				Create Dataset
			</Button>
		</div>
	{:else}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[200px]">Name</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head class="w-[80px]">Version</Table.Head>
					<Table.Head class="w-[100px]">Status</Table.Head>
					<Table.Head class="w-[140px]">Updated</Table.Head>
					<Table.Head class="w-[100px]"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.datasets as ds (ds.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{ds.name}</Table.Cell>
						<Table.Cell>
							{#if ds.description}
								<span class="line-clamp-1 text-xs">{ds.description}</span>
							{:else}
								<span class="text-xs text-muted-foreground/50">--</span>
							{/if}
						</Table.Cell>
						<Table.Cell>v{ds.version}</Table.Cell>
						<Table.Cell>
							<Badge variant={ds.is_active ? "default" : "secondary"} class="text-[10px]">
								{ds.is_active ? "Active" : "Inactive"}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							<span class="text-xs">{new Date(String(ds.updated_at)).toLocaleDateString()}</span>
						</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-1">
								<a href={resolve(`/app/datasets/${String(ds.id)}` as Pathname)}>
									<Button variant="outline" size="sm" class="h-7">
										<PencilIcon class="mr-1 size-3" />
										Edit
									</Button>
								</a>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={ds.id} />
									<Button variant="ghost" size="sm" type="submit" class="h-7 text-destructive hover:text-destructive">
										<TrashIcon class="size-3" />
									</Button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{/if}
</div>
