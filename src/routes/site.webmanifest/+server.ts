import { supabase } from "$lib/database/supabase.client";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
	const settings: Record<string, string> = {};

	const { orgId } = locals.auth();
	if (orgId) {
		const { data, error } = await supabase
			.from("organizations")
			.select(`organization_settings(settings_key, settings_value)`)
			.eq("organization_identifier", orgId);

		if (!error && data) {
			for (const setting of data) {
				for (const os of setting.organization_settings) {
					settings[os.settings_key] = os.settings_value;
				}
			}
		}
	}

	const manifest = {
		name: settings["app_name"] ?? "",
		short_name: settings["app_short_name"] ?? "",
		icons: [
			{
				src: settings["icon_android_chrome_192"] ?? "/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: settings["icon_android_chrome_512"] ?? "/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
		theme_color: settings["color_theme_color_light"] ?? "#faf8f6",
		background_color: settings["color_theme_color_light"] ?? "#faf8f6",
		display: "standalone" as const,
	};

	return json(manifest, {
		headers: {
			"Content-Type": "application/manifest+json",
		},
	});
};
