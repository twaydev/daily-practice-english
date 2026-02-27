import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeSentence } from '$lib/services/openai';

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
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('returns PhoneticAnalysis for sentence content type', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify(mockPhoneticAnalysis), { status: 200 })
		);

		const result = await analyzeSentence('I am looking.', 'sentence');

		expect(result).toEqual(mockPhoneticAnalysis);
		expect(result.ipa).toBeTruthy();
		expect(result.stress).toBeTruthy();
		expect(Array.isArray(result.tips)).toBe(true);
		expect(Array.isArray(result.breakdown)).toBe(true);
	});

	it('returns PhrasalAnalysis for phrasal content type', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify(mockPhrasalAnalysis), { status: 200 })
		);

		const result = await analyzeSentence('give up', 'phrasal');

		expect(result).toEqual(mockPhrasalAnalysis);
		const phrasal = result as typeof mockPhrasalAnalysis;
		expect(phrasal.definition).toBeTruthy();
		expect(Array.isArray(phrasal.usage_examples)).toBe(true);
		expect(Array.isArray(phrasal.formVariants)).toBe(true);
	});

	it('sends Authorization header when access token provided', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify(mockPhoneticAnalysis), { status: 200 })
		);

		await analyzeSentence('Test sentence.', 'sentence', 'my-access-token');

		const [, options] = vi.mocked(fetch).mock.calls[0];
		const headers = options?.headers as Record<string, string>;
		expect(headers['Authorization']).toBe('Bearer my-access-token');
	});

	it('falls back to anon key in Authorization header when no access token provided', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify(mockPhoneticAnalysis), { status: 200 })
		);

		await analyzeSentence('Test sentence.', 'sentence');

		const [, options] = vi.mocked(fetch).mock.calls[0];
		const headers = options?.headers as Record<string, string>;
		// Should always have an Authorization header — anon key when no user token
		expect(headers['Authorization']).toMatch(/^Bearer /);
	});

	it('throws on non-ok response', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
		);

		await expect(analyzeSentence('Test.', 'sentence')).rejects.toThrow('Unauthorized');
	});

	it('sends POST request with correct body', async () => {
		vi.mocked(fetch).mockResolvedValueOnce(
			new Response(JSON.stringify(mockPhoneticAnalysis), { status: 200 })
		);

		await analyzeSentence('give up', 'phrasal');

		const [, options] = vi.mocked(fetch).mock.calls[0];
		expect(options?.method).toBe('POST');

		const body = JSON.parse(options?.body as string);
		expect(body.sentence).toBe('give up');
		expect(body.content_type).toBe('phrasal');
	});
});
