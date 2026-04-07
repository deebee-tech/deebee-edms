<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { GlobalVariable, GlobalVariableType } from "./types";

	let {
		variables,
		onchange,
	}: {
		variables: GlobalVariable[];
		onchange: (variables: GlobalVariable[]) => void;
	} = $props();

	const typeOptions: { label: string; value: GlobalVariableType }[] = [
		{ label: "String", value: "string" },
		{ label: "Number", value: "number" },
		{ label: "Boolean", value: "boolean" },
		{ label: "Object", value: "object" },
		{ label: "Array", value: "array" },
	];

	function addVariable() {
		const key = `variable_${variables.length + 1}`;
		onchange([...variables, { key, type: "string", description: "" }]);
	}

	function removeVariable(index: number) {
		onchange(variables.filter((_, i) => i !== index));
	}

	function updateVariable(index: number, updates: Partial<GlobalVariable>) {
		onchange(variables.map((v, i) => (i === index ? { ...v, ...updates } : v)));
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h4 class="text-sm font-semibold">Global State</h4>
		<Button variant="outline" size="sm" class="h-7 text-xs" onclick={addVariable}>
			<PlusIcon class="mr-1.5 size-3.5" />
			Add Variable
		</Button>
	</div>

	{#if variables.length === 0}
		<div class="flex flex-col items-center justify-center rounded-md border border-dashed py-6 text-center">
			<p class="text-xs text-muted-foreground">No global state variables defined.</p>
			<p class="mt-1 text-[10px] text-muted-foreground">
				Variables can be referenced in node configs using <code class="rounded bg-muted px-1">{"{{state.key}}"}</code>
			</p>
		</div>
	{:else}
		<div class="space-y-3">
			{#each variables as variable, i (i)}
				<div class="rounded-md border p-3">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-xs font-medium text-muted-foreground">Variable {i + 1}</span>
						<Button variant="ghost" size="icon" class="size-6" onclick={() => removeVariable(i)}>
							<TrashIcon class="size-3.5" />
						</Button>
					</div>
					<div class="space-y-2">
						<Field.Field>
							<Field.Label class="text-xs">Key</Field.Label>
							<Field.Content>
								<Input
									value={variable.key}
									placeholder="variableName"
									class="text-xs"
									oninput={(e) => updateVariable(i, { key: e.currentTarget.value })}
								/>
							</Field.Content>
						</Field.Field>
						<Field.Field>
							<Field.Label class="text-xs">Type</Field.Label>
							<Field.Content>
								<Select.Root
									type="single"
									value={variable.type}
									onValueChange={(v) => updateVariable(i, { type: v as GlobalVariableType })}
								>
									<Select.Trigger class="text-xs">
										{typeOptions.find((o) => o.value === variable.type)?.label ?? "String"}
									</Select.Trigger>
									<Select.Content>
										{#each typeOptions as option (option.value)}
											<Select.Item value={option.value} label={option.label} />
										{/each}
									</Select.Content>
								</Select.Root>
							</Field.Content>
						</Field.Field>
						<Field.Field>
							<Field.Label class="text-xs">Default Value</Field.Label>
							<Field.Content>
								<Input
									value={variable.defaultValue != null ? String(variable.defaultValue) : ""}
									placeholder="Default value"
									class="text-xs"
									oninput={(e) => {
										let val: unknown = e.currentTarget.value;
										if (variable.type === "number") val = parseFloat(val as string) || 0;
										else if (variable.type === "boolean") val = val === "true";
										updateVariable(i, { defaultValue: val });
									}}
								/>
							</Field.Content>
						</Field.Field>
						<Field.Field>
							<Field.Label class="text-xs">Description</Field.Label>
							<Field.Content>
								<Input
									value={variable.description ?? ""}
									placeholder="What this variable is for..."
									class="text-xs"
									oninput={(e) => updateVariable(i, { description: e.currentTarget.value })}
								/>
							</Field.Content>
						</Field.Field>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
