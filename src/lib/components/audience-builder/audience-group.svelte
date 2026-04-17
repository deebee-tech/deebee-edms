<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import { dndzone } from "svelte-dnd-action";
	import { flip } from "svelte/animate";
	import AudienceConditionRow from "./audience-condition-row.svelte";
	import {
		createEmptyCondition,
		type AudienceCatalog,
		type AudienceCondition,
		type AudienceGroup,
		type AudienceGroupLogic,
	} from "./types.js";

	let {
		group,
		catalog,
		canDelete,
		defaultName,
		onchange,
		ondelete,
	}: {
		group: AudienceGroup;
		catalog: AudienceCatalog;
		canDelete: boolean;
		/** Placeholder to show when the group has no name yet (e.g. "Group 1"). */
		defaultName: string;
		onchange: (next: AudienceGroup) => void;
		ondelete: () => void;
	} = $props();

	const flipDurationMs = 150;
	const conditionCount = $derived(group.conditions.length);

	function setLogic(value: string) {
		if (value === "and" || value === "or") onchange({ ...group, logic: value as AudienceGroupLogic });
	}

	function setName(e: Event) {
		const value = (e.currentTarget as HTMLInputElement).value;
		const trimmed = value.trim();
		onchange({ ...group, name: trimmed.length > 0 ? value : undefined });
	}

	function updateCondition(next: AudienceCondition) {
		onchange({
			...group,
			conditions: group.conditions.map((c) => (c.id === next.id ? next : c)),
		});
	}

	function removeCondition(id: string) {
		onchange({ ...group, conditions: group.conditions.filter((c) => c.id !== id) });
	}

	function addConditionForType(tagTypeId: string | undefined, tagId?: string) {
		const typeId = tagTypeId ?? catalog.tagTypes[0]?.id ?? "";
		if (!typeId) return;
		const resolvedTagId = tagId ?? catalog.tags.find((t) => t.tagTypeId === typeId)?.id;
		const newCond = createEmptyCondition(typeId, resolvedTagId);
		onchange({ ...group, conditions: [...group.conditions, newCond] });
	}

	function onConsider(e: CustomEvent<{ items: AudienceCondition[] }>) {
		onchange({ ...group, conditions: e.detail.items });
	}

	function onFinalize(e: CustomEvent<{ items: AudienceCondition[] }>) {
		onchange({ ...group, conditions: e.detail.items });
	}

	function handleDrop(e: DragEvent) {
		const data = e.dataTransfer?.getData("application/audience-tag");
		if (!data) return;
		e.preventDefault();
		try {
			const parsed = JSON.parse(data) as { tagTypeId: string; tagId?: string };
			if (parsed.tagTypeId) addConditionForType(parsed.tagTypeId, parsed.tagId);
			isDragOver = false;
		} catch {
			// ignore
		}
	}

	function handleDragOver(e: DragEvent) {
		if (e.dataTransfer?.types.includes("application/audience-tag")) {
			e.preventDefault();
			e.dataTransfer.dropEffect = "copy";
			isDragOver = true;
		}
	}

	function handleDragLeave(e: DragEvent) {
		// Only clear if we actually left the dropzone (not entering a child)
		if (e.currentTarget instanceof HTMLElement && !e.currentTarget.contains(e.relatedTarget as Node | null)) {
			isDragOver = false;
		}
	}

	let isDragOver = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="rounded-lg border bg-card/50 transition-colors {isDragOver ? 'border-primary bg-primary/5' : ''}"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<!-- Group header -->
	<div class="flex flex-wrap items-center gap-3 border-b px-3 py-2">
		<!-- Group name (free-form label) -->
		<div class="flex min-w-0 flex-1 items-center gap-2">
			<span class="shrink-0 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
				Group Name
			</span>
			<input
				type="text"
				class="min-w-0 flex-1 rounded-md border border-input bg-background px-2.5 py-1 text-sm font-medium shadow-xs outline-none placeholder:font-normal placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
				value={group.name ?? ""}
				placeholder={defaultName}
				oninput={setName}
				aria-label="Group name"
			/>
		</div>

		<!-- Match ALL/ANY widget (visually grouped + tinted so it stays distinct) -->
		<div class="flex shrink-0 items-center gap-2 rounded-md bg-muted/60 px-2.5 py-1">
			<span class="text-xs font-medium text-muted-foreground">Match</span>
			<Select.Root type="single" value={group.logic} onValueChange={setLogic}>
				<Select.Trigger class="h-7 w-20 border-0 bg-background text-xs font-semibold">
					{group.logic === "and" ? "ALL" : "ANY"}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="and">ALL</Select.Item>
					<Select.Item value="or">ANY</Select.Item>
				</Select.Content>
			</Select.Root>
			<span class="text-xs text-muted-foreground">of these conditions</span>
			{#if conditionCount > 0}
				<span class="rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
					{conditionCount}
				</span>
			{/if}
		</div>

		{#if canDelete}
			<Button
				variant="ghost"
				size="sm"
				class="h-7 w-7 shrink-0 p-0 text-muted-foreground hover:text-destructive"
				onclick={ondelete}
				aria-label="Remove group"
			>
				<TrashIcon class="size-3.5" />
			</Button>
		{/if}
	</div>

	<!-- Conditions list -->
	<div class="p-3">
		{#if conditionCount === 0}
			<div
				class="flex min-h-[80px] flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/20 p-4 text-center"
			>
				<p class="text-xs text-muted-foreground">Drag a tag from the palette to add a condition.</p>
			</div>
		{:else}
			<!-- Column headers (kept aligned with the row's grid template) -->
			<div
				class="mb-1.5 grid items-center gap-2 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase"
				style="grid-template-columns: 16px 168px 184px minmax(0, 1fr) 28px;"
			>
				<span></span>
				<span>Match</span>
				<span>Tag Type</span>
				<span>Tag</span>
				<span></span>
			</div>

			<div
				class="space-y-1.5"
				use:dndzone={{
					items: group.conditions,
					flipDurationMs,
					type: "audience-conditions",
					dropTargetStyle: {},
				}}
				onconsider={onConsider}
				onfinalize={onFinalize}
			>
				{#each group.conditions as condition, i (condition.id)}
					<div animate:flip={{ duration: flipDurationMs }}>
						{#if i > 0}
							{@const isAnd = group.logic === "and"}
							<div class="my-2 flex items-center gap-2 font-medium text-muted-foreground">
								<div class="h-px flex-1 bg-border"></div>
								<span
									class={[
										"rounded-full bg-sky-100 font-semibold tracking-wider text-sky-800 dark:bg-sky-950 dark:text-sky-300",
										isAnd ? "px-3 py-0.5 text-xs" : "px-3.5 py-0.5 text-sm",
									]}
								>
									{isAnd ? "AND" : "OR"}
								</span>
								<div class="h-px flex-1 bg-border"></div>
							</div>
						{/if}
						<AudienceConditionRow
							{condition}
							{catalog}
							onchange={updateCondition}
							ondelete={() => removeCondition(condition.id)}
						/>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
