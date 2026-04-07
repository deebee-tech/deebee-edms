<script lang="ts">
	import { Checkbox } from "$lib/components/shadcn-svelte/checkbox";
	import * as Field from "$lib/components/shadcn-svelte/field";
	import type { FormFieldDefinition } from "../../types";

	let {
		field,
		value = $bindable(false),
		errors,
		disabled = false,
	}: {
		field: FormFieldDefinition;
		value: boolean;
		errors?: string[];
		disabled?: boolean;
	} = $props();

	const hasErrors = $derived(errors && errors.length > 0);
</script>

<Field.Field orientation="horizontal" data-invalid={hasErrors || undefined}>
	<Checkbox
		name={field.name}
		bind:checked={value}
		disabled={disabled || field.disabled}
		aria-invalid={hasErrors || undefined}
	/>
	<Field.Content>
		<Field.Label>{field.label}</Field.Label>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
