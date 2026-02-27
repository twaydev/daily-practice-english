<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { addFavorite, removeFavorite } from '$lib/services/supabase';
	import { toast } from 'svelte-sonner';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	type Props = {
		sentenceId: string;
		isFavorited: boolean;
		onToggle?: (favorited: boolean) => void;
	};

	let { sentenceId, isFavorited = $bindable(false), onToggle }: Props = $props();
	let loading = $state(false);

	async function handleToggle() {
		if (!$authStore.user) {
			toast.error('Please sign in to save favorites');
			goto(`${base}/auth/login`);
			return;
		}

		loading = true;
		try {
			if (isFavorited) {
				await removeFavorite($authStore.user.id, sentenceId);
				isFavorited = false;
				onToggle?.(false);
				toast.success('Removed from favorites');
			} else {
				await addFavorite($authStore.user.id, sentenceId);
				isFavorited = true;
				onToggle?.(true);
				toast.success('Added to favorites');
			}
		} catch {
			toast.error('Failed to update favorites');
		} finally {
			loading = false;
		}
	}
</script>

<Button
	variant="ghost"
	size="sm"
	onclick={handleToggle}
	disabled={loading}
	title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
	aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
>
	{#if loading}
		<Icon icon="mdi:loading" width="18" class="animate-spin" />
	{:else if isFavorited}
		<Icon icon="mdi:heart" width="18" class="text-destructive" />
	{:else}
		<Icon icon="mdi:heart-outline" width="18" />
	{/if}
</Button>
