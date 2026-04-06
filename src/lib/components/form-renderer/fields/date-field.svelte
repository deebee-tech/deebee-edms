<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Calendar } from "$lib/components/ui/calendar";
	import * as Field from "$lib/components/ui/field";
	import * as Popover from "$lib/components/ui/popover";
	import type { FormFieldDefinition } from "$lib/forms/types";
	import { type DateValue, getLocalTimeZone, parseDate } from "@internationalized/date";
	import CalendarIcon from "@lucide/svelte/icons/calendar";

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

	let dateValue = $state<DateValue | undefined>(undefined);

	$effect(() => {
		if (value) {
			try {
				dateValue = parseDate(value);
			} catch {
				dateValue = undefined;
			}
		} else {
			dateValue = undefined;
		}
	});

	function onDateChange(newDate: DateValue | undefined) {
		dateValue = newDate;
		value = newDate ? newDate.toString() : "";
	}

	const displayText = $derived(
		dateValue ? dateValue.toDate(getLocalTimeZone()).toLocaleDateString() : (field.placeholder ?? "Pick a date..."),
	);
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		<input type="hidden" name={field.name} {value} />
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						variant="outline"
						class="w-full justify-start text-left font-normal {dateValue ? '' : 'text-muted-foreground'}"
						disabled={disabled || field.disabled}
						{...props}
					>
						<CalendarIcon class="mr-2 size-4" />
						{displayText}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-auto p-0">
				<Calendar type="single" value={dateValue} onValueChange={onDateChange} />
			</Popover.Content>
		</Popover.Root>
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>
