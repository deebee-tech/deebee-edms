// cspell: disable
export interface Employee {
	[key: string]: unknown;
	id: number;
	name: string;
	email: string;
	department: string;
	salary: number;
	hireDate: string;
	isActive: boolean;
	notes: string | null;
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
	"Kenneth",
	"Carol",
	"Kevin",
	"Amanda",
	"Brian",
	"Dorothy",
	"George",
	"Melissa",
	"Timothy",
	"Deborah",
	"Ronald",
	"Stephanie",
	"Edward",
	"Rebecca",
	"Jason",
	"Sharon",
	"Jeffrey",
	"Laura",
	"Ryan",
	"Cynthia",
	"Jacob",
	"Kathleen",
	"Gary",
	"Amy",
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
	"Walker",
	"Young",
	"Allen",
	"King",
	"Wright",
	"Scott",
	"Torres",
	"Nguyen",
	"Hill",
	"Flores",
	"Green",
	"Adams",
	"Nelson",
	"Baker",
	"Hall",
	"Rivera",
	"Campbell",
	"Mitchell",
];

const DEPARTMENTS = [
	"Engineering",
	"Product",
	"Design",
	"Marketing",
	"Sales",
	"Finance",
	"HR",
	"Legal",
	"Operations",
	"Support",
];

const NOTES_POOL = [
	"Top performer this quarter",
	"Transferred from the NYC office",
	"On parental leave until Q3",
	"Leading the new platform initiative",
	"Completed AWS certification",
	"Mentoring two junior engineers",
	"Working remotely from Denver",
	"Participating in the leadership program",
	"Recently promoted from associate level",
	"Responsible for vendor negotiations",
	null,
	null,
	null,
	null,
	null,
];

function seededRandom(seed: number) {
	let s = seed;
	return () => {
		s = (s * 16807 + 0) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

export function generateEmployees(count = 500, seed = 42): Employee[] {
	const rng = seededRandom(seed);
	const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

	const employees: Employee[] = [];
	for (let i = 1; i <= count; i++) {
		const first = pick(FIRST_NAMES);
		const last = pick(LAST_NAMES);
		const year = 2015 + Math.floor(rng() * 11);
		const month = String(1 + Math.floor(rng() * 12)).padStart(2, "0");
		const day = String(1 + Math.floor(rng() * 28)).padStart(2, "0");

		employees.push({
			id: i,
			name: `${first} ${last}`,
			email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
			department: pick(DEPARTMENTS),
			salary: Math.round((40000 + rng() * 160000) / 1000) * 1000,
			hireDate: `${year}-${month}-${day}`,
			isActive: rng() > 0.15,
			notes: pick(NOTES_POOL),
		});
	}
	return employees;
}
