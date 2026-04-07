<script lang="ts">
	import DOMPurify from "isomorphic-dompurify";
	import type { FormFieldDefinition } from "../../types";

	let { field }: { field: FormFieldDefinition } = $props();

	const content = $derived((field.config?.content as string) ?? "");
	const sanitized = $derived(DOMPurify.sanitize(content));
</script>

{#if field.label}
	<p class="text-sm font-medium">{field.label}</p>
{/if}
{#if sanitized}
	<div class="prose prose-sm max-w-none text-muted-foreground dark:prose-invert">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html sanitized}
	</div>
{:else}
	<p class="text-sm text-muted-foreground italic">No content configured</p>
{/if}
{#if field.description}
	<p class="mt-1 text-xs text-muted-foreground">{field.description}</p>
{/if}
