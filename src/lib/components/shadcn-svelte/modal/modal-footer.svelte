<script lang="ts">
	import * as Dialog from "$lib/components/shadcn-svelte/dialog/index.js";
	import * as Drawer from "$lib/components/shadcn-svelte/drawer/index.js";
	import { useModalSub } from "$lib/components/shadcn-svelte/modal/modal.svelte.js";
	import type { WithElementRef } from "bits-ui";
	import type { HTMLAttributes } from "svelte/elements";

	const modal = useModalSub();

	let { ref = $bindable(null), children, ...rest }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

{#if modal.view === "desktop"}
	<Dialog.Footer bind:ref {...rest}>
		{@render children?.()}
	</Dialog.Footer>
{:else}
	<Drawer.Footer bind:ref {...rest}>
		{@render children?.()}
	</Drawer.Footer>
{/if}
