import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Compute word-level accuracy between a spoken transcript and a target sentence.
 * Case-insensitive and punctuation-agnostic. Returns 0–100.
 */
export function computeAccuracy(spoken: string, target: string): number {
	const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
	const spokenWords = new Set(norm(spoken).split(/\s+/).filter(Boolean));
	const targetWords = norm(target).split(/\s+/).filter(Boolean);
	if (!targetWords.length) return 0;
	const matches = targetWords.filter((w) => spokenWords.has(w)).length;
	return Math.round((matches / targetWords.length) * 100);
}
