<script lang="ts">
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Button } from "$lib/components/ui/button";
	import * as Field from "$lib/components/ui/field";
	import { Separator } from "$lib/components/ui/separator";
	import { DynamicLucideIcon } from "$lib/components/ui/dynamic-lucide-icon";
	import XIcon from "@lucide/svelte/icons/x";
	import type { FormStepDefinition } from "$lib/forms/types";
	import { STEP_ICON_QUICK_PICKS } from "$lib/forms/step-icon-registry";

	let {
		step = $bindable(),
	}: {
		step: FormStepDefinition;
	} = $props();
</script>

<div class="space-y-4">
	<div>
		<h4 class="mb-3 text-sm font-semibold">Step Settings</h4>
		<div class="space-y-3">
			<Field.Field>
				<Field.Label>Title</Field.Label>
				<Field.Content>
					<Input bind:value={step.title} placeholder="Step title" />
				</Field.Content>
			</Field.Field>

			<Field.Field>
				<Field.Label>Description</Field.Label>
				<Field.Content>
					<Textarea bind:value={step.description} placeholder="Optional step description..." />
				</Field.Content>
			</Field.Field>
		</div>
	</div>

	<Separator />

	<div>
		<h4 class="mb-3 text-sm font-semibold">Appearance</h4>
		<div class="space-y-3">
			<Field.Field>
				<Field.Label>Icon</Field.Label>
				<Field.Content>
					<div class="flex items-center gap-2">
						{#if step.icon}
							<div class="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
								<DynamicLucideIcon name={step.icon} class="size-4" />
							</div>
						{/if}
						<Input
							value={step.icon ?? ""}
							placeholder="e.g. user, briefcase, star"
							oninput={(e) => {
								const val = e.currentTarget.value.trim();
								step.icon = val || undefined;
							}}
							class="flex-1"
						/>
						{#if step.icon}
							<Button
								variant="ghost"
								size="icon"
								class="size-8 shrink-0"
								onclick={() => {
									step.icon = undefined;
								}}
							>
								<XIcon class="size-3.5" />
							</Button>
						{/if}
					</div>
					<Field.Description>
						Any <a
							href="https://lucide.dev/icons/"
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-foreground">Lucide icon</a
						> name. Shown in the step indicator instead of the number.
					</Field.Description>
				</Field.Content>
			</Field.Field>

			<div>
				<p class="mb-2 text-xs font-medium text-muted-foreground">Quick picks</p>
				<div class="grid grid-cols-6 gap-1">
					{#each STEP_ICON_QUICK_PICKS as { name, label } (name)}
						<button
							type="button"
							class="flex size-8 items-center justify-center rounded-md border transition-colors hover:bg-accent {step.icon ===
							name
								? 'border-primary bg-primary/10'
								: 'border-transparent'}"
							title={label}
							onclick={() => {
								step.icon = step.icon === name ? undefined : name;
							}}
						>
							<DynamicLucideIcon {name} class="size-3.5 text-muted-foreground" />
						</button>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
