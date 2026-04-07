import PlayIcon from "@lucide/svelte/icons/play";
import WebhookIcon from "@lucide/svelte/icons/webhook";
import GlobeIcon from "@lucide/svelte/icons/globe";
import GitBranchIcon from "@lucide/svelte/icons/git-branch";
import ShuffleIcon from "@lucide/svelte/icons/shuffle";
import TimerIcon from "@lucide/svelte/icons/timer";
import MailIcon from "@lucide/svelte/icons/mail";
import RepeatIcon from "@lucide/svelte/icons/repeat";
import DatabaseIcon from "@lucide/svelte/icons/database";
import CodeIcon from "@lucide/svelte/icons/code";
import type { Component } from "svelte";
import type { NodeType, NodeCategory, ConfigField } from "./types";

export interface NodeRegistryEntry {
	label: string;
	icon: Component;
	category: NodeCategory;
	description: string;
	color: string;
	defaultConfig: Record<string, unknown>;
	configSchema: ConfigField[];
	hasFailureOutput: boolean;
}

export const nodeRegistry: Record<NodeType, NodeRegistryEntry> = {
	"manual-trigger": {
		label: "Manual Trigger",
		icon: PlayIcon,
		category: "trigger",
		description: "Start the workflow manually",
		color: "emerald",
		hasFailureOutput: false,
		defaultConfig: { description: "" },
		configSchema: [
			{
				name: "description",
				label: "Description",
				type: "textarea",
				placeholder: "Describe when this workflow should be triggered...",
			},
		],
	},
	"webhook-trigger": {
		label: "Webhook Trigger",
		icon: WebhookIcon,
		category: "trigger",
		description: "Start the workflow via HTTP webhook",
		color: "emerald",
		hasFailureOutput: false,
		defaultConfig: { path: "/webhook", method: "POST" },
		configSchema: [
			{
				name: "path",
				label: "Webhook Path",
				type: "text",
				placeholder: "/webhook/my-endpoint",
				required: true,
			},
			{
				name: "method",
				label: "HTTP Method",
				type: "select",
				required: true,
				options: [
					{ label: "GET", value: "GET" },
					{ label: "POST", value: "POST" },
					{ label: "PUT", value: "PUT" },
					{ label: "DELETE", value: "DELETE" },
				],
			},
		],
	},
	"api-call": {
		label: "API Call",
		icon: GlobeIcon,
		category: "action",
		description: "Make an HTTP request",
		color: "blue",
		hasFailureOutput: true,
		defaultConfig: { method: "GET", url: "", headers: {}, body: "", timeout: 30000 },
		configSchema: [
			{
				name: "method",
				label: "Method",
				type: "select",
				required: true,
				options: [
					{ label: "GET", value: "GET" },
					{ label: "POST", value: "POST" },
					{ label: "PUT", value: "PUT" },
					{ label: "PATCH", value: "PATCH" },
					{ label: "DELETE", value: "DELETE" },
				],
			},
			{
				name: "url",
				label: "URL",
				type: "text",
				placeholder: "https://api.example.com/endpoint",
				required: true,
			},
			{
				name: "headers",
				label: "Headers",
				type: "kv-pairs",
				description: "Request headers as key-value pairs",
			},
			{
				name: "body",
				label: "Body",
				type: "json",
				placeholder: '{"key": "value"}',
				description: "Request body (JSON). Supports {{state.var}} references.",
			},
			{
				name: "timeout",
				label: "Timeout (ms)",
				type: "number",
				defaultValue: 30000,
			},
		],
	},
	condition: {
		label: "Condition",
		icon: GitBranchIcon,
		category: "logic",
		description: "Branch based on a condition",
		color: "amber",
		hasFailureOutput: true,
		defaultConfig: { field: "", operator: "eq", value: "" },
		configSchema: [
			{
				name: "field",
				label: "Field",
				type: "expression",
				placeholder: "state.myVariable",
				required: true,
				description: "The state field to evaluate",
			},
			{
				name: "operator",
				label: "Operator",
				type: "select",
				required: true,
				options: [
					{ label: "Equals", value: "eq" },
					{ label: "Not Equals", value: "neq" },
					{ label: "Greater Than", value: "gt" },
					{ label: "Greater or Equal", value: "gte" },
					{ label: "Less Than", value: "lt" },
					{ label: "Less or Equal", value: "lte" },
					{ label: "Contains", value: "contains" },
					{ label: "Not Contains", value: "not-contains" },
					{ label: "Exists", value: "exists" },
					{ label: "Not Exists", value: "not-exists" },
				],
			},
			{
				name: "value",
				label: "Value",
				type: "text",
				placeholder: "Value to compare against",
				description: "Supports {{state.var}} references",
			},
		],
	},
	transform: {
		label: "Transform",
		icon: ShuffleIcon,
		category: "logic",
		description: "Map and reshape data in state",
		color: "amber",
		hasFailureOutput: true,
		defaultConfig: { assignments: [{ key: "", value: "" }] },
		configSchema: [
			{
				name: "assignments",
				label: "Assignments",
				type: "kv-pairs",
				description: "Set state variables. Values support {{state.var}} references.",
			},
		],
	},
	delay: {
		label: "Delay",
		icon: TimerIcon,
		category: "action",
		description: "Wait for a specified duration",
		color: "blue",
		hasFailureOutput: false,
		defaultConfig: { duration: 1, unit: "s" },
		configSchema: [
			{
				name: "duration",
				label: "Duration",
				type: "number",
				required: true,
				defaultValue: 1,
			},
			{
				name: "unit",
				label: "Unit",
				type: "select",
				required: true,
				options: [
					{ label: "Milliseconds", value: "ms" },
					{ label: "Seconds", value: "s" },
					{ label: "Minutes", value: "m" },
					{ label: "Hours", value: "h" },
				],
			},
		],
	},
	email: {
		label: "Send Email",
		icon: MailIcon,
		category: "action",
		description: "Send an email message",
		color: "blue",
		hasFailureOutput: true,
		defaultConfig: { to: "", subject: "", body: "", from: "" },
		configSchema: [
			{
				name: "to",
				label: "To",
				type: "text",
				placeholder: "recipient@example.com",
				required: true,
				description: "Supports {{state.var}} references",
			},
			{
				name: "from",
				label: "From",
				type: "text",
				placeholder: "sender@example.com",
			},
			{
				name: "subject",
				label: "Subject",
				type: "text",
				placeholder: "Email subject",
				required: true,
			},
			{
				name: "body",
				label: "Body",
				type: "textarea",
				placeholder: "Email body content...",
				required: true,
				description: "Supports {{state.var}} references",
			},
		],
	},
	loop: {
		label: "Loop",
		icon: RepeatIcon,
		category: "logic",
		description: "Iterate over a collection in state",
		color: "amber",
		hasFailureOutput: true,
		defaultConfig: { collection: "", itemVariable: "item", indexVariable: "index" },
		configSchema: [
			{
				name: "collection",
				label: "Collection",
				type: "expression",
				placeholder: "state.myArray",
				required: true,
				description: "The state field containing the array to iterate",
			},
			{
				name: "itemVariable",
				label: "Item Variable",
				type: "text",
				placeholder: "item",
				required: true,
				description: "Variable name for the current item",
			},
			{
				name: "indexVariable",
				label: "Index Variable",
				type: "text",
				placeholder: "index",
				description: "Variable name for the current index",
			},
		],
	},
	"supabase-query": {
		label: "Supabase Query",
		icon: DatabaseIcon,
		category: "integration",
		description: "Query or mutate data in Supabase",
		color: "violet",
		hasFailureOutput: true,
		defaultConfig: {
			table: "",
			operation: "select",
			filters: "",
			body: "",
			resultVariable: "queryResult",
		},
		configSchema: [
			{
				name: "table",
				label: "Table",
				type: "text",
				placeholder: "my_table",
				required: true,
			},
			{
				name: "operation",
				label: "Operation",
				type: "select",
				required: true,
				options: [
					{ label: "Select", value: "select" },
					{ label: "Insert", value: "insert" },
					{ label: "Update", value: "update" },
					{ label: "Delete", value: "delete" },
				],
			},
			{
				name: "filters",
				label: "Filters",
				type: "json",
				placeholder: '{"column": "value"}',
				description: "Filter conditions (JSON)",
			},
			{
				name: "body",
				label: "Data",
				type: "json",
				placeholder: '{"column": "value"}',
				description: "Data for insert/update operations",
			},
			{
				name: "resultVariable",
				label: "Result Variable",
				type: "text",
				placeholder: "queryResult",
				description: "State variable to store the result",
			},
		],
	},
	"custom-script": {
		label: "Custom Script",
		icon: CodeIcon,
		category: "integration",
		description: "Run custom JavaScript code",
		color: "violet",
		hasFailureOutput: true,
		defaultConfig: {
			code: "// Access global state via `state`\n// Return an object to update state\nreturn {};",
		},
		configSchema: [
			{
				name: "code",
				label: "Script",
				type: "textarea",
				placeholder: "// Your JavaScript code here...",
				required: true,
				description: "Access state via `state` object. Return an object to merge into state.",
			},
		],
	},
};

export const nodeCategories: Record<NodeCategory, string> = {
	trigger: "Triggers",
	action: "Actions",
	logic: "Logic",
	integration: "Integrations",
};
