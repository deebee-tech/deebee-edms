<script lang="ts">
	import { Button, type ButtonElementProps } from "$lib/components/shadcn-svelte/button";
	import { useRenameSave } from "$lib/components/shadcn-svelte/rename/rename.svelte.js";
	import type { Snippet } from "svelte";

	const saveState = useRenameSave();

	type Props = Omit<ButtonElementProps, "type" | "onclick"> & {
		child?: Snippet<[{ save: () => void }]>;
	};

	let { ref = $bindable(null), children, variant = "default", child, ...rest }: Props = $props();
</script>

{#if child}
	{@render child({ save: saveState.save })}
{:else}
	<Button bind:ref type="button" onclick={saveState.save} {variant} {...rest}>
		{#if children}
			{@render children()}
		{:else}
			Save
		{/if}
	</Button>
{/if}
