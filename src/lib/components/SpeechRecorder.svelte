<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		targetText: string;
		/** Called after recognition ends with the transcript + accuracy score. */
		onRecorded: (transcript: string, score: number) => Promise<void>;
	};

	let { targetText, onRecorded }: Props = $props();

	let supported = $state(false);
	let isRecording = $state(false);
	let transcript = $state<string | null>(null);
	let score = $state<number | null>(null);
	let error = $state<string | null>(null);
	let saving = $state(false);
	let manualMode = $state(false);
	let manualInput = $state('');

	onMount(() => {
		supported =
			typeof window !== 'undefined' &&
			('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
	});

	/** Word-overlap accuracy: how many target words appeared in what the user said. */
	function computeAccuracy(spoken: string, target: string): number {
		const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
		const spokenWords = new Set(norm(spoken).split(/\s+/).filter(Boolean));
		const targetWords = norm(target).split(/\s+/).filter(Boolean);
		if (!targetWords.length) return 0;
		const matches = targetWords.filter((w) => spokenWords.has(w)).length;
		return Math.round((matches / targetWords.length) * 100);
	}

	function startRecording() {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
		const recognition = new SR();
		recognition.lang = 'en-US';
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;
		recognition.continuous = false;

		transcript = null;
		score = null;
		error = null;
		isRecording = true;

		recognition.onresult = async (event: SpeechRecognitionEvent) => {
			const spoken = event.results[0][0].transcript;
			const s = computeAccuracy(spoken, targetText);
			transcript = spoken;
			score = s;

			saving = true;
			try {
				await onRecorded(spoken, s);
			} finally {
				saving = false;
			}
		};

		recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
			isRecording = false;
			if (event.error === 'no-speech') return;
			if (event.error === 'not-allowed') {
				error = 'Microphone permission denied. Please allow access in your browser settings.';
			} else if (event.error === 'network') {
				error = 'Speech recognition requires Google\'s servers and couldn\'t connect. Type your attempt below instead.';
				manualMode = true;
			} else {
				error = `Recording failed (${event.error})`;
			}
		};

		recognition.onend = () => {
			isRecording = false;
		};

		try {
			recognition.start();
		} catch {
			isRecording = false;
			error = 'Could not start recording';
		}
	}

	async function submitManual() {
		const spoken = manualInput.trim();
		if (!spoken) return;
		const s = computeAccuracy(spoken, targetText);
		transcript = spoken;
		score = s;
		manualMode = false;
		manualInput = '';
		error = null;

		saving = true;
		try {
			await onRecorded(spoken, s);
		} finally {
			saving = false;
		}
	}

	function reset() {
		transcript = null;
		score = null;
		error = null;
		manualMode = false;
		manualInput = '';
	}

	const scoreLabel = $derived(
		score === null
			? ''
			: score >= 90
				? 'Excellent!'
				: score >= 70
					? 'Good'
					: score >= 50
						? 'Keep practicing'
						: 'Try again'
	);

	const scoreColor = $derived(
		score === null
			? ''
			: score >= 90
				? 'text-green-600'
				: score >= 70
					? 'text-amber-600'
					: score >= 50
						? 'text-orange-600'
						: 'text-red-600'
	);

	const scoreBarColor = $derived(
		score === null
			? ''
			: score >= 90
				? 'bg-green-500'
				: score >= 70
					? 'bg-amber-500'
					: score >= 50
						? 'bg-orange-500'
						: 'bg-red-500'
	);
</script>

{#if !supported}
	<p class="text-xs text-muted-foreground italic">
		Speech recording requires Chrome or Edge. Your browser doesn't support it.
	</p>
{:else}
	<div class="space-y-3 rounded-md border p-4">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-semibold flex items-center gap-2">
				<Icon icon="mdi:microphone" width="16" />
				Speak it aloud
			</h3>
			{#if transcript !== null}
				<button
					onclick={reset}
					class="text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					Clear
				</button>
			{/if}
		</div>

		{#if transcript === null && !isRecording}
			<p class="text-xs text-muted-foreground">
				Read the sentence aloud, then click Record. Your pronunciation is compared word-by-word.
			</p>
		{/if}

		<Button
			variant={isRecording ? 'destructive' : 'outline'}
			onclick={isRecording ? undefined : startRecording}
			disabled={saving}
			class="gap-2"
		>
			{#if isRecording}
				<span class="h-2 w-2 rounded-full bg-white animate-pulse"></span>
				Listening…
			{:else}
				<Icon icon="mdi:microphone" width="16" />
				{transcript !== null ? 'Record again' : 'Record'}
			{/if}
		</Button>

		{#if transcript !== null}
			<div class="space-y-3">
				<!-- What user said -->
				<div class="rounded-md bg-muted/40 px-3 py-2 text-sm">
					<p class="text-xs text-muted-foreground mb-1">You said:</p>
					<p class="font-medium">{transcript}</p>
				</div>

				{#if score !== null}
					<!-- Accuracy bar -->
					<div class="space-y-1">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground">Accuracy</span>
							<span class="font-semibold {scoreColor}">{score}% — {scoreLabel}</span>
						</div>
						<div class="h-2 w-full rounded-full bg-muted overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-500 {scoreBarColor}"
								style="width: {score}%"
							></div>
						</div>
					</div>

					{#if saving}
						<p class="text-xs text-muted-foreground">Saving attempt…</p>
					{:else}
						<p class="text-xs text-muted-foreground">Attempt saved to your history.</p>
					{/if}
				{/if}
			</div>
		{/if}

		{#if error}
			<p class="text-xs text-destructive">{error}</p>
		{/if}

		{#if manualMode}
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={manualInput}
					onkeydown={(e) => { if (e.key === 'Enter') submitManual(); }}
					placeholder="Type what you said…"
					class="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
				<Button onclick={submitManual} disabled={!manualInput.trim() || saving} class="h-9">
					Submit
				</Button>
			</div>
		{/if}
	</div>
{/if}
