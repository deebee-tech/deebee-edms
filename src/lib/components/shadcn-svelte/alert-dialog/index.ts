import Action from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-action.svelte";
import Cancel from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-cancel.svelte";
import Content from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-content.svelte";
import Description from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-description.svelte";
import Footer from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-footer.svelte";
import Header from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-header.svelte";
import Overlay from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-overlay.svelte";
import Title from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-title.svelte";
import Trigger from "$lib/components/shadcn-svelte/alert-dialog/alert-dialog-trigger.svelte";
import { AlertDialog as AlertDialogPrimitive } from "bits-ui";

const Root = AlertDialogPrimitive.Root;
const Portal = AlertDialogPrimitive.Portal;

export {
	Action,
	//
	Root as AlertDialog,
	Action as AlertDialogAction,
	Cancel as AlertDialogCancel,
	Content as AlertDialogContent,
	Description as AlertDialogDescription,
	Footer as AlertDialogFooter,
	Header as AlertDialogHeader,
	Overlay as AlertDialogOverlay,
	Portal as AlertDialogPortal,
	Title as AlertDialogTitle,
	Trigger as AlertDialogTrigger,
	Cancel,
	Content,
	Description,
	Footer,
	Header,
	Overlay,
	Portal,
	Root,
	Title,
	Trigger,
};
