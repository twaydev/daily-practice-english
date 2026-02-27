import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client before importing analyzeSentence
vi.mock('$lib/services/supabase', () => ({
	supabase: {
		functions: {
			invoke: vi.fn()
		}
	}
}));

import { analyzeSentence } from '$lib/services/openai';
import { supabase } from '$lib/services/supabase';

const mockPhoneticAnalysis = {
	ipa: '/aɪ æm ˈlʊkɪŋ/',
	stress: 'i am LOO-king',
	tips: ['Stress the first syllable of "looking"', 'The /aɪ/ sound is a diphthong'],
	breakdown: [
		{ word: 'I', ipa: '/aɪ/' },
		{ word: 'am', ipa: '/æm/' },
		{ word: 'looking', ipa: '/ˈlʊkɪŋ/' }
	]
};

const mockPhrasalAnalysis = {
	...mockPhoneticAnalysis,
	ipa: '/ɡɪv ʌp/',
	stress: 'give UP',
	definition: 'to stop trying or doing something',
	usage_examples: ['She gave up smoking last year.', 'Never give up on your dreams.', 'He gave up the fight.'],
	formVariants: ['give up', 'gives up', 'gave up', 'given up', 'giving up'],
	register: 'informal' as const
};

describe('analyzeSentence', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns PhoneticAnalysis for sentence content type', async () => {
		vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
			data: mockPhoneticAnalysis,
			error: null
		});

		const result = await analyzeSentence('I am looking.', 'sentence');

		expect(result).toEqual(mockPhoneticAnalysis);
		expect(result.ipa).toBeTruthy();
		expect(result.stress).toBeTruthy();
		expect(Array.isArray(result.tips)).toBe(true);
		expect(Array.isArray(result.breakdown)).toBe(true);
	});

	it('returns PhrasalAnalysis for phrasal content type', async () => {
		vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
			data: mockPhrasalAnalysis,
			error: null
		});

		const result = await analyzeSentence('give up', 'phrasal');

		expect(result).toEqual(mockPhrasalAnalysis);
		const phrasal = result as typeof mockPhrasalAnalysis;
		expect(phrasal.definition).toBeTruthy();
		expect(Array.isArray(phrasal.usage_examples)).toBe(true);
		expect(Array.isArray(phrasal.formVariants)).toBe(true);
	});

	it('invokes the correct function name with the right body', async () => {
		vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
			data: mockPhoneticAnalysis,
			error: null
		});

		await analyzeSentence('give up', 'phrasal');

		expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-sentence', {
			body: { sentence: 'give up', content_type: 'phrasal' }
		});
	});

	it('throws when invoke returns an error', async () => {
		vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
			data: null,
			error: { message: 'Unauthorized' }
		});

		await expect(analyzeSentence('Test.', 'sentence')).rejects.toThrow('Unauthorized');
	});

	it('invokes with sentence content type body', async () => {
		vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
			data: mockPhoneticAnalysis,
			error: null
		});

		await analyzeSentence('I am looking.', 'sentence');

		expect(supabase.functions.invoke).toHaveBeenCalledWith('analyze-sentence', {
			body: { sentence: 'I am looking.', content_type: 'sentence' }
		});
	});
});
