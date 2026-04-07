<script lang="ts">
	import type { TreeViewFileProps } from "$lib/components/shadcn-svelte/tree-view/types";
	import { cn } from "$lib/utils.js";
	import FileIcon from "@lucide/svelte/icons/file";

	let { name, icon, type = "button", class: className, ...rest }: TreeViewFileProps = $props();
</script>

<button {type} class={cn("flex place-items-center gap-1 pl-[3px]", className)} {...rest}>
	{#if icon}
		{@render icon({ name })}
	{:else}
		<FileIcon class="size-4" />
	{/if}
	<span>{name}</span>
</button>
