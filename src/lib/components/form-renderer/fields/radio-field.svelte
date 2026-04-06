<script lang="ts">
	import * as RadioGroup from "$lib/components/ui/radio-group";
	import { Label } from "$lib/components/ui/label";
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
		<RadioGroup.Root bind:value disabled={disabled || field.disabled} name={field.name}>
			{#each field.options ?? [] as option (option.value)}
				<div class="flex items-center gap-2">
					<RadioGroup.Item value={option.value} />
					<Label>{option.label}</Label>
				</div>
			{/each}
		</RadioGroup.Root>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
