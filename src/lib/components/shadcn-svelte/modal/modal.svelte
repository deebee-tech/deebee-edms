<script lang="ts">
	import * as Dialog from "$lib/components/shadcn-svelte/dialog/index.js";
	import * as Drawer from "$lib/components/shadcn-svelte/drawer/index.js";
	import { useModal } from "$lib/components/shadcn-svelte/modal/modal.svelte.js";
	import type { DialogRootProps } from "bits-ui";

	let { open = $bindable(false), children, ...rest }: DialogRootProps = $props();

	const modal = useModal();
</script>

{#if modal.view === "desktop"}
	<Dialog.Root bind:open {...rest}>
		{@render children?.()}
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open {...rest}>
		{@render children?.()}
	</Drawer.Root>
{/if}
