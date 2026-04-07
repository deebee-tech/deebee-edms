<script lang="ts">
	import { useRename } from "$lib/components/shadcn-svelte/rename/rename.svelte.js";
	import type { Snippet } from "svelte";

	useRename();

	let { children }: { children: Snippet } = $props();
</script>

{@render children?.()}
