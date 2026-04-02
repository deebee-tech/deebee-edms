<script lang="ts">
	import { CLERK_LOCALE_MAP } from "$lib/constants";
	import { m } from "$lib/paraglide/messages";
	import { getLocale } from "$lib/paraglide/runtime";
	import { ui } from "@clerk/ui";
	import { ModeWatcher } from "mode-watcher";
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

<svelte:head><link rel="icon" href={data.favicon ?? "/images/favicon.ico"} /></svelte:head>

<ModeWatcher />
<ClerkProvider {ui} localization={clerkLocalization}>
	{@render children()}
</ClerkProvider>
