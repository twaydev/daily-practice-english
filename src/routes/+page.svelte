<script lang="ts">
	import { onMount } from 'svelte';
	import { getSeededSentences, getUserFavoriteIds, getUserSentences } from '$lib/services/supabase';
	import { authStore } from '$lib/stores/auth';
	import type { Sentence } from '$lib/types';
	import SentenceCard from '$lib/components/SentenceCard.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { buttonVariants } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';
	import { base } from '$app/paths';

	let sentences = $state<Sentence[]>([]);
	let userSentences = $state<Sentence[]>([]);
	let loading = $state(false);
	let userLoading = $state(false);
	let error = $state<string | null>(null);
	let favoriteIds = $state<Set<string>>(new Set());
	let activeTab = $state('sentences');
	let categoryFilter = $state<string | null>(null);

	const sentencesOnly = $derived(sentences.filter((s) => s.content_type === 'sentence'));
	const phrasalsOnly = $derived(sentences.filter((s) => s.content_type === 'phrasal'));
	const sentenceCategories = $derived([...new Set(sentencesOnly.map((s) => s.category))]);
	const filteredSentences = $derived(
		categoryFilter ? sentencesOnly.filter((s) => s.category === categoryFilter) : sentencesOnly
	);

	async function loadSeeded() {
		loading = true;
		error = null;
		try {
			sentences = await getSeededSentences();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load sentences';
		} finally {
			loading = false;
		}
	}

	async function loadUserData(userId: string) {
		userLoading = true;
		try {
			const [s, ids] = await Promise.all([getUserSentences(userId), getUserFavoriteIds(userId)]);
			userSentences = s;
			favoriteIds = new Set(ids);
		} catch {
			// non-critical
		} finally {
			userLoading = false;
		}
	}

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			if (state.loading) return;
			if (state.user) {
				if (!sentences.length) loadSeeded();
				loadUserData(state.user.id);
			} else {
				sentences = [];
				userSentences = [];
				favoriteIds = new Set();
			}
		});

		return unsubscribe;
	});

	function toggleFavorite(id: string, fav: boolean) {
		if (fav) favoriteIds.add(id);
		else favoriteIds.delete(id);
		favoriteIds = new Set(favoriteIds);
	}
</script>

<svelte:head>
	<title>English Practice – Daily Speaking Practice</title>
</svelte:head>

{#if $authStore.loading}
	<!-- Auth initialising -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
		{#each { length: 6 } as _}
			<div class="space-y-3 p-4 border rounded-lg">
				<Skeleton class="h-4 w-24" />
				<Skeleton class="h-12 w-full" />
				<Skeleton class="h-8 w-20" />
			</div>
		{/each}
	</div>

{:else if !$authStore.user}
	<!-- Guest: introduction / landing -->
	<div class="flex flex-col items-center text-center space-y-10 py-12">
		<div class="space-y-4 max-w-2xl">
			<h1 class="text-4xl font-bold tracking-tight">Daily English Practice</h1>
			<p class="text-lg text-muted-foreground">
				Improve your spoken English with IPA phonetics, stress patterns, and AI-powered
				pronunciation feedback — one sentence at a time.
			</p>
			<div class="flex flex-wrap justify-center gap-3 pt-2">
				<a href="{base}/auth/signup" class={buttonVariants({ variant: 'default' }) + ' gap-2'}>
					<Icon icon="mdi:account-plus" width="18" />
					Get started free
				</a>
				<a href="{base}/auth/login" class={buttonVariants({ variant: 'outline' }) + ' gap-2'}>
					<Icon icon="mdi:login" width="18" />
					Sign in
				</a>
			</div>
		</div>

		<!-- Feature highlights -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl text-left">
			<div class="rounded-lg border p-5 space-y-2">
				<div class="flex items-center gap-2 font-semibold">
					<Icon icon="mdi:text-to-speech" width="20" class="text-primary" />
					IPA Phonetics
				</div>
				<p class="text-sm text-muted-foreground">
					Get full IPA transcriptions, stress markers, and word-by-word breakdowns for any
					sentence or phrasal verb.
				</p>
			</div>
			<div class="rounded-lg border p-5 space-y-2">
				<div class="flex items-center gap-2 font-semibold">
					<Icon icon="mdi:microphone" width="20" class="text-primary" />
					Speech Practice
				</div>
				<p class="text-sm text-muted-foreground">
					Record yourself speaking, see your accuracy score instantly, and track progress
					across every session.
				</p>
			</div>
			<div class="rounded-lg border p-5 space-y-2">
				<div class="flex items-center gap-2 font-semibold">
					<Icon icon="mdi:tag-multiple" width="20" class="text-primary" />
					Personal Collection
				</div>
				<p class="text-sm text-muted-foreground">
					Save and tag sentences you practise. Your phonetic analysis is cached so you
					never pay for the same AI call twice.
				</p>
			</div>
		</div>
	</div>

{:else}
	<!-- Logged-in: full content -->
	<div class="space-y-6">
		<div class="text-center space-y-2">
			<h1 class="text-3xl font-bold tracking-tight">Daily English Practice</h1>
			<p class="text-muted-foreground max-w-xl mx-auto">
				Improve your English pronunciation with IPA phonetics, stress patterns, and expert tips.
			</p>
		</div>

		{#if loading}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each { length: 6 } as _}
					<div class="space-y-3 p-4 border rounded-lg">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-12 w-full" />
						<Skeleton class="h-8 w-20" />
					</div>
				{/each}
			</div>
		{:else if error}
			<div class="text-center py-12 text-destructive">
				<Icon icon="mdi:alert-circle" width="48" class="mx-auto mb-2" />
				<p>{error}</p>
			</div>
		{:else}
			<Tabs bind:value={activeTab}>
				<TabsList class="mb-4">
					<TabsTrigger value="sentences">Sentences ({sentencesOnly.length})</TabsTrigger>
					<TabsTrigger value="phrasal">Phrasal Verbs ({phrasalsOnly.length})</TabsTrigger>
					<TabsTrigger value="mine">
						Mine {#if userSentences.length > 0}({userSentences.length}){/if}
					</TabsTrigger>
				</TabsList>

				<!-- Sentences tab -->
				<TabsContent value="sentences">
					{#if sentenceCategories.length > 1}
						<div class="flex flex-wrap gap-2 mb-4">
							<button
								onclick={() => (categoryFilter = null)}
								class="rounded-full px-3 py-1 text-xs font-medium transition-colors {categoryFilter === null ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
							>
								All
							</button>
							{#each sentenceCategories as cat}
								<button
									onclick={() => (categoryFilter = cat)}
									class="rounded-full px-3 py-1 text-xs font-medium transition-colors {categoryFilter === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}"
								>
									{cat}
								</button>
							{/each}
						</div>
					{/if}

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each filteredSentences as sentence (sentence.id)}
							<SentenceCard
								{sentence}
								isFavorited={favoriteIds.has(sentence.id)}
								onFavoriteToggle={(fav) => toggleFavorite(sentence.id, fav)}
							/>
						{/each}
					</div>
				</TabsContent>

				<!-- Phrasal Verbs tab -->
				<TabsContent value="phrasal">
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{#each phrasalsOnly as sentence (sentence.id)}
							<SentenceCard
								{sentence}
								isFavorited={favoriteIds.has(sentence.id)}
								onFavoriteToggle={(fav) => toggleFavorite(sentence.id, fav)}
							/>
						{/each}
					</div>
				</TabsContent>

				<!-- Mine tab -->
				<TabsContent value="mine">
					{#if userLoading}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each { length: 3 } as _}
								<div class="space-y-3 p-4 border rounded-lg">
									<Skeleton class="h-4 w-24" />
									<Skeleton class="h-12 w-full" />
									<Skeleton class="h-8 w-20" />
								</div>
							{/each}
						</div>
					{:else if userSentences.length === 0}
						<div class="text-center py-16 text-muted-foreground">
							<Icon icon="mdi:pencil-plus" width="64" class="mx-auto mb-4 opacity-30" />
							<p class="text-lg font-medium mb-1">Nothing here yet</p>
							<p class="text-sm">
								Go to <a href="{base}/practice" class="text-primary hover:underline">Practice</a>
								and analyze a sentence — it'll appear here automatically.
							</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each userSentences as sentence (sentence.id)}
								<SentenceCard
									{sentence}
									isFavorited={favoriteIds.has(sentence.id)}
									onFavoriteToggle={(fav) => toggleFavorite(sentence.id, fav)}
								/>
							{/each}
						</div>
					{/if}
				</TabsContent>
			</Tabs>
		{/if}
	</div>
{/if}
