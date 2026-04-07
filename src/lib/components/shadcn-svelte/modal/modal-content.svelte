<script lang="ts">
	import * as Dialog from "$lib/components/shadcn-svelte/dialog/index.js";
	import * as Drawer from "$lib/components/shadcn-svelte/drawer/index.js";
	import { useModalSub } from "$lib/components/shadcn-svelte/modal/modal.svelte.js";
	import type { DialogContentProps } from "bits-ui";

	const modal = useModalSub();

	let {
		ref = $bindable(null),
		hideClose = false,
		children,
		...rest
	}: DialogContentProps & { hideClose?: boolean } = $props();
</script>

{#if modal.view === "desktop"}
	<Dialog.Content bind:ref {...rest} {hideClose}>
		{@render children?.()}
	</Dialog.Content>
{:else}
	<Drawer.Content bind:ref {...rest}>
		{@render children?.()}
	</Drawer.Content>
{/if}
