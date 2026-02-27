import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { PhoneticAnalysis, PhrasalAnalysis, ContentType } from '$lib/types';

const EDGE_FUNCTION_URL = `${PUBLIC_SUPABASE_URL}/functions/v1/analyze-sentence`;

export async function analyzeSentence(
	sentence: string,
	contentType: ContentType,
	accessToken?: string
): Promise<PhoneticAnalysis | PhrasalAnalysis> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		// Always send a bearer token — user session token if available, otherwise anon key
		Authorization: `Bearer ${accessToken ?? PUBLIC_SUPABASE_ANON_KEY}`
	};

	const response = await fetch(EDGE_FUNCTION_URL, {
		method: 'POST',
		headers,
		body: JSON.stringify({ sentence, content_type: contentType })
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(error.error ?? `HTTP error ${response.status}`);
	}

	return response.json();
}
