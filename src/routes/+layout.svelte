<script lang="ts">
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import type { PathnameWithSearchOrHash } from "$app/types";
	import favicon from "$lib/assets/favicon.svg";
	import { locales, localizeHref } from "$lib/paraglide/runtime";
	import { ClerkProvider } from "svelte-clerk";
	import "./layout.css";

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<ClerkProvider>
	{@render children()}

	<div style="display:none">
		{#each locales as locale, index (index)}
			<a href={resolve(localizeHref(page.url.pathname, { locale }) as PathnameWithSearchOrHash)}>{locale}</a>
		{/each}
	</div>
</ClerkProvider>
