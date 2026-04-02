import { esES } from "@clerk/localizations";
import { type Locale, locales } from "./paraglide/runtime";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CLERK_LOCALE_MAP: Partial<Record<Locale, Record<string, any>>> = {
	es: esES,
};

export const LANGUAGE_LABELS: Partial<Record<Locale, string>> = {
	en: "English",
	es: "Español",
};

const LANGUAGE_COUNTRY_CODES: Partial<Record<Locale, string>> = {
	en: "US",
	es: "ES",
};

export const LANGUAGES = locales.map((code) => ({
	code,
	label: LANGUAGE_LABELS[code] ?? code.toUpperCase(),
	countryCode: LANGUAGE_COUNTRY_CODES[code],
}));
