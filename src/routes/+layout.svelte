<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { ClerkProvider } from "svelte-clerk";
	import "./layout.css";

	let { children, data } = $props();
</script>

<svelte:head><link rel="icon" href={data.favicon ?? favicon} /></svelte:head>

<ClerkProvider
	localization={{
		signIn: { start: { title: data.authPageTitleSignIn } },
		signUp: { start: { title: data.authPageTitleSignUp } },
	}}
>
	{@render children()}
</ClerkProvider>
