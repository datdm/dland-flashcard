import { Curriculum, CurriculumsData } from "@/types";

const LESSONS_KEY = "flashcash-lessons";
const PROGRESS_KEY = "flashcash-progress";
const SETTINGS_KEY = "flashcash-settings";
const NOTEBOOKS_KEY = "flashcash-notebooks";
const CURRICULUMS_KEY = "flashcash-curriculums";
const GRAMMAR_COLLECTIONS_KEY = "flashcash-grammar-collections";
const GRAMMAR_PROGRESS_KEY = "flashcash-grammar-progress";
const KANJI_PROGRESS_KEY = "flashcash-kanji-progress";

export const StorageKeys = {
  LESSONS: LESSONS_KEY,
  PROGRESS: PROGRESS_KEY,
  SETTINGS: SETTINGS_KEY,
  NOTEBOOKS: NOTEBOOKS_KEY,
  CURRICULUMS: CURRICULUMS_KEY,
  GRAMMAR_COLLECTIONS: GRAMMAR_COLLECTIONS_KEY,
  GRAMMAR_PROGRESS: GRAMMAR_PROGRESS_KEY,
  KANJI_PROGRESS: KANJI_PROGRESS_KEY,
} as const;

export function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function exportAllData(): string {
  if (typeof window === "undefined") return "{}";
  const data: Record<string, unknown> = {};
  const keys = [
    LESSONS_KEY,
    PROGRESS_KEY,
    SETTINGS_KEY,
    NOTEBOOKS_KEY,
    CURRICULUMS_KEY,
    GRAMMAR_COLLECTIONS_KEY,
    GRAMMAR_PROGRESS_KEY,
    KANJI_PROGRESS_KEY,
  ];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): void {
  if (typeof window === "undefined") return;
  const data = JSON.parse(jsonString) as Record<string, unknown>;
  const keys = [
    LESSONS_KEY,
    PROGRESS_KEY,
    SETTINGS_KEY,
    NOTEBOOKS_KEY,
    CURRICULUMS_KEY,
    GRAMMAR_COLLECTIONS_KEY,
    GRAMMAR_PROGRESS_KEY,
    KANJI_PROGRESS_KEY,
  ];
  for (const key of keys) {
    if (data[key] !== undefined) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  }
}

export interface CurriculumImportFormat {
  curriculum: string;
  lessons: Array<{
    name: string;
    vocabulary: Array<{
      kanji?: string;
      hiragana?: string;
      onyomi?: string;
      meaning?: string;
      phonetic?: string;
    }>;
  }>;
}

/**
 * Import curriculum JSON into both Lessons and Curriculums systems
 * Returns { lessonCount, vocabularyCount, error? }
 */
export function importCurriculumJson(jsonString: string): { lessonCount: number; vocabularyCount: number; error?: string } {
  if (typeof window === "undefined") return { lessonCount: 0, vocabularyCount: 0 };

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { lessonCount: 0, vocabularyCount: 0, error: "JSON không hợp lệ." };
  }

  const data = parsed as CurriculumImportFormat;
  if (!data.curriculum || !Array.isArray(data.lessons)) {
    return { lessonCount: 0, vocabularyCount: 0, error: 'JSON phải có "curriculum" và "lessons".' };
  }

  let totalVocab = 0;

  // Import into Lessons system
  const lessonData = getItem<Record<string, unknown>>(LESSONS_KEY) || {};
  const lessons = (lessonData.lessons as unknown[]) || [];

  for (const lesson of data.lessons) {
    if (!lesson.name || !Array.isArray(lesson.vocabulary)) continue;

    const lessonId = `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const vocabulary = lesson.vocabulary.map((v, idx) => ({
      id: `v-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      kanji: v.kanji || undefined,
      hiragana: v.hiragana || undefined,
      onyomi: v.onyomi || undefined,
      meaning: v.meaning || undefined,
      phonetic: v.phonetic || undefined,
    }));

    totalVocab += vocabulary.length;
    (lessons as unknown[]).push({
      id: lessonId,
      name: lesson.name,
      curriculum: data.curriculum,
      level: undefined,
      vocabulary,
    });
  }

  if (lessons.length > 0) {
    setItem(LESSONS_KEY, { lessons });
  }

  // Return counts for UI
  return { lessonCount: data.lessons.length, vocabularyCount: totalVocab };
}

/**
 * Initialize sample curriculum from sample-vocabulary.json on first app load
 * Only runs if curriculums array is empty
 */
export function initializeSampleData(): void {
  if (typeof window === "undefined") return;

  const curriculumsData = getItem<CurriculumsData>(StorageKeys.CURRICULUMS);
  if (curriculumsData?.curriculums && curriculumsData.curriculums.length > 0) {
    return; // Already has data
  }

  // Fetch and load sample data
  fetch("/sample-vocabulary.json")
    .then((res) => res.json())
    .then((data: any) => {
      if (!data.lessons || !Array.isArray(data.lessons)) return;

      // Convert lessons format to curriculum format
      const sampleCurriculum: Curriculum = {
        id: "sample-n5",
        name: "Mẫu N5",
        createdAt: new Date().toISOString(),
        lessons: data.lessons.map((lesson: any) => ({
          id: lesson.id || `lesson-${Math.random().toString(36).slice(2, 9)}`,
          name: lesson.name,
          vocabulary: Array.isArray(lesson.vocabulary)
            ? lesson.vocabulary.map((v: any) => ({
                id: v.id || `v-${Math.random().toString(36).slice(2, 9)}`,
                kanji: v.kanji,
                hiragana: v.hiragana,
                onyomi: v.onyomi,
                meaning: v.meaning,
                phonetic: v.phonetic,
              }))
            : [],
        })),
      };

      setItem<CurriculumsData>(StorageKeys.CURRICULUMS, {
        curriculums: [sampleCurriculum],
      });
    })
    .catch(() => {
      // Silent failure - sample data optional
    });
}

// Streak tracking
export const STREAK_KEY = 'flashcash-streak';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string;
}

export function getStreak(): StreakData {
  if (typeof window === 'undefined') {
    return { currentStreak: 0, longestStreak: 0, lastStreakDate: '' };
  }
  const data = localStorage.getItem(STREAK_KEY);
  if (!data) {
    return { currentStreak: 0, longestStreak: 0, lastStreakDate: '' };
  }
  try {
    return JSON.parse(data);
  } catch {
    return { currentStreak: 0, longestStreak: 0, lastStreakDate: '' };
  }
}

export function updateStreak(): void {
  if (typeof window === 'undefined') return;
  const today = new Date().toISOString().split('T')[0];
  const streak = getStreak();
  if (streak.lastStreakDate === today) {
    return;
  }
  if (streak.lastStreakDate) {
    const lastDate = new Date(streak.lastStreakDate);
    const currentDate = new Date(today);
    const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1) {
      streak.currentStreak = 1;
    } else if (daysDiff === 1) {
      streak.currentStreak++;
    }
  } else {
    streak.currentStreak = 1;
  }
  if (streak.currentStreak > streak.longestStreak) {
    streak.longestStreak = streak.currentStreak;
  }
  streak.lastStreakDate = today;
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak));
}
