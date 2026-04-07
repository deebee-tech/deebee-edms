<script lang="ts">
	import type { AvatarGroupEtcProps } from "$lib/components/shadcn-svelte/avatar-group/types";
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), plus, class: className, ...rest }: AvatarGroupEtcProps = $props();
</script>

<div
	{...rest}
	bind:this={ref}
	class={cn(
		"relative flex size-8 items-center justify-center rounded-full bg-accent text-xs ring-2 ring-background",
		className,
	)}
>
	<span>+{plus}</span>
</div>
