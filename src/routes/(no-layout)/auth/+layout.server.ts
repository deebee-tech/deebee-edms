import { env } from "$env/dynamic/public";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ parent }) => {
	const { organizationSettings } = await parent();

	const authBackgroundColor = organizationSettings["auth_background_color"];
	const authPrimaryColor = organizationSettings["auth_primary_color"];
	const authLogo = organizationSettings["auth_logo"];
	const authLogoWidth = organizationSettings["auth_logo_width"];
	const authLogoHeight = organizationSettings["auth_logo_height"];

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
