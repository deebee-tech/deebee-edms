<script lang="ts">
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import CheckIcon from "@lucide/svelte/icons/check";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
	import { buttonVariants } from "$lib/components/ui/button";
	import { cn } from "$lib/utils.js";
	import { Flag } from "$lib/components/ui/flag";
	import type { LanguageSwitcherProps } from "$lib/components/ui/language-switcher/types";

	let {
		languages = [],
		value = $bindable(""),
		align = "end",
		variant = "outline",
		onChange,
		class: className,
	}: LanguageSwitcherProps = $props();

	$effect(() => {
		if (value === "" && languages.length > 0) {
			value = languages[0].code;
		}
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={cn(buttonVariants({ variant, size: "icon" }), className)} aria-label="Change language">
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
