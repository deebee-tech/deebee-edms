<script lang="ts">
	import { usePassword } from "$lib/components/shadcn-svelte/password/password.svelte.js";
	import type { PasswordRootProps } from "$lib/components/shadcn-svelte/password/types";
	import { cn } from "$lib/utils.js";
	import { box } from "svelte-toolbelt";

	let {
		ref = $bindable(null),
		hidden = $bindable(true),
		minScore = 3,
		class: className,
		children,
	}: PasswordRootProps = $props();

	usePassword({
		hidden: box.with(
			() => hidden,
			(v) => (hidden = v),
		),
		minScore: box.with(() => minScore),
	});
</script>

<div bind:this={ref} class={cn("flex flex-col gap-2", className)}>
	{@render children?.()}
</div>
