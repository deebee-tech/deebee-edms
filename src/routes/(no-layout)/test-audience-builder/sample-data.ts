// cspell: disable
import type { AudienceCatalog, ObjectTagLink } from "$lib/components/audience-builder";

export interface Person {
	[key: string]: unknown;
	id: string;
	name: string;
	email: string;
	city: string;
	signupDate: string;
}

const FIRST_NAMES = [
	"James",
	"Mary",
	"Robert",
	"Patricia",
	"John",
	"Jennifer",
	"Michael",
	"Linda",
	"David",
	"Elizabeth",
	"William",
	"Barbara",
	"Richard",
	"Susan",
	"Joseph",
	"Jessica",
	"Thomas",
	"Sarah",
	"Charles",
	"Karen",
	"Christopher",
	"Lisa",
	"Daniel",
	"Nancy",
	"Matthew",
	"Betty",
	"Anthony",
	"Margaret",
	"Mark",
	"Sandra",
	"Donald",
	"Ashley",
	"Steven",
	"Kimberly",
	"Paul",
	"Emily",
	"Andrew",
	"Donna",
	"Joshua",
	"Michelle",
];

const LAST_NAMES = [
	"Smith",
	"Johnson",
	"Williams",
	"Brown",
	"Jones",
	"Garcia",
	"Miller",
	"Davis",
	"Rodriguez",
	"Martinez",
	"Hernandez",
	"Lopez",
	"Gonzalez",
	"Wilson",
	"Anderson",
	"Thomas",
	"Taylor",
	"Moore",
	"Jackson",
	"Martin",
	"Lee",
	"Perez",
	"Thompson",
	"White",
	"Harris",
	"Sanchez",
	"Clark",
	"Ramirez",
	"Lewis",
	"Robinson",
];

const CITIES = ["Austin", "Boston", "Chicago", "Denver", "Miami", "Portland", "Seattle", "Brooklyn"];

// ── Tag taxonomy ──
//
// Stable IDs are used so the sample audience definition can reference them
// without relying on randomness.

export const sampleCatalog: AudienceCatalog = {
	tagTypes: [
		{ id: "tt-diet", name: "Diet", description: "Dietary preferences" },
		{ id: "tt-region", name: "Region", description: "Where they live" },
		{ id: "tt-role", name: "Role", description: "Customer role / persona" },
		{ id: "tt-interests", name: "Interests", description: "Hobbies and interests" },
		{ id: "tt-lifecycle", name: "Lifecycle Stage", description: "Where they are in the funnel" },
	],
	tags: [
		// Diet
		{ id: "tag-vegan", tagTypeId: "tt-diet", value: "vegan", label: "Vegan" },
		{ id: "tag-vegetarian", tagTypeId: "tt-diet", value: "vegetarian", label: "Vegetarian" },
		{ id: "tag-pescatarian", tagTypeId: "tt-diet", value: "pescatarian", label: "Pescatarian" },
		{ id: "tag-omnivore", tagTypeId: "tt-diet", value: "omnivore", label: "Omnivore" },
		{ id: "tag-glutenfree", tagTypeId: "tt-diet", value: "glutenfree", label: "Gluten-Free" },

		// Region
		{ id: "tag-northeast", tagTypeId: "tt-region", value: "northeast", label: "Northeast" },
		{ id: "tag-southeast", tagTypeId: "tt-region", value: "southeast", label: "Southeast" },
		{ id: "tag-midwest", tagTypeId: "tt-region", value: "midwest", label: "Midwest" },
		{ id: "tag-southwest", tagTypeId: "tt-region", value: "southwest", label: "Southwest" },
		{ id: "tag-west", tagTypeId: "tt-region", value: "west", label: "West" },

		// Role
		{ id: "tag-buyer", tagTypeId: "tt-role", value: "buyer", label: "Buyer" },
		{ id: "tag-influencer", tagTypeId: "tt-role", value: "influencer", label: "Influencer" },
		{ id: "tag-decisionmaker", tagTypeId: "tt-role", value: "decisionmaker", label: "Decision Maker" },
		{ id: "tag-enduser", tagTypeId: "tt-role", value: "enduser", label: "End User" },

		// Interests
		{ id: "tag-hiking", tagTypeId: "tt-interests", value: "hiking", label: "Hiking" },
		{ id: "tag-cooking", tagTypeId: "tt-interests", value: "cooking", label: "Cooking" },
		{ id: "tag-cycling", tagTypeId: "tt-interests", value: "cycling", label: "Cycling" },
		{ id: "tag-photography", tagTypeId: "tt-interests", value: "photography", label: "Photography" },
		{ id: "tag-gaming", tagTypeId: "tt-interests", value: "gaming", label: "Gaming" },
		{ id: "tag-reading", tagTypeId: "tt-interests", value: "reading", label: "Reading" },
		{ id: "tag-music", tagTypeId: "tt-interests", value: "music", label: "Music" },

		// Lifecycle Stage
		{ id: "tag-lead", tagTypeId: "tt-lifecycle", value: "lead", label: "Lead" },
		{ id: "tag-prospect", tagTypeId: "tt-lifecycle", value: "prospect", label: "Prospect" },
		{ id: "tag-customer", tagTypeId: "tt-lifecycle", value: "customer", label: "Customer" },
		{ id: "tag-evangelist", tagTypeId: "tt-lifecycle", value: "evangelist", label: "Evangelist" },
		{ id: "tag-churned", tagTypeId: "tt-lifecycle", value: "churned", label: "Churned" },
	],
};

// ── Deterministic PRNG so the dataset is stable across reloads ──
function mulberry32(seed: number): () => number {
	let t = seed;
	return () => {
		t = (t + 0x6d2b79f5) | 0;
		let r = Math.imul(t ^ (t >>> 15), 1 | t);
		r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
		return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
	};
}

function pad(n: number) {
	return n.toString().padStart(2, "0");
}

function randomDate(rand: () => number): string {
	const start = new Date(2019, 0, 1).getTime();
	const end = new Date(2025, 11, 31).getTime();
	const t = start + Math.floor(rand() * (end - start));
	const d = new Date(t);
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface SamplePopulation {
	people: Person[];
	objectTags: ObjectTagLink[];
}

/**
 * Generate a stable population of people plus their object_tag links.
 * The distribution across tag-types is intentionally varied so the
 * audience builder produces interesting non-empty (and non-trivial) results.
 */
export function generatePopulation(count = 500, seed = 42): SamplePopulation {
	const rand = mulberry32(seed);

	const dietTags = sampleCatalog.tags.filter((t) => t.tagTypeId === "tt-diet").map((t) => t.id);
	const regionTags = sampleCatalog.tags.filter((t) => t.tagTypeId === "tt-region").map((t) => t.id);
	const roleTags = sampleCatalog.tags.filter((t) => t.tagTypeId === "tt-role").map((t) => t.id);
	const interestTags = sampleCatalog.tags.filter((t) => t.tagTypeId === "tt-interests").map((t) => t.id);
	const lifecycleTags = sampleCatalog.tags.filter((t) => t.tagTypeId === "tt-lifecycle").map((t) => t.id);

	const people: Person[] = [];
	const objectTags: ObjectTagLink[] = [];

	for (let i = 0; i < count; i++) {
		const id = `p-${(i + 1).toString().padStart(4, "0")}`;
		const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
		const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
		const name = `${first} ${last}`;
		const email = `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`;
		const city = CITIES[Math.floor(rand() * CITIES.length)];
		const signupDate = randomDate(rand);
		people.push({ id, name, email, city, signupDate });

		// Diet: ~85% have one diet tag
		if (rand() < 0.85) {
			const tagId = dietTags[Math.floor(rand() * dietTags.length)];
			objectTags.push({ objectId: id, objectType: "person", tagId });
		}

		// Region: ~95% have a region
		if (rand() < 0.95) {
			const tagId = regionTags[Math.floor(rand() * regionTags.length)];
			objectTags.push({ objectId: id, objectType: "person", tagId });
		}

		// Role: 0-2 role tags
		const roleCount = Math.floor(rand() * 3);
		const shuffledRoles = [...roleTags].sort(() => rand() - 0.5);
		for (let r = 0; r < roleCount; r++) {
			objectTags.push({ objectId: id, objectType: "person", tagId: shuffledRoles[r] });
		}

		// Interests: 0-4 interest tags
		const interestCount = Math.floor(rand() * 5);
		const shuffledInterests = [...interestTags].sort(() => rand() - 0.5);
		for (let r = 0; r < interestCount; r++) {
			objectTags.push({ objectId: id, objectType: "person", tagId: shuffledInterests[r] });
		}

		// Lifecycle: ~90% have exactly one stage
		if (rand() < 0.9) {
			const tagId = lifecycleTags[Math.floor(rand() * lifecycleTags.length)];
			objectTags.push({ objectId: id, objectType: "person", tagId });
		}
	}

	return { people, objectTags };
}
