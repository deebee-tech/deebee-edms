<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { Checkbox } from "$lib/components/shadcn-svelte/checkbox";
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import * as Select from "$lib/components/shadcn-svelte/select";
	import { Separator } from "$lib/components/shadcn-svelte/separator";
	import { Textarea } from "$lib/components/shadcn-svelte/textarea";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import { NON_INTERACTIVE_TYPES } from "../types";
	import type { FormFieldDefinition } from "../types";

	let {
		field = $bindable(),
	}: {
		field: FormFieldDefinition;
	} = $props();

	const isNonInteractive = $derived(NON_INTERACTIVE_TYPES.has(field.type));
	const hasOptions = $derived(field.type === "select" || field.type === "radio");
	const hasTextValidation = $derived(
		["text", "email", "password", "textarea", "phone", "richtext", "code", "otp"].includes(field.type),
	);
	const hasNumberValidation = $derived(field.type === "number" || field.type === "slider");
	const hasCodeConfig = $derived(field.type === "code");
	const hasStaticTextConfig = $derived(field.type === "static_text");
	const hasVideoConfig = $derived(field.type === "video");

	const codeLanguages = [
		{ label: "JavaScript", value: "javascript" },
		{ label: "TypeScript", value: "typescript" },
		{ label: "JSON", value: "json" },
		{ label: "SQL", value: "sql" },
		{ label: "HTML", value: "html" },
		{ label: "CSS", value: "css" },
		{ label: "Python", value: "python" },
		{ label: "Markdown", value: "markdown" },
		{ label: "XML", value: "xml" },
		{ label: "YAML", value: "yaml" },
		{ label: "Shell", value: "shell" },
		{ label: "Plain Text", value: "plaintext" },
	] as const;

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

			{#if !isNonInteractive && field.type !== "checkbox" && field.type !== "switch" && field.type !== "slider" && field.type !== "code"}
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
			{#if !isNonInteractive}
				<Field.Field orientation="horizontal">
					<Checkbox bind:checked={() => field.required ?? false, (v) => (field.required = v)} />
					<Field.Label>Required</Field.Label>
				</Field.Field>

				<Field.Field orientation="horizontal">
					<Checkbox bind:checked={() => field.disabled ?? false, (v) => (field.disabled = v)} />
					<Field.Label>Disabled</Field.Label>
				</Field.Field>
			{/if}

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

	{#if hasStaticTextConfig}
		<Separator />
		<div>
			<h4 class="mb-3 text-sm font-semibold">Content</h4>
			<div class="space-y-3">
				<Field.Field>
					<Field.Label>HTML Content</Field.Label>
					<Field.Content>
						<Textarea
							value={(field.config?.content as string) ?? ""}
							placeholder="Enter text or HTML content..."
							rows={6}
							oninput={(e) => {
								field.config = { ...field.config, content: e.currentTarget.value };
							}}
						/>
						<Field.Description>Supports plain text and HTML markup</Field.Description>
					</Field.Content>
				</Field.Field>
			</div>
		</div>
	{/if}

	{#if hasVideoConfig}
		<Separator />
		<div>
			<h4 class="mb-3 text-sm font-semibold">Video</h4>
			<div class="space-y-3">
				<Field.Field>
					<Field.Label>Video URL</Field.Label>
					<Field.Content>
						<Input
							value={(field.config?.url as string) ?? ""}
							placeholder="https://youtube.com/watch?v=... or direct video URL"
							oninput={(e) => {
								field.config = { ...field.config, url: e.currentTarget.value };
							}}
						/>
						<Field.Description>YouTube URLs and direct video file URLs are supported</Field.Description>
					</Field.Content>
				</Field.Field>

				<Field.Field orientation="horizontal">
					<Checkbox
						checked={!!field.config?.requireWatch}
						onCheckedChange={(v) => {
							field.config = { ...field.config, requireWatch: v };
						}}
					/>
					<div>
						<Field.Label>Require Watch</Field.Label>
						<Field.Description>User must watch the video before submitting</Field.Description>
					</div>
				</Field.Field>

				{#if field.config?.requireWatch}
					<Field.Field>
						<Field.Label>Watch Threshold (%)</Field.Label>
						<Field.Content>
							<Input
								type="number"
								min={1}
								max={100}
								value={(field.config?.watchThreshold as number) ?? 95}
								oninput={(e) => {
									const v = parseInt(e.currentTarget.value);
									field.config = {
										...field.config,
										watchThreshold: isNaN(v) ? 95 : Math.min(100, Math.max(1, v)),
									};
								}}
							/>
							<Field.Description>Percentage of the video that must be watched (high watermark)</Field.Description>
						</Field.Content>
					</Field.Field>
				{/if}
			</div>
		</div>
	{/if}

	{#if hasCodeConfig}
		<Separator />
		<div>
			<h4 class="mb-3 text-sm font-semibold">Code Editor</h4>
			<div class="space-y-3">
				<Field.Field>
					<Field.Label>Language</Field.Label>
					<Field.Content>
						<Select.Root
							type="single"
							bind:value={
								() => (field.config?.language as string) ?? "javascript",
								(v) => (field.config = { ...field.config, language: v })
							}
						>
							<Select.Trigger>
								{codeLanguages.find((l) => l.value === ((field.config?.language as string) ?? "javascript"))?.label ??
									"JavaScript"}
							</Select.Trigger>
							<Select.Content>
								{#each codeLanguages as lang (lang.value)}
									<Select.Item value={lang.value} label={lang.label} />
								{/each}
							</Select.Content>
						</Select.Root>
					</Field.Content>
				</Field.Field>
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
