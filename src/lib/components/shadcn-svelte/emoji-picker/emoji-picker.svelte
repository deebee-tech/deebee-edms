<script lang="ts">
	import { useEmojiPicker } from "$lib/components/shadcn-svelte/emoji-picker/emoji-picker.svelte.js";
	import type { EmojiPickerRootProps } from "$lib/components/shadcn-svelte/emoji-picker/types";
	import { cn } from "$lib/utils.js";
	import { Command as CommandPrimitive } from "bits-ui";
	import { box } from "svelte-toolbelt";

	let {
		value = $bindable(""),
		skin = $bindable(0),
		onSelect = () => {},
		showRecents = false,
		recentsKey = "",
		maxRecents = 12,
		onSkinChange = () => {},
		class: className,
		children,
		...rest
	}: EmojiPickerRootProps = $props();

	const state = useEmojiPicker({
		value: box.with(
			() => value,
			(v) => (value = v),
		),
		skin: box.with(
			() => skin,
			(v) => (skin = v),
		),
		showRecents: box.with(() => showRecents),
		recentsKey: box.with(() => recentsKey),
		maxRecents: box.with(() => maxRecents),
		onSelect: box.with(() => onSelect),
		onSkinChange: box.with(() => onSkinChange),
	});
</script>

<CommandPrimitive.Root
	{...rest}
	columns={6}
	shouldFilter={false}
	class={cn("max-w-[232px]", className)}
	onValueChange={state.onValueChange}
>
	{@render children?.()}
</CommandPrimitive.Root>
