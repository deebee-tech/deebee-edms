<script lang="ts">
	import AvatarRoot from "$lib/components/shadcn-svelte/avatar/avatar.svelte";
	import { cn } from "$lib/utils.js";
	import { Avatar as AvatarPrimitive } from "bits-ui";

	let { ref = $bindable(null), class: className, ...restProps }: AvatarPrimitive.RootProps = $props();
</script>

<AvatarRoot bind:ref class={cn("bg-accent ring-2 ring-background", className)} {...restProps} />
