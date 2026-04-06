<script lang="ts">
	import { FormRenderer } from "$lib/components/form-renderer";
	import * as Card from "$lib/components/ui/card";
	import type { PageData } from "./$types";

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto max-w-2xl py-10">
	<Card.Root>
		<Card.Header>
			<Card.Title>{data.definition.name}</Card.Title>
			{#if data.definition.description}
				<Card.Description>{data.definition.description}</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content>
			<FormRenderer definition={data.definition} data={data.form} />
		</Card.Content>
	</Card.Root>
</div>
