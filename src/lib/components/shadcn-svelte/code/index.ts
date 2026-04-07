import CopyButton from "$lib/components/shadcn-svelte/code/code-copy-button.svelte";
import Overflow from "$lib/components/shadcn-svelte/code/code-overflow.svelte";
import Root from "$lib/components/shadcn-svelte/code/code.svelte";
import type { CodeCopyButtonProps, CodeRootProps } from "$lib/components/shadcn-svelte/code/types";
import { tv, type VariantProps } from "tailwind-variants";

export const codeVariants = tv({
	base: "not-prose relative h-full overflow-auto rounded-lg border",
	variants: {
		variant: {
			default: "border-border bg-card",
			secondary: "bg-secondary/50 border-transparent",
		},
	},
});

export type CodeVariant = VariantProps<typeof codeVariants>["variant"];

export { CopyButton, Overflow, Root, type CodeCopyButtonProps as CopyButtonProps, type CodeRootProps as RootProps };
