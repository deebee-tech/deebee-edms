<script lang="ts">
	import { LanguageSwitcher } from "$lib/components/shadcn-svelte/language-switcher";
	import { ThemeSelector } from "$lib/components/shadcn-svelte/theme-selector";

	let { children } = $props();
</script>

<div class="fixed top-4 right-4 z-50">
	<LanguageSwitcher />
	<ThemeSelector />
</div>

{@render children()}
