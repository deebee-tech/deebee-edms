<script lang="ts">
	import { typewriter } from "$lib/actions/typewriter.svelte";
	import { useAnimation } from "$lib/components/shadcn-svelte/terminal/terminal.svelte.js";
	import type { TerminalAnimationProps } from "$lib/components/shadcn-svelte/terminal/types";
	import { cn } from "$lib/utils.js";
	import { onDestroy } from "svelte";

	let { children, delay = 0, class: className }: TerminalAnimationProps = $props();

	let playAnimation = $state(false);
	let animationSpeed = $state(1);

	const play = (speed: number) => {
		playAnimation = true;
		animationSpeed = speed;
	};

	const animation = useAnimation({ delay: () => delay, play });

	onDestroy(() => animation.dispose());
</script>

{#if playAnimation}
	<span
		class={cn("block", className)}
		transition:typewriter={{
			speed: animationSpeed * 2,
			onComplete: () => animation.onComplete?.(),
		}}
	>
		{@render children?.()}
	</span>
{/if}
