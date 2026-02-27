import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SpeechRecorder from '$lib/components/SpeechRecorder.svelte';

// Mock transcribeAudio so no real network calls happen
vi.mock('$lib/services/openai', () => ({
	transcribeAudio: vi.fn()
}));

import { transcribeAudio } from '$lib/services/openai';

// Stable blob URL mock (URL.createObjectURL is not fully supported in jsdom)
vi.stubGlobal('URL', {
	...URL,
	createObjectURL: vi.fn(() => 'blob:mock-url'),
	revokeObjectURL: vi.fn()
});

// ── MediaRecorder mock ──────────────────────────────────────────────────
class MockMediaRecorder {
	static isTypeSupported = () => true;
	mimeType = 'audio/webm';
	state = 'inactive';
	ondataavailable: ((e: { data: Blob }) => void) | null = null;
	onstop: (() => Promise<void> | void) | null = null;

	start = vi.fn(() => {
		this.state = 'recording';
	});

	stop = vi.fn(() => {
		this.state = 'inactive';
	});
}

const mockStream = { getTracks: () => [{ stop: vi.fn() }] };

function setupBrowserMocks() {
	vi.stubGlobal('MediaRecorder', MockMediaRecorder);
	Object.defineProperty(navigator, 'mediaDevices', {
		value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
		configurable: true,
		writable: true
	});
}

function teardownBrowserMocks() {
	vi.unstubAllGlobals();
	// Restore URL mock since unstubAllGlobals removes it too
	vi.stubGlobal('URL', {
		...URL,
		createObjectURL: vi.fn(() => 'blob:mock-url'),
		revokeObjectURL: vi.fn()
	});
}

// Helper: start recording, wait for recording state, return the mock recorder
async function startRecordingFlow(onRecorded = vi.fn().mockResolvedValue(undefined)) {
	let mockRecorder: MockMediaRecorder | null = null;

	vi.stubGlobal(
		'MediaRecorder',
		vi.fn(() => {
			mockRecorder = new MockMediaRecorder();
			return mockRecorder;
		})
	);

	render(SpeechRecorder, { targetText: 'hello world', onRecorded });

	const btn = await screen.findByRole('button', { name: /tap to record/i });
	fireEvent.click(btn);

	// Wait until the component has entered recording state
	await waitFor(() => expect(mockRecorder?.start).toHaveBeenCalled());

	return { mockRecorder: mockRecorder!, onRecorded };
}

// Helper: simulate MediaRecorder finishing (fires ondataavailable then onstop)
async function finishRecording(recorder: MockMediaRecorder) {
	recorder.ondataavailable?.({ data: new Blob(['fake-audio'], { type: 'audio/webm' }) });
	await recorder.onstop?.();
	// Flush any remaining microtask queue
	await new Promise((r) => setTimeout(r, 0));
}

// ── Tests ───────────────────────────────────────────────────────────────

describe('SpeechRecorder — unsupported environment', () => {
	beforeEach(() => {
		vi.stubGlobal('MediaRecorder', undefined);
	});
	afterEach(() => vi.unstubAllGlobals());

	it('shows an unsupported message when MediaRecorder is unavailable', async () => {
		render(SpeechRecorder, { targetText: 'hello world', onRecorded: vi.fn() });
		expect(screen.getByText(/not supported in this browser/i)).toBeTruthy();
	});

	it('does not render the record button', async () => {
		render(SpeechRecorder, { targetText: 'hello world', onRecorded: vi.fn() });
		expect(screen.queryByRole('button', { name: /tap to record/i })).toBeNull();
	});
});

describe('SpeechRecorder — idle state', () => {
	beforeEach(setupBrowserMocks);
	afterEach(teardownBrowserMocks);

	it('renders the "Tap to record" button', async () => {
		render(SpeechRecorder, { targetText: 'hello world', onRecorded: vi.fn() });
		await waitFor(() => expect(screen.getByText(/tap to record/i)).toBeTruthy());
	});

	it('shows the instruction hint text', async () => {
		render(SpeechRecorder, { targetText: 'hello world', onRecorded: vi.fn() });
		await waitFor(() =>
			expect(screen.getByText(/tap the button to start recording/i)).toBeTruthy()
		);
	});
});

describe('SpeechRecorder — recording flow', () => {
	beforeEach(() => {
		setupBrowserMocks();
		vi.clearAllMocks();
	});
	afterEach(teardownBrowserMocks);

	it('enters recording state after tapping the button', async () => {
		const { mockRecorder } = await startRecordingFlow();
		expect(mockRecorder.start).toHaveBeenCalled();
		expect(screen.getByText(/Recording…/i)).toBeTruthy();
	});

	it('calls onRecorded with transcript, score, and blob after recording completes', async () => {
		vi.mocked(transcribeAudio).mockResolvedValue('hello world');
		const { mockRecorder, onRecorded } = await startRecordingFlow();

		await finishRecording(mockRecorder);

		await waitFor(() => expect(onRecorded).toHaveBeenCalled(), { timeout: 2000 });

		const [transcript, score, blob] = onRecorded.mock.calls[0];
		expect(transcript).toBe('hello world');
		expect(score).toBe(100); // exact match → 100%
		expect(blob).toBeInstanceOf(Blob);
	});

	it('computes accuracy score based on word overlap', async () => {
		// Only "hello" matches the target "hello world" → 50%
		vi.mocked(transcribeAudio).mockResolvedValue('hello there');
		const { mockRecorder, onRecorded } = await startRecordingFlow();

		await finishRecording(mockRecorder);

		await waitFor(() => expect(onRecorded).toHaveBeenCalled(), { timeout: 2000 });
		expect(onRecorded.mock.calls[0][1]).toBe(50);
	});

	it('shows the transcript and accuracy bar after recording completes', async () => {
		vi.mocked(transcribeAudio).mockResolvedValue('hello world');
		const onRecorded = vi.fn().mockResolvedValue(undefined);
		const { mockRecorder } = await startRecordingFlow(onRecorded);

		await finishRecording(mockRecorder);

		await waitFor(() => expect(screen.getByText('hello world')).toBeTruthy(), {
			timeout: 2000
		});
		expect(screen.getByText(/100%/)).toBeTruthy();
		expect(screen.getByText(/Excellent/i)).toBeTruthy();
	});
});
