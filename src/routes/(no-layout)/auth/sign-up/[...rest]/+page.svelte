<script lang="ts">
	import { SignUp } from "svelte-clerk";
	let { data } = $props();
</script>

<svelte:head>
	<title>{data.authPageTitleSignUp}</title>
</svelte:head>

<SignUp signInUrl={data.signInUrl} />
