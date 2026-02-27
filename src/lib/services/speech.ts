export function speak(text: string, lang = 'en-US'): void {
	if (typeof window === 'undefined' || !window.speechSynthesis) return;

	cancelSpeech();

	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = lang;
	utterance.rate = 0.85;
	utterance.pitch = 1;
	utterance.volume = 1;

	window.speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
	if (typeof window === 'undefined' || !window.speechSynthesis) return;
	window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
	if (typeof window === 'undefined' || !window.speechSynthesis) return false;
	return window.speechSynthesis.speaking;
}

export function isSupported(): boolean {
	return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
