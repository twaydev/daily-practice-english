import type { PhoneticAnalysis, PhrasalAnalysis, ContentType } from '$lib/types';
import { supabase } from '$lib/services/supabase';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

/**
 * Transcribe an audio blob using OpenAI Whisper via the Edge Function.
 * Returns the transcribed text, or an empty string if transcription fails.
 */
export async function transcribeAudio(blob: Blob): Promise<string> {
	const {
		data: { session }
	} = await supabase.auth.getSession();
	const token = session?.access_token;
	if (!token) throw new Error('Not authenticated');

	const formData = new FormData();
	// Give the file a name with an appropriate extension so Whisper can detect the format
	const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'mp4' : 'webm';
	formData.append('file', blob, `recording.${ext}`);

	const response = await fetch(`${PUBLIC_SUPABASE_URL}/functions/v1/transcribe-speech`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}` },
		body: formData
	});

	if (!response.ok) {
		const err = await response.json().catch(() => ({}));
		throw new Error(err.error ?? 'Transcription failed');
	}

	const data = await response.json();
	return (data.transcript as string) ?? '';
}

export async function analyzeSentence(
	sentence: string,
	contentType: ContentType
): Promise<PhoneticAnalysis | PhrasalAnalysis> {
	const { data, error } = await supabase.functions.invoke('analyze-sentence', {
		body: { sentence, content_type: contentType }
	});

	if (error) throw new Error(error.message);
	return data;
}
