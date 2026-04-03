import { getTextDirection } from "$lib/paraglide/runtime";
import { paraglideMiddleware } from "$lib/paraglide/server";
import { COOKIE_NAMES } from "$lib/stores/cookies.svelte";
import { type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { withClerkHandler } from "svelte-clerk/server";

const handleCookies: Handle = async ({ event, resolve }) => {
	event.locals.appCookies = {
		selectedOrgId: event.cookies.get(COOKIE_NAMES.selectedOrgId),
	};
	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace("%paraglide.lang%", locale).replace("%paraglide.dir%", getTextDirection(locale)),
		});
	});

export const handle: Handle = sequence(handleCookies, withClerkHandler(), handleParaglide);
