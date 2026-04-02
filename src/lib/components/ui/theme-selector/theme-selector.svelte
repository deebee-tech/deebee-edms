<script lang="ts" module>
	export type ThemeSelectorProps = {
		variant?: "outline" | "ghost";
	};
</script>

<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ComputerIcon from "@lucide/svelte/icons/computer";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import SunIcon from "@lucide/svelte/icons/sun";
	import { m } from "$lib/paraglide/messages";
	import { resetMode, setMode, userPrefersMode } from "mode-watcher";

	let { variant = "outline" }: ThemeSelectorProps = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class={buttonVariants({ variant, size: "icon" })}>
		<SunIcon class="scale-100 rotate-0 transition-all! dark:scale-0 dark:-rotate-90" />
		<MoonIcon class="absolute scale-0 rotate-90 transition-all! dark:scale-100 dark:rotate-0" />
		<span class="sr-only">{m.theme_toggle()}</span>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		<DropdownMenu.Item class="gap-2" onclick={() => setMode("light")}>
			<SunIcon class="size-4" />
			<span class="flex-1 text-sm">{m.theme_light()}</span>
			{#if userPrefersMode.current === "light"}
				<CheckIcon class="size-4" />
			{/if}
		</DropdownMenu.Item>
		<DropdownMenu.Item class="gap-2" onclick={() => setMode("dark")}>
			<MoonIcon class="size-4" />
			<span class="flex-1 text-sm">{m.theme_dark()}</span>
			{#if userPrefersMode.current === "dark"}
				<CheckIcon class="size-4" />
			{/if}
		</DropdownMenu.Item>
		<DropdownMenu.Item class="gap-2" onclick={() => resetMode()}>
			<ComputerIcon class="size-4" />
			<span class="flex-1 text-sm">{m.theme_system()}</span>
			{#if userPrefersMode.current === "system"}
				<CheckIcon class="size-4" />
			{/if}
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
