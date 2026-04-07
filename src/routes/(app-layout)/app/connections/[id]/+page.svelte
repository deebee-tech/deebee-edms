<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import SaveIcon from "@lucide/svelte/icons/save";

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let form = $state({
		name: data.connection.name,
		description: data.connection.description,
		engine: data.connection.engine,
		host: data.connection.config.host ?? "localhost",
		port: String(data.connection.config.port ?? 5432),
		database: data.connection.config.database ?? "",
		username: data.connection.config.username ?? "",
		password: data.connection.config.password ?? "",
		schema: data.connection.config.schema ?? "public",
	});

	let saved = $state(false);

	let lastSyncedConnectionId: string | null = null;

	$effect.pre(() => {
		const id = data.connection.id;
		if (lastSyncedConnectionId === id) return;
		lastSyncedConnectionId = id;
		const c = data.connection;
		const cfg = c.config;
		form = {
			name: c.name,
			description: c.description,
			engine: c.engine,
			host: cfg.host ?? "localhost",
			port: String(cfg.port ?? 5432),
			database: cfg.database ?? "",
			username: cfg.username ?? "",
			password: cfg.password ?? "",
			schema: cfg.schema ?? "public",
		};
		saved = false;
	});

	const engineOptions = [
		{ value: "postgres", label: "PostgreSQL" },
		{ value: "mysql", label: "MySQL" },
		{ value: "mssql", label: "SQL Server" },
		{ value: "sqlite", label: "SQLite" },
	];
</script>

<div class="container mx-auto max-w-3xl py-6">
	<div class="mb-6 flex items-center gap-3">
		<a href={resolve("/app/connections" as Pathname)}>
			<Button variant="ghost" size="icon" class="size-8">
				<ArrowLeftIcon class="size-4" />
			</Button>
		</a>
		<div>
			<h1 class="text-lg font-semibold">{form.name}</h1>
			<p class="text-xs text-muted-foreground">
				{saved ? "All changes saved" : "Edit connection details"}
			</p>
		</div>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title>Connection Settings</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === "success") saved = true;
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="edit-name" class="mb-1 block text-sm font-medium">Name</label>
						<Input id="edit-name" name="name" bind:value={form.name} required />
					</div>
					<div>
						<label for="edit-desc" class="mb-1 block text-sm font-medium">Description</label>
						<Textarea id="edit-desc" name="description" bind:value={form.description} rows={2} />
					</div>
					<div>
						<label for="edit-engine" class="mb-1 block text-sm font-medium">Engine</label>
						<input type="hidden" name="engine" value={form.engine} />
						<Select.Root type="single" bind:value={form.engine}>
							<Select.Trigger id="edit-engine" class="w-full">
								{engineOptions.find((e) => e.value === form.engine)?.label ?? "Select engine"}
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
							<label for="edit-host" class="mb-1 block text-sm font-medium">Host</label>
							<Input id="edit-host" name="host" bind:value={form.host} />
						</div>
						<div>
							<label for="edit-port" class="mb-1 block text-sm font-medium">Port</label>
							<Input id="edit-port" name="port" type="number" bind:value={form.port} />
						</div>
					</div>
					<div>
						<label for="edit-database" class="mb-1 block text-sm font-medium">Database</label>
						<Input id="edit-database" name="database" bind:value={form.database} required />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-user" class="mb-1 block text-sm font-medium">Username</label>
							<Input id="edit-user" name="username" bind:value={form.username} />
						</div>
						<div>
							<label for="edit-pass" class="mb-1 block text-sm font-medium">Password</label>
							<Input id="edit-pass" name="password" type="password" bind:value={form.password} />
						</div>
					</div>
					<div>
						<label for="edit-schema" class="mb-1 block text-sm font-medium">Schema</label>
						<Input id="edit-schema" name="schema" bind:value={form.schema} />
					</div>
				</div>
				<div class="mt-6 flex justify-end">
					<Button type="submit">
						<SaveIcon class="mr-2 size-3.5" />
						Save
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
