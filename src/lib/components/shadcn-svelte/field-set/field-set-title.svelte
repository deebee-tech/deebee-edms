<script lang="ts">
	import type { FieldSetTitleProps } from "$lib/components/shadcn-svelte/field-set/types";
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), class: className, level = 3, children, ...rest }: FieldSetTitleProps = $props();
</script>

<div
	bind:this={ref}
	role="heading"
	aria-level={level}
	bind:this={ref}
	class={cn("text-2xl leading-none font-semibold tracking-tight", className)}
	{...rest}
>
	{@render children?.()}
</div>
