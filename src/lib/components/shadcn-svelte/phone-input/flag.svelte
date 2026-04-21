<script lang="ts">
	import { Flag } from "$lib/components/flag";
	import type { Country } from "svelte-tel-input/types";

	interface Props {
		country?: Country | null;
	}

	let { country = null }: Props = $props();
</script>

<Flag countryCode={country?.iso2} />
