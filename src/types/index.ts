export interface Vocabulary {
  id: string;
  kanji?: string;
  hiragana?: string;
  onyomi?: string;
  meaning?: string;
  phonetic?: string;
  createdAt?: string;
}

export interface Lesson {
  id: string;
  name: string;
  description?: string;
  level?: string;
  curriculum?: string;
  vocabulary: Vocabulary[];
}

export interface LessonInCurriculum {
  id: string;
  name: string;
  vocabulary: Vocabulary[];
}

export interface Curriculum {
  id: string;
  name: string;
  createdAt: string;
  lessons: LessonInCurriculum[];
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

export interface CurriculumsData {
  curriculums: Curriculum[];
}

export interface VocabProgress {
  learned: boolean;
  favorite: boolean;
  learnedAt?: string;
}

export type ProgressMap = Record<string, VocabProgress>;

// --- Grammar Types ---

export interface GrammarExample {
  id: string;
  sentence: string;          // Câu tiếng Nhật
  romaji?: string;           // Phiên âm
  meaning: string;           // Nghĩa tiếng Việt
  breakdown?: string;        // Phân tích câu
}

export interface GrammarPoint {
  id: string;
  structure: string;         // Cấu trúc: "～ている"
  meaning: string;           // Nghĩa: "Đang làm gì"
  explanation?: string;      // Giải thích chi tiết
  mnemonic?: string;         // Mẹo ghi nhớ
  level?: string;            // N5, N4, N3, N2, N1
  examples: GrammarExample[];
  notes?: string;            // Ghi chú thêm
  relatedGrammar?: string[]; // IDs của ngữ pháp liên quan
}

export interface GrammarCollection {
  id: string;
  name: string;              // "Ngữ pháp N5 cơ bản", "Động từ thể て"
  description?: string;
  createdAt: string;
  grammarPoints: GrammarPoint[];
}

export interface GrammarCollectionsData {
  collections: GrammarCollection[];
}

export interface GrammarProgress {
  learned: boolean;
  favorite: boolean;
  learnedAt?: string;
  lastPracticedAt?: string;
  masteryLevel?: number;     // 0-5 scale
}

export type GrammarProgressMap = Record<string, GrammarProgress>;

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
