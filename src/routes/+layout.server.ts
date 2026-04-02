import { env } from "$env/dynamic/public";
import { supabase } from "$lib/database/supabase.client";
import { redirect } from "@sveltejs/kit";
import { buildClerkProps } from "svelte-clerk/server";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { userId } = locals.auth();
	const organizationSettings: Record<string, string> = {};

	const { data, error } = await supabase
		.from("organizations")
		.select(`organization_settings(settings_key, settings_value)`)
		.eq("organization_identifier", userId ?? "");

	if (!error && data) {
		for (const setting of data) {
			for (const os of setting.organization_settings) {
				organizationSettings[os.settings_key] = os.settings_value;
			}
		}
	}

	const authPageTitleSignIn = organizationSettings["auth_page_title_sign_in"];
	const authPageTitleSignUp = organizationSettings["auth_page_title_sign_up"];
	const favicon = organizationSettings["icon_favicon"];
	const favicon16 = organizationSettings["icon_favicon_16x16"];
	const favicon32 = organizationSettings["icon_favicon_32x32"];
	const appleTouchIcon = organizationSettings["icon_apple_touch_icon"];
	const themeColorLight = organizationSettings["color_theme_color_light"];
	const themeColorDark = organizationSettings["color_theme_color_dark"];

	if (!userId && !url.pathname.startsWith("/auth")) {
		return redirect(307, env.PUBLIC_CLERK_SIGN_IN_URL);
	}

	if (userId && url.pathname === "/") {
		return redirect(307, "/app");
	}

	return {
		...buildClerkProps(locals.auth()),
		authPageTitleSignIn,
		authPageTitleSignUp,
		favicon,
		favicon16,
		favicon32,
		appleTouchIcon,
		themeColorLight,
		themeColorDark,
		organizationSettings,
	};
};
