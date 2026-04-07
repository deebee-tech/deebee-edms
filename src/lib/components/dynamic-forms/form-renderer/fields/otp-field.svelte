<script lang="ts">
	import * as Field from "$lib/components/shadcn-svelte/field";
	import * as InputOTP from "$lib/components/shadcn-svelte/input-otp";
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
	const maxlength = $derived(field.validation?.maxLength ?? 6);
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		<input type="hidden" name={field.name} {value} />
		<InputOTP.Root bind:value {maxlength} disabled={disabled || field.disabled}>
			{#snippet children({ cells })}
				<InputOTP.Group>
					{#each cells as cell (cell)}
						<InputOTP.Slot {cell} />
					{/each}
				</InputOTP.Group>
			{/snippet}
		</InputOTP.Root>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
