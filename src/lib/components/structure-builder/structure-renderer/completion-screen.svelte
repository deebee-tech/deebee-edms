<script lang="ts">
	import * as Card from "$lib/components/shadcn-svelte/card";
	import { CopyButton } from "$lib/components/shadcn-svelte/copy-button";
	import CheckCircle2Icon from "@lucide/svelte/icons/check-circle-2";
	import PartyPopperIcon from "@lucide/svelte/icons/party-popper";

	let {
		name,
		formData,
	}: {
		name: string;
		formData: Record<string, Record<string, unknown>>;
	} = $props();

	const summaryJson = $derived(JSON.stringify(formData, null, 2));
	const sectionCount = $derived(Object.keys(formData).length);
</script>

<div class="space-y-6">
	<div class="flex flex-col items-center pt-8 text-center">
		<div class="mb-4 flex items-center justify-center rounded-full bg-green-500/10 p-4">
			<PartyPopperIcon class="size-10 text-green-500" />
		</div>
		<h2 class="text-2xl font-bold">All Done!</h2>
		<p class="mt-2 max-w-md text-sm text-muted-foreground">
			You have successfully completed <span class="font-medium text-foreground">{name}</span>. All {sectionCount} section{sectionCount !==
			1
				? "s"
				: ""} have been filled out.
		</p>
	</div>

	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<CheckCircle2Icon class="size-4 text-green-500" />
					<Card.Title>Submitted Data</Card.Title>
				</div>
				<CopyButton text={summaryJson} />
			</div>
			<Card.Description>Summary of all collected data across sections</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="space-y-3">
				{#each Object.entries(formData) as [stateKey, data] (stateKey)}
					<div class="rounded-md border p-3">
						<h4 class="mb-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
							{stateKey}
						</h4>
						<dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
							{#each Object.entries(data) as [field, value] (field)}
								<dt class="font-medium text-muted-foreground">{field}</dt>
								<dd class="truncate">
									{#if typeof value === "boolean"}
										<span class={value ? "text-green-500" : "text-muted-foreground"}>
											{value ? "Yes" : "No"}
										</span>
									{:else if value === null || value === undefined || value === ""}
										<span class="text-muted-foreground/50">—</span>
									{:else}
										{String(value)}
									{/if}
								</dd>
							{/each}
						</dl>
					</div>
				{/each}
			</div>
		</Card.Content>
	</Card.Root>
</div>
