import Content from "$lib/components/shadcn-svelte/field-set/field-set-content.svelte";
import Footer from "$lib/components/shadcn-svelte/field-set/field-set-footer.svelte";
import Title from "$lib/components/shadcn-svelte/field-set/field-set-title.svelte";
import Root from "$lib/components/shadcn-svelte/field-set/field-set.svelte";
import type {
	FieldSetContentProps,
	FieldSetFooterProps,
	FieldSetRootProps,
	FieldSetTitleProps,
} from "$lib/components/shadcn-svelte/field-set/types";
import { tv, type VariantProps } from "tailwind-variants";

export const fieldSetVariants = tv({
	base: "border-border flex h-fit w-full flex-col rounded-lg border",
	variants: {
		variant: {
			default: "border-border bg-card",
			destructive: "border-destructive",
		},
	},
});

export type Variant = VariantProps<typeof fieldSetVariants>["variant"];

export {
	Content,
	Footer,
	Root,
	Title,
	type FieldSetContentProps as ContentProps,
	type FieldSetFooterProps as FooterProps,
	type FieldSetRootProps as RootProps,
	type FieldSetTitleProps as TitleProps,
};
