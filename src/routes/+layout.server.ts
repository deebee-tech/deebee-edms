// src/routes/+layout.server.ts
import { env } from "$env/dynamic/public";
import { redirect } from "@sveltejs/kit";
import { buildClerkProps } from "svelte-clerk/server";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = ({ locals, url }) => {
	const { userId } = locals.auth();

	if (!userId && !url.pathname.startsWith("/auth")) {
		return redirect(307, env.PUBLIC_CLERK_SIGN_IN_URL);
	}
	return {
		...buildClerkProps(locals.auth()),
	};
};
