import TypeIcon from "@lucide/svelte/icons/type";
import MailIcon from "@lucide/svelte/icons/mail";
import LockIcon from "@lucide/svelte/icons/lock";
import HashIcon from "@lucide/svelte/icons/hash";
import AlignLeftIcon from "@lucide/svelte/icons/align-left";
import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
import SquareCheckIcon from "@lucide/svelte/icons/square-check";
import ToggleLeftIcon from "@lucide/svelte/icons/toggle-left";
import CircleDotIcon from "@lucide/svelte/icons/circle-dot";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import PhoneIcon from "@lucide/svelte/icons/phone";
import TagsIcon from "@lucide/svelte/icons/tags";
import UploadIcon from "@lucide/svelte/icons/upload";
import SlidersHorizontalIcon from "@lucide/svelte/icons/sliders-horizontal";
import KeyboardIcon from "@lucide/svelte/icons/keyboard";
import PaletteIcon from "@lucide/svelte/icons/palette";
import TextIcon from "@lucide/svelte/icons/text";
import type { Component } from "svelte";
import type { FieldType, FormFieldDefinition } from "./types";

export type FieldCategory = "basic" | "choice" | "advanced" | "special";

export interface FieldRegistryEntry {
	label: string;
	icon: Component;
	category: FieldCategory;
	defaults: Partial<FormFieldDefinition>;
}

export const fieldRegistry: Record<FieldType, FieldRegistryEntry> = {
	text: {
		label: "Text Input",
		icon: TypeIcon,
		category: "basic",
		defaults: { placeholder: "Enter text..." },
	},
	email: {
		label: "Email",
		icon: MailIcon,
		category: "basic",
		defaults: { placeholder: "name@example.com" },
	},
	password: {
		label: "Password",
		icon: LockIcon,
		category: "basic",
		defaults: { placeholder: "Enter password..." },
	},
	number: {
		label: "Number",
		icon: HashIcon,
		category: "basic",
		defaults: { placeholder: "0" },
	},
	textarea: {
		label: "Textarea",
		icon: AlignLeftIcon,
		category: "basic",
		defaults: { placeholder: "Enter text..." },
	},
	select: {
		label: "Select",
		icon: ChevronDownIcon,
		category: "choice",
		defaults: {
			placeholder: "Select an option...",
			options: [
				{ label: "Option 1", value: "option1" },
				{ label: "Option 2", value: "option2" },
			],
		},
	},
	checkbox: {
		label: "Checkbox",
		icon: SquareCheckIcon,
		category: "choice",
		defaults: { defaultValue: false },
	},
	switch: {
		label: "Switch",
		icon: ToggleLeftIcon,
		category: "choice",
		defaults: { defaultValue: false },
	},
	radio: {
		label: "Radio Group",
		icon: CircleDotIcon,
		category: "choice",
		defaults: {
			options: [
				{ label: "Option 1", value: "option1" },
				{ label: "Option 2", value: "option2" },
			],
		},
	},
	date: {
		label: "Date Picker",
		icon: CalendarIcon,
		category: "advanced",
		defaults: { placeholder: "Pick a date..." },
	},
	phone: {
		label: "Phone",
		icon: PhoneIcon,
		category: "advanced",
		defaults: { placeholder: "+1 (555) 000-0000" },
	},
	tags: {
		label: "Tags",
		icon: TagsIcon,
		category: "advanced",
		defaults: { placeholder: "Add tags...", defaultValue: [] },
	},
	file: {
		label: "File Upload",
		icon: UploadIcon,
		category: "advanced",
		defaults: {},
	},
	slider: {
		label: "Slider",
		icon: SlidersHorizontalIcon,
		category: "advanced",
		defaults: { defaultValue: 50, validation: { min: 0, max: 100, step: 1 } },
	},
	otp: {
		label: "OTP Input",
		icon: KeyboardIcon,
		category: "special",
		defaults: { validation: { minLength: 6, maxLength: 6 } },
	},
	color: {
		label: "Color Picker",
		icon: PaletteIcon,
		category: "special",
		defaults: { defaultValue: "#000000" },
	},
	richtext: {
		label: "Rich Text",
		icon: TextIcon,
		category: "special",
		defaults: { placeholder: "Enter rich text..." },
	},
};

export const fieldCategories: Record<FieldCategory, string> = {
	basic: "Basic",
	choice: "Choice",
	advanced: "Advanced",
	special: "Special",
};
