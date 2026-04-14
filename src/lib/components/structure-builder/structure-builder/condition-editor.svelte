<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import { CONDITION_OPERATORS, CONDITION_OPERATOR_LABELS, type ConditionRule } from "../types";

	let {
		rules = $bindable(),
		stateKeys = [],
		label = "Visibility Rules",
	}: {
		rules: ConditionRule[];
		stateKeys?: string[];
		label?: string;
	} = $props();

	function addRule() {
		rules = [
			...rules,
			{
				stateKey: stateKeys[0] ?? "",
				operator: "eq",
				value: "",
				logic: rules.length > 0 ? "and" : undefined,
			},
		];
	}

	function removeRule(index: number) {
		rules = rules.filter((_, i) => i !== index);
		if (rules.length > 0 && rules[0].logic) {
			rules[0] = { ...rules[0], logic: undefined };
		}
	}

	function updateRule(index: number, field: keyof ConditionRule, value: unknown) {
		rules = rules.map((r, i) => (i === index ? { ...r, [field]: value } : r));
	}
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-muted-foreground">{label}</span>
		<Button variant="ghost" size="icon" class="size-6" onclick={addRule}>
			<PlusIcon class="size-3" />
		</Button>
	</div>

	{#if rules.length === 0}
		<p class="text-xs text-muted-foreground/75">No rules — always visible</p>
	{:else}
		{#each rules as rule, i (i)}
			<div class="space-y-1.5 rounded-md border bg-muted/30 p-2">
				{#if i > 0}
					<Select.Root type="single" value={rule.logic ?? "and"} onValueChange={(v) => updateRule(i, "logic", v)}>
						<Select.Trigger class="h-6 w-16 text-xs">
							{rule.logic === "or" ? "OR" : "AND"}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="and">AND</Select.Item>
							<Select.Item value="or">OR</Select.Item>
						</Select.Content>
					</Select.Root>
				{/if}

				<Field.Field>
					<Field.Label class="text-xs">State Key</Field.Label>
					{#if stateKeys.length > 0}
						<Select.Root type="single" value={rule.stateKey} onValueChange={(v) => updateRule(i, "stateKey", v)}>
							<Select.Trigger class="h-7 text-xs">{rule.stateKey || "Select..."}</Select.Trigger>
							<Select.Content>
								{#each stateKeys as key (key)}
									<Select.Item value={key}>{key}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					{:else}
						<Input
							class="h-7 text-xs"
							value={rule.stateKey}
							oninput={(e) => updateRule(i, "stateKey", e.currentTarget.value)}
							placeholder="e.g. attendee.pass_type"
						/>
					{/if}
				</Field.Field>

				<Field.Field>
					<Field.Label class="text-xs">Operator</Field.Label>
					<Select.Root type="single" value={rule.operator} onValueChange={(v) => updateRule(i, "operator", v)}>
						<Select.Trigger class="h-7 text-xs">
							{CONDITION_OPERATOR_LABELS[rule.operator]}
						</Select.Trigger>
						<Select.Content>
							{#each CONDITION_OPERATORS as op (op)}
								<Select.Item value={op}>{CONDITION_OPERATOR_LABELS[op]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</Field.Field>

				{#if rule.operator !== "exists" && rule.operator !== "not_exists"}
					<Field.Field>
						<Field.Label class="text-xs">Value</Field.Label>
						<Input
							class="h-7 text-xs"
							value={typeof rule.value === "string" ? rule.value : JSON.stringify(rule.value ?? "")}
							oninput={(e) => {
								const raw = e.currentTarget.value;
								try {
									updateRule(i, "value", JSON.parse(raw));
								} catch {
									updateRule(i, "value", raw);
								}
							}}
							placeholder="Value or JSON array"
						/>
					</Field.Field>
				{/if}

				<div class="flex justify-end">
					<Button
						variant="ghost"
						size="icon"
						class="size-6 text-muted-foreground hover:text-destructive"
						onclick={() => removeRule(i)}
					>
						<TrashIcon class="size-3" />
					</Button>
				</div>
			</div>
		{/each}
	{/if}
</div>
