/// <reference types="svelte-clerk/env" />

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			appCookies: import("$lib/stores/cookies.svelte").AppCookies;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
