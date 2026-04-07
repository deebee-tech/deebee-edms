<script lang="ts">
	import { browser } from "$app/environment";
	import type { FormFieldDefinition, VideoWatchData } from "../../types";

	let {
		field,
		value = $bindable({ progress: 0, ended: false, watchedSeconds: 0, totalSeconds: 0 }),
		errors,
	}: {
		field: FormFieldDefinition;
		value?: VideoWatchData;
		errors?: string[];
	} = $props();

	const url = $derived((field.config?.url as string) ?? "");
	const requireWatch = $derived(!!field.config?.requireWatch);
	const watchThreshold = $derived(((field.config?.watchThreshold as number) ?? 95) / 100);
	const hasErrors = $derived(errors && errors.length > 0);
	const meetsThreshold = $derived(value.progress >= watchThreshold);

	let containerEl: HTMLDivElement | undefined = $state();
	let player: ReturnType<(typeof import("video.js"))["default"]> | undefined = undefined;
	let highWatermark = 0;

	function isYouTubeUrl(src: string): boolean {
		return /(?:youtube\.com|youtu\.be)/.test(src);
	}

	function updateWatchData(partial: Partial<VideoWatchData>) {
		value = { ...value, ...partial };
	}

	$effect(() => {
		const src = url;
		const container = containerEl;
		if (!browser || !container || !src) return;

		let disposed = false;
		highWatermark = 0;

		const init = async () => {
			const videojs = (await import("video.js")).default;
			await import("video.js/dist/video-js.css");
			// @ts-expect-error - no type declarations
			await import("videojs-youtube");

			if (disposed) return;

			const videoEl = document.createElement("video-js");
			videoEl.classList.add("vjs-big-play-centered");
			container.appendChild(videoEl);

			const opts: Record<string, unknown> = {
				controls: true,
				fluid: true,
				responsive: true,
			};

			if (isYouTubeUrl(src)) {
				opts.techOrder = ["youtube"];
				opts.sources = [{ type: "video/youtube", src }];
				opts.youtube = { ytControls: 0 };
			} else {
				opts.sources = [{ src }];
			}

			player = videojs(videoEl, opts);

			if (requireWatch) {
				player.on("loadedmetadata", () => {
					if (disposed || !player) return;
					const duration = player.duration() ?? 0;
					if (duration > 0) {
						updateWatchData({ totalSeconds: Math.round(duration) });
					}
				});

				player.on("timeupdate", () => {
					if (disposed || !player) return;
					const current = player.currentTime() ?? 0;
					const duration = player.duration() ?? 0;
					if (duration <= 0) return;

					const progress = current / duration;
					if (progress > highWatermark) {
						highWatermark = progress;
						updateWatchData({
							progress: highWatermark,
							watchedSeconds: Math.round(current),
							totalSeconds: Math.round(duration),
						});
					}
				});

				player.on("ended", () => {
					if (disposed) return;
					highWatermark = 1;
					const duration = player?.duration() ?? 0;
					updateWatchData({
						progress: 1,
						ended: true,
						watchedSeconds: Math.round(duration),
						totalSeconds: Math.round(duration),
					});
				});
			}
		};

		init();

		return () => {
			disposed = true;
			if (player) {
				player.dispose();
				player = undefined;
			}
			container.innerHTML = "";
		};
	});
</script>

{#if field.label}
	<p class="mb-2 text-sm font-medium">{field.label}</p>
{/if}
{#if url}
	<div
		bind:this={containerEl}
		class="overflow-hidden rounded-md"
		class:ring-2={hasErrors}
		class:ring-destructive={hasErrors}
	></div>

	{#if requireWatch}
		<div class="mt-2 space-y-1">
			<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full transition-all duration-300 {meetsThreshold ? 'bg-green-500' : 'bg-primary'}"
					style="width: {Math.min(Math.round(value.progress * 100), 100)}%"
				></div>
			</div>
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>
					{#if value.ended}
						Watched to completion
					{:else if value.progress > 0}
						{Math.round(value.progress * 100)}% watched
					{:else}
						Not started
					{/if}
				</span>
				{#if meetsThreshold}
					<span class="font-medium text-green-600 dark:text-green-400">Requirement met</span>
				{:else}
					<span>Requires {Math.round(watchThreshold * 100)}%</span>
				{/if}
			</div>
		</div>
	{/if}
{:else}
	<div class="flex min-h-[200px] items-center justify-center rounded-md border bg-muted/50">
		<span class="text-sm text-muted-foreground">No video URL configured</span>
	</div>
{/if}
{#if field.description}
	<p class="mt-1 text-xs text-muted-foreground">{field.description}</p>
{/if}
{#if hasErrors}
	{#each errors ?? [] as error, i (i)}
		<p class="mt-1 text-xs text-destructive">{error}</p>
	{/each}
{/if}
