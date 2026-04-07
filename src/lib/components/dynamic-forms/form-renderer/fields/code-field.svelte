<script lang="ts">
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { browser } from "$app/environment";
	import { mode } from "mode-watcher";
	import { onDestroy, onMount } from "svelte";
	import type { FormFieldDefinition } from "../../types";
	import type * as Monaco from "monaco-editor";

	let {
		field,
		value = $bindable(""),
		errors,
		disabled = false,
	}: {
		field: FormFieldDefinition;
		value: string;
		errors?: string[];
		disabled?: boolean;
	} = $props();

	const hasErrors = $derived(errors && errors.length > 0);
	const language = $derived((field.config?.language as string) ?? "javascript");

	let container: HTMLDivElement | undefined = $state();
	let monacoInstance: typeof Monaco | undefined;
	let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
	let suppressUpdate = false;

	onMount(() => {
		if (!browser || !container) return;

		async function init() {
			if (!container) return;
			const loader = await import("@monaco-editor/loader");
			const monaco = await loader.default.init();
			monacoInstance = monaco;

			const instance = monaco.editor.create(container, {
				value,
				language,
				theme: mode.current === "dark" ? "vs-dark" : "vs",
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				automaticLayout: true,
				fontSize: 14,
				lineNumbers: "on",
				roundedSelection: true,
				scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
				padding: { top: 8, bottom: 8 },
				readOnly: disabled || field.disabled,
			});
			editor = instance;

			instance.onDidChangeModelContent(() => {
				const newValue = instance.getValue();
				if (newValue !== value) {
					suppressUpdate = true;
					value = newValue;
				}
			});
		}

		init();
	});

	onDestroy(() => {
		editor?.dispose();
	});

	$effect(() => {
		if (!editor || suppressUpdate) {
			suppressUpdate = false;
			return;
		}
		const currentValue = value;
		if (editor.getValue() !== currentValue) {
			editor.setValue(currentValue);
		}
	});

	$effect(() => {
		if (!monacoInstance) return;
		const currentMode = mode.current;
		monacoInstance.editor.setTheme(currentMode === "dark" ? "vs-dark" : "vs");
	});

	$effect(() => {
		if (!editor || !monacoInstance) return;
		const model = editor.getModel();
		if (model) {
			monacoInstance.editor.setModelLanguage(model, language);
		}
	});

	$effect(() => {
		if (!editor) return;
		editor.updateOptions({ readOnly: disabled || field.disabled });
	});
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		{#if browser}
			<div class="code-editor-wrapper overflow-hidden rounded-md border" class:border-destructive={hasErrors}>
				<div bind:this={container} class="code-editor-container"></div>
			</div>
		{:else}
			<div class="flex min-h-[200px] items-center justify-center rounded-md border bg-muted/50">
				<span class="text-sm text-muted-foreground">Loading editor...</span>
			</div>
		{/if}
		<input type="hidden" name={field.name} {value} />
		{#if field.description}
			<Field.Description>{field.description}</Field.Description>
		{/if}
		<Field.Error errors={errors?.map((e) => ({ message: e }))} />
	</Field.Content>
</Field.Field>

<style>
	.code-editor-container {
		height: 250px;
		min-height: 150px;
	}
</style>
