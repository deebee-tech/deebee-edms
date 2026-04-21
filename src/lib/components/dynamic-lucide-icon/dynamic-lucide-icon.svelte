<script lang="ts">
	import type { Component, Snippet } from "svelte";
	import type { SVGAttributes } from "svelte/elements";

	let {
		name,
		class: className = "",
		fallback,
		...rest
	}: {
		name: string | undefined;
		class?: string;
		/** Rendered when `name` is empty or doesn't resolve to a known Lucide icon. */
		fallback?: Snippet;
	} & SVGAttributes<SVGElement> = $props();

	type IconLoader = () => Promise<{ default: Component }>;
	const loaders = import.meta.glob("/node_modules/@lucide/svelte/dist/icons/*.svelte") as Record<string, IconLoader>;

	let IconComponent = $state<Component | null>(null);
	let loadedName = $state<string | undefined>(undefined);
	let pending = $state(false);

	function pathFor(iconName: string) {
		return `/node_modules/@lucide/svelte/dist/icons/${iconName}.svelte`;
	}

	function resolveIcon(iconName: string | undefined) {
		if (!iconName) {
			IconComponent = null;
			loadedName = undefined;
			pending = false;
			return;
		}
		if (iconName === loadedName && IconComponent) return;

		const requested = iconName;
		const loader = loaders[pathFor(iconName)];
		if (!loader) {
			IconComponent = null;
			loadedName = requested;
			pending = false;
			return;
		}
		pending = true;
		loader()
			.then((mod) => {
				if (name === requested) {
					IconComponent = mod.default;
					loadedName = requested;
					pending = false;
				}
			})
			.catch(() => {
				if (name === requested) {
					IconComponent = null;
					loadedName = requested;
					pending = false;
				}
			});
	}

	$effect(() => {
		resolveIcon(name);
	});
</script>

{#if IconComponent}
	<IconComponent class={className} {...rest} />
{:else if !pending && fallback}
	{@render fallback()}
{/if}
