<script lang="ts">
	import {
		AuditLogViewer,
		fieldsChangedInEntry,
		isValidAuditLog,
		snapshotForEntry,
		type AuditLog,
		type AuditRecord,
	} from "$lib/components/audit-log-viewer";
	import { AppDataTable } from "$lib/components/data-table";
	import { createStaticProvider } from "$lib/components/data-table/providers/static-provider";
	import type { ColumnMeta } from "$lib/components/data-table/types";
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import * as Code from "$lib/components/shadcn-svelte/code";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import * as Tabs from "$lib/components/shadcn-svelte/tabs";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import HistoryIcon from "@lucide/svelte/icons/history";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import { createColumnHelper } from "@tanstack/table-core";
	import { untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import { sampleAuditLog } from "./sample-audit-log";

	let log = $state<AuditLog>(structuredClone(sampleAuditLog));
	let activeTab = $state("viewer");
	let importText = $state("");
	let importError = $state("");

	// "Live" working copy of the record. Staged-merge applies feed into this so
	// the testbed can prove the callback behaves correctly.
	function snapshotOfNewest(l: typeof log): AuditRecord {
		const newest = [...l.entries].sort((a, b) => b.changedAt.localeCompare(a.changedAt))[0];
		return newest ? { ...snapshotForEntry(newest) } : {};
	}

	let workingRecord = $state<AuditRecord>(untrack(() => snapshotOfNewest(log)));

	function resetToSample() {
		log = structuredClone(sampleAuditLog);
		workingRecord = snapshotOfNewest(log);
		toast.success("Reset to sample audit log.");
	}

	function resetWorkingRecord() {
		workingRecord = snapshotOfNewest(log);
		toast.success("Working record reset to latest snapshot.");
	}

	function loadFromJson() {
		importError = "";
		try {
			const parsed = JSON.parse(importText);
			if (!isValidAuditLog(parsed)) {
				importError =
					"Invalid audit log JSON: missing required fields (recordId, recordType, entries) or malformed entries.";
				return;
			}
			log = parsed;
			workingRecord = snapshotOfNewest(log);
			importText = "";
			activeTab = "viewer";
			toast.success("Audit log loaded.");
		} catch {
			importError = "Invalid JSON";
		}
	}

	function handleApplyMerged(record: AuditRecord, selections: Record<string, "left" | "right">) {
		workingRecord = { ...record };
		const count = Object.keys(selections).length;
		toast.success("Merged record applied", {
			description: `${count} explicit pick${count === 1 ? "" : "s"}; remaining fields took the right snapshot.`,
		});
	}

	const logJson = $derived(JSON.stringify(log, null, 2));
	const workingRecordJson = $derived(JSON.stringify(workingRecord, null, 2));

	// ── Activity table ──

	type ActivityRow = {
		id: string;
		changedAt: string;
		actor: string;
		action: string;
		fieldsChanged: number;
		reason: string;
	};

	const activityRows = $derived.by<ActivityRow[]>(() =>
		log.entries.map((e) => ({
			id: e.id,
			changedAt: e.changedAt,
			actor: e.changedBy.name,
			action: e.action,
			fieldsChanged: fieldsChangedInEntry(e),
			reason: e.reason ?? "",
		})),
	);

	const activityProvider = $derived(
		createStaticProvider(activityRows, {
			defaultSort: [{ column: "changedAt", ascending: false }],
		}),
	);

	const columnHelper = createColumnHelper<ActivityRow>();
	const activityColumnDefs = [
		columnHelper.accessor("changedAt", { header: "When", size: 200 }),
		columnHelper.accessor("actor", { header: "Actor", size: 200 }),
		columnHelper.accessor("action", { header: "Action", size: 110 }),
		columnHelper.accessor("fieldsChanged", { header: "Fields changed", size: 140 }),
		columnHelper.accessor("reason", { header: "Reason", size: 420 }),
	];

	const activityColumnMeta: ColumnMeta[] = [
		{ key: "changedAt", label: "When", type: "date" },
		{ key: "actor", label: "Actor", type: "text" },
		{ key: "action", label: "Action", type: "text" },
		{ key: "fieldsChanged", label: "Fields changed", type: "number" },
		{ key: "reason", label: "Reason", type: "text" },
	];
</script>

<div class="container mx-auto max-w-[1600px] py-6">
	<div class="mb-6 flex items-start justify-between gap-4">
		<div>
			<h1 class="flex items-center gap-2 text-2xl font-bold">
				<HistoryIcon class="size-6 text-muted-foreground" />
				Audit Log Viewer
			</h1>
			<p class="text-muted-foreground">
				Pick any two snapshots, see the colorized diff, then stage a per-field merge and apply it back to the record.
				JSON-first; ready to wire to the database layer later.
			</p>
		</div>
		<Button variant="outline" size="sm" onclick={resetToSample}>
			<RotateCcwIcon class="mr-2 size-3.5" />
			Reset to sample
		</Button>
	</div>

	<Tabs.Root bind:value={activeTab}>
		<Tabs.List>
			<Tabs.Trigger value="viewer">Viewer</Tabs.Trigger>
			<Tabs.Trigger value="activity">
				Activity
				<Badge variant="secondary" class="ml-2 px-1.5 text-[10px]">
					{log.entries.length.toLocaleString()}
				</Badge>
			</Tabs.Trigger>
			<Tabs.Trigger value="record">Current Record</Tabs.Trigger>
			<Tabs.Trigger value="json">JSON</Tabs.Trigger>
		</Tabs.List>

		<Tabs.Content value="viewer" class="mt-4">
			<div class="h-[calc(100vh-220px)] min-h-[600px]">
				<AuditLogViewer {log} onapplymerged={handleApplyMerged} />
			</div>
		</Tabs.Content>

		<Tabs.Content value="activity" class="mt-4">
			<Card.Root>
				<Card.Header>
					<Card.Title>All Changes</Card.Title>
					<Card.Description>
						Every entry in the audit trail, with an at-a-glance count of how many fields each one touched.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					{#key activityRows.length}
						<AppDataTable
							provider={activityProvider}
							columnDefs={activityColumnDefs}
							columnMeta={activityColumnMeta}
							syncUrl={false}
							pageSize={50}
							tableHeight="500px"
						/>
					{/key}
				</Card.Content>
			</Card.Root>
		</Tabs.Content>

		<Tabs.Content value="record" class="mt-4">
			<Card.Root>
				<Card.Header>
					<div class="flex items-start justify-between gap-3">
						<div>
							<Card.Title>Working Record</Card.Title>
							<Card.Description>
								This is the record the viewer's "Apply merged record" button writes to. In production this would be a
								row in your database; here we keep it in component state so you can watch the diff land.
							</Card.Description>
						</div>
						<div class="flex items-center gap-2">
							<CopyButton text={workingRecordJson} />
							<Button variant="outline" size="sm" onclick={resetWorkingRecord}>
								<RotateCcwIcon class="mr-2 size-3.5" />
								Reset record
							</Button>
						</div>
					</div>
				</Card.Header>
				<Card.Content>
					<Code.Root code={workingRecordJson} lang="json" hideLines class="max-h-[600px]" />
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
								<Card.Title>Audit Log (JSON)</Card.Title>
							</div>
							<CopyButton text={logJson} />
						</div>
						<Card.Description>
							This JSON is the complete audit trail for the record and can be stored in a database or file.
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<Code.Root code={logJson} lang="json" hideLines>
							<Code.CopyButton class="absolute top-2 right-2" />
						</Code.Root>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<div class="flex items-center gap-2">
							<UploadIcon class="size-4 text-muted-foreground" />
							<Card.Title>Load Audit Log</Card.Title>
						</div>
						<Card.Description>Paste an audit log JSON to load it into the viewer.</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<Textarea
								class="min-h-[300px] font-mono text-xs"
								placeholder="Paste audit log JSON here..."
								bind:value={importText}
							/>
							{#if importError}
								<p class="text-sm text-destructive">{importError}</p>
							{/if}
							<Button onclick={loadFromJson} disabled={!importText.trim()} class="w-full">
								<UploadIcon class="mr-2 size-4" />
								Load into Viewer
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</Tabs.Content>
	</Tabs.Root>
</div>
