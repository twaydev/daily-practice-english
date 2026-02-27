<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authStore } from '$lib/stores/auth';
	import { getPracticeEntries, getRecordingUrl } from '$lib/services/supabase';
	import type { PracticeEntry, PracticeHistoryGroup } from '$lib/types';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import Icon from '@iconify/svelte';
	import { toast } from 'svelte-sonner';

	type ViewMode = 'timeline' | 'grouped';

	let entries = $state<PracticeEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let view = $state<ViewMode>('timeline');
	let playingUrl = $state<string | null>(null);
	let playingId = $state<string | null>(null);
	let loadingId = $state<string | null>(null);

	// Flat entries already sorted newest-first — used for timeline
	// Group by sentence_text preserving insertion order → most recently practiced first
	const grouped = $derived.by(() => {
		const map = new Map<string, PracticeEntry[]>();
		for (const entry of entries) {
			const existing = map.get(entry.sentence_text);
			if (existing) existing.push(entry);
			else map.set(entry.sentence_text, [entry]);
		}
		return Array.from(map.entries()).map(([sentence_text, attempts]) => ({
			sentence_text,
			attempts
		} satisfies PracticeHistoryGroup));
	});

	// Group timeline entries by calendar day
	const timelineDays = $derived.by(() => {
		const map = new Map<string, PracticeEntry[]>();
		for (const entry of entries) {
			const day = new Date(entry.created_at).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
			const existing = map.get(day);
			if (existing) existing.push(entry);
			else map.set(day, [entry]);
		}
		return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
	});

	async function loadEntries(userId: string) {
		try {
			entries = await getPracticeEntries(userId);
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
			if (!state.user) { goto(`${base}/auth/login`); return; }
			if (!loaded) { loaded = true; loadEntries(state.user.id); }
		});
		return unsubscribe;
	});

	function revokePlayingUrl() {
		if (playingUrl?.startsWith('blob:')) URL.revokeObjectURL(playingUrl);
		playingUrl = null;
	}

	onDestroy(revokePlayingUrl);

	async function handlePlay(entryId: string, audioUrl: string | null | undefined) {
		if (!audioUrl) return;
		if (playingId === entryId) { playingId = null; revokePlayingUrl(); return; }
		loadingId = entryId;
		try {
			const signed = await getRecordingUrl(audioUrl);
			// Fetch raw bytes and create a blob URL with a known-good MIME type.
			// This bypasses Content-Type mismatches (e.g. video/webm stored in Supabase).
			const resp = await fetch(signed);
			if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
			const bytes = await resp.blob();
			revokePlayingUrl();
			playingUrl = URL.createObjectURL(new Blob([bytes], { type: 'audio/webm' }));
			playingId = entryId;
		} catch (err) {
			console.error('[handlePlay] failed:', err);
			toast.error('Could not load recording. It may have expired or been deleted.');
		} finally {
			loadingId = null;
		}
	}

	function scoreColor(score: number) {
		if (score >= 90) return 'bg-green-500';
		if (score >= 70) return 'bg-amber-500';
		if (score >= 50) return 'bg-orange-500';
		return 'bg-red-500';
	}

	function scoreTextColor(score: number) {
		if (score >= 90) return 'text-green-600';
		if (score >= 70) return 'text-amber-600';
		if (score >= 50) return 'text-orange-600';
		return 'text-red-600';
	}

	function scoreLabel(score: number) {
		if (score >= 90) return 'Excellent';
		if (score >= 70) return 'Good';
		if (score >= 50) return 'Keep practicing';
		return 'Try again';
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDate(iso: string) {
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

<div class="space-y-5">
	<!-- Header + toggle -->
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-xl sm:text-2xl font-bold tracking-tight mb-1">Practice History</h1>
			<p class="text-sm text-muted-foreground">
				{#if !loading}
					{entries.length} {entries.length === 1 ? 'attempt' : 'attempts'} across {grouped.length}
					{grouped.length === 1 ? 'sentence' : 'sentences'}
				{:else}
					Your recording attempts
				{/if}
			</p>
		</div>

		<!-- View toggle -->
		<div class="flex rounded-lg bg-muted p-1 gap-1 shrink-0">
			<button
				onclick={() => (view = 'timeline')}
				class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all {view === 'timeline'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Icon icon="mdi:timeline-clock" width="15" />
				Timeline
			</button>
			<button
				onclick={() => (view = 'grouped')}
				class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all {view === 'grouped'
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground'}"
			>
				<Icon icon="mdi:format-list-group" width="15" />
				By Sentence
			</button>
		</div>
	</div>

	<!-- Loading skeleton -->
	{#if loading}
		<div class="space-y-4">
			{#each { length: 4 } as _}
				<div class="rounded-lg border p-4 space-y-3">
					<Skeleton class="h-4 w-32" />
					<Skeleton class="h-5 w-2/3" />
					<Skeleton class="h-2 w-40 rounded-full" />
				</div>
			{/each}
		</div>

	<!-- Error -->
	{:else if error}
		<div class="text-center py-12 text-destructive">
			<Icon icon="mdi:alert-circle" width="48" class="mx-auto mb-2" />
			<p>{error}</p>
		</div>

	<!-- Empty state -->
	{:else if entries.length === 0}
		<div class="text-center py-16 text-muted-foreground">
			<Icon icon="mdi:history" width="64" class="mx-auto mb-4 opacity-30" />
			<p class="text-lg font-medium mb-1">No practice history yet</p>
			<p class="text-sm">
				Go to <a href="{base}/practice" class="text-primary hover:underline">Practice</a> and record
				yourself speaking a sentence.
			</p>
		</div>

	<!-- ── TIMELINE VIEW ── -->
	{:else if view === 'timeline'}
		<div class="space-y-6">
			{#each timelineDays as { day, items } (day)}
				<!-- Day header -->
				<div>
					<div class="flex items-center gap-3 mb-3">
						<span class="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
							{day}
						</span>
						<div class="flex-1 h-px bg-border"></div>
					</div>

					<!-- Entries for this day -->
					<div class="space-y-2 pl-1">
						{#each items as attempt (attempt.id)}
							<div class="relative pl-5">
								<!-- Timeline dot -->
								<span class="absolute left-0 top-3 w-2 h-2 rounded-full bg-primary/40"></span>

								<div class="rounded-lg border bg-card px-4 py-3 space-y-2">
									<!-- Time + sentence -->
									<div class="flex items-start justify-between gap-2">
										<div class="space-y-0.5 flex-1 min-w-0">
											<p class="text-xs text-muted-foreground">{formatTime(attempt.created_at)}</p>
											<p class="text-sm font-medium leading-snug truncate">
												"{attempt.sentence_text}"
											</p>
										</div>
										<!-- Play button -->
										{#if attempt.audio_url}
											<button
												onclick={() => handlePlay(attempt.id, attempt.audio_url)}
												disabled={loadingId === attempt.id}
												class="shrink-0 flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors hover:bg-accent disabled:opacity-50"
											>
												{#if loadingId === attempt.id}
													<Icon icon="mdi:loading" width="13" class="animate-spin" />
												{:else if playingId === attempt.id}
													<Icon icon="mdi:stop" width="13" />
													Stop
												{:else}
													<Icon icon="mdi:play" width="13" />
													Play
												{/if}
											</button>
										{/if}
									</div>

									<!-- Accuracy -->
									<div class="flex items-center gap-2">
										<div class="h-1.5 w-20 rounded-full bg-muted overflow-hidden shrink-0">
											<div
												class="h-full rounded-full {scoreColor(attempt.accuracy_score)}"
												style="width:{attempt.accuracy_score}%"
											></div>
										</div>
										<span class="text-xs font-semibold tabular-nums {scoreTextColor(attempt.accuracy_score)}">
											{attempt.accuracy_score}%
										</span>
										<span class="text-xs text-muted-foreground">— {scoreLabel(attempt.accuracy_score)}</span>
									</div>

									<!-- Inline audio player -->
									{#if playingId === attempt.id && playingUrl}
										<!-- svelte-ignore a11y_media_has_caption -->
										<video
											controls
											src={playingUrl}
											autoplay
											class="w-full rounded-md"
											style="height:54px"
											onended={() => { playingId = null; revokePlayingUrl(); }}
											onerror={(e) => {
												const el = e.currentTarget as HTMLVideoElement;
												const code = el.error?.code ?? '?';
												console.error('[video] error', code);
												toast.error(`Cannot play recording (error ${code})`);
												playingId = null;
												revokePlayingUrl();
											}}
										></video>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

	<!-- ── GROUPED VIEW ── -->
	{:else}
		<div class="space-y-4">
			{#each grouped as group (group.sentence_text)}
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
											class="h-full rounded-full {scoreColor(attempt.accuracy_score)}"
											style="width:{attempt.accuracy_score}%"
										></div>
									</div>
									<span class="text-xs font-medium tabular-nums">{attempt.accuracy_score}%</span>
									<span class="text-xs text-muted-foreground">— {scoreLabel(attempt.accuracy_score)}</span>
								</div>

								<!-- Play button -->
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

							<!-- Inline audio player -->
							{#if playingId === attempt.id && playingUrl}
								<div class="px-4 pb-3">
									<!-- svelte-ignore a11y_media_has_caption -->
									<video
										controls
										src={playingUrl}
										autoplay
										class="w-full rounded-md"
										style="height:54px"
										onended={() => { playingId = null; revokePlayingUrl(); }}
										onerror={(e) => {
											const el = e.currentTarget as HTMLVideoElement;
											const code = el.error?.code ?? '?';
											console.error('[video] error', code);
											toast.error(`Cannot play recording (error ${code})`);
											playingId = null;
											revokePlayingUrl();
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
