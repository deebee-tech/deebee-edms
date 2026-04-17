import type { AudienceDefinition } from "$lib/components/audience-builder";

/**
 * A reasonably meaty default audience that exercises:
 *   - HAS conditions
 *   - DOES NOT HAVE conditions
 *   - Two top-level groups OR'd together
 *   - A group whose internal logic is OR (the second group)
 *
 * Reads as: "(West-coast customers who are decision makers and into hiking,
 * and aren't churned) OR (vegan or vegetarian people who are also into cooking)."
 */
export const sampleAudienceDefinition: AudienceDefinition = {
	id: "audience-sample-1",
	name: "Active West-Coast Champions",
	description: "Demo audience showing single-tag HAS / DOES NOT HAVE rows with AND/OR groups.",
	version: 1,
	objectType: "person",
	groups: [
		{
			id: "grp-1",
			name: "West-Coast Decision Makers",
			logic: "and",
			conditions: [
				{ id: "c-1-region", mode: "has", tagTypeId: "tt-region", tagIds: ["tag-west"] },
				{ id: "c-1-role", mode: "has", tagTypeId: "tt-role", tagIds: ["tag-decisionmaker"] },
				{ id: "c-1-interest", mode: "has", tagTypeId: "tt-interests", tagIds: ["tag-hiking"] },
				{ id: "c-1-not-churned", mode: "has_not", tagTypeId: "tt-lifecycle", tagIds: ["tag-churned"] },
			],
		},
		{
			id: "grp-2",
			name: "Plant-Based Foodies",
			logic: "or",
			conditions: [
				{ id: "c-2-vegan", mode: "has", tagTypeId: "tt-diet", tagIds: ["tag-vegan"] },
				{ id: "c-2-vegetarian", mode: "has", tagTypeId: "tt-diet", tagIds: ["tag-vegetarian"] },
				{ id: "c-2-cooking", mode: "has", tagTypeId: "tt-interests", tagIds: ["tag-cooking"] },
			],
		},
	],
};
