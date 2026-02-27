<script lang="ts">
	import type { Sentence } from '$lib/types';
	import { Card, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import AudioButton from './AudioButton.svelte';
	import FavoriteButton from './FavoriteButton.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	type Props = {
		sentence: Sentence;
		isFavorited?: boolean;
		onFavoriteToggle?: (favorited: boolean) => void;
	};

	let { sentence, isFavorited = $bindable(false), onFavoriteToggle }: Props = $props();

	function handlePractice() {
		const params = new URLSearchParams({
			text: sentence.text,
			type: sentence.content_type
		});
		goto(`${base}/practice?${params.toString()}`);
	}

	const categoryColors: Record<string, string> = {
		'career moves': 'bg-blue-100 text-blue-800',
		'daily life': 'bg-green-100 text-green-800',
		'phrasal verbs': 'bg-purple-100 text-purple-800',
		meetings: 'bg-yellow-100 text-yellow-800',
		general: 'bg-gray-100 text-gray-800'
	};

	const badgeColor = $derived(categoryColors[sentence.category] ?? categoryColors.general);
</script>

<Card class="flex flex-col transition-shadow hover:shadow-md">
	<CardContent class="flex-1 pt-4">
		<div class="flex items-start justify-between gap-2 mb-3">
			<span
				class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {badgeColor}"
			>
				{sentence.category}
			</span>
			{#if sentence.content_type === 'phrasal'}
				<Badge variant="secondary" class="text-xs">phrasal verb</Badge>
			{/if}
		</div>
		<p class="text-sm font-medium leading-relaxed">
			{sentence.text}
		</p>
		{#if sentence.tags?.length > 0}
			<div class="flex flex-wrap gap-1 mt-2">
				{#each sentence.tags as tag}
					<span class="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
						{tag}
					</span>
				{/each}
			</div>
		{/if}
	</CardContent>

	<CardFooter class="flex items-center justify-between pt-0 pb-3 px-4">
		<div class="flex items-center gap-1">
			<AudioButton text={sentence.text} />
			<FavoriteButton
				sentenceId={sentence.id}
				bind:isFavorited
				onToggle={onFavoriteToggle}
			/>
		</div>
		<Button size="sm" onclick={handlePractice}>
			Practice
		</Button>
	</CardFooter>
</Card>
