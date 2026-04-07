import { type VirtualizerOptions, type VirtualItem, Virtualizer, elementScroll } from "@tanstack/virtual-core";

export type { VirtualItem };

export interface CreateVirtualizerOptions {
	count: number;
	getScrollElement: () => HTMLElement | null;
	estimateSize: (index: number) => number;
	overscan?: number;
}

/**
 * Creates a reactive TanStack Virtualizer for Svelte 5.
 * Follows the same runes-based pattern as `createSvelteTable`.
 */
export function createSvelteVirtualizer(opts: CreateVirtualizerOptions) {
	let virtualItems = $state<VirtualItem[]>([]);
	let totalSize = $state(0);

	const options: VirtualizerOptions<HTMLElement, HTMLElement> = {
		count: opts.count,
		getScrollElement: opts.getScrollElement,
		estimateSize: opts.estimateSize,
		overscan: opts.overscan ?? 5,
		scrollToFn: elementScroll,
		observeElementOffset: (instance, cb) => {
			const el = instance.scrollElement;
			if (!el) return;
			const handler = () => cb(el.scrollTop, false);
			el.addEventListener("scroll", handler, { passive: true });
			handler();
			return () => el.removeEventListener("scroll", handler);
		},
		observeElementRect: (instance, cb) => {
			const el = instance.scrollElement;
			if (!el) return;
			const observer = new ResizeObserver((entries) => {
				for (const entry of entries) {
					if (entry.target === el) {
						cb({ width: el.clientWidth, height: el.clientHeight });
					}
				}
			});
			observer.observe(el);
			cb({ width: el.clientWidth, height: el.clientHeight });
			return () => observer.disconnect();
		},
		onChange: (instance) => {
			virtualItems = instance.getVirtualItems();
			totalSize = instance.getTotalSize();
		},
	};

	const virtualizer = new Virtualizer(options);

	$effect(() => {
		virtualizer.setOptions({
			...options,
			count: opts.count,
			estimateSize: opts.estimateSize,
			overscan: opts.overscan ?? 5,
		});
		virtualizer._willUpdate();
	});

	$effect(() => {
		return () => virtualizer._willUpdate();
	});

	return {
		get virtualItems() {
			return virtualItems;
		},
		get totalSize() {
			return totalSize;
		},
		get virtualizer() {
			return virtualizer;
		},
		measureElement: (el: HTMLElement) => virtualizer.measureElement(el),
		scrollToIndex: (index: number) => virtualizer.scrollToIndex(index),
	};
}
