<script lang="ts">
	import { Badge } from "$lib/components/shadcn-svelte/badge";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import UserIcon from "@lucide/svelte/icons/user";
	import type { AuditAction, AuditLogEntry } from "./types.js";

	let {
		entry,
	}: {
		entry: AuditLogEntry | undefined;
	} = $props();

	const actionVariants: Record<AuditAction, "default" | "secondary" | "destructive" | "outline"> = {
		create: "default",
		update: "secondary",
		delete: "destructive",
	};

	const actionLabels: Record<AuditAction, string> = {
		create: "Created",
		update: "Updated",
		delete: "Deleted",
	};

	function formatTimestamp(iso: string): string {
		const d = new Date(iso);
		if (Number.isNaN(d.getTime())) return iso;
		return d.toLocaleString(undefined, {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	function initials(name: string): string {
		return name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((p) => p[0]?.toUpperCase() ?? "")
			.join("");
	}
</script>

{#if entry}
	<div class="flex flex-col gap-1.5 rounded-md border bg-muted/30 px-2.5 py-2">
		<div class="flex items-center gap-2">
			<Badge variant={actionVariants[entry.action]} class="shrink-0 text-[10px] uppercase">
				{actionLabels[entry.action]}
			</Badge>
			<span class="flex min-w-0 items-center gap-1.5 text-xs">
				<span
					class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary"
					aria-hidden="true"
				>
					{initials(entry.changedBy.name) || "?"}
				</span>
				<span class="truncate font-medium">{entry.changedBy.name}</span>
			</span>
		</div>
		<div class="flex items-center gap-1.5 text-[11px] text-muted-foreground">
			<CalendarIcon class="size-3 shrink-0" />
			<span class="truncate">{formatTimestamp(entry.changedAt)}</span>
		</div>
		{#if entry.reason}
			<div class="flex items-start gap-1.5 text-[11px] text-muted-foreground">
				<MessageSquareIcon class="mt-0.5 size-3 shrink-0" />
				<span class="line-clamp-2 italic">{entry.reason}</span>
			</div>
		{/if}
	</div>
{:else}
	<div
		class="flex items-center gap-1.5 rounded-md border border-dashed bg-muted/20 px-2.5 py-2 text-[11px] text-muted-foreground"
	>
		<UserIcon class="size-3 shrink-0" />
		<span>No change selected.</span>
	</div>
{/if}
