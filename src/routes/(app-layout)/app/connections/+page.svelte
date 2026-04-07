<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Dialog from "$lib/components/shadcn-svelte/dialog";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import * as Table from "$lib/components/shadcn-svelte/table";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";

	let { data } = $props();

	let showCreateDialog = $state(false);
	let newName = $state("");
	let newEngine = $state("postgres");
	let newHost = $state("localhost");
	let newPort = $state("5432");
	let newDatabase = $state("");
	let newUsername = $state("");
	let newPassword = $state("");
	let newSchema = $state("public");

	const engineOptions = [
		{ value: "postgres", label: "PostgreSQL" },
		{ value: "mysql", label: "MySQL" },
		{ value: "mssql", label: "SQL Server" },
		{ value: "sqlite", label: "SQLite" },
	];
</script>

<div class="container mx-auto max-w-5xl py-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Connections</h1>
			<p class="text-muted-foreground">Manage database connections</p>
		</div>
		<Dialog.Root bind:open={showCreateDialog}>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button size="sm" {...props}>
						<PlusIcon class="mr-2 size-4" />
						New Connection
					</Button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content class="max-w-lg">
				<Dialog.Header>
					<Dialog.Title>Create Connection</Dialog.Title>
					<Dialog.Description>Configure a new database connection.</Dialog.Description>
				</Dialog.Header>
				<form method="POST" action="?/create" use:enhance>
					<div class="space-y-4 py-4">
						<div>
							<label for="conn-name" class="mb-1 block text-sm font-medium">Name</label>
							<Input id="conn-name" name="name" placeholder="My Database" bind:value={newName} required />
						</div>
						<div>
							<label for="conn-engine" class="mb-1 block text-sm font-medium">Engine</label>
							<input type="hidden" name="engine" value={newEngine} />
							<Select.Root type="single" bind:value={newEngine}>
								<Select.Trigger id="conn-engine" class="w-full">
									{engineOptions.find((e) => e.value === newEngine)?.label ?? "Select engine"}
								</Select.Trigger>
								<Select.Content>
									{#each engineOptions as opt (opt.value)}
										<Select.Item value={opt.value}>{opt.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<div class="grid grid-cols-3 gap-3">
							<div class="col-span-2">
								<label for="conn-host" class="mb-1 block text-sm font-medium">Host</label>
								<Input id="conn-host" name="host" placeholder="localhost" bind:value={newHost} />
							</div>
							<div>
								<label for="conn-port" class="mb-1 block text-sm font-medium">Port</label>
								<Input id="conn-port" name="port" type="number" placeholder="5432" bind:value={newPort} />
							</div>
						</div>
						<div>
							<label for="conn-database" class="mb-1 block text-sm font-medium">Database</label>
							<Input id="conn-database" name="database" placeholder="my_database" bind:value={newDatabase} required />
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="conn-user" class="mb-1 block text-sm font-medium">Username</label>
								<Input id="conn-user" name="username" bind:value={newUsername} />
							</div>
							<div>
								<label for="conn-pass" class="mb-1 block text-sm font-medium">Password</label>
								<Input id="conn-pass" name="password" type="password" bind:value={newPassword} />
							</div>
						</div>
						<div>
							<label for="conn-schema" class="mb-1 block text-sm font-medium">Schema</label>
							<Input id="conn-schema" name="schema" placeholder="public" bind:value={newSchema} />
						</div>
					</div>
					<Dialog.Footer>
						<Button type="button" variant="outline" onclick={() => (showCreateDialog = false)}>Cancel</Button>
						<Button type="submit" disabled={!newName.trim() || !newDatabase.trim()}>Create</Button>
					</Dialog.Footer>
				</form>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	{#if data.connections.length === 0}
		<div class="flex flex-col items-center justify-center rounded-lg border py-16">
			<DatabaseIcon class="mb-4 size-12 text-muted-foreground/40" />
			<h3 class="mb-2 text-lg font-semibold text-muted-foreground">No connections yet</h3>
			<p class="mb-4 text-sm text-muted-foreground">Add a database connection to get started</p>
			<Button onclick={() => (showCreateDialog = true)}>
				<PlusIcon class="mr-2 size-4" />
				New Connection
			</Button>
		</div>
	{:else}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-[200px]">Name</Table.Head>
					<Table.Head>Description</Table.Head>
					<Table.Head class="w-[120px]">Engine</Table.Head>
					<Table.Head class="w-[100px]">Status</Table.Head>
					<Table.Head class="w-[140px]">Updated</Table.Head>
					<Table.Head class="w-[100px]"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each data.connections as conn (conn.id)}
					<Table.Row>
						<Table.Cell class="font-medium">{conn.name}</Table.Cell>
						<Table.Cell>
							{#if conn.description}
								<span class="line-clamp-1 text-xs">{conn.description}</span>
							{:else}
								<span class="text-xs text-muted-foreground/50">--</span>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<Badge variant="outline" class="text-[10px]">{conn.engine}</Badge>
						</Table.Cell>
						<Table.Cell>
							<Badge variant={conn.is_active ? "default" : "secondary"} class="text-[10px]">
								{conn.is_active ? "Active" : "Inactive"}
							</Badge>
						</Table.Cell>
						<Table.Cell>
							<span class="text-xs">{new Date(String(conn.updated_at)).toLocaleDateString()}</span>
						</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-1">
								<a href={resolve(`/app/connections/${String(conn.id)}` as Pathname)}>
									<Button variant="outline" size="sm" class="h-7">
										<PencilIcon class="mr-1 size-3" />
										Edit
									</Button>
								</a>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={conn.id} />
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
