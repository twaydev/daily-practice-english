import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { ContentType, Sentence, Favorite } from '$lib/types';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export async function getSeededSentences(): Promise<Sentence[]> {
	const { data, error } = await supabase
		.from('sentences')
		.select('*')
		.eq('is_seeded', true)
		.order('category');

	if (error) throw error;
	return data ?? [];
}

export async function getSentencesByCategory(category: string): Promise<Sentence[]> {
	const { data, error } = await supabase
		.from('sentences')
		.select('*')
		.eq('category', category)
		.eq('is_seeded', true);

	if (error) throw error;
	return data ?? [];
}

export async function addFavorite(userId: string, sentenceId: string): Promise<void> {
	const { error } = await supabase
		.from('favorites')
		.insert({ user_id: userId, sentence_id: sentenceId });

	if (error) throw error;
}

export async function removeFavorite(userId: string, sentenceId: string): Promise<void> {
	const { error } = await supabase
		.from('favorites')
		.delete()
		.eq('user_id', userId)
		.eq('sentence_id', sentenceId);

	if (error) throw error;
}

export async function getFavorites(userId: string): Promise<Favorite[]> {
	const { data, error } = await supabase
		.from('favorites')
		.select('*, sentence:sentences(*)')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export async function updateSentencePhoneticData(
	sentenceId: string,
	userId: string,
	data: unknown
): Promise<void> {
	const { error } = await supabase
		.from('sentences')
		.update({ phonetic_data: data })
		.eq('id', sentenceId)
		.eq('user_id', userId); // Only update own sentences

	if (error) throw error;
}

export async function addPracticeEntry(
	userId: string,
	sentenceId: string | null,
	sentenceText: string,
	userTranscript: string,
	accuracyScore: number
): Promise<void> {
	const { error } = await supabase.from('practice_history').insert({
		user_id: userId,
		sentence_id: sentenceId,
		sentence_text: sentenceText,
		user_transcript: userTranscript,
		accuracy_score: accuracyScore
	});

	if (error) throw error;
}

export async function getUserFavoriteIds(userId: string): Promise<string[]> {
	const { data, error } = await supabase
		.from('favorites')
		.select('sentence_id')
		.eq('user_id', userId);

	if (error) throw error;
	return (data ?? []).map((f) => f.sentence_id);
}

export async function getUserSentences(userId: string): Promise<Sentence[]> {
	const { data, error } = await supabase
		.from('sentences')
		.select('*')
		.eq('user_id', userId)
		.eq('is_seeded', false)
		.order('created_at', { ascending: false });

	if (error) throw error;
	return data ?? [];
}

export async function saveUserSentence(
	userId: string,
	text: string,
	contentType: ContentType
): Promise<{ sentence: Sentence; isNew: boolean }> {
	// Return existing sentence if already saved (same user + same text)
	const { data: existing } = await supabase
		.from('sentences')
		.select('*')
		.eq('user_id', userId)
		.eq('text', text)
		.maybeSingle();

	if (existing) return { sentence: existing as Sentence, isNew: false };

	const category = contentType === 'phrasal' ? 'phrasal verbs' : 'my sentences';

	const { data, error } = await supabase
		.from('sentences')
		.insert({ text, content_type: contentType, category, is_seeded: false, user_id: userId })
		.select()
		.single();

	if (error) throw error;
	return { sentence: data as Sentence, isNew: true };
}

export async function updateSentenceTags(
	sentenceId: string,
	userId: string,
	tags: string[]
): Promise<void> {
	const { error } = await supabase
		.from('sentences')
		.update({ tags })
		.eq('id', sentenceId)
		.eq('user_id', userId); // Only allow updating own sentences

	if (error) throw error;
}
