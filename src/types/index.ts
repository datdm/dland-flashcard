export interface Vocabulary {
  id: string;
  kanji?: string;
  hiragana?: string;
  onyomi?: string;
  meaning?: string;
  phonetic?: string;
}

export interface Lesson {
  id: string;
  name: string;
  description?: string;
  level?: string;
  curriculum?: string;
  vocabulary: Vocabulary[];
}

export const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;

export interface LessonsData {
  lessons: Lesson[];
}

export interface Notebook {
  id: string;
  name: string;
  createdAt: string;
  vocabulary: Vocabulary[];
}

export interface NotebooksData {
  notebooks: Notebook[];
}

export interface VocabProgress {
  learned: boolean;
  favorite: boolean;
  learnedAt?: string;
}

export type ProgressMap = Record<string, VocabProgress>;

export type VocabField = "kanji" | "hiragana" | "onyomi" | "meaning" | "phonetic";

export interface CardSideSettings {
  kanji: boolean;
  hiragana: boolean;
  onyomi: boolean;
  meaning: boolean;
  phonetic: boolean;
}

export interface FlashCardSettings {
  front: CardSideSettings;
  back: CardSideSettings;
}

export const FIELD_LABELS: Record<VocabField, string> = {
  kanji: "Kanji",
  hiragana: "Hiragana",
  onyomi: "Âm Hán",
  meaning: "Nghĩa",
  phonetic: "Phiên Âm",
};

export const ALL_FIELDS: VocabField[] = ["kanji", "hiragana", "onyomi", "meaning", "phonetic"];

export const DEFAULT_SETTINGS: FlashCardSettings = {
  front: {
    kanji: true,
    hiragana: true,
    onyomi: false,
    meaning: false,
    phonetic: false,
  },
  back: {
    kanji: false,
    hiragana: false,
    onyomi: true,
    meaning: true,
    phonetic: true,
  },
};
