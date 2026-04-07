<script lang="ts">
	import type { ImageCropperControlsProps } from "$lib/components/shadcn-svelte/image-cropper/types";
	import { cn } from "$lib/utils.js";

	let { ref = $bindable(null), class: className, children, ...rest }: ImageCropperControlsProps = $props();
</script>

<div {...rest} bind:this={ref} class={cn("flex w-full place-items-center justify-center gap-2", className)}>
	{@render children?.()}
</div>
