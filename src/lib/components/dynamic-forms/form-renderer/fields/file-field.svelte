<script lang="ts">
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { Input } from "$lib/components/shadcn-svelte/input";
	import type { FormFieldDefinition } from "../../types";

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
