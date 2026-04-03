import { browser } from "$app/environment";
import { createContext } from "svelte";

export interface AppCookies {
	selectedOrgId: string | undefined;
}

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365;

export const COOKIE_NAMES: Record<keyof AppCookies, string> = {
	selectedOrgId: "deebee_edms:selected_org_id",
};

export class CookieStore {
	values = $state<AppCookies>({} as AppCookies);

	constructor(getter: () => AppCookies) {
		this.values = { ...getter() };
		$effect(() => {
			Object.assign(this.values, getter());
		});
	}

	set(name: keyof AppCookies, value: string, maxAge = DEFAULT_MAX_AGE) {
		this.values[name] = value;
		if (browser) {
			const cookieName = COOKIE_NAMES[name];
			document.cookie = `${cookieName}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
		}
	}

	remove(name: keyof AppCookies) {
		this.values[name] = undefined;
		if (browser) {
			const cookieName = COOKIE_NAMES[name];
			document.cookie = `${cookieName}=; path=/; max-age=0`;
		}
	}
}

export const [getCookieStore, setCookieStore] = createContext<CookieStore>();
