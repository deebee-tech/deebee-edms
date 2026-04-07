<script lang="ts">
	import type { Component } from "svelte";
	import type { SVGAttributes } from "svelte/elements";

	let {
		name,
		class: className = "",
		...rest
	}: { name: string | undefined; class?: string } & SVGAttributes<SVGElement> = $props();

	let IconComponent = $state<Component | null>(null);
	let loadedName = $state<string | undefined>(undefined);

	function resolveIcon(iconName: string | undefined) {
		if (!iconName) {
			IconComponent = null;
			loadedName = undefined;
			return;
		}
		if (iconName === loadedName && IconComponent) return;

		const requested = iconName;
		import(/* @vite-ignore */ `@lucide/svelte/icons/${iconName}`)
			.then((mod) => {
				if (name === requested) {
					IconComponent = mod.default;
					loadedName = requested;
				}
			})
			.catch(() => {
				if (name === requested) {
					IconComponent = null;
					loadedName = requested;
				}
			});
	}

	$effect(() => {
		resolveIcon(name);
	});
</script>

{#if IconComponent}
	<IconComponent class={className} {...rest} />
{/if}
