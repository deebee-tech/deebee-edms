<script lang="ts">
	import { useStepperSeparator } from "$lib/components/shadcn-svelte/stepper/stepper.svelte.js";
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let { class: className, children, ...rest }: HTMLAttributes<HTMLDivElement> = $props();

	const separatorState = useStepperSeparator();

	const item = separatorState.itemState;
	const orientation = $derived(item.navState.opts.orientation.current);
	const stepCount = $derived(item.rootState.steps.length);
	const step = $derived(item.step);
	const isLast = $derived(item.isLast);

	/** Horizontal: center of first → center of last. Last column needs a tail (`left-0 right-1/2`); penultimate stays full width. */
	const horizontalInset = $derived.by(() => {
		if (orientation !== "horizontal" || stepCount < 2) return "";
		if (isLast) return "left-0 right-1/2";
		if (step === 1) return "left-1/2 right-0";
		return "inset-x-0";
	});

	/** Vertical keeps the legacy rule (no segment on the last item). Horizontal draws into the last column via `horizontalInset`. */
	const hideSeparator = $derived(stepCount < 2 || (orientation === "vertical" && isLast));
</script>

<div
	data-slot="stepper-separator"
	class={cn(
		"absolute shrink-0 bg-border transition-colors data-[state=completed]:bg-primary",
		orientation === "horizontal" && cn("top-[12px] h-1", horizontalInset),
		"group-data-[orientation=vertical]/stepper-nav:top-[28px] group-data-[orientation=vertical]/stepper-nav:left-[12px] group-data-[orientation=vertical]/stepper-nav:h-full group-data-[orientation=vertical]/stepper-nav:w-1",
		{
			hidden: hideSeparator,
		},
		className,
	)}
	{...separatorState.props}
	{...rest}
>
	{@render children?.()}
</div>
