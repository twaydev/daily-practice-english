<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authStore } from '$lib/stores/auth';
	import { getFavorites } from '$lib/services/supabase';
	import type { Favorite } from '$lib/types';
	import SentenceCard from '$lib/components/SentenceCard.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import Icon from '@iconify/svelte';

	let favorites = $state<Favorite[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadFavorites(userId: string) {
		try {
			favorites = await getFavorites(userId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load favorites';
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
				loadFavorites(state.user.id);
			}
		});

		return unsubscribe;
	});

	function handleFavoriteRemoved(id: string) {
		favorites = favorites.filter((f) => f.sentence_id !== id);
	}
</script>

<svelte:head>
	<title>Favorites – English Practice</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight mb-1">Favorites</h1>
		<p class="text-sm text-muted-foreground">Sentences and phrases you've saved for practice.</p>
	</div>

	{#if loading}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each { length: 3 } as _}
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
	{:else if favorites.length === 0}
		<div class="text-center py-16 text-muted-foreground">
			<Icon icon="mdi:heart-outline" width="64" class="mx-auto mb-4 opacity-30" />
			<p class="text-lg font-medium mb-1">No favorites yet</p>
			<p class="text-sm">
				Browse the <a href="{base}/" class="text-primary hover:underline">home page</a> and save
				sentences you want to practice.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each favorites as fav (fav.id)}
				{#if fav.sentence}
					<SentenceCard
						sentence={fav.sentence}
						isFavorited={true}
						onFavoriteToggle={(favorited) => {
							if (!favorited) handleFavoriteRemoved(fav.sentence_id);
						}}
					/>
				{/if}
			{/each}
		</div>
	{/if}
</div>
