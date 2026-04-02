<script lang="ts">
	import { getFlag } from "$lib/components/ui/flag/flags";

	interface Props {
		countryCode?: string | null;
	}

	let { countryCode = null }: Props = $props();
</script>

<span class="flex h-4 w-6 shrink-0 overflow-hidden rounded-sm bg-foreground/20 [&>svg]:h-4! [&>svg]:w-6!">
	{#await getFlag(countryCode) then flag}
		{#if flag}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html flag}
		{/if}
	{/await}
</span>
