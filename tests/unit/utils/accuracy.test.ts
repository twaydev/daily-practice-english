import { describe, it, expect } from 'vitest';
import { computeAccuracy } from '$lib/utils';

describe('computeAccuracy', () => {
	it('returns 100 for an exact match', () => {
		expect(computeAccuracy('hello world', 'hello world')).toBe(100);
	});

	it('is case-insensitive', () => {
		expect(computeAccuracy('Hello World', 'hello world')).toBe(100);
		expect(computeAccuracy('GIVE UP', 'give up')).toBe(100);
	});

	it('ignores punctuation in both spoken and target', () => {
		expect(computeAccuracy('hello, world!', 'hello world')).toBe(100);
		expect(computeAccuracy('hello world', "hello, world!")).toBe(100);
	});

	it('returns 0 when no words match', () => {
		expect(computeAccuracy('foo bar', 'hello world')).toBe(0);
	});

	it('returns 0 when spoken is empty', () => {
		expect(computeAccuracy('', 'hello world')).toBe(0);
	});

	it('returns 0 when target is empty', () => {
		expect(computeAccuracy('hello world', '')).toBe(0);
	});

	it('computes partial matches correctly', () => {
		// 1 of 2 target words matched
		expect(computeAccuracy('hello there', 'hello world')).toBe(50);
		// 2 of 4 target words matched
		expect(computeAccuracy('I am here now', 'I am looking forward')).toBe(50);
	});

	it('counts each target word only once even if spoken twice', () => {
		// "hello" appears twice in spoken but target only has it once → still 50%
		expect(computeAccuracy('hello hello', 'hello world')).toBe(50);
	});

	it('handles extra words in spoken without penalty', () => {
		// Target is "give up" → both words present in spoken → 100%
		expect(computeAccuracy('I should give up now', 'give up')).toBe(100);
	});

	it('returns a rounded integer', () => {
		// 1 of 3 words = 33.33... → rounds to 33
		const result = computeAccuracy('hello', 'hello world today');
		expect(result).toBe(33);
		expect(Number.isInteger(result)).toBe(true);
	});
});
