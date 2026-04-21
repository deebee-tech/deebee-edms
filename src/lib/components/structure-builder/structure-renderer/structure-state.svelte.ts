import { createContext } from "svelte";
import { evaluateConditions, flattenSections, isSectionBlocked, isSectionVisible } from "../conditions";
import type {
	SectionDefinition,
	SectionFormEntry,
	SectionStatus,
	StructureAnswers,
	StructureDefinition,
} from "../types";

export interface NavigableItem {
	sectionId: string;
	section: SectionDefinition;
	formIndex: number;
	form: SectionFormEntry;
	depth: number;
}

export class StructureState {
	#getDefinition: () => StructureDefinition;
	sectionStatus = $state<Record<string, SectionStatus>>({});
	formData = $state<Record<string, Record<string, unknown>>>({});
	activeSectionId = $state<string>("");
	activeFormIndex = $state(0);
	completed = $state(false);

	get definition(): StructureDefinition {
		return this.#getDefinition();
	}

	constructor(getDefinition: () => StructureDefinition, answers?: StructureAnswers) {
		this.#getDefinition = getDefinition;
		const definition = getDefinition();

		if (answers) {
			this.formData = { ...answers.formData };
			this.sectionStatus = { ...answers.sectionStatus };
			this.completed = answers.completed;

			const flat = flattenSections(definition.sections);
			for (const s of flat) {
				if (!(s.id in this.sectionStatus)) {
					this.sectionStatus[s.id] = "pending";
				}
			}

			if (this.completed) {
				const items = this.getNavigableItems();
				if (items.length > 0) {
					const last = items[items.length - 1];
					this.activeSectionId = last.sectionId;
					this.activeFormIndex = last.formIndex >= 0 ? last.formIndex : 0;
				}
			} else {
				const items = this.getNavigableItems();
				const firstIncomplete = items.find((item) => {
					const status = this.sectionStatus[item.sectionId];
					return status !== "completed" && status !== "skipped";
				});
				if (firstIncomplete) {
					this.activeSectionId = firstIncomplete.sectionId;
					this.activeFormIndex = firstIncomplete.formIndex >= 0 ? firstIncomplete.formIndex : 0;
					if (this.sectionStatus[firstIncomplete.sectionId] === "pending") {
						this.sectionStatus[firstIncomplete.sectionId] = "in_progress";
					}
				}
			}
		} else {
			const flat = flattenSections(definition.sections);
			const statusInit: Record<string, SectionStatus> = {};
			for (const s of flat) {
				statusInit[s.id] = "pending";
			}
			this.sectionStatus = statusInit;

			if (definition.sections.length > 0) {
				const first = this.getFirstNavigableSection();
				if (first) {
					this.activeSectionId = first.sectionId;
					this.activeFormIndex = 0;
					this.sectionStatus[first.sectionId] = "in_progress";
				}
			}
		}
	}

	/**
	 * Re-anchors `activeSectionId` / `activeFormIndex` after the underlying definition changes
	 * (sections added, removed, or hidden by visibility rules in live editing). If the current
	 * active section is gone or no longer navigable, snap to the first navigable item; if its
	 * `activeFormIndex` is out of range, reset it.
	 */
	reconcileActiveSection() {
		const items = this.getNavigableItems();
		if (items.length === 0) {
			this.activeSectionId = "";
			this.activeFormIndex = 0;
			return;
		}

		const stillValid = items.some(
			(item) =>
				item.sectionId === this.activeSectionId && (item.formIndex === this.activeFormIndex || item.formIndex < 0),
		);
		if (stillValid) return;

		const sameSection = items.find((item) => item.sectionId === this.activeSectionId);
		if (sameSection) {
			this.activeFormIndex = sameSection.formIndex >= 0 ? sameSection.formIndex : 0;
			return;
		}

		const first = items[0];
		this.activeSectionId = first.sectionId;
		this.activeFormIndex = first.formIndex >= 0 ? first.formIndex : 0;
	}

	toAnswers(): StructureAnswers {
		return {
			structureId: this.definition.id,
			sectionStatus: { ...this.sectionStatus },
			formData: JSON.parse(JSON.stringify(this.formData)),
			completed: this.completed,
		};
	}

	get visibleSections(): SectionDefinition[] {
		return this.definition.sections.filter((s) => isSectionVisible(s, this.formData));
	}

	isSectionVisibleCheck(section: SectionDefinition): boolean {
		return isSectionVisible(section, this.formData);
	}

	/**
	 * Returns a display status that, for parent sections, reflects the aggregate
	 * progress of their visible children rather than the parent's own stored status.
	 *
	 * Aggregation rules (children only — own forms are handled by `checkParentCompletion`):
	 *  - all visible children completed/skipped → "completed"
	 *  - any visible child in_progress (or partially completed) → "in_progress"
	 *  - all visible children blocked → "blocked"
	 *  - otherwise → fall back to the section's own stored status
	 *
	 * Leaf sections (no children) return their own stored status.
	 */
	getEffectiveStatus(section: SectionDefinition): SectionStatus {
		const ownStatus = this.sectionStatus[section.id] ?? "pending";

		if (!section.children || section.children.length === 0) {
			return ownStatus;
		}

		const visibleChildren = section.children.filter((c) => this.isSectionVisibleCheck(c));
		if (visibleChildren.length === 0) {
			return ownStatus;
		}

		const childStatuses = visibleChildren.map((c) => this.getEffectiveStatus(c));

		if (childStatuses.every((s) => s === "completed" || s === "skipped")) {
			return "completed";
		}
		if (childStatuses.some((s) => s === "in_progress" || s === "completed")) {
			return "in_progress";
		}
		if (childStatuses.every((s) => s === "blocked")) {
			return "blocked";
		}

		return ownStatus;
	}

	isSectionBlockedCheck(section: SectionDefinition): boolean {
		return isSectionBlocked(section, this.sectionStatus);
	}

	isFormVisibleCheck(entry: SectionFormEntry): boolean {
		if (!entry.conditions?.visibility || entry.conditions.visibility.length === 0) return true;
		return evaluateConditions(entry.conditions.visibility, this.formData);
	}

	getNavigableItems(): NavigableItem[] {
		const items: NavigableItem[] = [];
		const walk = (sections: SectionDefinition[], depth: number) => {
			for (const section of sections) {
				if (!this.isSectionVisibleCheck(section)) continue;

				if (section.forms && section.forms.length > 0) {
					const visibleForms = section.forms.filter((f) => this.isFormVisibleCheck(f));
					for (let i = 0; i < visibleForms.length; i++) {
						items.push({
							sectionId: section.id,
							section,
							formIndex: section.forms.indexOf(visibleForms[i]),
							form: visibleForms[i],
							depth,
						});
					}
				} else if (!section.children || section.children.length === 0) {
					items.push({
						sectionId: section.id,
						section,
						formIndex: -1,
						form: undefined as unknown as SectionFormEntry,
						depth,
					});
				}

				if (section.children && section.children.length > 0) {
					walk(section.children, depth + 1);
				}
			}
		};
		walk(this.definition.sections, 0);
		return items;
	}

	private getFirstNavigableSection(): NavigableItem | null {
		const items = this.getNavigableItems();
		return items[0] ?? null;
	}

	get activeSection(): SectionDefinition | null {
		const flat = flattenSections(this.definition.sections);
		return flat.find((s) => s.id === this.activeSectionId) ?? null;
	}

	get activeForm(): SectionFormEntry | null {
		const section = this.activeSection;
		if (!section?.forms) return null;
		return section.forms[this.activeFormIndex] ?? null;
	}

	get currentNavIndex(): number {
		const items = this.getNavigableItems();
		return items.findIndex(
			(item) => item.sectionId === this.activeSectionId && item.formIndex === this.activeFormIndex,
		);
	}

	get canGoNext(): boolean {
		const items = this.getNavigableItems();
		const idx = this.currentNavIndex;
		return idx < items.length - 1;
	}

	get canGoPrevious(): boolean {
		return this.currentNavIndex > 0;
	}

	get canSkip(): boolean {
		const section = this.activeSection;
		return section?.conditions?.skippable === true;
	}

	get isLastItem(): boolean {
		const items = this.getNavigableItems();
		return this.currentNavIndex === items.length - 1;
	}

	submitCurrentForm(data: Record<string, unknown>) {
		const form = this.activeForm;
		if (form) {
			this.formData = { ...this.formData, [form.stateKey]: data };
		}

		const section = this.activeSection;
		if (section?.forms) {
			const visibleForms = section.forms.filter((f) => this.isFormVisibleCheck(f));
			const currentVisibleIndex = visibleForms.indexOf(form!);
			if (currentVisibleIndex < visibleForms.length - 1) {
				this.activeFormIndex = section.forms.indexOf(visibleForms[currentVisibleIndex + 1]);
				return;
			}
		}

		this.markSectionCompleted(this.activeSectionId);
		if (this.isLastItem) {
			this.completed = true;
		} else {
			this.goNext();
		}
	}

	markSectionCompleted(sectionId: string) {
		this.sectionStatus = { ...this.sectionStatus, [sectionId]: "completed" };
		this.checkParentCompletion(sectionId);
	}

	private checkParentCompletion(childId: string) {
		const findParent = (sections: SectionDefinition[]): SectionDefinition | null => {
			for (const s of sections) {
				if (s.children?.some((c) => c.id === childId)) return s;
				if (s.children) {
					const found = findParent(s.children);
					if (found) return found;
				}
			}
			return null;
		};

		const parent = findParent(this.definition.sections);
		if (!parent) return;

		const allChildrenDone = parent.children!.every((c) => {
			const status = this.sectionStatus[c.id];
			return status === "completed" || status === "skipped" || !this.isSectionVisibleCheck(c);
		});

		const allFormsDone =
			!parent.forms ||
			parent.forms.every((f) => {
				if (!this.isFormVisibleCheck(f)) return true;
				return this.formData[f.stateKey] !== undefined;
			});

		if (allChildrenDone && allFormsDone) {
			this.markSectionCompleted(parent.id);
		}
	}

	goNext() {
		const items = this.getNavigableItems();
		const idx = this.currentNavIndex;
		if (idx >= items.length - 1) return;

		const next = items[idx + 1];
		this.activeSectionId = next.sectionId;
		this.activeFormIndex = next.formIndex >= 0 ? next.formIndex : 0;

		if (this.sectionStatus[next.sectionId] === "pending") {
			if (this.isSectionBlockedCheck(next.section)) {
				this.sectionStatus = { ...this.sectionStatus, [next.sectionId]: "blocked" };
			} else {
				this.sectionStatus = { ...this.sectionStatus, [next.sectionId]: "in_progress" };
			}
		}
	}

	goPrevious() {
		const items = this.getNavigableItems();
		const idx = this.currentNavIndex;
		if (idx <= 0) return;

		const prev = items[idx - 1];
		this.activeSectionId = prev.sectionId;
		this.activeFormIndex = prev.formIndex >= 0 ? prev.formIndex : 0;
	}

	skipSection() {
		const section = this.activeSection;
		if (!section?.conditions?.skippable) return;
		this.sectionStatus = { ...this.sectionStatus, [section.id]: "skipped" };
		this.goNext();
	}

	navigateTo(sectionId: string, formIndex = 0) {
		if (this.isSectionBlockedCheck(flattenSections(this.definition.sections).find((s) => s.id === sectionId)!)) {
			return;
		}
		this.activeSectionId = sectionId;
		this.activeFormIndex = formIndex;
		if (this.sectionStatus[sectionId] === "pending") {
			this.sectionStatus = { ...this.sectionStatus, [sectionId]: "in_progress" };
		}
	}

	get allFormData(): Record<string, Record<string, unknown>> {
		return this.formData;
	}
}

export const [getStructureState, setStructureState] = createContext<StructureState>();
