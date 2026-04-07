import type { ButtonElementProps } from "$lib/components/shadcn-svelte/button";
import type { UseRampOptions } from "$lib/hooks/use-ramp.svelte";
import type { WithElementRef } from "$lib/utils";
import type { Snippet } from "svelte";
import type { HTMLInputAttributes } from "svelte/elements";

export type NumberFieldRootProps = {
	value?: number;
	step?: number;
	min?: number;
	max?: number;
	rampSettings?: Omit<UseRampOptions, "increment" | "canRamp">;
	children: Snippet;
};

export type NumberFieldButtonProps = Omit<ButtonElementProps, "disabled"> & {
	disabled?: boolean;
};

export type NumberFieldInputProps = WithElementRef<Omit<HTMLInputAttributes, "min" | "max" | "value" | "type">>;
