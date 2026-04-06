<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import * as Field from "$lib/components/ui/field";
	import { Input } from "$lib/components/ui/input";
	import * as Select from "$lib/components/ui/select";
	import { Separator } from "$lib/components/ui/separator";
	import { Textarea } from "$lib/components/ui/textarea";
	import { nodeRegistry } from "$lib/workflows/node-registry";
	import type { WorkflowNodeDefinition } from "$lib/workflows/types";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";

	let {
		node,
		onchange,
		ondelete,
	}: {
		node: WorkflowNodeDefinition;
		onchange: (node: WorkflowNodeDefinition) => void;
		ondelete?: (nodeId: string) => void;
	} = $props();

	const registryEntry = $derived(nodeRegistry[node.type]);
	const configSchema = $derived(registryEntry?.configSchema ?? []);

	function updateLabel(value: string) {
		onchange({ ...node, label: value });
	}

	function updateConfig(key: string, value: unknown) {
		onchange({ ...node, config: { ...node.config, [key]: value } });
	}

	function updateKvPairs(key: string, pairs: { key: string; value: string }[]) {
		onchange({ ...node, config: { ...node.config, [key]: pairs } });
	}

	function addKvPair(fieldName: string) {
		const current = (node.config[fieldName] as { key: string; value: string }[]) ?? [];
		updateKvPairs(fieldName, [...current, { key: "", value: "" }]);
	}

	function removeKvPair(fieldName: string, index: number) {
		const current = (node.config[fieldName] as { key: string; value: string }[]) ?? [];
		updateKvPairs(
			fieldName,
			current.filter((_, i) => i !== index),
		);
	}

	function updateKvPairEntry(fieldName: string, index: number, prop: "key" | "value", val: string) {
		const current = (node.config[fieldName] as { key: string; value: string }[]) ?? [];
		const updated = current.map((item, i) => (i === index ? { ...item, [prop]: val } : item));
		updateKvPairs(fieldName, updated);
	}
</script>

<div class="space-y-4">
	<div>
		<div class="mb-3 flex items-center gap-2">
			{#if registryEntry?.icon}
				{@const Icon = registryEntry.icon}
				<Icon class="size-4 text-muted-foreground" />
			{/if}
			<h4 class="text-sm font-semibold">{registryEntry?.label ?? node.type}</h4>
		</div>

		<Field.Field>
			<Field.Label>Label</Field.Label>
			<Field.Content>
				<Input value={node.label} oninput={(e) => updateLabel(e.currentTarget.value)} placeholder="Node label" />
			</Field.Content>
		</Field.Field>
	</div>

	{#if configSchema.length > 0}
		<Separator />
		<div>
			<h4 class="mb-3 text-sm font-semibold">Configuration</h4>
			<div class="space-y-3">
				{#each configSchema as field (field.name)}
					{@const value = node.config[field.name] ?? field.defaultValue ?? ""}
					{#if field.type === "text" || field.type === "expression"}
						<Field.Field>
							<Field.Label>
								{field.label}
								{#if field.required}<span class="text-destructive">*</span>{/if}
							</Field.Label>
							<Field.Content>
								<Input
									value={typeof value === "string" ? value : String(value)}
									placeholder={field.placeholder}
									oninput={(e) => updateConfig(field.name, e.currentTarget.value)}
								/>
								{#if field.description}
									<Field.Description>{field.description}</Field.Description>
								{/if}
							</Field.Content>
						</Field.Field>
					{:else if field.type === "number"}
						<Field.Field>
							<Field.Label>
								{field.label}
								{#if field.required}<span class="text-destructive">*</span>{/if}
							</Field.Label>
							<Field.Content>
								<Input
									type="number"
									value={typeof value === "number" ? value : ""}
									placeholder={field.placeholder}
									oninput={(e) => {
										const v = parseFloat(e.currentTarget.value);
										updateConfig(field.name, isNaN(v) ? undefined : v);
									}}
								/>
								{#if field.description}
									<Field.Description>{field.description}</Field.Description>
								{/if}
							</Field.Content>
						</Field.Field>
					{:else if field.type === "textarea" || field.type === "json"}
						<Field.Field>
							<Field.Label>
								{field.label}
								{#if field.required}<span class="text-destructive">*</span>{/if}
							</Field.Label>
							<Field.Content>
								<Textarea
									value={typeof value === "string" ? value : JSON.stringify(value, null, 2)}
									placeholder={field.placeholder}
									class={field.type === "json" ? "font-mono text-xs" : ""}
									rows={field.type === "json" ? 6 : 3}
									oninput={(e) => updateConfig(field.name, e.currentTarget.value)}
								/>
								{#if field.description}
									<Field.Description>{field.description}</Field.Description>
								{/if}
							</Field.Content>
						</Field.Field>
					{:else if field.type === "select" && field.options}
						<Field.Field>
							<Field.Label>
								{field.label}
								{#if field.required}<span class="text-destructive">*</span>{/if}
							</Field.Label>
							<Field.Content>
								<Select.Root
									type="single"
									value={typeof value === "string" ? value : ""}
									onValueChange={(v) => updateConfig(field.name, v)}
								>
									<Select.Trigger>
										{field.options.find((o) => o.value === value)?.label ?? field.placeholder ?? "Select..."}
									</Select.Trigger>
									<Select.Content>
										{#each field.options as option (option.value)}
											<Select.Item value={option.value} label={option.label} />
										{/each}
									</Select.Content>
								</Select.Root>
								{#if field.description}
									<Field.Description>{field.description}</Field.Description>
								{/if}
							</Field.Content>
						</Field.Field>
					{:else if field.type === "kv-pairs"}
						{@const pairs = (
							Array.isArray(node.config[field.name])
								? node.config[field.name]
								: Object.entries((node.config[field.name] as Record<string, string>) ?? {}).map(([k, v]) => ({
										key: k,
										value: v,
									}))
						) as { key: string; value: string }[]}
						<Field.Field>
							<Field.Label>
								{field.label}
								{#if field.required}<span class="text-destructive">*</span>{/if}
							</Field.Label>
							<Field.Content>
								<div class="space-y-2">
									{#each pairs as pair, i (i)}
										<div class="flex items-center gap-1.5">
											<Input
												value={pair.key}
												placeholder="Key"
												class="flex-1 text-xs"
												oninput={(e) => updateKvPairEntry(field.name, i, "key", e.currentTarget.value)}
											/>
											<Input
												value={pair.value}
												placeholder="Value"
												class="flex-1 text-xs"
												oninput={(e) => updateKvPairEntry(field.name, i, "value", e.currentTarget.value)}
											/>
											<Button
												variant="ghost"
												size="icon"
												class="size-7 shrink-0"
												onclick={() => removeKvPair(field.name, i)}
											>
												<TrashIcon class="size-3.5" />
											</Button>
										</div>
									{/each}
									<Button variant="outline" size="sm" class="w-full text-xs" onclick={() => addKvPair(field.name)}>
										<PlusIcon class="mr-1.5 size-3.5" />
										Add
									</Button>
								</div>
								{#if field.description}
									<Field.Description>{field.description}</Field.Description>
								{/if}
							</Field.Content>
						</Field.Field>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	{#if ondelete}
		<Separator />
		<Button variant="destructive" size="sm" class="w-full" onclick={() => ondelete(node.id)}>
			<TrashIcon class="mr-1.5 size-3.5" />
			Delete node
		</Button>
	{/if}
</div>
