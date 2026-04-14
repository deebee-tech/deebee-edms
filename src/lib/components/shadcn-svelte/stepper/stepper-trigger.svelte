<script lang="ts">
	import { useStepperItemTrigger } from "$lib/components/shadcn-svelte/stepper/stepper.svelte.js";
	import { cn } from "$lib/utils.js";
	import { box, type WithElementRef } from "svelte-toolbelt";
	import type { HTMLButtonAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		disabled = false,
		onclick,
		onkeydown,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLButtonAttributes, HTMLButtonElement> = $props();

	const triggerState = useStepperItemTrigger({
		ref: box.with(() => ref),
		disabled: box.with(() => disabled ?? false),
		onclick: box.with(() => onclick),
		onkeydown: box.with(() => onkeydown),
	});
</script>

<button
	bind:this={ref}
	data-slot="stepper-trigger"
	class={cn(
		"group/stepper-trigger z-1 flex",
		"group-data-[orientation=horizontal]/stepper-nav:w-full group-data-[orientation=horizontal]/stepper-nav:flex-col group-data-[orientation=horizontal]/stepper-nav:items-center group-data-[orientation=horizontal]/stepper-nav:gap-1.5",
		"group-data-[orientation=vertical]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:gap-4",
		className,
	)}
	{...triggerState.props}
	{...restProps}
>
	{@render children?.()}
</button>
