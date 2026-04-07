<script lang="ts">
	import { useTerminalRoot } from "$lib/components/shadcn-svelte/terminal/terminal.svelte.js";
	import type { TerminalRootProps } from "$lib/components/shadcn-svelte/terminal/types.js";
	import { Window } from "$lib/components/shadcn-svelte/window";
	import { cn } from "$lib/utils.js";
	import { onMount } from "svelte";

	let { delay = 0, speed = 1, onComplete = () => {}, children, class: className }: TerminalRootProps = $props();

	const terminal = useTerminalRoot({
		get delay() {
			return delay;
		},
		get speed() {
			return speed;
		},
		get onComplete() {
			return onComplete;
		},
	});

	onMount(() => {
		// we play here so that we don't play before it is visible (on the server)
		terminal.play();

		return () => {
			terminal.dispose();
		};
	});
</script>

<Window class={cn("font-mono text-sm font-light", className)}>
	{@render children?.()}
</Window>
