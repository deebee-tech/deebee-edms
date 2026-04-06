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

	const svelteModules = import.meta.glob<{ default: Component }>("/node_modules/@lucide/svelte/dist/icons/*.svelte");

	const jsModules = import.meta.glob<{ default: Component }>("/node_modules/@lucide/svelte/dist/icons/*.js");

	function resolveIcon(iconName: string | undefined) {
		if (!iconName) {
			IconComponent = null;
			loadedName = undefined;
			return;
		}
		if (iconName === loadedName && IconComponent) return;

		const svelteKey = `/node_modules/@lucide/svelte/dist/icons/${iconName}.svelte`;
		const jsKey = `/node_modules/@lucide/svelte/dist/icons/${iconName}.js`;
		const loader = svelteModules[svelteKey] ?? jsModules[jsKey];
		if (!loader) {
			IconComponent = null;
			loadedName = iconName;
			return;
		}
		const requested = iconName;
		loader().then((mod) => {
			if (name === requested) {
				IconComponent = mod.default;
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
