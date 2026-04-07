<script lang="ts">
	import { Separator } from "$lib/components/shadcn-svelte/separator";
	import type { FormFieldDefinition } from "../../types";

	let { field }: { field: FormFieldDefinition } = $props();
</script>

{#if field.label}
	<div class="relative py-2">
		<div class="absolute inset-0 flex items-center">
			<Separator class="w-full" />
		</div>
		<div class="relative flex justify-start">
			<span class="bg-background pr-3 text-sm font-medium text-muted-foreground">
				{field.label}
			</span>
		</div>
	</div>
{:else}
	<Separator class="my-2" />
{/if}
