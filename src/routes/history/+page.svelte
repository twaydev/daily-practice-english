<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authStore } from '$lib/stores/auth';
	import { getPracticeHistory, getRecordingUrl } from '$lib/services/supabase';
	import type { PracticeHistoryGroup } from '$lib/types';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import Icon from '@iconify/svelte';
	import { toast } from 'svelte-sonner';

	let groups = $state<PracticeHistoryGroup[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	// Map from entryId → signed URL (fetched on demand)
	let playingUrl = $state<string | null>(null);
	let playingId = $state<string | null>(null);
	let loadingId = $state<string | null>(null);

	async function loadHistory(userId: string) {
		try {
			groups = await getPracticeHistory(userId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load history';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		let loaded = false;

		const unsubscribe = authStore.subscribe((state) => {
			if (state.loading) return;
			if (!state.user) {
				goto(`${base}/auth/login`);
				return;
			}
			if (!loaded) {
				loaded = true;
				loadHistory(state.user.id);
			}
		});

		return unsubscribe;
	});

	async function handlePlay(entryId: string, audioUrl: string | null | undefined) {
		if (!audioUrl) return;

		if (playingId === entryId) {
			// Already playing — stop
			playingId = null;
			playingUrl = null;
			return;
		}

		loadingId = entryId;
		try {
			const signed = await getRecordingUrl(audioUrl);
			console.log('[handlePlay] signed URL:', signed);
			playingUrl = signed;
			playingId = entryId;
		} catch (err) {
			console.error('[handlePlay] getRecordingUrl failed:', err);
			toast.error('Could not load recording. It may have expired or been deleted.');
		} finally {
			loadingId = null;
		}
	}

	function scoreColor(score: number): string {
		if (score >= 90) return 'bg-green-500';
		if (score >= 70) return 'bg-amber-500';
		if (score >= 50) return 'bg-orange-500';
		return 'bg-red-500';
	}

	function scoreLabel(score: number): string {
		if (score >= 90) return 'Excellent';
		if (score >= 70) return 'Good';
		if (score >= 50) return 'Keep practicing';
		return 'Try again';
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>History – English Practice</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-xl sm:text-2xl font-bold tracking-tight mb-1">Practice History</h1>
		<p class="text-sm text-muted-foreground">Your recording attempts, grouped by sentence.</p>
	</div>

	{#if loading}
		<div class="space-y-4">
			{#each { length: 3 } as _}
				<div class="rounded-lg border p-4 space-y-3">
					<Skeleton class="h-5 w-2/3" />
					<Skeleton class="h-4 w-1/3" />
					<div class="space-y-2 pl-2">
						{#each { length: 2 } as __}
							<div class="flex items-center gap-3">
								<Skeleton class="h-4 w-24" />
								<Skeleton class="h-2 w-32 rounded-full" />
								<Skeleton class="h-7 w-16" />
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else if error}
		<div class="text-center py-12 text-destructive">
			<Icon icon="mdi:alert-circle" width="48" class="mx-auto mb-2" />
			<p>{error}</p>
		</div>
	{:else if groups.length === 0}
		<div class="text-center py-16 text-muted-foreground">
			<Icon icon="mdi:history" width="64" class="mx-auto mb-4 opacity-30" />
			<p class="text-lg font-medium mb-1">No practice history yet</p>
			<p class="text-sm">
				Go to <a href="{base}/practice" class="text-primary hover:underline">Practice</a> and record
				yourself speaking a sentence.
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each groups as group (group.sentence_text)}
				<div class="rounded-lg border bg-card shadow-sm">
					<!-- Card header -->
					<div class="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b">
						<p class="font-medium text-sm leading-snug flex-1">"{group.sentence_text}"</p>
						<Badge variant="secondary" class="shrink-0 text-xs">
							{group.attempts.length}
							{group.attempts.length === 1 ? 'attempt' : 'attempts'}
						</Badge>
					</div>

					<!-- Attempt rows -->
					<div class="divide-y">
						{#each group.attempts as attempt (attempt.id)}
							<div class="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-x-4">
								<!-- Date -->
								<span class="text-xs text-muted-foreground sm:w-36 sm:shrink-0">
									{formatDate(attempt.created_at)}
								</span>

								<!-- Accuracy bar -->
								<div class="flex items-center gap-2 flex-1">
									<div class="h-2 w-24 rounded-full bg-muted overflow-hidden shrink-0">
										<div
											class="h-full rounded-full transition-all {scoreColor(attempt.accuracy_score)}"
											style="width: {attempt.accuracy_score}%"
										></div>
									</div>
									<span class="text-xs font-medium tabular-nums">{attempt.accuracy_score}%</span>
									<span class="text-xs text-muted-foreground">
										— {scoreLabel(attempt.accuracy_score)}
									</span>
								</div>

								<!-- Play button (only if audio was saved) -->
								{#if attempt.audio_url}
									<button
										onclick={() => handlePlay(attempt.id, attempt.audio_url)}
										disabled={loadingId === attempt.id}
										class="self-start sm:self-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors hover:bg-accent disabled:opacity-50 min-h-[36px]"
									>
										{#if loadingId === attempt.id}
											<Icon icon="mdi:loading" width="14" class="animate-spin" />
											Loading…
										{:else if playingId === attempt.id}
											<Icon icon="mdi:stop" width="14" />
											Stop
										{:else}
											<Icon icon="mdi:play" width="14" />
											Play
										{/if}
									</button>
								{/if}
							</div>

							<!-- Audio player (shown inline when playing) -->
							{#if playingId === attempt.id && playingUrl}
								<div class="px-4 pb-3">
									<!-- svelte-ignore a11y_media_has_caption -->
									<!-- svelte-ignore a11y_media_has_caption -->
									<video
										controls
										src={playingUrl}
										autoplay
										class="w-full rounded-md"
										style="height:54px"
										onended={() => { playingId = null; playingUrl = null; }}
										onerror={(e) => {
											const el = e.currentTarget as HTMLVideoElement;
											const code = el.error?.code ?? '?';
											const msg = el.error?.message ?? 'unknown';
											console.error('[video] error', code, msg);
											toast.error(`Cannot play recording (error ${code}): ${msg}`);
											playingId = null;
											playingUrl = null;
										}}
									></video>
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
