<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { DynamicLucideIcon } from "$lib/components/shadcn-svelte/dynamic-lucide-icon";
	import * as Stepper from "$lib/components/shadcn-svelte/stepper";
	import CheckIcon from "@lucide/svelte/icons/check";
	import { untrack } from "svelte";
	import { superForm, type SuperValidated } from "sveltekit-superforms";
	import { valibotClient } from "sveltekit-superforms/adapters";
	import * as v from "valibot";
	import { createStepValibotSchema, createValibotSchema, isMultiStep } from "../schema";
	import type { FormDefinition, FormFieldDefinition } from "../types";
	import CheckboxField from "./fields/checkbox-field.svelte";
	import DateField from "./fields/date-field.svelte";
	import FileField from "./fields/file-field.svelte";
	import InputField from "./fields/input-field.svelte";
	import OtpField from "./fields/otp-field.svelte";
	import PhoneField from "./fields/phone-field.svelte";
	import RadioField from "./fields/radio-field.svelte";
	import SelectField from "./fields/select-field.svelte";
	import SliderField from "./fields/slider-field.svelte";
	import SwitchField from "./fields/switch-field.svelte";
	import TagsField from "./fields/tags-field.svelte";
	import TextareaField from "./fields/textarea-field.svelte";

	let {
		definition,
		data,
		action,
		disabled = false,
		submitLabel = "Submit",
		onsubmit,
	}: {
		definition: FormDefinition;
		data: SuperValidated<Record<string, unknown>>;
		action?: string;
		disabled?: boolean;
		submitLabel?: string;
		onsubmit?: (data: Record<string, unknown>) => void;
	} = $props();

	const multiStep = $derived(isMultiStep(definition));
	let currentStep = $state(1);

	const sf = untrack(() => {
		const schema = createValibotSchema(definition);
		return superForm(data, {
			validators: valibotClient(schema),
			dataType: "json",
			onResult({ result }) {
				if (result.type === "success" && onsubmit) {
					onsubmit($formData);
				}
			},
		});
	});

	const { form: formData, errors: formErrors, enhance } = sf;

	function fieldErrors(name: string): string[] | undefined {
		const errs = ($formErrors as Record<string, string[] | undefined>)[name];
		return errs && errs.length > 0 ? errs : undefined;
	}

	function validateAndNext() {
		if (!multiStep || !definition.steps) return;
		const step = definition.steps[currentStep - 1];
		const schema = createStepValibotSchema(step);

		const stepData: Record<string, unknown> = {};
		for (const field of step.fields) {
			stepData[field.name] = $formData[field.name];
		}

		const result = v.safeParse(schema, stepData);
		if (result.success) {
			for (const field of step.fields) {
				($formErrors as Record<string, string[] | undefined>)[field.name] = undefined;
			}
			currentStep++;
			return;
		}

		const errorMap: Record<string, string[]> = {};
		for (const issue of result.issues) {
			const key = issue.path?.[0]?.key as string | undefined;
			if (key) {
				if (!errorMap[key]) errorMap[key] = [];
				errorMap[key].push(issue.message);
			}
		}
		for (const field of step.fields) {
			($formErrors as Record<string, string[] | undefined>)[field.name] = errorMap[field.name] ?? undefined;
		}
	}

	const widthMap: Record<string, string> = {
		full: "col-span-12",
		half: "col-span-6",
		"1/3": "col-span-4",
		"2/3": "col-span-8",
		"1/4": "col-span-3",
		"3/4": "col-span-9",
	};
</script>

{#snippet renderField(field: FormFieldDefinition)}
	{@const widthClass = widthMap[field.width ?? "full"]}
	<div class={widthClass}>
		{#if field.type === "text" || field.type === "email" || field.type === "password" || field.type === "number" || field.type === "color"}
			<InputField
				{field}
				bind:value={() => $formData[field.name] as string, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "textarea" || field.type === "richtext"}
			<TextareaField
				{field}
				bind:value={() => $formData[field.name] as string, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "select"}
			<SelectField
				{field}
				bind:value={() => $formData[field.name] as string, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "checkbox"}
			<CheckboxField
				{field}
				bind:value={() => $formData[field.name] as boolean, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "switch"}
			<SwitchField
				{field}
				bind:value={() => $formData[field.name] as boolean, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "radio"}
			<RadioField
				{field}
				bind:value={() => $formData[field.name] as string, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "date"}
			<DateField
				{field}
				bind:value={() => $formData[field.name] as string, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "phone"}
			<PhoneField
				{field}
				bind:value={() => $formData[field.name] as string, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "tags"}
			<TagsField
				{field}
				bind:value={() => $formData[field.name] as string[], (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "file"}
			<FileField
				{field}
				bind:value={() => $formData[field.name] as FileList | undefined, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "slider"}
			<SliderField
				{field}
				bind:value={() => $formData[field.name] as number, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{:else if field.type === "otp"}
			<OtpField
				{field}
				bind:value={() => $formData[field.name] as string, (val) => ($formData[field.name] = val)}
				errors={fieldErrors(field.name)}
				{disabled}
			/>
		{/if}
	</div>
{/snippet}

{#snippet renderFieldGrid(fields: FormFieldDefinition[])}
	<div class="grid grid-cols-12 gap-4">
		{#each fields as field (field.id)}
			{@render renderField(field)}
		{/each}
	</div>
{/snippet}

<form method="POST" {action} use:enhance class="space-y-6">
	{#if multiStep && definition.steps}
		<Stepper.Root bind:step={currentStep}>
			<Stepper.Nav class="mx-auto max-w-lg">
				{#each definition.steps as step, i (step.id)}
					<Stepper.Item id={step.id}>
						<Stepper.Trigger>
							<Stepper.Indicator>
								{#if currentStep > i + 1}
									<CheckIcon class="size-4" />
								{:else if step.icon}
									<DynamicLucideIcon name={step.icon} class="size-4" />
								{:else}
									{i + 1}
								{/if}
							</Stepper.Indicator>
							<Stepper.Title>{step.title}</Stepper.Title>
							{#if step.description}
								<Stepper.Description>{step.description}</Stepper.Description>
							{/if}
						</Stepper.Trigger>
						<Stepper.Separator />
					</Stepper.Item>
				{/each}
			</Stepper.Nav>

			<div class="mt-6">
				{#each definition.steps as step, i (step.id)}
					{#if currentStep === i + 1}
						{@render renderFieldGrid(step.fields)}
					{/if}
				{/each}
			</div>

			<div class="flex justify-between pt-2">
				<Button type="button" variant="outline" disabled={disabled || currentStep <= 1} onclick={() => currentStep--}>
					Previous
				</Button>
				{#if currentStep < definition.steps.length}
					<Button type="button" {disabled} onclick={validateAndNext}>Next</Button>
				{:else}
					<Button type="submit" {disabled}>{submitLabel}</Button>
				{/if}
			</div>
		</Stepper.Root>
	{:else}
		{@render renderFieldGrid(definition.fields)}
		<Button type="submit" {disabled}>{submitLabel}</Button>
	{/if}
</form>
