<script lang="ts">
	import { LanguageSwitcher } from "$lib/components/ui/language-switcher";
	import { ThemeSelector } from "$lib/components/ui/theme-selector";
	import { LANGUAGES } from "$lib/constants";
	import { m } from "$lib/paraglide/messages";
	import { getLocale, isLocale, setLocale } from "$lib/paraglide/runtime";

	let { children } = $props();

	const MESSAGE_MAP: Record<string, () => string> = {
		en: () => m.language_en(),
		es: () => m.language_es(),
	};

	let languages = $derived(
		LANGUAGES.map((lang) => ({
			...lang,
			label: MESSAGE_MAP[lang.code]?.() ?? lang.label,
		})),
	);

	let currentLang = $derived(getLocale());
</script>

<div class="fixed top-4 right-4 z-50">
	<LanguageSwitcher
		{languages}
		bind:value={currentLang}
		onChange={(code: string) => {
			if (isLocale(code)) setLocale(code);
		}}
	/>
	<ThemeSelector />
</div>

{@render children()}
