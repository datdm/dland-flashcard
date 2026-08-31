import { Curriculum, CurriculumsData } from "@/types";

const LESSONS_KEY = "flashcash-lessons";
const PROGRESS_KEY = "flashcash-progress";
const SETTINGS_KEY = "flashcash-settings";
const NOTEBOOKS_KEY = "flashcash-notebooks";
const CURRICULUMS_KEY = "flashcash-curriculums";
const GRAMMAR_COLLECTIONS_KEY = "flashcash-grammar-collections";
const GRAMMAR_PROGRESS_KEY = "flashcash-grammar-progress";
const KANJI_PROGRESS_KEY = "flashcash-kanji-progress";
const CURRICULUM_HISTORY_KEY = "flashcash-curriculum-history";
const PRACTICE_HISTORY_KEY = "flashcash-practice-history";
const TARGET_LANGUAGE_KEY = "dland_target_language";
const KAIWA_PROGRESS_KEY = "dland_kaiwa_completed";
export const STREAK_KEY = "flashcash-streak";
const DAILY_50_KEY = "flashcash-is-daily-50";
const NAV_MENU_SETTINGS_KEY = "dland_nav_menu_settings";

export const StorageKeys = {
  LESSONS: LESSONS_KEY,
  PROGRESS: PROGRESS_KEY,
  SETTINGS: SETTINGS_KEY,
  NOTEBOOKS: NOTEBOOKS_KEY,
  CURRICULUMS: CURRICULUMS_KEY,
  GRAMMAR_COLLECTIONS: GRAMMAR_COLLECTIONS_KEY,
  GRAMMAR_PROGRESS: GRAMMAR_PROGRESS_KEY,
  KANJI_PROGRESS: KANJI_PROGRESS_KEY,
  CURRICULUM_HISTORY: CURRICULUM_HISTORY_KEY,
  PRACTICE_HISTORY: PRACTICE_HISTORY_KEY,
  TARGET_LANGUAGE: TARGET_LANGUAGE_KEY,
  KAIWA_PROGRESS: KAIWA_PROGRESS_KEY,
  STREAK: STREAK_KEY,
  DAILY_50: DAILY_50_KEY,
  NAV_MENU_SETTINGS: NAV_MENU_SETTINGS_KEY,
} as const;

export const ALL_STORAGE_KEYS = [
  LESSONS_KEY,
  PROGRESS_KEY,
  SETTINGS_KEY,
  NOTEBOOKS_KEY,
  CURRICULUMS_KEY,
  GRAMMAR_COLLECTIONS_KEY,
  GRAMMAR_PROGRESS_KEY,
  KANJI_PROGRESS_KEY,
  CURRICULUM_HISTORY_KEY,
  PRACTICE_HISTORY_KEY,
  TARGET_LANGUAGE_KEY,
  KAIWA_PROGRESS_KEY,
  STREAK_KEY,
  DAILY_50_KEY,
  NAV_MENU_SETTINGS_KEY,
];

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

export interface BackupPayload {
  version: string;
  scope: string;
  scopeName: string;
  exportedAt: string;
  data: Record<string, unknown>;
}

export interface ImportResult {
  success: boolean;
  scope: string;
  scopeName: string;
  notebookCount: number;
  vocabCount: number;
  practiceCount: number;
  message?: string;
  error?: string;
}

export function exportDataByScope(scope: "all" | "ja" | "en" | "de" | "ko" | "zh" = "all"): string {
  if (typeof window === "undefined") return "{}";

  const scopeNames: Record<string, string> = {
    all: "Toàn bộ hệ thống (Tất cả ngôn ngữ)",
    ja: "Tiếng Nhật (Japanese)",
    en: "Tiếng Anh (English)",
    de: "Tiếng Đức (German)",
    ko: "Tiếng Hàn (Korean)",
    zh: "Tiếng Trung (Chinese)",
  };

  const rawData: Record<string, unknown> = {};

  if (scope === "all") {
    for (const key of ALL_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          rawData[key] = JSON.parse(raw);
        } catch {
          rawData[key] = raw;
        }
      }
    }
  } else {
    // 1. Notebooks: Filter by language
    const notebooksRaw = localStorage.getItem(StorageKeys.NOTEBOOKS);
    if (notebooksRaw) {
      try {
        const nbData = JSON.parse(notebooksRaw) as { notebooks: any[] };
        const filtered = (nbData.notebooks || []).filter(
          (nb: any) => (nb.lang || "ja") === scope
        );
        rawData[StorageKeys.NOTEBOOKS] = { notebooks: filtered };
      } catch {}
    }

    // 2. Practice History: Filter by language
    const practiceRaw = localStorage.getItem(StorageKeys.PRACTICE_HISTORY);
    if (practiceRaw) {
      try {
        const list = JSON.parse(practiceRaw) as any[];
        const filtered = list.filter((item: any) => (item.lang || "ja") === scope);
        rawData[StorageKeys.PRACTICE_HISTORY] = filtered;
      } catch {}
    }

    // 3. Language-specific Curriculum, Kaiwa, Grammar & Kanji
    if (scope === "ja") {
      const curriculums = localStorage.getItem(StorageKeys.CURRICULUMS);
      if (curriculums) rawData[StorageKeys.CURRICULUMS] = JSON.parse(curriculums);

      const kaiwa = localStorage.getItem(StorageKeys.KAIWA_PROGRESS);
      if (kaiwa) rawData[StorageKeys.KAIWA_PROGRESS] = JSON.parse(kaiwa);

      const grammar = localStorage.getItem(StorageKeys.GRAMMAR_COLLECTIONS);
      if (grammar) rawData[StorageKeys.GRAMMAR_COLLECTIONS] = JSON.parse(grammar);

      const grammarProg = localStorage.getItem(StorageKeys.GRAMMAR_PROGRESS);
      if (grammarProg) rawData[StorageKeys.GRAMMAR_PROGRESS] = JSON.parse(grammarProg);

      const kanjiProg = localStorage.getItem(StorageKeys.KANJI_PROGRESS);
      if (kanjiProg) rawData[StorageKeys.KANJI_PROGRESS] = JSON.parse(kanjiProg);
    }

    // 4. Progress & History maps
    const curriculumHist = localStorage.getItem(StorageKeys.CURRICULUM_HISTORY);
    if (curriculumHist) {
      try {
        rawData[StorageKeys.CURRICULUM_HISTORY] = JSON.parse(curriculumHist);
      } catch {}
    }

    const progress = localStorage.getItem(StorageKeys.PROGRESS);
    if (progress) {
      try {
        rawData[StorageKeys.PROGRESS] = JSON.parse(progress);
      } catch {}
    }

    // 5. Global Streak & Settings
    const streak = localStorage.getItem(StorageKeys.STREAK);
    if (streak) rawData[StorageKeys.STREAK] = JSON.parse(streak);

    const settings = localStorage.getItem(StorageKeys.SETTINGS);
    if (settings) rawData[StorageKeys.SETTINGS] = JSON.parse(settings);

    rawData[StorageKeys.TARGET_LANGUAGE] = scope;
  }

  const payload: BackupPayload = {
    version: "2.0",
    scope,
    scopeName: scopeNames[scope] || scope,
    exportedAt: new Date().toISOString(),
    data: rawData,
  };

  return JSON.stringify(payload, null, 2);
}

export function exportAllData(): string {
  return exportDataByScope("all");
}

export function importScopedData(jsonString: string, mode: "merge" | "replace" = "merge"): ImportResult {
  if (typeof window === "undefined") {
    return { success: false, scope: "all", scopeName: "Lỗi", notebookCount: 0, vocabCount: 0, practiceCount: 0, error: "Window undefined" };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, scope: "all", scopeName: "Lỗi", notebookCount: 0, vocabCount: 0, practiceCount: 0, error: "File backup JSON không hợp lệ." };
  }

  // Detect format: version 2.0 wrapped vs legacy flat format
  const isV2 = parsed && parsed.version && parsed.data;
  const payloadData: Record<string, unknown> = isV2 ? parsed.data : parsed;
  const scope = isV2 && parsed.scope ? parsed.scope : "all";
  const scopeName = isV2 && parsed.scopeName ? parsed.scopeName : (scope === "all" ? "Toàn bộ hệ thống" : scope.toUpperCase());

  let notebookCount = 0;
  let vocabCount = 0;
  let practiceCount = 0;

  if (mode === "replace" || scope === "all") {
    // Direct replacement
    for (const key of ALL_STORAGE_KEYS) {
      if (payloadData[key] !== undefined) {
        if (typeof payloadData[key] === "string") {
          localStorage.setItem(key, payloadData[key] as string);
        } else {
          localStorage.setItem(key, JSON.stringify(payloadData[key]));
        }
      }
    }
  } else {
    // Smart merge for specific language backup
    // 1. Merge Notebooks: Keep other languages, update/append this language's notebooks
    if (payloadData[StorageKeys.NOTEBOOKS]) {
      const incomingNbData = payloadData[StorageKeys.NOTEBOOKS] as { notebooks?: any[] };
      const incomingList = incomingNbData.notebooks || [];
      const currentNbRaw = localStorage.getItem(StorageKeys.NOTEBOOKS);
      const currentNbData = currentNbRaw ? JSON.parse(currentNbRaw) : { notebooks: [] };
      const currentList: any[] = currentNbData.notebooks || [];

      // Keep notebooks not matching this scope
      const otherNotebooks = currentList.filter((nb: any) => (nb.lang || "ja") !== scope);
      const mergedNotebooks = [...otherNotebooks, ...incomingList];
      localStorage.setItem(StorageKeys.NOTEBOOKS, JSON.stringify({ notebooks: mergedNotebooks }));

      notebookCount = incomingList.length;
      vocabCount = incomingList.reduce((acc: number, nb: any) => acc + (nb.vocabulary?.length || 0), 0);
    }

    // 2. Merge Practice History: Filter incoming and merge uniquely by ID
    if (payloadData[StorageKeys.PRACTICE_HISTORY]) {
      const incomingHistory = (payloadData[StorageKeys.PRACTICE_HISTORY] as any[]) || [];
      const currentHistRaw = localStorage.getItem(StorageKeys.PRACTICE_HISTORY);
      const currentHist: any[] = currentHistRaw ? JSON.parse(currentHistRaw) : [];

      const existingIds = new Set(currentHist.map((item: any) => item.id));
      const newItems = incomingHistory.filter((item: any) => !existingIds.has(item.id));
      const mergedHistory = [...newItems, ...currentHist].slice(0, 150);
      localStorage.setItem(StorageKeys.PRACTICE_HISTORY, JSON.stringify(mergedHistory));
      practiceCount = incomingHistory.length;
    }

    // 3. Merge Curriculum History
    if (payloadData[StorageKeys.CURRICULUM_HISTORY]) {
      const incomingCurHist = (payloadData[StorageKeys.CURRICULUM_HISTORY] as any[]) || [];
      const currentCurRaw = localStorage.getItem(StorageKeys.CURRICULUM_HISTORY);
      const currentCurHist: any[] = currentCurRaw ? JSON.parse(currentCurRaw) : [];
      const existingLessonIds = new Set(currentCurHist.map((item: any) => item.lessonId));
      const newLessons = incomingCurHist.filter((item: any) => !existingLessonIds.has(item.lessonId));
      localStorage.setItem(StorageKeys.CURRICULUM_HISTORY, JSON.stringify([...currentCurHist, ...newLessons]));
    }

    // 4. Merge Progress Map
    if (payloadData[StorageKeys.PROGRESS]) {
      const incomingProgress = (payloadData[StorageKeys.PROGRESS] as Record<string, any>) || {};
      const currentProgRaw = localStorage.getItem(StorageKeys.PROGRESS);
      const currentProgress = currentProgRaw ? JSON.parse(currentProgRaw) : {};
      const mergedProg = { ...currentProgress, ...incomingProgress };
      localStorage.setItem(StorageKeys.PROGRESS, JSON.stringify(mergedProg));
    }

    // 5. If Japanese scope, merge Kaiwa, Grammar & Kanji
    if (scope === "ja") {
      if (payloadData[StorageKeys.KAIWA_PROGRESS]) {
        localStorage.setItem(StorageKeys.KAIWA_PROGRESS, JSON.stringify(payloadData[StorageKeys.KAIWA_PROGRESS]));
      }
      if (payloadData[StorageKeys.GRAMMAR_COLLECTIONS]) {
        localStorage.setItem(StorageKeys.GRAMMAR_COLLECTIONS, JSON.stringify(payloadData[StorageKeys.GRAMMAR_COLLECTIONS]));
      }
      if (payloadData[StorageKeys.GRAMMAR_PROGRESS]) {
        localStorage.setItem(StorageKeys.GRAMMAR_PROGRESS, JSON.stringify(payloadData[StorageKeys.GRAMMAR_PROGRESS]));
      }
      if (payloadData[StorageKeys.KANJI_PROGRESS]) {
        localStorage.setItem(StorageKeys.KANJI_PROGRESS, JSON.stringify(payloadData[StorageKeys.KANJI_PROGRESS]));
      }
    }
  }

  // Count if all format
  if (scope === "all" && payloadData[StorageKeys.NOTEBOOKS]) {
    const nbData = payloadData[StorageKeys.NOTEBOOKS] as { notebooks?: any[] };
    const nbs = nbData?.notebooks || [];
    notebookCount = nbs.length;
    vocabCount = nbs.reduce((acc: number, nb: any) => acc + (nb.vocabulary?.length || 0), 0);
    if (Array.isArray(payloadData[StorageKeys.PRACTICE_HISTORY])) {
      practiceCount = (payloadData[StorageKeys.PRACTICE_HISTORY] as any[]).length;
    }
  }

  // Dispatch all UI sync events across browser
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notebooks-updated"));
    window.dispatchEvent(new Event("practice-history-updated"));
    window.dispatchEvent(new Event("settings-updated"));
    window.dispatchEvent(new Event("curriculum-updated"));
    window.dispatchEvent(new Event("language-changed"));
    window.dispatchEvent(new Event("storage"));
  }

  return {
    success: true,
    scope,
    scopeName,
    notebookCount,
    vocabCount,
    practiceCount,
  };
}

export function importAllData(jsonString: string): void {
  importScopedData(jsonString, "merge");
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
