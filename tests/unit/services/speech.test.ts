import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { speak, cancelSpeech, isSpeaking, isSupported } from '$lib/services/speech';

const mockSpeechSynthesis = {
	speak: vi.fn(),
	cancel: vi.fn(),
	speaking: false
};

describe('speech service', () => {
	beforeEach(() => {
		vi.stubGlobal('window', {
			speechSynthesis: { ...mockSpeechSynthesis, speaking: false }
		});
		vi.stubGlobal('SpeechSynthesisUtterance', vi.fn().mockImplementation((text) => ({ text })));
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe('speak()', () => {
		it('calls speechSynthesis.speak with an utterance', () => {
			speak('Hello world');
			expect(window.speechSynthesis.speak).toHaveBeenCalledTimes(1);
		});

		it('cancels any ongoing speech before speaking', () => {
			speak('First sentence');
			speak('Second sentence');
			expect(window.speechSynthesis.cancel).toHaveBeenCalled();
		});

		it('creates utterance with provided text', () => {
			speak('Test text');
			expect(SpeechSynthesisUtterance).toHaveBeenCalledWith('Test text');
		});

		it('does nothing when speechSynthesis is not available', () => {
			vi.stubGlobal('window', {});
			expect(() => speak('Test')).not.toThrow();
		});

		it('does nothing when window is undefined (SSR)', () => {
			vi.stubGlobal('window', undefined);
			expect(() => speak('Test')).not.toThrow();
		});
	});

	describe('cancelSpeech()', () => {
		it('calls speechSynthesis.cancel', () => {
			cancelSpeech();
			expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(1);
		});

		it('does nothing when speechSynthesis is not available', () => {
			vi.stubGlobal('window', {});
			expect(() => cancelSpeech()).not.toThrow();
		});
	});

	describe('isSpeaking()', () => {
		it('returns true when speechSynthesis is speaking', () => {
			vi.stubGlobal('window', {
				speechSynthesis: { ...mockSpeechSynthesis, speaking: true }
			});
			expect(isSpeaking()).toBe(true);
		});

		it('returns false when not speaking', () => {
			expect(isSpeaking()).toBe(false);
		});

		it('returns false when window is undefined', () => {
			vi.stubGlobal('window', undefined);
			expect(isSpeaking()).toBe(false);
		});
	});

	describe('isSupported()', () => {
		it('returns true when speechSynthesis exists', () => {
			expect(isSupported()).toBe(true);
		});

		it('returns false when window is undefined', () => {
			vi.stubGlobal('window', undefined);
			expect(isSupported()).toBe(false);
		});

		it('returns false when speechSynthesis is not in window', () => {
			vi.stubGlobal('window', {});
			expect(isSupported()).toBe(false);
		});
	});
});
