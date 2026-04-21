<script lang="ts">
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Card from "$lib/components/shadcn-svelte/card";
	import { ScrollArea } from "$lib/components/shadcn-svelte/scroll-area";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import CheckCheckIcon from "@lucide/svelte/icons/check-check";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import GitCompareArrowsIcon from "@lucide/svelte/icons/git-compare-arrows";
	import HistoryIcon from "@lucide/svelte/icons/history";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import { SvelteMap } from "svelte/reactivity";
	import ChangePicker from "./change-picker.svelte";
	import { diffSnapshots, snapshotForEntry, sortEntriesNewestFirst, summarizeDiff } from "./diff-engine.js";
	import DiffRow from "./diff-row.svelte";
	import type { AuditLog, AuditRecord, FieldStatus } from "./types.js";

	type Side = "left" | "right";
	type Filter = "all" | "changes" | "added" | "removed";

	let {
		log,
		leftEntryId,
		rightEntryId,
		onapplymerged,
		onpickchange,
	}: {
		log: AuditLog;
		/** Optional override for the left (older) snapshot. Defaults to next-to-newest entry. */
		leftEntryId?: string;
		/** Optional override for the right (newer) snapshot. Defaults to newest entry. */
		rightEntryId?: string;
		onapplymerged?: (record: AuditRecord, selections: Record<string, Side>) => void;
		onpickchange?: (side: Side, entryId: string) => void;
	} = $props();

	const sortedEntries = $derived(sortEntriesNewestFirst(log.entries));

	const defaultRightId = $derived(sortedEntries[0]?.id);
	const defaultLeftId = $derived(sortedEntries[1]?.id ?? sortedEntries[0]?.id);

	let internalLeftId = $state<string | undefined>(undefined);
	let internalRightId = $state<string | undefined>(undefined);

	const effectiveLeftId = $derived(internalLeftId ?? leftEntryId ?? defaultLeftId);
	const effectiveRightId = $derived(internalRightId ?? rightEntryId ?? defaultRightId);

	const leftEntry = $derived(sortedEntries.find((e) => e.id === effectiveLeftId));
	const rightEntry = $derived(sortedEntries.find((e) => e.id === effectiveRightId));

	// `sortedEntries` is newest-first, so a higher index = older entry. Right
	// (newer) must always sit at an index <= left (older). Filter each picker's
	// options so an invalid pair can never be constructed.
	const leftIndex = $derived(sortedEntries.findIndex((e) => e.id === effectiveLeftId));
	const rightIndex = $derived(sortedEntries.findIndex((e) => e.id === effectiveRightId));
	const leftEligibleEntries = $derived(rightIndex >= 0 ? sortedEntries.slice(rightIndex) : sortedEntries);
	const rightEligibleEntries = $derived(leftIndex >= 0 ? sortedEntries.slice(0, leftIndex + 1) : sortedEntries);

	const leftSnapshot = $derived(leftEntry ? snapshotForEntry(leftEntry) : ({} as AuditRecord));
	const rightSnapshot = $derived(rightEntry ? snapshotForEntry(rightEntry) : ({} as AuditRecord));

	const diffs = $derived(diffSnapshots(leftSnapshot, rightSnapshot));
	const summary = $derived(summarizeDiff(diffs));

	let filter = $state<Filter>("all");

	// Per-field selections, keyed by field name. Reset when either side changes.
	let selections = $state(new SvelteMap<string, Side>());
	let lastPair = $state<string>("");
	$effect(() => {
		const pair = `${effectiveLeftId ?? ""}|${effectiveRightId ?? ""}`;
		if (pair !== lastPair) {
			lastPair = pair;
			selections.clear();
		}
	});

	const filteredDiffs = $derived.by(() => {
		switch (filter) {
			case "changes":
				return diffs.filter((d) => d.status !== "unchanged");
			case "added":
				return diffs.filter((d) => d.status === "added");
			case "removed":
				return diffs.filter((d) => d.status === "removed");
			default:
				return diffs;
		}
	});

	function pickSide(side: Side, entryId: string) {
		if (side === "left") internalLeftId = entryId;
		else internalRightId = entryId;
		onpickchange?.(side, entryId);
	}

	function handleSelect(field: string, source: Side) {
		if (selections.get(field) === source) {
			selections.delete(field);
		} else {
			selections.set(field, source);
		}
	}

	const mergedRecord = $derived.by(() => {
		const out: AuditRecord = {};
		for (const d of diffs) {
			const picked = selections.get(d.field);
			if (picked === "left") {
				if (d.left !== undefined) out[d.field] = d.left;
				continue;
			}
			if (picked === "right") {
				if (d.right !== undefined) out[d.field] = d.right;
				continue;
			}
			// No explicit pick → fall back to right (newer) snapshot.
			if (d.right !== undefined) out[d.field] = d.right;
			else if (d.left !== undefined) out[d.field] = d.left;
		}
		return out;
	});

	const selectionCount = $derived(selections.size);

	function applyMerged() {
		const snapshot: Record<string, Side> = {};
		for (const [k, v] of selections) snapshot[k] = v;
		onapplymerged?.(mergedRecord, snapshot);
	}

	function clearSelections() {
		selections.clear();
	}

	function selectAllFromSide(side: Side) {
		selections.clear();
		for (const d of diffs) {
			if (d.status === "unchanged") continue;
			const value = side === "left" ? d.left : d.right;
			if (value === undefined) continue;
			selections.set(d.field, side);
		}
	}

	const filterChips: { id: Filter; label: string; count: number; status: FieldStatus | "all" }[] = $derived([
		{ id: "all", label: "All fields", count: diffs.length, status: "all" },
		{ id: "changes", label: "Changed", count: summary.totalChanges, status: "changed" },
		{ id: "added", label: "Added", count: summary.added, status: "added" },
		{ id: "removed", label: "Removed", count: summary.removed, status: "removed" },
	]);

	const filterChipColors: Record<FieldStatus | "all", string> = {
		all: "data-[active=true]:bg-foreground/85 data-[active=true]:text-background",
		changed: "data-[active=true]:bg-amber-500 data-[active=true]:text-amber-50",
		added: "data-[active=true]:bg-emerald-500 data-[active=true]:text-emerald-50",
		removed: "data-[active=true]:bg-rose-500 data-[active=true]:text-rose-50",
		unchanged: "",
	};

	function shortLabel(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		const pad = (n: number) => n.toString().padStart(2, "0");
		return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}
</script>

<Card.Root size="sm" class="flex h-full min-h-0 flex-col">
	<Card.Header class="gap-2 border-b">
		<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
			<div class="flex items-center gap-1.5">
				<HistoryIcon class="size-3.5 text-muted-foreground" />
				<Card.Title class="text-sm">Audit Trail</Card.Title>
				<span class="text-xs text-muted-foreground">
					· {sortedEntries.length.toLocaleString()} change{sortedEntries.length === 1 ? "" : "s"} ·
					<span class="font-mono text-[11px]">{log.recordType}/{log.recordId}</span>
				</span>
			</div>
			<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
				<Badge variant="outline" class="border-amber-500/40 text-[10px] uppercase">
					{summary.changed} changed
				</Badge>
				<Badge variant="outline" class="border-emerald-500/40 text-[10px] uppercase">
					{summary.added} added
				</Badge>
				<Badge variant="outline" class="border-rose-500/40 text-[10px] uppercase">
					{summary.removed} removed
				</Badge>
			</div>
		</div>

		<!-- Pickers -->
		<div class="grid items-start gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
			<ChangePicker
				entries={leftEligibleEntries}
				value={effectiveLeftId}
				side="left"
				onpick={(id) => pickSide("left", id)}
			/>

			<div
				class="flex h-full items-center justify-center pt-7 text-muted-foreground"
				aria-hidden="true"
				title="Right (newer) compared to left (older)"
			>
				<GitCompareArrowsIcon class="size-4" />
			</div>

			<ChangePicker
				entries={rightEligibleEntries}
				value={effectiveRightId}
				side="right"
				onpick={(id) => pickSide("right", id)}
			/>
		</div>

		<!-- Filter chips -->
		<div class="flex flex-wrap items-center gap-1">
			{#each filterChips as chip (chip.id)}
				<button
					type="button"
					class={[
						"group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
						"bg-background text-muted-foreground hover:text-foreground",
						filterChipColors[chip.status],
					]}
					data-active={filter === chip.id}
					onclick={() => (filter = chip.id)}
					aria-pressed={filter === chip.id}
				>
					{chip.label}
					<span
						class="rounded-full bg-muted px-1.5 text-[10px] tabular-nums group-data-[active=true]:bg-background/40 group-data-[active=true]:text-foreground"
					>
						{chip.count.toLocaleString()}
					</span>
				</button>
			{/each}
		</div>
	</Card.Header>

	<Card.Content class="flex min-h-0 flex-1 flex-col gap-0 p-0">
		<!-- Column headers -->
		<div
			class="grid items-center gap-0 border-b bg-muted/30 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
			style="grid-template-columns: 200px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);"
		>
			<div class="border-r px-2.5 py-1.5">Field</div>
			<div class="flex items-center justify-between border-r px-2.5 py-1.5">
				<span class="truncate">Left {leftEntry ? `· ${shortLabel(leftEntry.changedAt)}` : ""}</span>
				{#if summary.totalChanges > 0}
					<button
						type="button"
						class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase hover:bg-muted hover:text-foreground"
						onclick={() => selectAllFromSide("left")}
						title="Select all changed fields from the left side"
					>
						Use all ←
					</button>
				{/if}
			</div>
			<div class="flex items-center justify-between border-r px-2.5 py-1.5">
				<span class="truncate">Right {rightEntry ? `· ${shortLabel(rightEntry.changedAt)}` : ""}</span>
				{#if summary.totalChanges > 0}
					<button
						type="button"
						class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase hover:bg-muted hover:text-foreground"
						onclick={() => selectAllFromSide("right")}
						title="Select all changed fields from the right side"
					>
						Use all →
					</button>
				{/if}
			</div>
			<div class="flex items-center justify-between bg-muted/40 px-2.5 py-1.5">
				<span>Merged · result</span>
				{#if selectionCount > 0}
					<button
						type="button"
						class="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase hover:bg-muted hover:text-foreground"
						onclick={clearSelections}
						title="Reset all explicit picks (each field falls back to right)"
					>
						Reset
					</button>
				{/if}
			</div>
		</div>

		<!-- Diff rows -->
		<ScrollArea class="min-h-0 flex-1">
			{#if filteredDiffs.length === 0}
				<div class="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-12 text-center">
					<EyeIcon class="size-6 text-muted-foreground/50" />
					<p class="text-sm text-muted-foreground">
						{#if diffs.length === 0}
							Nothing to compare yet. Pick two changes above.
						{:else}
							No fields match the current filter.
						{/if}
					</p>
				</div>
			{:else}
				{#each filteredDiffs as diff (diff.field)}
					<DiffRow
						{diff}
						selection={selections.get(diff.field)}
						onselect={(source) => handleSelect(diff.field, source)}
					/>
				{/each}
			{/if}
		</ScrollArea>

		<div class="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2">
			<div class="flex items-center gap-1.5 text-xs">
				<LayersIcon class="size-3.5 text-muted-foreground" />
				<span class="font-medium">
					{selectionCount} explicit pick{selectionCount === 1 ? "" : "s"}
				</span>
				<span class="text-muted-foreground">· rest default to right</span>
			</div>
			<div class="flex items-center gap-1.5">
				<Button
					variant="outline"
					size="sm"
					class="h-7 gap-1 px-2.5 text-[11px]"
					onclick={clearSelections}
					disabled={selectionCount === 0}
				>
					<RotateCcwIcon class="size-3" />
					Clear
				</Button>
				<Button size="sm" class="h-7 gap-1 px-2.5 text-[11px]" onclick={applyMerged} disabled={!onapplymerged}>
					<CheckCheckIcon class="size-3" />
					Apply merged record
					<ArrowRightIcon class="size-3" />
				</Button>
			</div>
		</div>
	</Card.Content>
</Card.Root>
