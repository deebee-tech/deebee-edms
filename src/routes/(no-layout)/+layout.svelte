<script lang="ts">
	import { LanguageSwitcher } from "$lib/components/ui/language-switcher";
	import { ThemeSelector } from "$lib/components/ui/theme-selector";

	let { children } = $props();
</script>

<div class="fixed top-4 right-4 z-50">
	<LanguageSwitcher />
	<ThemeSelector />
</div>

{@render children()}
