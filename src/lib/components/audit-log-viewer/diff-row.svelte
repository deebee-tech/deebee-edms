<script lang="ts">
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import CheckIcon from "@lucide/svelte/icons/check";
	import EqualIcon from "@lucide/svelte/icons/equal";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import { formatValue } from "./diff-engine.js";
	import type { AuditValue, FieldDiff } from "./types.js";

	type Side = "left" | "right";

	let {
		diff,
		selection,
		onselect,
	}: {
		diff: FieldDiff;
		/** Which side has been picked for this row (`undefined` = no explicit pick yet). */
		selection: Side | undefined;
		onselect: (source: Side) => void;
	} = $props();

	// Compute what the merged record will use for this field.
	// Same fallback logic as `mergedRecord` in audit-log-viewer.svelte.
	const mergedSource = $derived.by<Side | undefined>(() => {
		if (selection === "left" && diff.left !== undefined) return "left";
		if (selection === "right" && diff.right !== undefined) return "right";
		if (diff.right !== undefined) return "right";
		if (diff.left !== undefined) return "left";
		return undefined;
	});
	const mergedValue = $derived(mergedSource === "left" ? diff.left : mergedSource === "right" ? diff.right : undefined);
	const mergedIsExplicit = $derived(selection !== undefined);

	const statusClasses: Record<FieldDiff["status"], string> = {
		unchanged: "bg-transparent",
		changed: "bg-amber-500/5",
		added: "bg-emerald-500/5",
		removed: "bg-rose-500/5",
	};

	// 3px colored left bar replaces the old per-row status badge.
	const statusBarClasses: Record<FieldDiff["status"], string> = {
		unchanged: "border-l-transparent",
		changed: "border-l-amber-500",
		added: "border-l-emerald-500",
		removed: "border-l-rose-500",
	};

	const statusLabels: Record<FieldDiff["status"], string> = {
		unchanged: "Unchanged",
		changed: "Changed",
		added: "Added",
		removed: "Removed",
	};

	function cellClasses(side: Side): string {
		const status = diff.status;
		const missing = side === "left" ? diff.left === undefined : diff.right === undefined;
		if (missing) return "text-muted-foreground/40 italic";
		if (status === "unchanged") return "text-foreground/80";
		if (status === "added" && side === "right") return "text-emerald-700 dark:text-emerald-400 font-medium";
		if (status === "removed" && side === "left")
			return "text-rose-700 dark:text-rose-400 font-medium line-through decoration-rose-500/50";
		if (status === "changed") {
			return side === "left"
				? "text-rose-700 dark:text-rose-400 font-medium line-through decoration-rose-500/40"
				: "text-emerald-700 dark:text-emerald-400 font-medium";
		}
		return "text-muted-foreground/60";
	}

	function isMissing(side: Side): boolean {
		return side === "left" ? diff.left === undefined : diff.right === undefined;
	}

	function valueOf(side: Side): AuditValue | undefined {
		return side === "left" ? diff.left : diff.right;
	}

	const isUnchanged = $derived(diff.status === "unchanged");

	function pickHandler(side: Side) {
		return () => onselect(side);
	}
</script>

<div
	class={[
		"group/row grid items-stretch gap-0 border-b border-l-[3px] text-xs last:border-b-0",
		statusClasses[diff.status],
		statusBarClasses[diff.status],
		isUnchanged ? "opacity-70 hover:opacity-100" : "",
	]}
	style="grid-template-columns: 200px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);"
>
	<div
		class="flex items-center border-r px-2.5 py-1.5"
		title={isUnchanged
			? `${diff.field} (${statusLabels[diff.status]})`
			: `${diff.field} — ${statusLabels[diff.status]}`}
	>
		<span class="truncate font-mono text-xs font-medium">{diff.field}</span>
	</div>

	{@render valueCell("left")}
	{@render valueCell("right")}
	{@render mergedCell()}
</div>

{#snippet valueCell(side: Side)}
	{@const missing = isMissing(side)}
	{@const selected = selection === side}
	{@const canInteract = !missing && !isUnchanged}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class={[
			"relative flex items-center gap-2 border-r px-2.5 py-1.5 transition-colors",
			canInteract ? "cursor-pointer hover:bg-muted/40" : "",
			selected ? "bg-primary/10 ring-2 ring-primary/40 ring-inset" : "",
		]}
		onclick={canInteract ? pickHandler(side) : undefined}
		onkeydown={canInteract
			? (e: KeyboardEvent) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						pickHandler(side)();
					}
				}
			: undefined}
		role={canInteract ? "button" : "presentation"}
		tabindex={canInteract ? 0 : -1}
		aria-pressed={canInteract ? selected : undefined}
		aria-label={canInteract ? `Select ${side === "left" ? "left" : "right"} value for ${diff.field}` : undefined}
	>
		<span
			class={[
				"flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
				selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-background",
				canInteract ? "" : "opacity-30",
			]}
			aria-hidden="true"
		>
			{#if selected}
				<CheckIcon class="size-2.5" />
			{/if}
		</span>

		<span class={["min-w-0 flex-1 truncate font-mono text-xs", cellClasses(side)]} title={formatValue(valueOf(side))}>
			{missing ? "(absent)" : formatValue(valueOf(side))}
		</span>
	</div>
{/snippet}

{#snippet mergedCell()}
	{@const omitted = mergedSource === undefined}
	<div class="flex items-center gap-2 bg-muted/30 px-2.5 py-1.5">
		{#if omitted}
			<MinusIcon class="size-3 shrink-0 text-muted-foreground/50" aria-hidden="true" />
			<span class="font-mono text-xs text-muted-foreground/60 italic">(omitted)</span>
		{:else if isUnchanged}
			<EqualIcon class="size-3 shrink-0 text-muted-foreground/40" aria-hidden="true" />
			<span class="min-w-0 flex-1 truncate font-mono text-xs text-foreground/80" title={formatValue(mergedValue)}>
				{formatValue(mergedValue)}
			</span>
		{:else}
			<span
				class={[
					"flex size-4 shrink-0 items-center justify-center rounded-full transition-colors",
					mergedSource === "left"
						? mergedIsExplicit
							? "bg-rose-500/15 text-rose-700 dark:text-rose-400"
							: "text-rose-700/60 dark:text-rose-400/60"
						: mergedIsExplicit
							? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
							: "text-emerald-700/60 dark:text-emerald-400/60",
				]}
				title={mergedIsExplicit ? `Picked from ${mergedSource} side` : `Default — taking the ${mergedSource} value`}
				aria-label={mergedIsExplicit ? `Picked from ${mergedSource} side` : `Default from ${mergedSource} side`}
			>
				{#if mergedSource === "left"}
					<ArrowLeftIcon class="size-2.5" />
				{:else}
					<ArrowRightIcon class="size-2.5" />
				{/if}
			</span>
			<span
				class={[
					"min-w-0 flex-1 truncate font-mono text-xs",
					mergedSource === "left" ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300",
					mergedIsExplicit ? "font-medium" : "opacity-90",
				]}
				title={formatValue(mergedValue)}
			>
				{formatValue(mergedValue)}
			</span>
		{/if}
	</div>
{/snippet}
