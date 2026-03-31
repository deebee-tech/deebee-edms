<script lang="ts">
	let { children, data } = $props();
</script>

<div
	class="flex h-screen w-screen items-center justify-center"
	style="background-color: {data.authBackgroundColor ??
		'var(--background)'};--clerk-primary-color: {data.authPrimaryColor ?? 'var(--primary)'};"
>
	{@render children()}
</div>

<style>
	:global(.cl-button-primary) {
		background-color: var(--clerk-primary-color);
	}

	:global(.cl-formFieldLabel),
	:global(.cl-formFieldAction),
	:global(.cl-footerActionLink),
	:global(.cl-headerTitle) {
		color: var(--clerk-primary-color);
	}
</style>
