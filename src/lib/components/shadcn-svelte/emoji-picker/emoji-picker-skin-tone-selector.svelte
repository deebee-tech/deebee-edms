<script lang="ts">
	import { Button, type ButtonElementProps } from "$lib/components/shadcn-svelte/button";
	import { useEmojiPickerSkinToneSelector } from "$lib/components/shadcn-svelte/emoji-picker/emoji-picker.svelte.js";
	import type { EmojiPickerSkinProps } from "$lib/components/shadcn-svelte/emoji-picker/types.js";
	import { cn } from "$lib/utils.js";
	import { box } from "svelte-toolbelt";

	let {
		previewEmoji = "👋",
		variant = "outline",
		size = "icon",
		class: className,
		onclick,
		...rest
	}: EmojiPickerSkinProps = $props();

	const skinState = useEmojiPickerSkinToneSelector({
		previewEmoji: box.with(() => previewEmoji),
	});
</script>

<Button
	{...rest}
	{variant}
	{size}
	class={cn("size-8", className)}
	onclick={(e: Parameters<NonNullable<ButtonElementProps["onclick"]>>[0]) => {
		onclick?.(e);
		skinState.cycleSkinTone();
	}}
>
	{skinState.preview}
</Button>
