import { Command as CommandPrimitive } from "bits-ui";

import Dialog from "$lib/components/shadcn-svelte/command/command-dialog.svelte";
import Empty from "$lib/components/shadcn-svelte/command/command-empty.svelte";
import Group from "$lib/components/shadcn-svelte/command/command-group.svelte";
import Input from "$lib/components/shadcn-svelte/command/command-input.svelte";
import Item from "$lib/components/shadcn-svelte/command/command-item.svelte";
import LinkItem from "$lib/components/shadcn-svelte/command/command-link-item.svelte";
import List from "$lib/components/shadcn-svelte/command/command-list.svelte";
import Separator from "$lib/components/shadcn-svelte/command/command-separator.svelte";
import Shortcut from "$lib/components/shadcn-svelte/command/command-shortcut.svelte";
import Root from "$lib/components/shadcn-svelte/command/command.svelte";

const Loading = CommandPrimitive.Loading;

export {
	//
	Root as Command,
	Dialog as CommandDialog,
	Empty as CommandEmpty,
	Group as CommandGroup,
	Input as CommandInput,
	Item as CommandItem,
	LinkItem as CommandLinkItem,
	List as CommandList,
	Loading as CommandLoading,
	Separator as CommandSeparator,
	Shortcut as CommandShortcut,
	Dialog,
	Empty,
	Group,
	Input,
	Item,
	LinkItem,
	List,
	Loading,
	Root,
	Separator,
	Shortcut,
};
