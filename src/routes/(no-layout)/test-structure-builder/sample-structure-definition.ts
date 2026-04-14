import type { StructureDefinition } from "$lib/components/structure-builder/types";

export const sampleStructureDefinition: StructureDefinition = {
	id: "conf-2026",
	name: "Annual Conference 2026",
	description: "Build and configure the annual conference experience",
	sections: [
		{
			id: "attendee-info",
			title: "Attendee Information",
			description: "Collect basic attendee details",
			icon: "user",
			forms: [
				{
					id: "attendee-form",
					stateKey: "attendee",
					form: {
						id: "attendee-form-def",
						name: "Attendee Details",
						description: "Please provide your information",
						fields: [
							{
								id: "f-first-name",
								name: "first_name",
								type: "text",
								label: "First Name",
								required: true,
								width: "half",
							},
							{
								id: "f-last-name",
								name: "last_name",
								type: "text",
								label: "Last Name",
								required: true,
								width: "half",
							},
							{
								id: "f-email",
								name: "email",
								type: "email",
								label: "Email Address",
								required: true,
							},
							{
								id: "f-pass-type",
								name: "pass_type",
								type: "select",
								label: "Pass Type",
								required: true,
								options: [
									{ label: "Day Pass", value: "day_pass" },
									{ label: "Full Pass", value: "full_pass" },
									{ label: "VIP Pass", value: "vip_pass" },
								],
							},
						],
					},
				},
			],
		},
		{
			id: "sessions",
			title: "Session Selection",
			description: "Choose your sessions for the conference",
			icon: "calendar-days",
			children: [
				{
					id: "keynotes",
					title: "Keynote Sessions",
					description: "Select which keynote sessions you will attend",
					icon: "mic",
					forms: [
						{
							id: "keynote-form",
							stateKey: "keynotes",
							form: {
								id: "keynote-form-def",
								name: "Keynote Selection",
								fields: [
									{
										id: "f-keynote-day1",
										name: "day1_keynote",
										type: "select",
										label: "Day 1 Keynote",
										required: true,
										options: [
											{ label: "Opening Ceremony & Vision", value: "opening" },
											{ label: "Industry Trends 2026", value: "trends" },
										],
									},
									{
										id: "f-keynote-day2",
										name: "day2_keynote",
										type: "select",
										label: "Day 2 Keynote",
										required: true,
										options: [
											{ label: "Innovation Panel", value: "innovation" },
											{ label: "Leadership Forum", value: "leadership" },
										],
									},
								],
							},
						},
					],
				},
				{
					id: "workshops",
					title: "Workshop Sessions",
					description: "Available only for Full Pass and VIP holders",
					icon: "wrench",
					conditions: {
						visibility: [
							{
								stateKey: "attendee.pass_type",
								operator: "in",
								value: ["full_pass", "vip_pass"],
							},
						],
					},
					forms: [
						{
							id: "workshop-form",
							stateKey: "workshops",
							form: {
								id: "workshop-form-def",
								name: "Workshop Selection",
								fields: [
									{
										id: "f-workshop-am",
										name: "morning_workshop",
										type: "select",
										label: "Morning Workshop",
										options: [
											{ label: "Hands-on AI Lab", value: "ai_lab" },
											{ label: "Cloud Architecture Deep Dive", value: "cloud" },
											{ label: "Design Systems Workshop", value: "design" },
										],
									},
									{
										id: "f-workshop-pm",
										name: "afternoon_workshop",
										type: "select",
										label: "Afternoon Workshop",
										options: [
											{ label: "Security Best Practices", value: "security" },
											{ label: "Performance Optimization", value: "perf" },
											{ label: "Team Leadership Skills", value: "leadership" },
										],
									},
								],
							},
						},
					],
				},
			],
			conditions: {
				prerequisites: ["attendee-info"],
			},
		},
		{
			id: "accommodation",
			title: "Accommodation",
			description: "Optional hotel booking",
			icon: "hotel",
			conditions: {
				skippable: true,
				prerequisites: ["attendee-info"],
			},
			forms: [
				{
					id: "hotel-form",
					stateKey: "accommodation",
					form: {
						id: "hotel-form-def",
						name: "Hotel Preferences",
						fields: [
							{
								id: "f-checkin",
								name: "check_in",
								type: "date",
								label: "Check-in Date",
								width: "half",
							},
							{
								id: "f-checkout",
								name: "check_out",
								type: "date",
								label: "Check-out Date",
								width: "half",
							},
							{
								id: "f-room",
								name: "room_type",
								type: "select",
								label: "Room Type",
								options: [
									{ label: "Standard Single", value: "single" },
									{ label: "Standard Double", value: "double" },
									{ label: "Suite", value: "suite" },
								],
							},
							{
								id: "f-special-requests",
								name: "special_requests",
								type: "textarea",
								label: "Special Requests",
								placeholder: "Any dietary requirements, accessibility needs, etc.",
							},
						],
					},
				},
			],
		},
		{
			id: "dietary",
			title: "Dietary & Accessibility",
			description: "Let us know about any requirements",
			icon: "utensils",
			conditions: {
				prerequisites: ["attendee-info"],
			},
			forms: [
				{
					id: "dietary-form",
					stateKey: "dietary",
					form: {
						id: "dietary-form-def",
						name: "Dietary & Accessibility Needs",
						fields: [
							{
								id: "f-diet",
								name: "dietary_preference",
								type: "select",
								label: "Dietary Preference",
								options: [
									{ label: "No restrictions", value: "none" },
									{ label: "Vegetarian", value: "vegetarian" },
									{ label: "Vegan", value: "vegan" },
									{ label: "Gluten-free", value: "gluten_free" },
									{ label: "Halal", value: "halal" },
									{ label: "Kosher", value: "kosher" },
								],
							},
							{
								id: "f-allergies",
								name: "allergies",
								type: "textarea",
								label: "Allergies",
								placeholder: "List any food allergies",
							},
							{
								id: "f-accessibility",
								name: "accessibility_needs",
								type: "textarea",
								label: "Accessibility Requirements",
								placeholder: "Wheelchair access, hearing loop, etc.",
							},
						],
					},
				},
			],
		},
		{
			id: "review",
			title: "Review & Confirm",
			description: "Review your selections and confirm",
			icon: "check-circle",
			conditions: {
				prerequisites: ["attendee-info", "sessions"],
			},
			forms: [
				{
					id: "confirm-form",
					stateKey: "confirmation",
					form: {
						id: "confirm-form-def",
						name: "Confirmation",
						fields: [
							{
								id: "f-terms",
								name: "accept_terms",
								type: "checkbox",
								label: "I accept the terms and conditions",
								required: true,
							},
							{
								id: "f-newsletter",
								name: "subscribe_newsletter",
								type: "switch",
								label: "Subscribe to conference updates",
							},
						],
					},
				},
			],
		},
	],
};
