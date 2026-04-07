import { Drawer as DrawerPrimitive } from "vaul-svelte";

import Close from "$lib/components/shadcn-svelte/drawer/drawer-close.svelte";
import Content from "$lib/components/shadcn-svelte/drawer/drawer-content.svelte";
import Description from "$lib/components/shadcn-svelte/drawer/drawer-description.svelte";
import Footer from "$lib/components/shadcn-svelte/drawer/drawer-footer.svelte";
import Header from "$lib/components/shadcn-svelte/drawer/drawer-header.svelte";
import NestedRoot from "$lib/components/shadcn-svelte/drawer/drawer-nested.svelte";
import Overlay from "$lib/components/shadcn-svelte/drawer/drawer-overlay.svelte";
import Title from "$lib/components/shadcn-svelte/drawer/drawer-title.svelte";
import Trigger from "$lib/components/shadcn-svelte/drawer/drawer-trigger.svelte";
import Root from "$lib/components/shadcn-svelte/drawer/drawer.svelte";

const Portal: typeof DrawerPrimitive.Portal = DrawerPrimitive.Portal;

export {
	Close,
	Content,
	Description,
	//
	Root as Drawer,
	Close as DrawerClose,
	Content as DrawerContent,
	Description as DrawerDescription,
	Footer as DrawerFooter,
	Header as DrawerHeader,
	NestedRoot as DrawerNestedRoot,
	Overlay as DrawerOverlay,
	Portal as DrawerPortal,
	Title as DrawerTitle,
	Trigger as DrawerTrigger,
	Footer,
	Header,
	NestedRoot,
	Overlay,
	Portal,
	Root,
	Title,
	Trigger,
};
