<script lang="ts">
	import type { FieldSetFooterProps } from "$lib/components/shadcn-svelte/field-set/types";
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), class: className, children, ...rest }: FieldSetFooterProps = $props();
</script>

<div bind:this={ref} class={cn("border-t border-inherit px-6 py-3", className)} {...rest}>
	{@render children?.()}
</div>
