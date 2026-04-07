<script lang="ts">
	import * as Dialog from "$lib/components/shadcn-svelte/dialog/index.js";
	import * as Drawer from "$lib/components/shadcn-svelte/drawer/index.js";
	import { useModalSub } from "$lib/components/shadcn-svelte/modal/modal.svelte.js";
	import type { DialogTriggerProps } from "bits-ui";

	const modal = useModalSub();

	let { ref = $bindable(null), children, ...rest }: DialogTriggerProps = $props();
</script>

{#if modal.view === "desktop"}
	<Dialog.Trigger bind:ref {...rest}>
		{@render children?.()}
	</Dialog.Trigger>
{:else}
	<Drawer.Trigger bind:ref {...rest}>
		{@render children?.()}
	</Drawer.Trigger>
{/if}
