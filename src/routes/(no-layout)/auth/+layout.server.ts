import { env } from "$env/dynamic/public";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ parent }) => {
	const { organizationSettings } = await parent();

	const authBackgroundColor: string | undefined = organizationSettings.find(
		(os) => os.settings_key === "auth_background_color",
	)?.settings_value;

	const authPrimaryColor: string | undefined = organizationSettings.find(
		(os) => os.settings_key === "auth_primary_color",
	)?.settings_value;

	const authLogo: string | undefined = organizationSettings.find(
		(os) => os.settings_key === "auth_logo",
	)?.settings_value;

	const authLogoWidth: string | undefined = organizationSettings.find(
		(os) => os.settings_key === "auth_logo_width",
	)?.settings_value;

	const authLogoHeight: string | undefined = organizationSettings.find(
		(os) => os.settings_key === "auth_logo_height",
	)?.settings_value;

	return {
		authBackgroundColor,
		authPrimaryColor,
		authLogo,
		authLogoWidth,
		authLogoHeight,
		signInUrl: env.PUBLIC_CLERK_SIGN_IN_URL ?? "/auth/sign-in",
		signUpUrl: env.PUBLIC_CLERK_SIGN_UP_URL ?? "/auth/sign-up",
	};
};
