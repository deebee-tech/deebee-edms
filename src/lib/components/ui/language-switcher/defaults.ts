import { m } from "$lib/paraglide/messages";
import { type Locale, locales } from "$lib/paraglide/runtime";
import type { Language } from "./types";

const LANGUAGE_LABELS: Partial<Record<Locale, string>> = {
	en: "English",
	es: "Español",
};

const LANGUAGE_COUNTRY_CODES: Partial<Record<Locale, string>> = {
	en: "US",
	es: "ES",
};

const MESSAGE_MAP: Record<string, () => string> = {
	en: () => m.language_en(),
	es: () => m.language_es(),
};

export function getDefaultLanguages(): Language[] {
	return locales.map((code) => ({
		code,
		label: MESSAGE_MAP[code]?.() ?? LANGUAGE_LABELS[code] ?? code.toUpperCase(),
		countryCode: LANGUAGE_COUNTRY_CODES[code],
	}));
}
