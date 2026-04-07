<script lang="ts">
	import type { Snippet } from "svelte";
	import { tick } from "svelte";

	let {
		children,
	}: {
		children: Snippet<[{ isFullscreen: boolean; toggle: () => void }]>;
	} = $props();

	let el: HTMLDivElement;
	let fsState = $state<"idle" | "entering" | "open" | "exiting">("idle");
	let origin = $state({ top: 0, left: 0, width: 0, height: 0 });

	const isFullscreen = $derived(fsState === "open" || fsState === "entering");

	async function toggle() {
		if (fsState === "entering" || fsState === "exiting") return;

		if (fsState === "idle") {
			const r = el.getBoundingClientRect();
			origin = { top: r.top, left: r.left, width: r.width, height: r.height };
			fsState = "entering";
			await tick();
			requestAnimationFrame(() =>
				requestAnimationFrame(() => {
					fsState = "open";
				}),
			);
		} else {
			fsState = "exiting";
		}
	}

	function onTransitionEnd(e: TransitionEvent) {
		if (fsState === "exiting" && e.target === el && e.propertyName === "top") {
			fsState = "idle";
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === "Escape" && fsState === "open") toggle();
	}}
/>

<div
	bind:this={el}
	class={fsState === "idle" ? "h-full" : "fs-overlay"}
	style={fsState === "open"
		? "top:0;left:0;width:100%;height:100%;"
		: fsState !== "idle"
			? `top:${origin.top}px;left:${origin.left}px;width:${origin.width}px;height:${origin.height}px;`
			: ""}
	ontransitionend={onTransitionEnd}
>
	{@render children({ isFullscreen, toggle })}
</div>

<style>
	.fs-overlay {
		position: fixed;
		z-index: 100;
		transition:
			top 300ms cubic-bezier(0.4, 0, 0.2, 1),
			left 300ms cubic-bezier(0.4, 0, 0.2, 1),
			width 300ms cubic-bezier(0.4, 0, 0.2, 1),
			height 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}
</style>
