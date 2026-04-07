<script lang="ts">
	import { buttonVariants } from "$lib/components/shadcn-svelte/button";
	import * as DropdownMenu from "$lib/components/shadcn-svelte/dropdown-menu";
	import { Flag } from "$lib/components/shadcn-svelte/flag";
	import { getDefaultLanguages } from "$lib/components/shadcn-svelte/language-switcher/defaults";
	import type { LanguageSwitcherProps } from "$lib/components/shadcn-svelte/language-switcher/types";
	import { getLocale, isLocale, setLocale } from "$lib/paraglide/runtime";
	import { cn } from "$lib/utils.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import GlobeIcon from "@lucide/svelte/icons/globe";

	let {
		languages = getDefaultLanguages(),
		value = $bindable(getLocale()),
		align = "end",
		variant = "outline",
		onChange = (code: string) => {
			if (isLocale(code)) setLocale(code);
		},
		class: className,
	}: LanguageSwitcherProps = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant, size: "icon" }), "cursor-pointer", className)}
		aria-label="Change language"
	>
		<GlobeIcon class="size-4" />
		<span class="sr-only">Change language</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content {align}>
		{#each languages as language (language.code)}
			<DropdownMenu.Item
				class="gap-2"
				onSelect={() => {
					value = language.code;
					onChange?.(language.code);
				}}
			>
				<Flag countryCode={language.countryCode} />
				<span class="flex-1 text-sm">{language.label}</span>
				{#if language.code === value}
					<CheckIcon class="size-4" />
				{/if}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
