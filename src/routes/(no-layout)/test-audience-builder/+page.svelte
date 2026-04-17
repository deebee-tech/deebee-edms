<script lang="ts">
	import {
		AudienceBuilder,
		audienceSummary,
		evaluateAudience,
		generateAudienceSql,
		isValidAudienceDefinition,
		SUPPORTED_DB_ENGINES,
		type AudienceDefinition,
		type DbEngine,
	} from "$lib/components/audience-builder";
	import { AppDataTable } from "$lib/components/data-table";
	import { createStaticProvider } from "$lib/components/data-table/providers/static-provider";
	import type { ColumnMeta } from "$lib/components/data-table/types";
	import { formatDisplaySql } from "$lib/format-display-sql";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import * as Code from "$lib/components/shadcn-svelte/code";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import UsersIcon from "@lucide/svelte/icons/users";
	import { createColumnHelper } from "@tanstack/table-core";
	import { SvelteMap } from "svelte/reactivity";
	import { sampleAudienceDefinition } from "./sample-audience-definition";
	import { generatePopulation, sampleCatalog, type Person } from "./sample-data";

	const population = generatePopulation(500);

	let definition = $state<AudienceDefinition>(structuredClone(sampleAudienceDefinition));
	let activeTab = $state("builder");
	let importText = $state("");
	let importError = $state("");
	let sqlEngine = $state<DbEngine>("postgres");

	const matchedPeople = $derived(evaluateAudience(definition, population.people, population.objectTags));
	const summary = $derived(audienceSummary(definition, sampleCatalog, population.people, population.objectTags));
	const generatedSql = $derived(generateAudienceSql(definition, sampleCatalog, { engine: sqlEngine }));
	const formattedAudienceSql = $derived(formatDisplaySql(generatedSql.sql, generatedSql.engine));
	const formattedAudienceRawSql = $derived(formatDisplaySql(generatedSql.rawSql, generatedSql.engine));

	const engineLabels: Record<DbEngine, string> = {
		postgres: "PostgreSQL",
		mysql: "MySQL",
		mssql: "Microsoft SQL Server",
		sqlite: "SQLite",
	};

	const definitionJson = $derived(JSON.stringify(definition, null, 2));

	const tagTypeNameById = $derived.by(() => {
		const m = new SvelteMap<string, string>();
		for (const tt of sampleCatalog.tagTypes) m.set(tt.id, tt.name);
		return m;
	});

	function handleDefinitionChange(updated: AudienceDefinition) {
		definition = updated;
	}

	function loadDefinitionFromJson() {
		importError = "";
		try {
			const parsed = JSON.parse(importText);
			if (!isValidAudienceDefinition(parsed)) {
				importError =
					"Invalid audience JSON: missing required fields (id, name, version, objectType, groups) or malformed conditions.";
				return;
			}
			definition = parsed;
			importText = "";
			activeTab = "builder";
		} catch {
			importError = "Invalid JSON";
		}
	}

	function resetToSample() {
		definition = structuredClone(sampleAudienceDefinition);
	}

	// ── Data table for matched people ──

	const columnHelper = createColumnHelper<Person>();
	const columnMeta: ColumnMeta[] = [
		{ key: "id", label: "ID", type: "text" },
		{ key: "name", label: "Name", type: "text" },
		{ key: "email", label: "Email", type: "text" },
		{ key: "city", label: "City", type: "text" },
		{ key: "signupDate", label: "Signup", type: "date" },
		{ key: "tagSummary", label: "Tags", type: "text", filterable: false, sortable: false },
	];

	const peopleWithTags = $derived.by(() => {
		const tagsByPerson = new SvelteMap<string, string[]>();
		for (const link of population.objectTags) {
			if (link.objectType !== definition.objectType) continue;
			const arr = tagsByPerson.get(link.objectId) ?? [];
			arr.push(link.tagId);
			tagsByPerson.set(link.objectId, arr);
		}
		const tagLabel = new SvelteMap<string, string>();
		for (const t of sampleCatalog.tags) tagLabel.set(t.id, t.label);
		return matchedPeople.map((p) => ({
			...p,
			tagSummary: (tagsByPerson.get(p.id) ?? [])
				.map((id) => tagLabel.get(id) ?? id)
				.sort()
				.join(", "),
		}));
	});

	const peopleProvider = $derived(
		createStaticProvider(peopleWithTags, {
			defaultSort: [{ column: "name", ascending: true }],
		}),
	);

	const columnDefs = [
		columnHelper.accessor("id", { header: "ID", size: 80 }),
		columnHelper.accessor("name", { header: "Name", size: 180 }),
		columnHelper.accessor("email", { header: "Email", size: 240 }),
		columnHelper.accessor("city", { header: "City", size: 120 }),
		columnHelper.accessor("signupDate", { header: "Signup", size: 110 }),
		columnHelper.accessor((row) => (row as Person & { tagSummary: string }).tagSummary, {
			id: "tagSummary",
			header: "Tags",
			size: 360,
		}),
	];
</script>

<div class="container mx-auto max-w-[1600px] py-6">
	<div class="mb-6 flex items-start justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold">Audience Builder</h1>
			<p class="text-muted-foreground">
				Compose tag-based <span class="font-medium">HAS</span> / <span class="font-medium">HAS NOT</span> conditions across
				any tag-type, with AND/OR groups. JSON-first; ready to wire to Supabase later.
			</p>
		</div>
		<Button variant="outline" size="sm" onclick={resetToSample}>
			<RotateCcwIcon class="mr-2 size-3.5" />
			Reset to sample
		</Button>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="builder">Builder</Tabs.Trigger>
			<Tabs.Trigger value="people">
				People
				<Badge variant="secondary" class="ml-2 px-1.5 text-[10px]">
					{summary.matchedCount.toLocaleString()}
				</Badge>
			</Tabs.Trigger>
			<Tabs.Trigger value="sql">SQL</Tabs.Trigger>
			<Tabs.Trigger value="json">JSON</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="builder" class="mt-4">
			<div class="h-[calc(100vh-220px)] min-h-[600px]">
				<AudienceBuilder
					{definition}
					catalog={sampleCatalog}
					matchedCount={summary.matchedCount}
					totalCount={summary.totalPopulation}
					ondefinitionchange={handleDefinitionChange}
				/>
			</div>
		</Tabs.Content>

		<Tabs.Content value="people" class="mt-4 space-y-4">
			<div class="grid gap-4 md:grid-cols-3">
				<Card.Root class="md:col-span-1">
					<Card.Header>
						<div class="flex items-center gap-2">
							<UsersIcon class="size-4 text-muted-foreground" />
							<Card.Title>Audience Size</Card.Title>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="flex items-baseline gap-2">
							<span class="text-4xl font-bold">{summary.matchedCount.toLocaleString()}</span>
							<span class="text-sm text-muted-foreground">
								/ {summary.totalPopulation.toLocaleString()}
							</span>
						</div>
						<div class="mt-1 text-xs text-muted-foreground">
							{summary.matchedPct.toFixed(1)}% of population
						</div>
						<div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
							<div class="h-full rounded-full bg-primary transition-all" style="width: {summary.matchedPct}%"></div>
						</div>
					</Card.Content>
				</Card.Root>

				<Card.Root class="md:col-span-1">
					<Card.Header>
						<div class="flex items-center gap-2">
							<SparklesIcon class="size-4 text-muted-foreground" />
							<Card.Title>Per-Group Reach</Card.Title>
						</div>
						<Card.Description>How many people each OR-group would match on its own.</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2">
						{#each summary.perGroupCounts as g, gi (g.groupId)}
							{@const max = Math.max(...summary.perGroupCounts.map((x) => x.count), 1)}
							{@const pct = Math.round((g.count / max) * 100)}
							{@const groupName = definition.groups.find((grp) => grp.id === g.groupId)?.name?.trim()}
							<div>
								<div class="flex items-center justify-between gap-2 text-xs">
									<span class="truncate font-medium">{groupName || `Group ${gi + 1}`}</span>
									<span class="shrink-0 text-muted-foreground">{g.count.toLocaleString()}</span>
								</div>
								<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full bg-blue-500/70" style="width: {pct}%"></div>
								</div>
							</div>
						{:else}
							<p class="text-xs text-muted-foreground">No groups defined.</p>
						{/each}
					</Card.Content>
				</Card.Root>

				<Card.Root class="md:col-span-1">
					<Card.Header>
						<Card.Title>Tag-Type Coverage</Card.Title>
						<Card.Description>How many matched people own at least one tag of each type.</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-1.5">
						{#each summary.perTagTypeCounts as t (t.tagTypeId)}
							{@const max = summary.matchedCount || 1}
							{@const pct = Math.round((t.count / max) * 100)}
							<div>
								<div class="flex items-center justify-between text-xs">
									<span class="truncate">{tagTypeNameById.get(t.tagTypeId) ?? t.tagTypeId}</span>
									<span class="text-muted-foreground">{t.count.toLocaleString()}</span>
								</div>
								<div class="mt-0.5 h-1 overflow-hidden rounded-full bg-muted">
									<div class="h-full rounded-full bg-emerald-500/70" style="width: {pct}%"></div>
								</div>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>
			</div>

			<Card.Root>
				<Card.Header>
					<Card.Title>Matching People</Card.Title>
					<Card.Description>
						Live results from the in-memory engine. Sort, filter, and paginate as you would any data table.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#key peopleWithTags.length}
						<AppDataTable
							provider={peopleProvider}
							{columnDefs}
							{columnMeta}
							syncUrl={false}
							pageSize={50}
							tableHeight="500px"
						/>
					{/key}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="sql" class="mt-4">
			<Card.Root>
				<Card.Header>
					<div class="flex flex-wrap items-center justify-between gap-3">
						<div>
							<Card.Title>Generated SQL</Card.Title>
							<Card.Description>
								Built live by driving the
								<a
									href="https://github.com/deebee-tech/sqleasy"
									class="font-medium underline-offset-2 hover:underline"
									target="_blank"
									rel="noreferrer noopener"
								>
									SQLEasy
								</a>
								query builder, so the same audience definition compiles to the right dialect for whichever database you point
								it at.
							</Card.Description>
						</div>
						<div class="flex items-center gap-2">
							<span class="text-xs text-muted-foreground">Dialect</span>
							<Select.Root type="single" bind:value={() => sqlEngine, (v) => (sqlEngine = v as DbEngine)}>
								<Select.Trigger class="w-[200px]">
									{engineLabels[sqlEngine]}
								</Select.Trigger>
								<Select.Content>
									{#each SUPPORTED_DB_ENGINES as engine (engine)}
										<Select.Item value={engine}>{engineLabels[engine]}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div>
						<div class="mb-2 flex items-center justify-between">
							<div class="text-xs font-medium text-muted-foreground">Prepared (placeholders, ready for execution)</div>
							<CopyButton text={generatedSql.sql} />
						</div>
						<div class="relative min-h-[min(16rem,40vh)] overflow-hidden rounded-lg border">
							<Code.Root code={formattedAudienceSql} lang="sql" hideLines class="max-h-[min(24rem,50vh)] border-0" />
						</div>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between">
							<div class="text-xs font-medium text-muted-foreground">
								Raw (values inlined &mdash; debug-friendly, not safe to execute)
							</div>
							<CopyButton text={generatedSql.rawSql} />
						</div>
						<div class="relative min-h-[min(16rem,40vh)] overflow-hidden rounded-lg border">
							<Code.Root
								code={formattedAudienceRawSql}
								lang="sql"
								hideLines
								class="max-h-[min(24rem,50vh)] border-0"
							/>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="json" class="mt-4">
			<div class="grid gap-4 lg:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<DownloadIcon class="size-4 text-muted-foreground" />
								<Card.Title>Audience Definition (JSON)</Card.Title>
							</div>
							<CopyButton text={definitionJson} />
						</div>
						<Card.Description>
							This JSON defines the complete audience and can be stored in a database or file.
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<Code.Root code={definitionJson} lang="json" hideLines>
							<Code.CopyButton class="absolute top-2 right-2" />
						</Code.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<div class="flex items-center gap-2">
							<UploadIcon class="size-4 text-muted-foreground" />
							<Card.Title>Load Audience Definition</Card.Title>
						</div>
						<Card.Description>Paste an audience definition JSON to load it into the builder.</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Textarea
								class="min-h-[300px] font-mono text-xs"
								placeholder="Paste audience definition JSON here..."
								bind:value={importText}
							/>
							{#if importError}
								<p class="text-sm text-destructive">{importError}</p>
							{/if}
							<Button onclick={loadDefinitionFromJson} disabled={!importText.trim()} class="w-full">
								<UploadIcon class="mr-2 size-4" />
								Load into Builder
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
