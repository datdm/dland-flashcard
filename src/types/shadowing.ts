export type ShadowingMode = "shadowing" | "dictation" | "pronunciation";

export interface FuriganaToken {
  surface: string; // The written text (Kanji, Kana, etc.)
  reading?: string; // Furigana reading (Hiragana)
  isKanji?: boolean;
  meaning?: string;
  romaji?: string;
}

export interface SubtitleChunk {
  id: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  japanese: string;
  vietnamese: string;
  romaji?: string;
  furiganaTokens?: FuriganaToken[];
  highlightPhrases?: {
    phrase: string;
    type: "grammar" | "vocabulary" | "key";
    meaning?: string;
  }[];
  audioUrl?: string;
  notes?: string;
}

export interface ShadowingVideo {
  id: string;
  youtubeId: string;
  title: string;
  originalTitle?: string;
  description?: string;
  thumbnailUrl: string;
  channelTitle: string;
  durationSeconds: number;
  level: "N5" | "N4" | "N3" | "N2" | "N1" | "A1" | "A2" | "B1" | "B2" | "IELTS" | "All";
  languageCode: "ja" | "en" | "de" | "zh" | "ko";
  category: "technology" | "news" | "conversation" | "vlog" | "business" | "anime" | "story";
  subtitles: SubtitleChunk[];
  isCustom?: boolean;
  importedAt?: string;
  tags?: string[];
}

export interface ShadowingSessionResult {
  videoId: string;
  mode: ShadowingMode;
  date: string;
  score: number;
  completedSentences: number;
  totalSentences: number;
  timeSpentSeconds: number;
  speechTranscripts?: Record<number, { text: string; score: number }>;
}

export interface DictationSentenceState {
  sentenceId: number;
  userInput: string;
  isCorrect: boolean;
  hintUsed: boolean;
  attempts: number;
}
