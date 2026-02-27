import { writable } from 'svelte/store';
import type { PhoneticAnalysis, PhrasalAnalysis, ContentType } from '$lib/types';
import { analyzeSentence } from '$lib/services/openai';

interface PracticeState {
	currentSentence: string;
	contentType: ContentType;
	analysis: PhoneticAnalysis | PhrasalAnalysis | null;
	loading: boolean;
	error: string | null;
}

function createPracticeStore() {
	const { subscribe, set, update } = writable<PracticeState>({
		currentSentence: '',
		contentType: 'sentence',
		analysis: null,
		loading: false,
		error: null
	});

	return {
		subscribe,

		setLoading(loading: boolean) {
			update((state) => ({ ...state, loading, error: null }));
		},

		setContentType(contentType: ContentType) {
			update((state) => ({ ...state, contentType, analysis: null }));
		},

		setSentence(sentence: string) {
			update((state) => ({ ...state, currentSentence: sentence }));
		},

		/**
		 * If cachedAnalysis is provided, use it directly and skip the OpenAI call.
		 * This is the primary token-saving mechanism.
		 */
		async analyze(
			sentence: string,
			contentType: ContentType,
			cachedAnalysis?: PhoneticAnalysis | PhrasalAnalysis
		) {
			if (cachedAnalysis) {
				update((state) => ({
					...state,
					analysis: cachedAnalysis,
					currentSentence: sentence,
					contentType,
					loading: false,
					error: null
				}));
				return;
			}

			update((state) => ({
				...state,
				loading: true,
				error: null,
				currentSentence: sentence,
				contentType
			}));

			try {
				const analysis = await analyzeSentence(sentence, contentType);
				update((state) => ({ ...state, analysis, loading: false }));
			} catch (err) {
				const error = err instanceof Error ? err.message : 'Analysis failed';
				update((state) => ({ ...state, error, loading: false }));
			}
		},

		clear() {
			set({
				currentSentence: '',
				contentType: 'sentence',
				analysis: null,
				loading: false,
				error: null
			});
		}
	};
}

export const practiceStore = createPracticeStore();
