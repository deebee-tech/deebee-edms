<script lang="ts">
	import type { FieldSetTitleProps } from "$lib/components/shadcn-svelte/field-set/types";
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), class: className, children, ...restProps }: FieldSetTitleProps = $props();
</script>

<div bind:this={ref} class={cn("p-6", className)} {...restProps}>
	{@render children?.()}
</div>
