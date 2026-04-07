<script lang="ts">
	import { Button, type ButtonElementProps } from "$lib/components/shadcn-svelte/button";
	import { useRenameEdit } from "$lib/components/shadcn-svelte/rename/rename.svelte.js";
	import type { Snippet } from "svelte";

	const editState = useRenameEdit();

	type Props = Omit<ButtonElementProps, "type" | "onclick"> & {
		child?: Snippet<[{ edit: () => void }]>;
	};

	let { ref = $bindable(null), children, variant = "outline", child, ...rest }: Props = $props();
</script>

{#if child}
	{@render child({ edit: editState.edit })}
{:else}
	<Button bind:ref type="button" onclick={editState.edit} {variant} {...rest}>
		{#if children}
			{@render children()}
		{:else}
			Edit
		{/if}
	</Button>
{/if}
