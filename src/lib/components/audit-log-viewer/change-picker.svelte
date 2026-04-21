<script lang="ts">
	import * as Select from "$lib/components/shadcn-svelte/select";
	import type { AuditAction, AuditLogEntry } from "./types.js";

	let {
		entries,
		value,
		side,
		onpick,
	}: {
		/** Already sorted newest-first by the parent. */
		entries: AuditLogEntry[];
		value: string | undefined;
		side: "left" | "right";
		onpick: (entryId: string) => void;
	} = $props();

	const sideLabels = {
		left: "From (older)",
		right: "To (newer)",
	};

	const actionDotClasses: Record<AuditAction, string> = {
		create: "bg-emerald-500",
		update: "bg-sky-500",
		delete: "bg-rose-500",
	};

	const actionLabels: Record<AuditAction, string> = {
		create: "Created record",
		update: "Updated fields",
		delete: "Deleted record",
	};

	const selectedEntry = $derived(entries.find((e) => e.id === value));

	function handleChange(next: string | undefined) {
		if (next) onpick(next);
	}

	function timeLabel(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
	}

	function shortDate(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		const pad = (n: number) => n.toString().padStart(2, "0");
		return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
	}

	function detailLine(entry: AuditLogEntry): string {
		return entry.reason ?? actionLabels[entry.action];
	}
</script>

<div class="flex min-w-0 flex-col gap-0.5">
	<span class="px-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
		{sideLabels[side]}
	</span>

	<Select.Root type="single" value={value ?? ""} onValueChange={handleChange}>
		<Select.Trigger class="w-full justify-between gap-2 text-left">
			{#if selectedEntry}
				<span class="flex min-w-0 flex-1 items-center gap-2">
					<span
						class={["size-2 shrink-0 rounded-full", actionDotClasses[selectedEntry.action]]}
						aria-label={actionLabels[selectedEntry.action]}
						title={actionLabels[selectedEntry.action]}
					></span>
					<span class="truncate text-sm">
						<span class="font-medium tabular-nums">{shortDate(selectedEntry.changedAt)} · {timeLabel(selectedEntry.changedAt)}</span>
						<span class="text-muted-foreground"> · {selectedEntry.changedBy.name}</span>
					</span>
				</span>
			{:else}
				<span class="text-sm text-muted-foreground">Select a change…</span>
			{/if}
		</Select.Trigger>
		<Select.Content class="max-h-[420px] min-w-(--bits-select-anchor-width) p-1">
			{#each entries as entry (entry.id)}
				<Select.Item
					value={entry.id}
					class="cursor-pointer items-start! gap-2 px-2 py-1.5 text-sm data-highlighted:bg-accent"
				>
					<span
						class={["mt-1.5 size-2 shrink-0 rounded-full", actionDotClasses[entry.action]]}
						aria-label={actionLabels[entry.action]}
						title={actionLabels[entry.action]}
					></span>
					<div class="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
						<div class="w-full truncate text-sm leading-tight">
							<span class="font-medium tabular-nums">{shortDate(entry.changedAt)} · {timeLabel(entry.changedAt)}</span>
							<span class="text-muted-foreground"> · {entry.changedBy.name}</span>
						</div>
						<div class="w-full truncate text-xs leading-tight text-muted-foreground">
							{detailLine(entry)}
						</div>
					</div>
				</Select.Item>
			{:else}
				<div class="px-3 py-6 text-center text-xs text-muted-foreground">No changes recorded.</div>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
