<script lang="ts">
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { PhoneInput } from "$lib/components/shadcn-svelte/phone-input";
	import type { FormFieldDefinition } from "../../types";

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
		<PhoneInput name={field.name} bind:value placeholder={field.placeholder} disabled={disabled || field.disabled} />
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
