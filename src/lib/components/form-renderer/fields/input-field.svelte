<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import * as Field from "$lib/components/ui/field";
	import type { FormFieldDefinition } from "$lib/forms/types";

	let {
		field,
		value = $bindable(""),
		errors,
		disabled = false,
	}: {
		field: FormFieldDefinition;
		value: string;
		errors?: string[];
		disabled?: boolean;
	} = $props();

	const hasErrors = $derived(errors && errors.length > 0);
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		<Input
			type={field.type === "color" ? "color" : field.type}
			name={field.name}
			bind:value
			placeholder={field.placeholder}
			disabled={disabled || field.disabled}
			required={field.required}
			aria-invalid={hasErrors || undefined}
			min={field.validation?.min}
			max={field.validation?.max}
			minlength={field.validation?.minLength}
			maxlength={field.validation?.maxLength}
			step={field.validation?.step}
		/>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
