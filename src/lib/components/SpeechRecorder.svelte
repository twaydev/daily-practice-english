<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import Icon from '@iconify/svelte';
	import { Button } from '$lib/components/ui/button';
	import { transcribeAudio } from '$lib/services/openai';
	import { computeAccuracy } from '$lib/utils';

	type Props = {
		targetText: string;
		/** Called after transcription completes with transcript, score, and audio blob. */
		onRecorded: (transcript: string, score: number, blob: Blob | null) => Promise<void>;
	};

	let { targetText, onRecorded }: Props = $props();

	let mediaSupported = $state(false);
	let isRecording = $state(false);
	let transcribing = $state(false);
	let saving = $state(false);
	/**
	 * null  = no recording yet
	 * ''    = recording done but no speech detected
	 * string = the spoken transcript
	 */
	let transcript = $state<string | null>(null);
	let score = $state<number | null>(null);
	let error = $state<string | null>(null);
	let audioUrl = $state<string | null>(null);
	let duration = $state(0);

	let mediaRecorder: MediaRecorder | null = null;
	let chunks: Blob[] = [];
	let stream: MediaStream | null = null;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let capturedMimeType = '';

	onMount(() => {
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

	async function startRecording() {
		// Reset state
		transcript = null;
		score = null;
		error = null;
		chunks = [];
		capturedMimeType = '';
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
			audioUrl = null;
		}

		try {
			stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch {
			error = 'Microphone permission denied. Please allow access in your browser settings.';
			return;
		}

		mediaRecorder = new MediaRecorder(stream);
		capturedMimeType = mediaRecorder.mimeType;

		mediaRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};

		mediaRecorder.onstop = async () => {
			stream?.getTracks().forEach((t) => t.stop());
			stream = null;

			const blob =
				chunks.length > 0 ? new Blob(chunks, { type: capturedMimeType || 'audio/webm' }) : null;

			// Show audio preview immediately so the user can listen while we transcribe
			if (blob) {
				if (audioUrl) URL.revokeObjectURL(audioUrl);
				audioUrl = URL.createObjectURL(blob);
			}

			if (!blob) {
				transcript = '';
				return;
			}

			// Transcribe via Whisper
			transcribing = true;
			let spoken = '';
			try {
				spoken = await transcribeAudio(blob);
			} catch {
				// Non-fatal: show audio without transcript
			} finally {
				transcribing = false;
			}

			spoken = spoken.trim();
			const s = spoken ? computeAccuracy(spoken, targetText) : 0;
			transcript = spoken;
			score = spoken ? s : null;

			saving = true;
			try {
				await onRecorded(spoken, s, blob);
			} finally {
				saving = false;
			}
		};

		mediaRecorder.start();
		isRecording = true;
		startTimer();
	}

	function stopRecording() {
		stopTimer();
		isRecording = false;
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
	}

	function reset() {
		transcript = null;
		score = null;
		error = null;
		transcribing = false;
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

	const busy = $derived(transcribing || saving);
</script>

{#if !mediaSupported}
	<p class="text-xs text-muted-foreground italic">
		Audio recording is not supported in this browser. Try Chrome, Edge, or Firefox.
	</p>
{:else}
	<div class="space-y-3 rounded-md border p-4">
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-semibold flex items-center gap-2">
				<Icon icon="mdi:microphone" width="16" />
				Speak it aloud
			</h3>
			{#if transcript !== null && !busy}
				<button
					onclick={reset}
					class="text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					Clear
				</button>
			{/if}
		</div>

		{#if transcript === null && !isRecording && !busy}
			<p class="text-xs text-muted-foreground">
				Tap the button to start recording. Tap again to stop.
			</p>
		{/if}

		<!-- Record / stop button -->
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
				onclick={startRecording}
				disabled={busy}
				class="w-full rounded-full py-3 h-auto gap-2 font-semibold"
			>
				{#if busy}
					<Icon icon="mdi:loading" width="18" class="animate-spin" />
					{transcribing ? 'Transcribing…' : 'Saving…'}
				{:else}
					<Icon icon="mdi:microphone" width="18" />
					{transcript !== null ? 'Try again' : 'Tap to record'}
				{/if}
			</Button>
		{/if}

		<!-- Results area -->
		{#if audioUrl || transcript !== null}
			<div class="space-y-3">
				<!-- Audio preview (shown as soon as recording stops) -->
				{#if audioUrl}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video controls src={audioUrl} class="w-full rounded-md" style="height:54px"></video>
				{/if}

				{#if transcribing}
					<p class="text-xs text-muted-foreground flex items-center gap-1.5">
						<Icon icon="mdi:loading" width="12" class="animate-spin" />
						Transcribing your speech…
					</p>
				{:else if transcript !== null}
					<!-- Transcript -->
					{#if transcript}
						<div class="rounded-md bg-muted/40 px-3 py-2 text-sm">
							<p class="text-xs text-muted-foreground mb-1">You said:</p>
							<p class="font-medium">{transcript}</p>
						</div>
					{:else}
						<p class="text-xs text-muted-foreground italic">
							No speech detected — make sure your mic is unmuted and try again.
						</p>
					{/if}

					<!-- Accuracy bar (only when we have a real transcript) -->
					{#if score !== null}
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
				{/if}
			</div>
		{/if}

		{#if error}
			<p class="text-xs text-destructive">{error}</p>
		{/if}
	</div>
{/if}
