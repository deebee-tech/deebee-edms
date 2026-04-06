import type { WorkflowDefinition } from "$lib/workflows/types";

export const sampleWorkflowDefinition: WorkflowDefinition = {
	id: "sample-workflow-1",
	name: "Sample API Workflow",
	description: "Fetches data from an API, checks the status, and sends a notification",
	version: 1,
	globalState: [
		{
			key: "apiResponse",
			type: "object",
			description: "Stores the API response data",
		},
		{
			key: "notificationSent",
			type: "boolean",
			defaultValue: false,
			description: "Whether the notification email was sent",
		},
	],
	nodes: [
		{
			id: "trigger-1",
			type: "manual-trigger",
			label: "Manual Trigger",
			position: { x: 300, y: 50 },
			config: { description: "Manually start this workflow" },
		},
		{
			id: "api-1",
			type: "api-call",
			label: "Fetch User Data",
			position: { x: 300, y: 200 },
			config: {
				method: "GET",
				url: "https://jsonplaceholder.typicode.com/users/1",
				headers: {},
				body: "",
				timeout: 30000,
			},
		},
		{
			id: "condition-1",
			type: "condition",
			label: "Check Response",
			position: { x: 300, y: 380 },
			config: {
				field: "state.apiResponse.id",
				operator: "exists",
				value: "",
			},
		},
		{
			id: "transform-1",
			type: "transform",
			label: "Prepare Email",
			position: { x: 150, y: 550 },
			config: {
				assignments: [{ key: "emailBody", value: "User: {{state.apiResponse.name}}" }],
			},
		},
		{
			id: "email-1",
			type: "email",
			label: "Send Notification",
			position: { x: 150, y: 720 },
			config: {
				to: "admin@example.com",
				subject: "User Data Retrieved",
				body: "{{state.emailBody}}",
				from: "system@example.com",
			},
		},
		{
			id: "delay-1",
			type: "delay",
			label: "Wait & Retry",
			position: { x: 500, y: 550 },
			config: { duration: 5, unit: "s" },
		},
	],
	edges: [
		{
			id: "e-trigger-api",
			source: "trigger-1",
			target: "api-1",
			sourceHandle: "success",
		},
		{
			id: "e-api-condition",
			source: "api-1",
			target: "condition-1",
			sourceHandle: "success",
		},
		{
			id: "e-condition-transform",
			source: "condition-1",
			target: "transform-1",
			sourceHandle: "success",
		},
		{
			id: "e-condition-delay",
			source: "condition-1",
			target: "delay-1",
			sourceHandle: "failure",
		},
		{
			id: "e-transform-email",
			source: "transform-1",
			target: "email-1",
			sourceHandle: "success",
		},
	],
};
