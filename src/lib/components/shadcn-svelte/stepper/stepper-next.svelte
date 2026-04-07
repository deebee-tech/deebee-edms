<script lang="ts">
	import { Button } from "$lib/components/shadcn-svelte/button";
	import { useStepperStepButton } from "$lib/components/shadcn-svelte/stepper/stepper.svelte.js";
	import type { StepperNextButtonProps } from "$lib/components/shadcn-svelte/stepper/types";
	import { box, mergeProps } from "svelte-toolbelt";

	let {
		disabled = false,
		child,
		children,
		variant = "default",
		size = "default",
		...rest
	}: StepperNextButtonProps = $props();

	const buttonState = useStepperStepButton({
		type: box.with(() => "next"),
		disabled: box.with(() => disabled),
	});

	const mergedProps = $derived(mergeProps(buttonState.props, rest, { variant, size, "data-slot": "stepper-next" }));
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<Button {...mergedProps}>
		{@render children?.()}
	</Button>
{/if}
