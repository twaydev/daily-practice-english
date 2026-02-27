export interface PhoneticAnalysis {
	ipa: string; // "/ˈkærɪər ˈmuːvz/"
	stress: string; // "CA-reer MOVES"
	tips: string[]; // ["Stress falls on...", "The /r/ is..."]
	breakdown: Array<{ word: string; ipa: string }>;
}

// Extended analysis for phrasal verbs
export interface PhrasalAnalysis extends PhoneticAnalysis {
	definition: string; // "to abandon or stop doing something"
	usage_examples: string[]; // 3 example sentences using the phrasal
	formVariants: string[]; // ["give up", "gave up", "gives up", "giving up"]
	register: 'formal' | 'informal' | 'neutral';
}

export type ContentType = 'sentence' | 'phrasal';

export interface Sentence {
	id: string;
	text: string;
	category: string; // "career moves" | "daily life" | "phrasal verbs" | etc.
	content_type: ContentType;
	is_seeded: boolean;
	user_id: string | null;
	created_at: string;
	tags: string[];
	phonetic_data: PhoneticAnalysis | PhrasalAnalysis | null;
}

export interface Favorite {
	id: string;
	user_id: string;
	sentence_id: string;
	sentence?: Sentence;
	created_at: string;
}

export interface PracticeEntry {
	id: string;
	user_id: string;
	sentence_id: string | null;
	sentence_text: string;
	user_transcript: string;
	accuracy_score: number;
	audio_url?: string | null;
	created_at: string;
}

export interface PracticeHistoryGroup {
	sentence_text: string;
	attempts: PracticeEntry[];
}
