import Content from "$lib/components/shadcn-svelte/tooltip/tooltip-content.svelte";
import Trigger from "$lib/components/shadcn-svelte/tooltip/tooltip-trigger.svelte";
import { Tooltip as TooltipPrimitive } from "bits-ui";

const Root = TooltipPrimitive.Root;
const Provider = TooltipPrimitive.Provider;
const Portal = TooltipPrimitive.Portal;

export {
	Content,
	Portal,
	Provider,
	Root,
	//
	Root as Tooltip,
	Content as TooltipContent,
	Portal as TooltipPortal,
	Provider as TooltipProvider,
	Trigger as TooltipTrigger,
	Trigger,
};
