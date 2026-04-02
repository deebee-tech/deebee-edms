<script lang="ts">
	import { mode } from "mode-watcher";
	import { ClerkLoaded } from "svelte-clerk";

	let { children, data } = $props();
	let layoutEl: HTMLDivElement | undefined = $state();
	let cardReady = $state(false);

	$effect(() => {
		if (!layoutEl) return;

		const check = () => (cardReady = !!layoutEl!.querySelector(".cl-card"));
		check();

		const observer = new MutationObserver(check);
		observer.observe(layoutEl, { childList: true, subtree: true });
		return () => observer.disconnect();
	});
</script>

<ClerkLoaded>
	<div
		bind:this={layoutEl}
		id="auth-layout"
		class="flex h-screen w-screen flex-col items-center justify-center
			{cardReady ? 'opacity-100 transition-opacity duration-100' : 'opacity-0'}"
		style="background-color: {data.authBackgroundColor ??
			'var(--background)'};--clerk-primary-color: {data.authPrimaryColor ??
			'var(--primary)'};--clerk-card-color: var(--card);"
	>
		<div class="mb-8" style="width: {data.authLogoWidth ?? '84px'}; height: {data.authLogoHeight ?? '84px'};">
			<img
				src={(data.authLogo ?? mode.current === "dark") ? "/bee_logo_dark.png" : "/bee_logo_light.png"}
				alt="auth logo"
			/>
		</div>
		{@render children()}
	</div>
</ClerkLoaded>

<style>
	:global(#auth-layout .cl-formButtonPrimary) {
		background-color: var(--clerk-primary-color);
		box-shadow: 0 1px 2px 0 color-mix(in srgb, var(--clerk-primary-color) 35%, transparent);
		transition:
			background-color 150ms ease,
			box-shadow 150ms ease;
	}

	:global(#auth-layout .cl-formButtonPrimary:hover:not(:disabled)),
	:global(#auth-layout .cl-formButtonPrimary:focus-visible:not(:disabled)) {
		background-color: color-mix(in oklch, var(--clerk-primary-color) 78%, black);
		box-shadow: 0 1px 2px 0 color-mix(in srgb, var(--clerk-primary-color) 50%, transparent);
	}

	:global(#auth-layout .cl-formButtonPrimary:active:not(:disabled)) {
		background-color: color-mix(in oklch, var(--clerk-primary-color) 68%, black);
	}

	:global(#auth-layout .cl-formFieldLabel),
	:global(#auth-layout .cl-formFieldAction),
	:global(#auth-layout .cl-footerActionLink),
	:global(#auth-layout .cl-headerTitle) {
		color: var(--clerk-primary-color);
	}

	/* .cl-footer sits beside .cl-card in .cl-cardBox; Clerk sets background via Emotion (muted). */
	:global(#auth-layout .cl-card),
	:global(#auth-layout .cl-footer),
	:global(#auth-layout .cl-footerAction) {
		background: var(--clerk-card-color);
	}
</style>
