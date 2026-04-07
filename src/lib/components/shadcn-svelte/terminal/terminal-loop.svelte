<script lang="ts">
	import { useTerminalLoop } from "$lib/components/shadcn-svelte/terminal/terminal.svelte.js";
	import type { TerminalLoopProps } from "$lib/components/shadcn-svelte/terminal/types";
	import { onDestroy } from "svelte";

	let { delay = 500, children }: TerminalLoopProps = $props();

	let loopIndex = $state(0);
	let loopDelayTimeout = $state<ReturnType<typeof setTimeout>>();

	const onComplete = () => {
		loopDelayTimeout = setTimeout(() => loopIndex++, delay);
	};

	useTerminalLoop({ onComplete });

	onDestroy(() => clearTimeout(loopDelayTimeout));
</script>

{#key loopIndex}
	{@render children?.()}
{/key}
