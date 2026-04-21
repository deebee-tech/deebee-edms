<script lang="ts">
	import type { SuperValidated } from "sveltekit-superforms";
	import type { FormDefinition } from "../types";
	import FormRendererInner from "./form-renderer-inner.svelte";

	let {
		definition,
		data,
		action,
		disabled = false,
		submitLabel = "Submit",
		onsubmit,
	}: {
		definition: FormDefinition;
		data: SuperValidated<Record<string, unknown>>;
		action?: string;
		disabled?: boolean;
		submitLabel?: string;
		onsubmit?: (data: Record<string, unknown>) => void;
	} = $props();

	/**
	 * Fingerprint of the parts of the definition that affect schema/validation/rendering.
	 * When this changes (e.g. the builder edits a field's required flag), we re-key the inner
	 * renderer so superForm and its valibot schema rebuild against the latest definition.
	 */
	const fingerprint = $derived(JSON.stringify(definition));
</script>

{#key fingerprint}
	<FormRendererInner {definition} {data} {action} {disabled} {submitLabel} {onsubmit} />
{/key}
