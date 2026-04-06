<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import * as Field from "$lib/components/ui/field";
	import type { FormFieldDefinition } from "$lib/forms/types";

	let {
		field,
		value = $bindable(undefined),
		errors,
		disabled = false,
	}: {
		field: FormFieldDefinition;
		value: FileList | undefined;
		errors?: string[];
		disabled?: boolean;
	} = $props();

	const hasErrors = $derived(errors && errors.length > 0);
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		<Input
			type="file"
			name={field.name}
			bind:files={value}
			disabled={disabled || field.disabled}
			aria-invalid={hasErrors || undefined}
		/>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
