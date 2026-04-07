<script lang="ts">
	import * as Dialog from "$lib/components/shadcn-svelte/dialog/index.js";
	import * as Drawer from "$lib/components/shadcn-svelte/drawer/index.js";
	import { useModalSub } from "$lib/components/shadcn-svelte/modal/modal.svelte.js";
	import type { DialogTitleProps } from "bits-ui";

	const modal = useModalSub();

	let { ref = $bindable(null), ...rest }: DialogTitleProps = $props();
</script>

{#if modal.view === "desktop"}
	<Dialog.Title bind:ref {...rest} />
{:else}
	<Drawer.Title bind:ref {...rest} />
{/if}
