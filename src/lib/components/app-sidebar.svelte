<script lang="ts" module>
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import LayersIcon from "@lucide/svelte/icons/layers";
	import NetworkIcon from "@lucide/svelte/icons/network";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";

	const data = {
		user: {
			name: "shadcn",
			email: "m@example.com",
			avatar: "/avatars/shadcn.jpg",
		},
		navMain: [
			{
				title: "Dashboard",
				url: "/app",
				icon: LayoutDashboardIcon,
			},
			{
				title: "Connections",
				url: "/app/connections",
				icon: DatabaseIcon,
			},
			{
				title: "Datasets",
				url: "/app/datasets",
				icon: LayersIcon,
			},
			{
				title: "Workflows",
				url: "/app/workflows",
				icon: NetworkIcon,
			},
		],
	};
</script>

<script lang="ts">
	import { page } from "$app/state";
	import { resolve } from "$app/paths";
	import type { Pathname } from "$app/types";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import CommandIcon from "@lucide/svelte/icons/command";
	import type { ComponentProps } from "svelte";
	import NavUser from "./nav-user.svelte";

	let { ref = $bindable(null), ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	function isActive(url: string): boolean {
		const path = page.url?.pathname ?? "";
		if (url === "/app") return path === "/app";
		return path.startsWith(url);
	}
</script>

<Sidebar.Root bind:ref collapsible="icon" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" class="md:h-8 md:p-0">
					{#snippet child({ props })}
						<a href={resolve("/app" as Pathname)} {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<CommandIcon class="size-4" />
							</div>
							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-medium">DeeBee EDMS</span>
								<span class="truncate text-xs">Database Tools</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
			<Sidebar.GroupContent>
				<Sidebar.Menu>
					{#each data.navMain as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								tooltipContentProps={{ hidden: false }}
								isActive={isActive(item.url)}
								class="px-2.5 md:px-2"
							>
								{#snippet tooltipContent()}
									{item.title}
								{/snippet}
								{#snippet child({ props })}
									<a href={resolve(item.url as Pathname)} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>
