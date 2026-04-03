export type Language = {
	/** Language code (e.g., 'en', 'de') */
	code: string;
	/** Display name (e.g., 'English', 'Deutsch') */
	label: string;
	/** ISO 3166-1 alpha-2 country code for the flag (e.g., 'GB', 'DE') */
	countryCode?: string;
};

export type LanguageSwitcherProps = {
	/** List of available languages (defaults to paraglide locales if omitted) */
	languages?: Language[];

	/** Current selected language code */
	value?: string;

	/** Dropdown alignment */
	align?: "start" | "center" | "end";

	/** Button variant */
	variant?: "outline" | "ghost";

	/** Called when the language changes */
	onChange?: (code: string) => void;

	class?: string;
};
