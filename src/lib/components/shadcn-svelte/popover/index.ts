import Content from "$lib/components/shadcn-svelte/popover/popover-content.svelte";
import Trigger from "$lib/components/shadcn-svelte/popover/popover-trigger.svelte";
import { Popover as PopoverPrimitive } from "bits-ui";
const Root = PopoverPrimitive.Root;
const Close = PopoverPrimitive.Close;

export {
	Close,
	Content,
	//
	Root as Popover,
	Close as PopoverClose,
	Content as PopoverContent,
	Trigger as PopoverTrigger,
	Root,
	Trigger,
};
