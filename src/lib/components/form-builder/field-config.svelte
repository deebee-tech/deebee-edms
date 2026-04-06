<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { Button } from "$lib/components/ui/button";
	import * as Select from "$lib/components/ui/select";
	import * as Field from "$lib/components/ui/field";
	import { Separator } from "$lib/components/ui/separator";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import type { FormFieldDefinition } from "$lib/forms/types";

	let {
		field = $bindable(),
	}: {
		field: FormFieldDefinition;
	} = $props();

	const hasOptions = $derived(field.type === "select" || field.type === "radio");
	const hasTextValidation = $derived(
		["text", "email", "password", "textarea", "phone", "richtext", "otp"].includes(field.type),
	);
	const hasNumberValidation = $derived(field.type === "number" || field.type === "slider");

	function addOption() {
		const idx = (field.options?.length ?? 0) + 1;
		field.options = [...(field.options ?? []), { label: `Option ${idx}`, value: `option${idx}` }];
	}

	function removeOption(index: number) {
		field.options = field.options?.filter((_, i) => i !== index) ?? [];
	}

	function slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "_")
			.replace(/^_|_$/g, "");
	}
</script>

<div class="space-y-4">
	<div>
		<h4 class="mb-3 text-sm font-semibold">Basic</h4>
		<div class="space-y-3">
			<Field.Field>
				<Field.Label>Label</Field.Label>
				<Field.Content>
					<Input
						bind:value={field.label}
						placeholder="Field label"
						oninput={() => {
							if (!field.name || field.name === slugify(field.label)) {
								field.name = slugify(field.label);
							}
						}}
					/>
				</Field.Content>
			</Field.Field>

			<Field.Field>
				<Field.Label>Name</Field.Label>
				<Field.Content>
					<Input bind:value={field.name} placeholder="field_name" />
					<Field.Description>Used as the form field key</Field.Description>
				</Field.Content>
			</Field.Field>

			{#if field.type !== "checkbox" && field.type !== "switch" && field.type !== "slider"}
				<Field.Field>
					<Field.Label>Placeholder</Field.Label>
					<Field.Content>
						<Input bind:value={field.placeholder} placeholder="Placeholder text..." />
					</Field.Content>
				</Field.Field>
			{/if}

			<Field.Field>
				<Field.Label>Description</Field.Label>
				<Field.Content>
					<Textarea bind:value={field.description} placeholder="Help text..." />
				</Field.Content>
			</Field.Field>
		</div>
	</div>

	<Separator />

	<div>
		<h4 class="mb-3 text-sm font-semibold">Behavior</h4>
		<div class="space-y-3">
			<Field.Field orientation="horizontal">
				<Checkbox bind:checked={() => field.required ?? false, (v) => (field.required = v)} />
				<Field.Label>Required</Field.Label>
			</Field.Field>

			<Field.Field orientation="horizontal">
				<Checkbox bind:checked={() => field.disabled ?? false, (v) => (field.disabled = v)} />
				<Field.Label>Disabled</Field.Label>
			</Field.Field>

			<Field.Field>
				<Field.Label>Width</Field.Label>
				<Field.Content>
					<Select.Root type="single" bind:value={() => field.width ?? "full", (v) => (field.width = v)}>
						<Select.Trigger>
							{{ full: "Full", half: "1/2", "1/3": "1/3", "2/3": "2/3", "1/4": "1/4", "3/4": "3/4" }[
								field.width ?? "full"
							]}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="full" label="Full width" />
							<Select.Item value="3/4" label="3/4 width" />
							<Select.Item value="2/3" label="2/3 width" />
							<Select.Item value="half" label="1/2 width" />
							<Select.Item value="1/3" label="1/3 width" />
							<Select.Item value="1/4" label="1/4 width" />
						</Select.Content>
					</Select.Root>
				</Field.Content>
			</Field.Field>
		</div>
	</div>

	{#if hasOptions}
		<Separator />
		<div>
			<h4 class="mb-3 text-sm font-semibold">Options</h4>
			<div class="space-y-2">
				{#each field.options ?? [] as option, i (i)}
					<div class="flex items-center gap-2">
						<Input
							bind:value={option.label}
							placeholder="Label"
							class="flex-1"
							oninput={() => {
								option.value = slugify(option.label);
							}}
						/>
						<Input bind:value={option.value} placeholder="value" class="flex-1" />
						<Button variant="ghost" size="icon" class="shrink-0" onclick={() => removeOption(i)}>
							<TrashIcon class="size-4" />
						</Button>
					</div>
				{/each}
				<Button variant="outline" size="sm" class="w-full" onclick={addOption}>
					<PlusIcon class="mr-2 size-4" />
					Add Option
				</Button>
			</div>
		</div>
	{/if}

	{#if hasTextValidation || hasNumberValidation}
		<Separator />
		<div>
			<h4 class="mb-3 text-sm font-semibold">Validation</h4>
			<div class="space-y-3">
				{#if hasTextValidation}
					<div class="grid grid-cols-2 gap-2">
						<Field.Field>
							<Field.Label>Min Length</Field.Label>
							<Field.Content>
								<Input
									type="number"
									value={field.validation?.minLength ?? ""}
									oninput={(e) => {
										const v = parseInt(e.currentTarget.value);
										field.validation = { ...field.validation, minLength: isNaN(v) ? undefined : v };
									}}
								/>
							</Field.Content>
						</Field.Field>
						<Field.Field>
							<Field.Label>Max Length</Field.Label>
							<Field.Content>
								<Input
									type="number"
									value={field.validation?.maxLength ?? ""}
									oninput={(e) => {
										const v = parseInt(e.currentTarget.value);
										field.validation = { ...field.validation, maxLength: isNaN(v) ? undefined : v };
									}}
								/>
							</Field.Content>
						</Field.Field>
					</div>
					<Field.Field>
						<Field.Label>Pattern (regex)</Field.Label>
						<Field.Content>
							<Input
								value={field.validation?.pattern ?? ""}
								placeholder="^[a-zA-Z]+$"
								oninput={(e) => {
									field.validation = { ...field.validation, pattern: e.currentTarget.value || undefined };
								}}
							/>
						</Field.Content>
					</Field.Field>
				{/if}
				{#if hasNumberValidation}
					<div class="grid grid-cols-2 gap-2">
						<Field.Field>
							<Field.Label>Min</Field.Label>
							<Field.Content>
								<Input
									type="number"
									value={field.validation?.min ?? ""}
									oninput={(e) => {
										const v = parseFloat(e.currentTarget.value);
										field.validation = { ...field.validation, min: isNaN(v) ? undefined : v };
									}}
								/>
							</Field.Content>
						</Field.Field>
						<Field.Field>
							<Field.Label>Max</Field.Label>
							<Field.Content>
								<Input
									type="number"
									value={field.validation?.max ?? ""}
									oninput={(e) => {
										const v = parseFloat(e.currentTarget.value);
										field.validation = { ...field.validation, max: isNaN(v) ? undefined : v };
									}}
								/>
							</Field.Content>
						</Field.Field>
					</div>
					<Field.Field>
						<Field.Label>Step</Field.Label>
						<Field.Content>
							<Input
								type="number"
								value={field.validation?.step ?? ""}
								oninput={(e) => {
									const v = parseFloat(e.currentTarget.value);
									field.validation = { ...field.validation, step: isNaN(v) ? undefined : v };
								}}
							/>
						</Field.Content>
					</Field.Field>
				{/if}
			</div>
		</div>
	{/if}
</div>
