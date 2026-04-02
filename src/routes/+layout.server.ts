import { env } from "$env/dynamic/public";
import { supabase } from "$lib/supabase.client";
import { redirect } from "@sveltejs/kit";
import { buildClerkProps } from "svelte-clerk/server";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { userId } = locals.auth();
	const organizationSettings: Record<string, string>[] = [];

	const { data, error } = await supabase
		.from("organizations")
		.select(`organization_settings(settings_key, settings_value)`)
		.eq("organization_identifier", userId ?? "");

	if (!error && data) {
		for (const setting of data) {
			for (const os of setting.organization_settings) {
				organizationSettings.push({
					[os.settings_key]: os.settings_value,
				});
			}
		}
	}

	const authPageTitleSignIn: string | undefined = organizationSettings.find(
		(os) => os.settings_key === "auth_page_title_sign_in",
	)?.settings_value;

	const authPageTitleSignUp: string | undefined = organizationSettings.find(
		(os) => os.settings_key === "auth_page_title_sign_up",
	)?.settings_value;

	const favicon: string | undefined = organizationSettings.find((os) => os.settings_key === "favicon")?.settings_value;

	if (!userId && !url.pathname.startsWith("/auth")) {
		return redirect(307, env.PUBLIC_CLERK_SIGN_IN_URL);
	}

	if (userId && url.pathname === "/") {
		return redirect(307, "/app");
	}

	return {
		...buildClerkProps(locals.auth()),
		authPageTitleSignIn: authPageTitleSignIn,
		authPageTitleSignUp: authPageTitleSignUp,
		favicon,
		organizationSettings,
	};
};
