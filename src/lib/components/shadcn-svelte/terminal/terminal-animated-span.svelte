<script lang="ts">
	import { useAnimation } from "$lib/components/shadcn-svelte/terminal/terminal.svelte.js";
	import type { TerminalAnimationProps } from "$lib/components/shadcn-svelte/terminal/types";
	import { cn } from "$lib/utils.js";
	import { onDestroy } from "svelte";
	import { fly } from "svelte/transition";

	let { children, delay = 0, class: className }: TerminalAnimationProps = $props();

	let playAnimation = $state(false);
	let animationSpeed = $state(1);
	let completeTimeout = $state<ReturnType<typeof setTimeout>>();

	const play = (speed: number) => {
		playAnimation = true;
		animationSpeed = speed;

		completeTimeout = setTimeout(() => animation.onComplete?.(), duration);
	};

	const duration = $derived(300 / animationSpeed);

	const animation = useAnimation({ delay: () => delay, play });

	onDestroy(() => {
		animation.dispose();
		clearTimeout(completeTimeout);
	});
</script>

{#if playAnimation}
	<span class={cn("block", className)} in:fly={{ y: -5, duration }}>
		{@render children?.()}
	</span>
{/if}
