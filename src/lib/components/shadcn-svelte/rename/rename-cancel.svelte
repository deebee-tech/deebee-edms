<script lang="ts">
	import { Button, type ButtonElementProps } from "$lib/components/shadcn-svelte/button";
	import { useRenameCancel } from "$lib/components/shadcn-svelte/rename/rename.svelte.js";
	import type { Snippet } from "svelte";

	const cancelState = useRenameCancel();

	type Props = Omit<ButtonElementProps, "type" | "onclick"> & {
		child?: Snippet<[{ cancel: () => void }]>;
	};

	let { ref = $bindable(null), children, variant = "outline", child, ...rest }: Props = $props();
</script>

{#if child}
	{@render child({ cancel: cancelState.cancel })}
{:else}
	<Button bind:ref type="button" onclick={cancelState.cancel} {variant} {...rest}>
		{#if children}
			{@render children()}
		{:else}
			Cancel
		{/if}
	</Button>
{/if}
