<script lang="ts">
	import { speak, cancelSpeech, isSpeaking } from '$lib/services/speech';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		text: string;
		size?: 'sm' | 'default';
		class?: string;
	};

	let { text, size = 'sm', class: className = '' }: Props = $props();

	let playing = $state(false);

	function handleClick() {
		if (playing) {
			cancelSpeech();
			playing = false;
		} else {
			playing = true;
			speak(text);

			// Poll for end of speech
			const interval = setInterval(() => {
				if (!isSpeaking()) {
					playing = false;
					clearInterval(interval);
				}
			}, 200);
		}
	}
</script>

<Button
	variant="ghost"
	{size}
	onclick={handleClick}
	title={playing ? 'Stop' : 'Listen'}
	class={className}
	aria-label={playing ? 'Stop audio' : 'Play audio'}
>
	{#if playing}
		<Icon icon="mdi:stop-circle" width="18" class="text-destructive" />
	{:else}
		<Icon icon="mdi:volume-high" width="18" />
	{/if}
</Button>
