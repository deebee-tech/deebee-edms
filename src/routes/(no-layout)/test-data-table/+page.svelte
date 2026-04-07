<script lang="ts">
	import { AppDataTable } from "$lib/components/data-table";
	import { createApiProvider, sveltekitPreset } from "$lib/components/data-table/providers/api-provider.js";
	import { createStaticProvider } from "$lib/components/data-table/providers/static-provider.js";
	import type { ColumnMeta } from "$lib/components/data-table/types.js";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { renderSnippet } from "$lib/components/shadcn-svelte/data-table";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import CodeIcon from "@lucide/svelte/icons/code";
	import { createColumnHelper } from "@tanstack/table-core";
	import { generateEmployees, type Employee } from "./sample-data.js";

	const employees = generateEmployees(500);

	const columnHelper = createColumnHelper<Employee>();

	const columnMeta: ColumnMeta[] = [
		{ key: "id", label: "ID", type: "number" },
		{ key: "name", label: "Name", type: "text" },
		{ key: "email", label: "Email", type: "text" },
		{ key: "department", label: "Department", type: "text" },
		{ key: "salary", label: "Salary", type: "number" },
		{ key: "hireDate", label: "Hire Date", type: "date" },
		{ key: "isActive", label: "Active", type: "boolean" },
		{ key: "notes", label: "Notes", type: "text" },
	];

	const columnDefs = [
		columnHelper.accessor("id", {
			header: "ID",
			size: 60,
		}),
		columnHelper.accessor("name", {
			header: "Name",
			size: 180,
		}),
		columnHelper.accessor("email", {
			header: "Email",
			size: 240,
		}),
		columnHelper.accessor("department", {
			header: "Department",
			size: 130,
		}),
		columnHelper.accessor("salary", {
			header: "Salary",
			cell: (info) => renderSnippet(salarySnippet, { value: info.getValue() }),
			size: 110,
		}),
		columnHelper.accessor("hireDate", {
			header: "Hire Date",
			size: 120,
		}),
		columnHelper.accessor("isActive", {
			header: "Active",
			cell: (info) => renderSnippet(activeSnippet, { value: info.getValue() }),
			size: 80,
		}),
		columnHelper.accessor("notes", {
			header: "Notes",
			size: 220,
			cell: (info) => renderSnippet(notesSnippet, { value: info.getValue() }),
		}),
	];

	// ── Providers ──

	const staticProvider = createStaticProvider<Employee>(employees, {
		defaultSort: [{ column: "id", ascending: true }],
	});

	const apiProvider = createApiProvider<Employee>({
		...sveltekitPreset<Employee>("/test-data-table"),
	});

	const sqlEasyApiProvider = createApiProvider<Employee>({
		endpoint: "/test-data-table?mode=sqleasy",
		method: "POST",
		mapParams: (params) => ({
			filters: params.filters,
			filterGroups: params.filterGroups,
			sort: params.sort,
			offset: params.offset,
			limit: params.limit,
		}),
		mapResponse: (json) => {
			const data = json as {
				rows: Employee[];
				totalCount: number;
				hasMore: boolean;
				_sql?: { dataSql: string; countSql: string };
			};
			if (data._sql) {
				latestSql = data._sql;
			}
			return {
				rows: data.rows ?? [],
				totalCount: data.totalCount ?? 0,
				hasMore: data.hasMore ?? false,
			};
		},
	});

	let latestSql = $state<{ dataSql: string; countSql: string } | null>(null);
</script>

{#snippet salarySnippet({ value }: { value: number })}
	<span class="font-mono text-xs">${value.toLocaleString()}</span>
{/snippet}

{#snippet activeSnippet({ value }: { value: boolean })}
	<Badge variant={value ? "default" : "secondary"} class="text-[10px]">
		{value ? "Active" : "Inactive"}
	</Badge>
{/snippet}

{#snippet notesSnippet({ value }: { value: string | null })}
	{#if value}
		<span class="text-xs">{value}</span>
	{:else}
		<span class="text-xs text-muted-foreground/50">--</span>
	{/if}
{/snippet}

<div class="container mx-auto max-w-7xl py-6">
	<div class="mb-6">
		<h1 class="text-2xl font-bold">Data Table Demo</h1>
		<p class="text-muted-foreground">
			500 randomly generated employee records across three provider types. Try sorting columns, applying per-column
			filters, and using the filter builder.
		</p>
	</div>

	<Tabs.Root value="static">
		<Tabs.List class="mb-4">
			<Tabs.Trigger value="static">Static Provider</Tabs.Trigger>
			<Tabs.Trigger value="api">API Provider</Tabs.Trigger>
			<Tabs.Trigger value="sqleasy">SQLEasy Provider</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="static">
			<div class="mb-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950">
				<strong>Static Provider</strong> &mdash; All 500 rows loaded in memory. Filtering, sorting, and pagination happen
				client-side in JavaScript.
			</div>
			<AppDataTable provider={staticProvider} {columnDefs} {columnMeta} syncUrl={false} pageSize={50} />
		</Tabs.Content>

		<Tabs.Content value="api">
			<div
				class="mb-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950"
			>
				<strong>API Provider</strong> &mdash; Uses <code>createApiProvider</code> with the <code>sveltekitPreset</code>
				to fetch from a local <code>+server.ts</code> endpoint via POST. Filters, sort, and pagination are sent as JSON.
			</div>
			<AppDataTable provider={apiProvider} {columnDefs} {columnMeta} syncUrl={false} pageSize={50} />
		</Tabs.Content>

		<Tabs.Content value="sqleasy">
			<div
				class="mb-3 rounded-md border border-purple-200 bg-purple-50 p-3 text-sm dark:border-purple-900 dark:bg-purple-950"
			>
				<strong>SQLEasy Provider</strong> &mdash; Same API endpoint, but also returns the SQL that
				<code>PostgresSqlEasy</code> would generate for each query. Data is still served from the in-memory array (no real
				DB), but the SQL shown below is exactly what would run against PostgreSQL.
			</div>

			<AppDataTable provider={sqlEasyApiProvider} {columnDefs} {columnMeta} syncUrl={false} pageSize={50} />

			{#if latestSql}
				<div class="mt-4 rounded-md border bg-muted/50 p-4">
					<div class="mb-2 flex items-center gap-2 text-sm font-medium">
						<CodeIcon class="size-4" />
						Generated SQL (PostgreSQL)
					</div>
					<div class="space-y-3">
						<div>
							<p class="mb-1 text-xs font-medium text-muted-foreground">Data Query:</p>
							<pre class="overflow-x-auto rounded bg-background p-3 text-xs">{latestSql.dataSql}</pre>
						</div>
						<div>
							<p class="mb-1 text-xs font-medium text-muted-foreground">Count Query:</p>
							<pre class="overflow-x-auto rounded bg-background p-3 text-xs">{latestSql.countSql}</pre>
						</div>
					</div>
				</div>
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
