<script lang="ts">
	import TagsInput from "$lib/components/ui/tags-input/tags-input.svelte";
	import * as Field from "$lib/components/ui/field";
	import type { FormFieldDefinition } from "$lib/forms/types";

	let {
		field,
		value = $bindable<string[]>([]),
		errors,
		disabled = false,
	}: {
		field: FormFieldDefinition;
		value: string[];
		errors?: string[];
		disabled?: boolean;
	} = $props();

	const hasErrors = $derived(errors && errors.length > 0);
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		<TagsInput bind:value placeholder={field.placeholder} disabled={disabled || field.disabled} />
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
