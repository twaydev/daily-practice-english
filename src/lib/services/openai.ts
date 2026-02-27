import type { PhoneticAnalysis, PhrasalAnalysis, ContentType } from '$lib/types';
import { supabase } from '$lib/services/supabase';

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
