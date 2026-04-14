<script lang="ts">
	import { useStepperItem } from "$lib/components/shadcn-svelte/stepper/stepper.svelte.js";
	import type { StepperItemProps } from "$lib/components/shadcn-svelte/stepper/types";
	import { cn } from "$lib/utils";

	const uid = $props.id();

	let { id = uid, class: className, children, ...rest }: StepperItemProps = $props();

	const stepperItemState = useStepperItem({
		get id() {
			return id;
		},
	});
</script>

<div
	data-slot="stepper-item"
	class={cn("group/stepper-item relative flex min-w-0 flex-1", className)}
	{...stepperItemState.props}
	{...rest}
>
	{@render children?.()}
</div>
