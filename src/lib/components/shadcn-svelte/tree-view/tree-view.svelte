<script lang="ts">
	import type { TreeViewRootProps } from "$lib/components/shadcn-svelte/tree-view/types";
	import { cn } from "$lib/utils.js";

	let { children, class: className }: TreeViewRootProps = $props();
</script>

<div role="tree" class={cn("flex flex-col", className)}>
	{@render children?.()}
</div>
