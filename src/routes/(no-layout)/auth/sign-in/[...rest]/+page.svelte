<script lang="ts">
	import { SignIn } from "svelte-clerk";
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.authPageTitleSignIn}</title>
</svelte:head>

<SignIn signInUrl={data.signInUrl} signUpUrl={data.signUpUrl} />
