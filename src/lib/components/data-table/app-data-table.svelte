<script lang="ts" generics="TData extends Record<string, unknown> = Record<string, unknown>">
	import {
		type ColumnDef,
		type SortingState,
		getCoreRowModel,
		type OnChangeFn,
	} from "@tanstack/table-core";
	import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table";
	import * as Table from "$lib/components/ui/table";
	import { createSvelteVirtualizer } from "$lib/components/ui/data-table/virtualizer.svelte.js";
	import FilterBar from "./filter-bar.svelte";
	import ColumnFilterPopover from "./column-filter-popover.svelte";
	import FilterBuilderDialog from "./filter-builder-dialog.svelte";
	import {
		type DataProvider,
		type DataProviderResult,
		type ColumnFilter,
		type ColumnMeta,
		type FilterGroup,
		type SortSpec,
	} from "$lib/data-table/types.js";
	import { serializeTableState } from "$lib/data-table/url-state.js";
	import { goto } from "$app/navigation";
	import { page } from "$app/state";
	import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
	import { onMount, type Snippet } from "svelte";

	interface Props {
		provider: DataProvider<TData>;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		columnDefs: ColumnDef<TData, any>[];
		columnMeta: ColumnMeta[];
		initialData?: DataProviderResult<TData>;
		pageSize?: number;
		/** Height of the scrollable table area. Defaults to "600px". */
		tableHeight?: string;
		/** Estimated row height in pixels for the virtualizer. Defaults to 40. */
		rowHeight?: number;
		/** Whether to sync filter/sort state to URL search params. Defaults to true. */
		syncUrl?: boolean;
		/** Optional snippet for row actions (rendered as the last cell of each row). */
		actions?: Snippet<[TData]>;
		/** Optional snippet for an empty state. */
		empty?: Snippet;
		/** Optional snippet for toolbar extras (rendered next to the filter builder button). */
		toolbar?: Snippet;
	}

	let {
		provider,
		columnDefs,
		columnMeta,
		initialData,
		pageSize = 50,
		tableHeight = "600px",
		rowHeight = 40,
		syncUrl = true,
		actions,
		empty,
		toolbar,
	}: Props = $props();

	// ── State ──

	const _snapshot = (() => {
		const d = initialData;
		return { rows: d?.rows ?? [], count: d?.totalCount ?? 0, more: d?.hasMore ?? true, had: !!d };
	})();

	let allRows = $state<TData[]>(_snapshot.rows);
	let totalCount = $state(_snapshot.count);
	let hasMore = $state(_snapshot.more);
	let isLoading = $state(!_snapshot.had);
	let isLoadingMore = $state(false);
	let filters = $state<ColumnFilter[]>([]);
	let filterGroups = $state<FilterGroup[]>([]);
	let sorting = $state<SortingState>([]);

	let scrollContainerRef = $state<HTMLDivElement | null>(null);

	// ── TanStack Table ──

	const onSortingChange: OnChangeFn<SortingState> = (updater) => {
		sorting = typeof updater === "function" ? updater(sorting) : updater;
		void fetchData(true);
	};

	const table = createSvelteTable<TData>({
		get data() {
			return allRows;
		},
		get columns() {
			return columnDefs;
		},
		getCoreRowModel: getCoreRowModel(),
		manualSorting: true,
		manualFiltering: true,
		get state() {
			return { sorting };
		},
		onSortingChange,
	});

	// ── Virtualizer ──

	const virt = createSvelteVirtualizer({
		get count() {
			return allRows.length;
		},
		getScrollElement: () => scrollContainerRef,
		estimateSize: () => rowHeight,
		overscan: 10,
	});

	// ── Data Fetching ──

	function currentSort(): SortSpec[] {
		return sorting.map((s) => ({ column: s.id, ascending: !s.desc }));
	}

	async function fetchData(reset: boolean) {
		if (reset) {
			isLoading = true;
			allRows = [];
		} else {
			isLoadingMore = true;
		}

		try {
			const result = await provider({
				filters,
				filterGroups: filterGroups.length > 0 ? filterGroups : undefined,
				sort: currentSort(),
				offset: reset ? 0 : allRows.length,
				limit: pageSize,
			});

			if (reset) {
				allRows = result.rows;
			} else {
				allRows = [...allRows, ...result.rows];
			}
			totalCount = result.totalCount;
			hasMore = result.hasMore;

			if (syncUrl) {
				const sp = serializeTableState(
					{ filters, sort: currentSort(), offset: 0 },
					new URLSearchParams(page.url.searchParams),
				);
				const newUrl = `${page.url.pathname}?${sp.toString()}`;
				if (newUrl !== `${page.url.pathname}?${page.url.searchParams.toString()}`) {
					// eslint-disable-next-line svelte/no-navigation-without-resolve
				void goto(newUrl, { replaceState: true, keepFocus: true, noScroll: true });
				}
			}
		} finally {
			isLoading = false;
			isLoadingMore = false;
		}
	}

	// ── Infinite Scroll ──

	let sentinel = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
					void fetchData(false);
				}
			},
			{ root: scrollContainerRef, rootMargin: "200px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	// ── Filter Handlers ──

	function handleAddFilter(filter: ColumnFilter) {
		filters = [...filters, filter];
		void fetchData(true);
	}

	function handleRemoveFilter(filterId: string) {
		filters = filters.filter((f) => f.id !== filterId);
		void fetchData(true);
	}

	function handleClearAllFilters() {
		filters = [];
		filterGroups = [];
		void fetchData(true);
	}

	function handleFilterBuilderApply(groups: FilterGroup[]) {
		filterGroups = groups;
		void fetchData(true);
	}

	// ── Initial Load ──

	onMount(() => {
		if (!_snapshot.had) {
			void fetchData(true);
		}
	});
</script>

<div class="flex flex-col overflow-hidden rounded-md border">
	<!-- Toolbar -->
	<div class="flex items-center gap-2 border-b px-3 py-2">
		<FilterBuilderDialog
			columns={columnMeta}
			onApply={handleFilterBuilderApply}
			existingGroups={filterGroups}
		/>
		{#if toolbar}
			{@render toolbar()}
		{/if}
		<div class="ml-auto text-xs text-muted-foreground">
			{#if !isLoading}
				{allRows.length.toLocaleString()} of {totalCount.toLocaleString()} rows
			{/if}
		</div>
	</div>

	<!-- Filter Bar -->
	<FilterBar
		{filters}
		columns={columnMeta}
		onRemove={handleRemoveFilter}
		onClearAll={handleClearAllFilters}
	/>

	<!-- Table -->
	{#if isLoading && allRows.length === 0}
		<div class="flex items-center justify-center py-16">
			<LoaderCircleIcon class="size-6 animate-spin text-muted-foreground" />
		</div>
	{:else if allRows.length === 0}
		{#if empty}
			{@render empty()}
		{:else}
			<div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
				<p class="text-sm">No results found</p>
				{#if filters.length > 0}
					<p class="mt-1 text-xs">Try adjusting your filters</p>
				{/if}
			</div>
		{/if}
	{:else}
		<div
			bind:this={scrollContainerRef}
			class="overflow-auto"
			style="height: {tableHeight};"
		>
			<Table.Root>
				<Table.Header class="sticky top-0 z-10 bg-background">
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head
									class="whitespace-nowrap"
									style="width: {header.getSize()}px;"
								>
									{#if !header.isPlaceholder}
										{@const meta = columnMeta.find((m) => m.key === header.column.id)}
										<div class="flex items-center">
											{#if header.column.getCanSort()}
												<button
													class="flex items-center gap-1 hover:text-foreground"
													onclick={() => header.column.toggleSorting()}
												>
													<FlexRender
														content={header.column.columnDef.header}
														context={header.getContext()}
													/>
													{#if header.column.getIsSorted() === "asc"}
														<span class="text-xs">↑</span>
													{:else if header.column.getIsSorted() === "desc"}
														<span class="text-xs">↓</span>
													{/if}
												</button>
											{:else}
												<FlexRender
													content={header.column.columnDef.header}
													context={header.getContext()}
												/>
											{/if}
											{#if meta && meta.filterable !== false}
												<ColumnFilterPopover
													column={meta}
													activeFilters={filters}
													onApply={handleAddFilter}
													onRemove={handleRemoveFilter}
												/>
											{/if}
										</div>
									{/if}
								</Table.Head>
							{/each}
							{#if actions}
								<Table.Head class="w-24">Actions</Table.Head>
							{/if}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#if virt.totalSize > 0}
						<!-- Top spacer -->
						{@const items = virt.virtualItems}
						{#if items.length > 0 && items[0].start > 0}
							<tr style="height: {items[0].start}px;"></tr>
						{/if}

						{#each items as virtualRow (virtualRow.index)}
							{@const row = table.getRowModel().rows[virtualRow.index]}
							{#if row}
								<Table.Row data-index={virtualRow.index}>
									{#each row.getVisibleCells() as cell (cell.id)}
										<Table.Cell>
											<FlexRender
												content={cell.column.columnDef.cell}
												context={cell.getContext()}
											/>
										</Table.Cell>
									{/each}
									{#if actions}
										<Table.Cell>
											{@render actions(row.original)}
										</Table.Cell>
									{/if}
								</Table.Row>
							{/if}
						{/each}

						<!-- Bottom spacer -->
						{#if items.length > 0}
							{@const lastItem = items[items.length - 1]}
							{@const bottomPadding = virt.totalSize - (lastItem.start + lastItem.size)}
							{#if bottomPadding > 0}
								<tr style="height: {bottomPadding}px;"></tr>
							{/if}
						{/if}
					{/if}
				</Table.Body>
			</Table.Root>

			<!-- Infinite scroll sentinel -->
			<div bind:this={sentinel} class="h-1"></div>

			{#if isLoadingMore}
				<div class="flex items-center justify-center py-4">
					<LoaderCircleIcon class="size-4 animate-spin text-muted-foreground" />
					<span class="ml-2 text-xs text-muted-foreground">Loading more...</span>
				</div>
			{/if}
		</div>
	{/if}
</div>
