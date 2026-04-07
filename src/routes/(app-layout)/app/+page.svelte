<script lang="ts">
	import AppSidebar from "$lib/components/app-sidebar.svelte";
	import * as Breadcrumb from "$lib/components/shadcn-svelte/breadcrumb/index.js";
	import { Separator } from "$lib/components/shadcn-svelte/separator/index.js";
	import * as Sidebar from "$lib/components/shadcn-svelte/sidebar/index.js";
</script>

<Sidebar.Provider style="--sidebar-width: 350px;">
	<AppSidebar />
	<Sidebar.Inset>
		<header class="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
			<Sidebar.Trigger class="-ms-1" />
			<Separator orientation="vertical" class="me-2 data-[orientation=vertical]:h-4" />
			<Breadcrumb.Root>
				<Breadcrumb.List>
					<Breadcrumb.Item class="hidden md:block">
						<Breadcrumb.Link href="##">All Inboxes</Breadcrumb.Link>
					</Breadcrumb.Item>
					<Breadcrumb.Separator class="hidden md:block" />
					<Breadcrumb.Item>
						<Breadcrumb.Page>Inbox</Breadcrumb.Page>
					</Breadcrumb.Item>
				</Breadcrumb.List>
			</Breadcrumb.Root>
		</header>
		<div class="flex flex-1 flex-col gap-4 p-4">
			{#each [...Array(24).keys()] as index (index)}
				<div class="aspect-video h-12 w-full rounded-lg bg-muted/50"></div>
			{/each}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
