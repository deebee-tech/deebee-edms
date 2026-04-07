<script lang="ts">
	import { fieldSetVariants } from "$lib/components/shadcn-svelte/field-set";
	import type { FieldSetRootProps } from "$lib/components/shadcn-svelte/field-set/types";
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), variant = "default", children, class: className, ...rest }: FieldSetRootProps = $props();
</script>

<div bind:this={ref} class={cn(fieldSetVariants({ variant }), className)} {...rest}>
	{@render children?.()}
</div>
