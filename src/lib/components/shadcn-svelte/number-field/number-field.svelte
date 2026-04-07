<script lang="ts">
	import { useNumberField } from "$lib/components/shadcn-svelte/number-field/number-field.svelte.js";
	import type { NumberFieldRootProps } from "$lib/components/shadcn-svelte/number-field/types";
	import { box } from "svelte-toolbelt";

	let {
		value = $bindable(0),
		step = 1,
		min,
		max,
		rampSettings = { startDelay: 400, rampUpTime: 0, minFrequency: 35, maxFrequency: 35 },
		children,
	}: NumberFieldRootProps = $props();

	useNumberField({
		value: box.with(
			() => value,
			(v) => (value = v),
		),
		step: box.with(() => step),
		min: box.with(() => min),
		max: box.with(() => max),
		rampSettings: box.with(() => rampSettings),
	});
</script>

{@render children?.()}
