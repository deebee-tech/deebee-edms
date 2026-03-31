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

	return {
		authBackgroundColor,
		authPrimaryColor,
		signInUrl: env.PUBLIC_CLERK_SIGN_IN_URL ?? "/auth/sign-in",
		signUpUrl: env.PUBLIC_CLERK_SIGN_UP_URL ?? "/auth/sign-up",
	};
};
