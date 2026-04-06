<script lang="ts">
	import { Slider } from "$lib/components/ui/slider";
	import * as Field from "$lib/components/ui/field";
	import type { FormFieldDefinition } from "$lib/forms/types";

	let {
		field,
		value = $bindable(0),
		errors,
		disabled = false,
	}: {
		field: FormFieldDefinition;
		value: number;
		errors?: string[];
		disabled?: boolean;
	} = $props();

	const hasErrors = $derived(errors && errors.length > 0);
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>
		{field.label}
		<span class="ml-2 text-sm text-muted-foreground">{value}</span>
	</Field.Label>
	<Field.Content>
		<input type="hidden" name={field.name} {value} />
		<Slider
			type="single"
			bind:value
			min={field.validation?.min ?? 0}
			max={field.validation?.max ?? 100}
			step={field.validation?.step ?? 1}
			disabled={disabled || field.disabled}
		/>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
