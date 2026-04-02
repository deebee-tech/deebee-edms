<script lang="ts">
	import { CLERK_LOCALE_MAP } from "$lib/constants";
	import { m } from "$lib/paraglide/messages";
	import { getLocale } from "$lib/paraglide/runtime";
	import { ui } from "@clerk/ui";
	import { ModeWatcher, mode } from "mode-watcher";
	import { ClerkProvider } from "svelte-clerk";
	import "./layout.css";

	let { children, data } = $props();

	const clerkLocale = $derived(CLERK_LOCALE_MAP[getLocale()] ?? {});

	let clerkLocalization = $derived({
		...clerkLocale,
		signIn: {
			...(clerkLocale.signIn ?? {}),
			start: {
				...(clerkLocale.signIn?.start ?? {}),
				title: data.authPageTitleSignIn ?? m.auth_title_sign_in(),
			},
		},
		signUp: {
			...(clerkLocale.signUp ?? {}),
			start: {
				...(clerkLocale.signUp?.start ?? {}),
				title: data.authPageTitleSignUp ?? m.auth_title_sign_up(),
			},
		},
	});
</script>

<svelte:head>
	<link rel="icon" href={data.favicon ?? "/favicon.ico"} />
	<link rel="icon" type="image/png" sizes="32x32" href={data.favicon32 ?? "/favicon-32x32.png"} />
	<link rel="icon" type="image/png" sizes="16x16" href={data.favicon16 ?? "/favicon-16x16.png"} />
	<link rel="apple-touch-icon" sizes="180x180" href={data.appleTouchIcon ?? "/apple-touch-icon.png"} />
	<link rel="manifest" href="/site.webmanifest" />
	<meta
		name="theme-color"
		content={mode.current === "dark" ? (data.themeColorDark ?? "#171717") : (data.themeColorLight ?? "#faf8f6")}
	/>
</svelte:head>

<ModeWatcher />
<ClerkProvider {ui} localization={clerkLocalization}>
	{@render children()}
</ClerkProvider>
