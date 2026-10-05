export type WordType = "Danh từ" | "Tính từ" | "Động từ" | "Phó từ" | "Liên từ" | "Trợ từ" | "Khác";

export const WORD_TYPES: WordType[] = ["Danh từ", "Tính từ", "Động từ", "Phó từ", "Liên từ", "Trợ từ", "Khác"];

export const WORD_TYPE_STYLES: Record<WordType, { bg: string; text: string; border: string }> = {
  "Danh từ":  { bg: "bg-blue-100",    text: "text-blue-800",    border: "border-blue-200" },
  "Tính từ":  { bg: "bg-rose-100",    text: "text-rose-700",    border: "border-rose-200" },
  "Động từ":  { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
  "Phó từ":   { bg: "bg-amber-100",   text: "text-amber-800",   border: "border-amber-200" },
  "Liên từ":  { bg: "bg-purple-100",  text: "text-purple-800",  border: "border-purple-200" },
  "Trợ từ":   { bg: "bg-indigo-100",  text: "text-indigo-800",  border: "border-indigo-200" },
  "Khác":     { bg: "bg-gray-100",    text: "text-gray-700",    border: "border-gray-200" },
};

export interface Vocabulary {
  id: string;
  kanji?: string;
  hiragana?: string;
  onyomi?: string;
  meaning?: string;
  phonetic?: string;
  createdAt?: string;
  sourceType?: "curriculum" | "notebook";
  sourceName?: string;
  wordType?: WordType;
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
  lang?: string;
  level?: string;
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
  lang?: string;
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
  hideSuperMasterN5?: boolean;
  hiddenCurriculumIds?: string[];
}

export const FIELD_LABELS: Record<VocabField, string> = {
  kanji: "Kanji",
  hiragana: "Hiragana",
  onyomi: "Âm Hán",
  meaning: "Nghĩa",
  phonetic: "Phiên Âm",
};

export function getFieldLabels(langCode?: string): Record<VocabField, string> {
  const code = (langCode || "").toLowerCase().trim();
  switch (code) {
    case "de":
      return {
        kanji: "Từ vựng",
        hiragana: "Phát âm",
        onyomi: "Ghi chú",
        meaning: "Nghĩa",
        phonetic: "Phiên âm",
      };
    case "en":
      return {
        kanji: "Từ vựng",
        hiragana: "Phát âm (IPA)",
        onyomi: "Từ loại",
        meaning: "Nghĩa",
        phonetic: "Phiên âm",
      };
    case "ko":
      return {
        kanji: "Từ vựng",
        hiragana: "Phát âm",
        onyomi: "Âm Hán Hàn",
        meaning: "Nghĩa",
        phonetic: "Phiên âm",
      };
    case "zh":
      return {
        kanji: "Chữ Hán",
        hiragana: "Pinyin",
        onyomi: "Âm Hán Việt",
        meaning: "Nghĩa",
        phonetic: "Phiên âm",
      };
    case "ja":
      return {
        kanji: "Kanji",
        hiragana: "Hiragana",
        onyomi: "Âm Hán",
        meaning: "Nghĩa",
        phonetic: "Phiên Âm",
      };
    default:
      if (code && code !== "ja") {
        return {
          kanji: "Từ vựng",
          hiragana: "Phát âm",
          onyomi: "Ghi chú",
          meaning: "Nghĩa",
          phonetic: "Phiên âm",
        };
      }
      return {
        kanji: "Kanji",
        hiragana: "Hiragana",
        onyomi: "Âm Hán",
        meaning: "Nghĩa",
        phonetic: "Phiên Âm",
      };
  }
}

export function getSpeechLangCode(langCode?: string): string {
  const code = (langCode || "").toLowerCase().trim();
  switch (code) {
    case "de":
      return "de-DE";
    case "en":
      return "en-US";
    case "ko":
      return "ko-KR";
    case "zh":
      return "zh-CN";
    case "ja":
    default:
      return "ja-JP";
  }
}

export function getLanguageMetadata(langCode?: string): { name: string; flag: string } {
  const code = (langCode || "").toLowerCase().trim();
  switch (code) {
    case "de":
      return { name: "Tiếng Đức", flag: "🇩🇪" };
    case "en":
      return { name: "Tiếng Anh", flag: "🇬🇧" };
    case "ko":
      return { name: "Tiếng Hàn", flag: "🇰🇷" };
    case "zh":
      return { name: "Tiếng Trung", flag: "🇨🇳" };
    case "ja":
    default:
      return { name: "Tiếng Nhật", flag: "🇯🇵" };
  }
}

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
  hideSuperMasterN5: false,
  hiddenCurriculumIds: [],
};
