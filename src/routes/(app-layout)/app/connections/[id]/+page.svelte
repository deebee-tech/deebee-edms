<script lang="ts">
	import { enhance } from "$app/forms";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import * as Card from "$lib/components/ui/card";
	import * as Select from "$lib/components/ui/select";
	import SaveIcon from "@lucide/svelte/icons/save";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";

	let { data } = $props();

	let name = $state(data.connection.name);
	let description = $state(data.connection.description);
	let engine = $state(data.connection.engine);
	let host = $state(data.connection.config.host ?? "localhost");
	let port = $state(String(data.connection.config.port ?? 5432));
	let database = $state(data.connection.config.database ?? "");
	let username = $state(data.connection.config.username ?? "");
	let password = $state(data.connection.config.password ?? "");
	let schema = $state(data.connection.config.schema ?? "public");

	let saved = $state(false);

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
			<h1 class="text-lg font-semibold">{name}</h1>
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
						<Input id="edit-name" name="name" bind:value={name} required />
					</div>
					<div>
						<label for="edit-desc" class="mb-1 block text-sm font-medium">Description</label>
						<Textarea id="edit-desc" name="description" bind:value={description} rows={2} />
					</div>
					<div>
						<label for="edit-engine" class="mb-1 block text-sm font-medium">Engine</label>
						<input type="hidden" name="engine" value={engine} />
						<Select.Root type="single" bind:value={engine}>
							<Select.Trigger id="edit-engine" class="w-full">
								{engineOptions.find((e) => e.value === engine)?.label ?? "Select engine"}
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
							<Input id="edit-host" name="host" bind:value={host} />
						</div>
						<div>
							<label for="edit-port" class="mb-1 block text-sm font-medium">Port</label>
							<Input id="edit-port" name="port" type="number" bind:value={port} />
						</div>
					</div>
					<div>
						<label for="edit-database" class="mb-1 block text-sm font-medium">Database</label>
						<Input id="edit-database" name="database" bind:value={database} required />
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="edit-user" class="mb-1 block text-sm font-medium">Username</label>
							<Input id="edit-user" name="username" bind:value={username} />
						</div>
						<div>
							<label for="edit-pass" class="mb-1 block text-sm font-medium">Password</label>
							<Input id="edit-pass" name="password" type="password" bind:value={password} />
						</div>
					</div>
					<div>
						<label for="edit-schema" class="mb-1 block text-sm font-medium">Schema</label>
						<Input id="edit-schema" name="schema" bind:value={schema} />
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
