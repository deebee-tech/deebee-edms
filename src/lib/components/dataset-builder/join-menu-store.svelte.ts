import { getContext, setContext } from "svelte";

const JOIN_MENU_KEY = Symbol("join-menu");

type JoinMenuRequest = (edgeId: string, x: number, y: number) => void;

export function setJoinMenuContext(handler: JoinMenuRequest) {
	setContext(JOIN_MENU_KEY, handler);
}

export function getJoinMenuContext(): JoinMenuRequest | undefined {
	return getContext<JoinMenuRequest>(JOIN_MENU_KEY);
}
