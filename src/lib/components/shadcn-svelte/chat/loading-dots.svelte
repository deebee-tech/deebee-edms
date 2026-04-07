<script lang="ts">
	type Props = {
		size?: number;
	};

	let { size = 4 }: Props = $props();
</script>

<div style:--loading-dots-size="{size}px" class="inline-flex items-center gap-1">
	{#each [0, 1, 2] as i (i)}
		<span class="inline-block size-(--loading-dots-size) rounded-full bg-primary" style:animation-delay="{i * 0.2}s"
		></span>
	{/each}
</div>

<style>
	span {
		animation-name: loading-dots;
		animation-duration: 1.4s;
		animation-iteration-count: infinite;
		animation-fill-mode: both;
	}

	@keyframes loading-dots {
		0% {
			opacity: 0.2;
		}
		20% {
			opacity: 1;
		}
		to {
			opacity: 0.2;
		}
	}
</style>
