import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing transcribeAudio
vi.mock('$lib/services/supabase', () => ({
	supabase: {
		auth: {
			getSession: vi.fn()
		}
	}
}));

import { transcribeAudio } from '$lib/services/openai';
import { supabase } from '$lib/services/supabase';

const mockSession = { access_token: 'test-token-abc' };

describe('transcribeAudio', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('throws if the user is not authenticated', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
			data: { session: null },
			error: null
		} as any);

		const blob = new Blob(['audio'], { type: 'audio/webm' });
		await expect(transcribeAudio(blob)).rejects.toThrow('Not authenticated');
	});

	it('sends a POST to the transcribe-speech edge function with correct headers', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
			data: { session: mockSession },
			error: null
		} as any);

		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ transcript: 'hello world' })
		} as Response);

		const blob = new Blob(['audio'], { type: 'audio/webm' });
		await transcribeAudio(blob);

		expect(fetchSpy).toHaveBeenCalledOnce();
		const [url, options] = fetchSpy.mock.calls[0];
		expect(String(url)).toContain('/functions/v1/transcribe-speech');
		expect((options as RequestInit).method).toBe('POST');
		expect(((options as RequestInit).headers as Record<string, string>)['Authorization']).toBe(
			'Bearer test-token-abc'
		);
	});

	it('appends the audio file with a webm extension for webm blobs', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
			data: { session: mockSession },
			error: null
		} as any);

		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ transcript: '' })
		} as Response);

		const blob = new Blob(['audio'], { type: 'audio/webm' });
		await transcribeAudio(blob);

		const body = (fetchSpy.mock.calls[0][1] as RequestInit).body as FormData;
		const file = body.get('file') as File;
		expect(file).toBeInstanceOf(File);
		expect(file.name).toBe('recording.webm');
	});

	it('uses .ogg extension for ogg blobs', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
			data: { session: mockSession },
			error: null
		} as any);

		const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ transcript: '' })
		} as Response);

		const blob = new Blob(['audio'], { type: 'audio/ogg' });
		await transcribeAudio(blob);

		const body = (fetchSpy.mock.calls[0][1] as RequestInit).body as FormData;
		const file = body.get('file') as File;
		expect(file.name).toBe('recording.ogg');
	});

	it('returns the transcript string on success', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
			data: { session: mockSession },
			error: null
		} as any);

		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({ transcript: 'I am looking to transition.' })
		} as Response);

		const blob = new Blob(['audio'], { type: 'audio/webm' });
		const result = await transcribeAudio(blob);
		expect(result).toBe('I am looking to transition.');
	});

	it('returns empty string when transcript field is missing', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
			data: { session: mockSession },
			error: null
		} as any);

		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: true,
			json: async () => ({})
		} as Response);

		const blob = new Blob(['audio'], { type: 'audio/webm' });
		const result = await transcribeAudio(blob);
		expect(result).toBe('');
	});

	it('throws when the edge function returns a non-ok response', async () => {
		vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
			data: { session: mockSession },
			error: null
		} as any);

		vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
			ok: false,
			json: async () => ({ error: 'Transcription failed' })
		} as Response);

		const blob = new Blob(['audio'], { type: 'audio/webm' });
		await expect(transcribeAudio(blob)).rejects.toThrow('Transcription failed');
	});
});
