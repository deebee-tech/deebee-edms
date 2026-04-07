<script lang="ts">
	import * as Field from "$lib/components/shadcn-svelte/field";
	import { browser } from "$app/environment";
	import { onMount, onDestroy } from "svelte";
	import type { FormFieldDefinition } from "../../types";
	import type { Editor } from "@tiptap/core";

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
	const isDisabled = $derived(disabled || !!field.disabled);

	let editorElement: HTMLDivElement | undefined = $state();
	let editor: Editor | undefined = $state();
	let suppressUpdate = false;
	let txn = $state(0);

	onMount(async () => {
		if (!browser || !editorElement) return;

		const { Editor: TiptapEditor } = await import("@tiptap/core");
		const { default: StarterKit } = await import("@tiptap/starter-kit");
		const { default: Underline } = await import("@tiptap/extension-underline");
		const { default: Link } = await import("@tiptap/extension-link");
		const { default: TextAlign } = await import("@tiptap/extension-text-align");
		const { default: Placeholder } = await import("@tiptap/extension-placeholder");
		const { default: Highlight } = await import("@tiptap/extension-highlight");
		const { default: Color } = await import("@tiptap/extension-color");
		const { TextStyle } = await import("@tiptap/extension-text-style");
		const { default: Subscript } = await import("@tiptap/extension-subscript");
		const { default: Superscript } = await import("@tiptap/extension-superscript");
		const { default: Image } = await import("@tiptap/extension-image");
		const { default: Typography } = await import("@tiptap/extension-typography");

		editor = new TiptapEditor({
			element: editorElement,
			extensions: [
				StarterKit,
				Underline,
				Link.configure({ openOnClick: false, autolink: true }),
				TextAlign.configure({ types: ["heading", "paragraph"] }),
				Placeholder.configure({ placeholder: field.placeholder ?? "Start writing..." }),
				Highlight.configure({ multicolor: true }),
				Color,
				TextStyle,
				Subscript,
				Superscript,
				Image,
				Typography,
			],
			content: value || "",
			editable: !isDisabled,
			onUpdate: ({ editor: e }) => {
				suppressUpdate = true;
				value = e.getHTML();
			},
			onTransaction: () => {
				txn++;
			},
		});
	});

	onDestroy(() => {
		editor?.destroy();
	});

	$effect(() => {
		if (!editor || suppressUpdate) {
			suppressUpdate = false;
			return;
		}
		const current = value;
		if (editor.getHTML() !== current) {
			editor.commands.setContent(current || "", { emitUpdate: false });
		}
	});

	$effect(() => {
		editor?.setEditable(!isDisabled);
	});

	function isActive(name: string, attrs?: Record<string, unknown>): boolean {
		void txn;
		return editor?.isActive(name, attrs) ?? false;
	}

	function toggleLink() {
		if (!editor) return;
		if (editor.isActive("link")) {
			editor.chain().focus().unsetLink().run();
		} else {
			const url = window.prompt("URL");
			if (url) {
				editor.chain().focus().setLink({ href: url }).run();
			}
		}
	}

	function insertImage() {
		if (!editor) return;
		const url = window.prompt("Image URL");
		if (url) {
			editor.chain().focus().setImage({ src: url }).run();
		}
	}
</script>

<Field.Field data-invalid={hasErrors || undefined}>
	<Field.Label>{field.label}</Field.Label>
	<Field.Content>
		{#if browser}
			<div class="richtext-editor-wrapper rounded-md border" class:border-destructive={hasErrors}>
				{#if editor}
					<div class="toolbar">
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("bold")}
							onclick={() => editor?.chain().focus().toggleBold().run()}
							{disabled}
							title="Bold"><b>B</b></button
						>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("italic")}
							onclick={() => editor?.chain().focus().toggleItalic().run()}
							{disabled}
							title="Italic"><i>I</i></button
						>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("underline")}
							onclick={() => editor?.chain().focus().toggleUnderline().run()}
							{disabled}
							title="Underline"><u>U</u></button
						>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("strike")}
							onclick={() => editor?.chain().focus().toggleStrike().run()}
							{disabled}
							title="Strikethrough"><s>S</s></button
						>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("highlight")}
							onclick={() => editor?.chain().focus().toggleHighlight().run()}
							{disabled}
							title="Highlight">H</button
						>

						<div class="toolbar-sep"></div>

						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("heading", { level: 1 })}
							onclick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
							{disabled}
							title="Heading 1">H1</button
						>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("heading", { level: 2 })}
							onclick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
							{disabled}
							title="Heading 2">H2</button
						>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("heading", { level: 3 })}
							onclick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
							{disabled}
							title="Heading 3">H3</button
						>

						<div class="toolbar-sep"></div>

						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("bulletList")}
							onclick={() => editor?.chain().focus().toggleBulletList().run()}
							{disabled}
							title="Bullet list"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line
									x1="8"
									y1="18"
									x2="21"
									y2="18"
								/><circle cx="3" cy="6" r="1" fill="currentColor" /><circle
									cx="3"
									cy="12"
									r="1"
									fill="currentColor"
								/><circle cx="3" cy="18" r="1" fill="currentColor" /></svg
							>
						</button>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("orderedList")}
							onclick={() => editor?.chain().focus().toggleOrderedList().run()}
							{disabled}
							title="Ordered list"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line
									x1="10"
									y1="18"
									x2="21"
									y2="18"
								/><text x="1" y="8" font-size="8" fill="currentColor" stroke="none" font-family="sans-serif">1</text
								><text x="1" y="14" font-size="8" fill="currentColor" stroke="none" font-family="sans-serif">2</text
								><text x="1" y="20" font-size="8" fill="currentColor" stroke="none" font-family="sans-serif">3</text
								></svg
							>
						</button>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("blockquote")}
							onclick={() => editor?.chain().focus().toggleBlockquote().run()}
							{disabled}
							title="Blockquote"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path
									d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"
								/><path
									d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"
								/></svg
							>
						</button>
						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("codeBlock")}
							onclick={() => editor?.chain().focus().toggleCodeBlock().run()}
							{disabled}
							title="Code block"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg
							>
						</button>

						<div class="toolbar-sep"></div>

						<button
							type="button"
							class="toolbar-btn"
							onclick={() => editor?.chain().focus().setTextAlign("left").run()}
							{disabled}
							title="Align left"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line
									x1="21"
									y1="14"
									x2="3"
									y2="14"
								/><line x1="17" y1="18" x2="3" y2="18" /></svg
							>
						</button>
						<button
							type="button"
							class="toolbar-btn"
							onclick={() => editor?.chain().focus().setTextAlign("center").run()}
							{disabled}
							title="Align center"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line
									x1="21"
									y1="14"
									x2="3"
									y2="14"
								/><line x1="18" y1="18" x2="6" y2="18" /></svg
							>
						</button>
						<button
							type="button"
							class="toolbar-btn"
							onclick={() => editor?.chain().focus().setTextAlign("right").run()}
							{disabled}
							title="Align right"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line
									x1="21"
									y1="14"
									x2="3"
									y2="14"
								/><line x1="21" y1="18" x2="7" y2="18" /></svg
							>
						</button>

						<div class="toolbar-sep"></div>

						<button
							type="button"
							class="toolbar-btn"
							class:active={isActive("link")}
							onclick={toggleLink}
							{disabled}
							title="Link"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path
									d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
								/></svg
							>
						</button>
						<button type="button" class="toolbar-btn" onclick={insertImage} {disabled} title="Image">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline
									points="21 15 16 10 5 21"
								/></svg
							>
						</button>
						<button
							type="button"
							class="toolbar-btn"
							onclick={() => editor?.chain().focus().setHorizontalRule().run()}
							{disabled}
							title="Horizontal rule"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12" /></svg
							>
						</button>

						<div class="toolbar-sep"></div>

						<button
							type="button"
							class="toolbar-btn"
							onclick={() => editor?.chain().focus().undo().run()}
							{disabled}
							title="Undo"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg
							>
						</button>
						<button
							type="button"
							class="toolbar-btn"
							onclick={() => editor?.chain().focus().redo().run()}
							{disabled}
							title="Redo"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg
							>
						</button>
					</div>
				{/if}
				<div bind:this={editorElement} class="editor-content"></div>
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
	.richtext-editor-wrapper {
		min-height: 200px;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 2px;
		padding: 6px 8px;
		border-bottom: 1px solid var(--border);
		background: var(--muted);
	}

	.toolbar-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 28px;
		height: 28px;
		padding: 0 5px;
		border: none;
		border-radius: 4px;
		background: transparent;
		color: var(--foreground);
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}

	.toolbar-btn:hover:not(:disabled) {
		background: var(--accent);
	}

	.toolbar-btn.active {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.toolbar-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.toolbar-sep {
		width: 1px;
		height: 20px;
		margin: 4px;
		background: var(--border);
	}

	.editor-content {
		min-height: 150px;
	}

	.editor-content :global(.tiptap) {
		padding: 8px 12px;
		outline: none;
		min-height: 150px;
	}

	.editor-content :global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		height: 0;
		color: var(--muted-foreground);
		pointer-events: none;
	}

	.editor-content :global(.tiptap h1) {
		font-size: 1.75em;
		font-weight: 700;
		line-height: 1.2;
		margin: 0.5em 0;
	}

	.editor-content :global(.tiptap h2) {
		font-size: 1.4em;
		font-weight: 700;
		line-height: 1.25;
		margin: 0.5em 0;
	}

	.editor-content :global(.tiptap h3) {
		font-size: 1.15em;
		font-weight: 600;
		line-height: 1.3;
		margin: 0.5em 0;
	}

	.editor-content :global(.tiptap ul) {
		list-style: disc;
		padding-left: 1.5em;
		margin: 0.5em 0;
	}

	.editor-content :global(.tiptap ol) {
		list-style: decimal;
		padding-left: 1.5em;
		margin: 0.5em 0;
	}

	.editor-content :global(.tiptap blockquote) {
		border-left: 3px solid var(--border);
		padding-left: 1em;
		margin: 0.5em 0;
		color: var(--muted-foreground);
	}

	.editor-content :global(.tiptap pre) {
		background: var(--muted);
		border-radius: 6px;
		padding: 0.75em 1em;
		font-family: var(--font-mono, monospace);
		font-size: 0.9em;
		overflow-x: auto;
		margin: 0.5em 0;
	}

	.editor-content :global(.tiptap code) {
		background: var(--muted);
		border-radius: 3px;
		padding: 0.15em 0.3em;
		font-family: var(--font-mono, monospace);
		font-size: 0.9em;
	}

	.editor-content :global(.tiptap pre code) {
		background: none;
		padding: 0;
	}

	.editor-content :global(.tiptap hr) {
		border: none;
		border-top: 1px solid var(--border);
		margin: 1em 0;
	}

	.editor-content :global(.tiptap a) {
		color: var(--primary);
		text-decoration: underline;
		cursor: pointer;
	}

	.editor-content :global(.tiptap mark) {
		background-color: #fef08a;
		border-radius: 2px;
		padding: 0.1em 0;
	}

	.editor-content :global(.tiptap img) {
		max-width: 100%;
		height: auto;
		border-radius: 4px;
		margin: 0.5em 0;
	}
</style>
