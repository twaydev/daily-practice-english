<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import AudioButton from './AudioButton.svelte';

	type Props = {
		examples: string[];
	};

	let { examples }: Props = $props();
</script>

<div class="space-y-3">
	{#each examples as example, i}
		<Card class="bg-muted/30">
			<CardContent class="pt-4 pb-3">
				<div class="flex items-start justify-between gap-3">
					<div class="flex items-start gap-2 flex-1">
						<span class="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
							{i + 1}
						</span>
						<p class="text-sm leading-relaxed">{example}</p>
					</div>
					<AudioButton text={example} class="flex-shrink-0" />
				</div>
			</CardContent>
		</Card>
	{/each}
</div>
