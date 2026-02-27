<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		targetText: string;
		/** Called after recording stops with transcript, score, and audio blob (null if unavailable). */
		onRecorded: (transcript: string, score: number, blob: Blob | null) => Promise<void>;
	};

	let { targetText, onRecorded }: Props = $props();

	let supported = $state(false);
	let mediaSupported = $state(false);
	let isRecording = $state(false);
	let transcript = $state<string | null>(null);
	let score = $state<number | null>(null);
	let error = $state<string | null>(null);
	let saving = $state(false);
	let audioUrl = $state<string | null>(null);
	let duration = $state(0);

	// Internal refs (not reactive)
	let mediaRecorder: MediaRecorder | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let recognition: any = null;
	let chunks: Blob[] = [];
	let stream: MediaStream | null = null;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let pendingTranscript = '';

	onMount(() => {
		supported =
			typeof window !== 'undefined' &&
			('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
		mediaSupported =
			typeof window !== 'undefined' && 'MediaRecorder' in window && 'mediaDevices' in navigator;
	});

	onDestroy(() => {
		stopTimer();
		if (audioUrl) URL.revokeObjectURL(audioUrl);
		if (stream) stream.getTracks().forEach((t) => t.stop());
	});

	function startTimer() {
		duration = 0;
		timerInterval = setInterval(() => {
			duration += 1;
		}, 1000);
	}

	function stopTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	function formatDuration(s: number) {
		const m = Math.floor(s / 60);
		const sec = s % 60;
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}

	/** Word-overlap accuracy: how many target words appeared in what the user said. */
	function computeAccuracy(spoken: string, target: string): number {
		const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
		const spokenWords = new Set(norm(spoken).split(/\s+/).filter(Boolean));
		const targetWords = norm(target).split(/\s+/).filter(Boolean);
		if (!targetWords.length) return 0;
		const matches = targetWords.filter((w) => spokenWords.has(w)).length;
		return Math.round((matches / targetWords.length) * 100);
	}

	async function startRecording() {
		transcript = null;
		score = null;
		error = null;
		audioUrl = null;
		pendingTranscript = '';
		chunks = [];

		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch {
			error = 'Microphone permission denied. Please allow access in your browser settings.';
			return;
		}

		// Start MediaRecorder on the shared stream
		mediaRecorder = new MediaRecorder(stream);
		mediaRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};
		mediaRecorder.onstop = async () => {
			stream?.getTracks().forEach((t) => t.stop());
			stream = null;

			const blob = chunks.length > 0 ? new Blob(chunks, { type: 'audio/webm' }) : null;
			if (blob) {
				if (audioUrl) URL.revokeObjectURL(audioUrl);
				audioUrl = URL.createObjectURL(blob);
			}

			const spoken = pendingTranscript;
			const s = computeAccuracy(spoken, targetText);
			transcript = spoken || '(no speech detected)';
			score = spoken ? s : 0;

			saving = true;
			try {
				await onRecorded(spoken || '', s, blob);
			} finally {
				saving = false;
			}
		};
		mediaRecorder.start();

		// Start SpeechRecognition in parallel (gracefully absent)
		if (supported) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
			recognition = new SR();
			recognition!.lang = 'en-US';
			recognition!.interimResults = false;
			recognition!.maxAlternatives = 1;
			recognition!.continuous = false;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			recognition!.onresult = (event: any) => {
				pendingTranscript = event.results[0][0].transcript;
			};
			recognition!.onerror = () => {
				// Non-fatal: MediaRecorder still captures audio
			};
			try {
				recognition!.start();
			} catch {
				// Ignore — recognition is optional
			}
		}

		isRecording = true;
		startTimer();
	}

	function stopRecording() {
		stopTimer();
		isRecording = false;

		if (recognition) {
			try { recognition.stop(); } catch { /* ignore */ }
			recognition = null;
		}
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	}

	function reset() {
		transcript = null;
		score = null;
		error = null;
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
			audioUrl = null;
		}
		duration = 0;
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

{#if !mediaSupported && !supported}
	<p class="text-xs text-muted-foreground italic">
		Speech recording is not supported in this browser. Try Chrome or Edge.
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
				Tap the button to start recording. Tap again to stop.
			</p>
		{/if}

		<!-- Big tap-to-record / tap-to-stop pill button -->
		{#if isRecording}
			<button
				onclick={stopRecording}
				class="w-full flex items-center justify-center gap-3 rounded-full bg-destructive text-destructive-foreground py-3 px-6 font-semibold text-sm animate-pulse transition-all"
			>
				<span class="h-2.5 w-2.5 rounded-full bg-white"></span>
				Recording… {formatDuration(duration)}
				<span class="text-xs font-normal opacity-80">Tap to stop</span>
			</button>
		{:else}
			<Button
				variant={transcript !== null ? 'outline' : 'default'}
				onclick={transcript !== null ? reset : startRecording}
				disabled={saving}
				class="w-full rounded-full py-3 h-auto gap-2 font-semibold"
			>
				<Icon icon="mdi:microphone" width="18" />
				{transcript !== null ? 'Try again' : 'Tap to record'}
			</Button>
		{/if}

		{#if transcript !== null}
			<div class="space-y-3">
				<!-- Local audio preview -->
				{#if audioUrl}
					<audio controls src={audioUrl} class="w-full h-10 rounded-md"></audio>
				{/if}

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
	</div>
{/if}
