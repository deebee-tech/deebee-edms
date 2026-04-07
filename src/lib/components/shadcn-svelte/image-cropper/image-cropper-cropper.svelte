<script lang="ts">
	import { useImageCropperCropper } from "$lib/components/shadcn-svelte/image-cropper/image-cropper.svelte.js";
	import type { ImageCropperCropperProps } from "$lib/components/shadcn-svelte/image-cropper/types.js";
	import Cropper from "svelte-easy-crop";

	let { cropShape = "round", aspect = 1, showGrid = false, ...rest }: ImageCropperCropperProps = $props();

	const cropperState = useImageCropperCropper();
</script>

<!-- This needs to be relative https://github.com/ValentinH/svelte-easy-crop#basic-usage -->
<div class="relative h-full w-full">
	<Cropper
		{...rest}
		{cropShape}
		{aspect}
		{showGrid}
		image={cropperState.rootState.tempUrl}
		oncropcomplete={cropperState.onCropComplete}
	/>
</div>
