import { hasFlag } from "country-flag-icons";

let flagIcons: Record<string, string> | null = null;

export async function getFlag(countryCode: string | null | undefined): Promise<string | null> {
	if (!countryCode) return null;

	const code = countryCode.toUpperCase();

	if (!hasFlag(code)) return null;

	flagIcons ??= await import("country-flag-icons/string/3x2");

	return flagIcons[code] ?? null;
}
