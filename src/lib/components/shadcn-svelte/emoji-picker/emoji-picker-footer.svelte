<script lang="ts">
	import { useEmojiPickerFooter } from "$lib/components/shadcn-svelte/emoji-picker/emoji-picker.svelte.js";
	import type { EmojiPickerFooterProps } from "$lib/components/shadcn-svelte/emoji-picker/types";
	import { cn } from "$lib/utils.js";

	let { class: className, children, ...rest }: EmojiPickerFooterProps = $props();

	const footerState = useEmojiPickerFooter();
</script>

<div {...rest} class={cn("relative max-w-full border-t border-border p-2", className)}>
	{@render children?.({ active: footerState.root.emojiPickerState.active })}
</div>
