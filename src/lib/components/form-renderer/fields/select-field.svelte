<script lang="ts">
	import * as Select from "$lib/components/ui/select";
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
	const selectedLabel = $derived(field.options?.find((o) => o.value === value)?.label ?? "");
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		<Select.Root type="single" bind:value disabled={disabled || field.disabled} name={field.name}>
			<Select.Trigger aria-invalid={hasErrors || undefined}>
				{#if selectedLabel}
					{selectedLabel}
				{:else}
					<span class="text-muted-foreground">{field.placeholder ?? "Select..."}</span>
				{/if}
			</Select.Trigger>
			<Select.Content>
				{#each field.options ?? [] as option (option.value)}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
