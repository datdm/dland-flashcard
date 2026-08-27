"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Curriculum, CurriculumsData, Vocabulary, LessonInCurriculum, FlashCardSettings } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";
import { DEFAULT_VOCABULARY } from "@/data";
import { autoSync, checkAuthStatus, loadCurriculumsFromServer } from "@/lib/syncService";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function isCurriculumMatchLang(c: { id: string; name: string; lang?: string }, langCode: string): boolean {
  if (c.lang) return c.lang === langCode;
  if (langCode === "en") return c.id.startsWith("en-") || c.name.toLowerCase().includes("ielts") || c.name.toLowerCase().includes("english");
  if (langCode === "de") return c.id.startsWith("de-") || c.name.toLowerCase().includes("deutsch") || c.name.toLowerCase().includes("netzwerk") || c.name.toLowerCase().includes("đức");
  if (langCode === "ko") return c.id.startsWith("ko-") || c.name.toLowerCase().includes("topik") || c.name.toLowerCase().includes("hàn");
  if (langCode === "zh") return c.id.startsWith("zh-") || c.name.toLowerCase().includes("hsk") || c.name.toLowerCase().includes("trung");
  // Default ja (Japanese)
  return !c.id.startsWith("en-") && !c.id.startsWith("de-") && !c.id.startsWith("ko-") && !c.id.startsWith("zh-");
}

function getActiveLanguageCode(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("dland_target_language");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return saved;
      }
    }
  }
  return "ja";
}

export function useCurriculums() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [hideSuperMaster, setHideSuperMaster] = useState(false);
  const [activeLang, setActiveLang] = useState<string>(() => getActiveLanguageCode());

  useEffect(() => {
    const handleLangChange = () => {
      setActiveLang(getActiveLanguageCode());
    };
    window.addEventListener("storage", handleLangChange);
    return () => window.removeEventListener("storage", handleLangChange);
  }, []);

  useEffect(() => {
    // Helper to sanitize old "Super Master" names in localStorage
    const sanitizeCurriculums = (list: Curriculum[]) => {
      return list.map((c) => {
        if (c.id === "default-n5-super-master-tango" || c.name.toLowerCase().includes("super master")) {
          return { ...c, name: "N5 Speed Master 語彙" };
        }
        return c;
      });
    };

    // Load local data first
    const data = getItem<CurriculumsData>(StorageKeys.CURRICULUMS);
    if (data?.curriculums && data.curriculums.length > 0) {
      const sanitized = sanitizeCurriculums(data.curriculums);
      setCurriculums(sanitized);
    } else if (DEFAULT_VOCABULARY?.curriculums) {
      const sanitized = sanitizeCurriculums(DEFAULT_VOCABULARY.curriculums);
      setCurriculums(sanitized);
      setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: sanitized });
    }

    // Sync from database if logged in
    const syncCurriculums = async () => {
      if (checkAuthStatus()) {
        try {
          const serverData = await loadCurriculumsFromServer() as any;
          const curriculumsList = Array.isArray(serverData)
            ? serverData
            : (serverData?.curriculums || []);
          
          if (curriculumsList.length > 0) {
            setCurriculums(curriculumsList);
            setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: curriculumsList });
          }
        } catch (error) {
          console.error("Failed to load curriculums from server:", error);
        }
      }
    };

    syncCurriculums();
  }, []);

  useEffect(() => {
    const checkHideSetting = () => {
      const saved = getItem<FlashCardSettings>(StorageKeys.SETTINGS);
      setHideSuperMaster(!!saved?.hideSuperMasterN5);
    };

    checkHideSetting();
    window.addEventListener("storage", checkHideSetting);
    window.addEventListener("settings-updated", checkHideSetting);
    return () => {
      window.removeEventListener("storage", checkHideSetting);
      window.removeEventListener("settings-updated", checkHideSetting);
    };
  }, []);

  const visibleCurriculums = useMemo(() => {
    if (!hideSuperMaster) return curriculums;
    return curriculums.filter(
      (c) => c.id !== "default-n5-super-master-tango" && !c.name.toLowerCase().includes("super master")
    );
  }, [curriculums, hideSuperMaster]);

  const activeCurriculums = useMemo(() => {
    return visibleCurriculums.filter((c) => isCurriculumMatchLang(c, activeLang));
  }, [visibleCurriculums, activeLang]);

  const save = useCallback((updated: Curriculum[]) => {
    setCurriculums(updated);
    setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
    autoSync(); // Auto-sync after save
  }, []);

  // --- Curriculum CRUD ---

  const addCurriculum = useCallback(
    (name: string): Curriculum => {
      const curriculum: Curriculum = {
        id: generateId("curr"),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        lessons: [],
      };
      setCurriculums((prev) => {
        const updated = [...prev, curriculum];
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
      return curriculum;
    },
    []
  );

  const updateCurriculum = useCallback(
    (id: string, name: string) => {
      setCurriculums((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, name: name.trim() } : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
    },
    []
  );

  const deleteCurriculum = useCallback(
    (id: string) => {
      setCurriculums((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
    },
    []
  );

  const getCurriculumById = useCallback(
    (id: string) => curriculums.find((c) => c.id === id),
    [curriculums]
  );

  // --- Lesson CRUD within a curriculum ---

  const addLesson = useCallback(
    (curriculumId: string, name: string): LessonInCurriculum => {
      const lesson: LessonInCurriculum = {
        id: generateId("lesson"),
        name: name.trim(),
        vocabulary: [],
      };
      setCurriculums((prev) => {
        const updated = prev.map((c) =>
          c.id === curriculumId
            ? { ...c, lessons: [...c.lessons, lesson] }
            : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
      return lesson;
    },
    []
  );

  /**
   * Add lessons from uploaded file to an existing curriculum
   * Used for syncing uploaded lessons into managed curriculum system
   */
  const addLessonsToExistingCurriculum = useCallback(
    (
      curriculumId: string,
      lessonsData: Array<{ name: string; vocabulary: Vocabulary[] }>
    ): { added: number; total: number } => {
      let vocabCount = 0;
      let lessonCount = 0;

      setCurriculums((prev) => {
        const updated = prev.map((c) => {
          if (c.id === curriculumId) {
            const newLessons: LessonInCurriculum[] = lessonsData.map((l) => {
              lessonCount++;
              vocabCount += l.vocabulary.length;
              return {
                id: generateId("lesson"),
                name: l.name,
                vocabulary: l.vocabulary.map((v, idx) => ({
                  id: `v-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
                  kanji: v.kanji,
                  hiragana: v.hiragana,
                  onyomi: v.onyomi,
                  meaning: v.meaning,
                  phonetic: v.phonetic,
                })),
              };
            });
            return {
              ...c,
              lessons: [...c.lessons, ...newLessons],
            };
          }
          return c;
        });
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });

      return { added: vocabCount, total: lessonCount };
    },
    []
  );

  const updateLesson = useCallback(
    (curriculumId: string, lessonId: string, name: string) => {
      setCurriculums((prev) => {
        const updated = prev.map((c) =>
          c.id === curriculumId
            ? {
                ...c,
                lessons: c.lessons.map((l) =>
                  l.id === lessonId ? { ...l, name: name.trim() } : l
                ),
              }
            : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
    },
    []
  );

  const deleteLesson = useCallback(
    (curriculumId: string, lessonId: string) => {
      setCurriculums((prev) => {
        const updated = prev.map((c) =>
          c.id === curriculumId
            ? {
                ...c,
                lessons: c.lessons.filter((l) => l.id !== lessonId),
              }
            : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
    },
    []
  );

  const getLessonById = useCallback(
    (curriculumId: string, lessonId: string) => {
      const curriculum = curriculums.find((c) => c.id === curriculumId);
      return curriculum?.lessons.find((l) => l.id === lessonId);
    },
    [curriculums]
  );

  // --- Vocabulary CRUD within a lesson ---

  const addVocab = useCallback(
    (curriculumId: string, lessonId: string, fields: Omit<Vocabulary, "id">): Vocabulary => {
      const vocab: Vocabulary = { id: generateId("v"), ...fields };
      setCurriculums((prev) => {
        const updated = prev.map((c) =>
          c.id === curriculumId
            ? {
                ...c,
                lessons: c.lessons.map((l) =>
                  l.id === lessonId
                    ? { ...l, vocabulary: [...l.vocabulary, vocab] }
                    : l
                ),
              }
            : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
      return vocab;
    },
    []
  );

  const updateVocab = useCallback(
    (curriculumId: string, lessonId: string, vocabId: string, patch: Partial<Omit<Vocabulary, "id">>) => {
      setCurriculums((prev) => {
        const updated = prev.map((c) =>
          c.id === curriculumId
            ? {
                ...c,
                lessons: c.lessons.map((l) =>
                  l.id === lessonId
                    ? {
                        ...l,
                        vocabulary: l.vocabulary.map((v) =>
                          v.id === vocabId ? { ...v, ...patch } : v
                        ),
                      }
                    : l
                ),
              }
            : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
    },
    []
  );

  const deleteVocab = useCallback(
    (curriculumId: string, lessonId: string, vocabId: string) => {
      setCurriculums((prev) => {
        const updated = prev.map((c) =>
          c.id === curriculumId
            ? {
                ...c,
                lessons: c.lessons.map((l) =>
                  l.id === lessonId
                    ? {
                        ...l,
                        vocabulary: l.vocabulary.filter((v) => v.id !== vocabId),
                      }
                    : l
                ),
              }
            : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
    },
    []
  );

  // --- Validation ---

  const checkDuplicate = useCallback(
    (curriculumId: string, lessonId: string, kanji?: string, hiragana?: string, excludeVocabId?: string): Vocabulary | null => {
      // Only check if both kanji and hiragana are provided and non-empty
      if (!kanji?.trim() || !hiragana?.trim()) return null;

      const normalizedKanji = kanji.trim();
      const normalizedHiragana = hiragana.trim();

      const curriculum = curriculums.find((c) => c.id === curriculumId);
      if (!curriculum) return null;

      const lesson = curriculum.lessons.find((l) => l.id === lessonId);
      if (!lesson) return null;

      const duplicate = lesson.vocabulary.find(
        (v) =>
          v.id !== excludeVocabId &&
          v.kanji?.trim() === normalizedKanji &&
          v.hiragana?.trim() === normalizedHiragana
      );

      return duplicate || null;
    },
    [curriculums]
  );

  // --- Export / Import ---

  const exportLesson = useCallback(
    (curriculumId: string, lessonId: string): string => {
      const curriculum = curriculums.find((c) => c.id === curriculumId);
      const lesson = curriculum?.lessons.find((l) => l.id === lessonId);
      if (!lesson) return "{}";
      return JSON.stringify({ lesson }, null, 2);
    },
    [curriculums]
  );

  const importVocabFromJson = useCallback(
    (curriculumId: string, lessonId: string, jsonString: string): { imported: number; error?: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        return { imported: 0, error: "File JSON không hợp lệ." };
      }
      const raw = parsed as { lesson?: { vocabulary?: unknown[] } };
      const incoming = raw?.lesson?.vocabulary;
      if (!Array.isArray(incoming)) {
        return { imported: 0, error: 'JSON phải có trường "lesson.vocabulary".' };
      }
      let count = 0;
      setCurriculums((prev) => {
        const curriculum = prev.find((c) => c.id === curriculumId);
        if (!curriculum) return prev;
        const lesson = curriculum.lessons.find((l) => l.id === lessonId);
        if (!lesson) return prev;

        const existingIds = new Set(lesson.vocabulary.map((v) => v.id));
        const toAdd: Vocabulary[] = [];
        for (const item of incoming) {
          const v = item as Partial<Vocabulary>;
          if (!v.id && !v.kanji && !v.hiragana && !v.meaning) continue;
          const entry: Vocabulary = {
            id: v.id && !existingIds.has(v.id) ? v.id : generateId("v"),
            kanji: v.kanji,
            hiragana: v.hiragana,
            onyomi: v.onyomi,
            meaning: v.meaning,
            phonetic: v.phonetic,
          };
          toAdd.push(entry);
          count++;
        }
        const updated = prev.map((c) =>
          c.id === curriculumId
            ? {
                ...c,
                lessons: c.lessons.map((l) =>
                  l.id === lessonId
                    ? { ...l, vocabulary: [...l.vocabulary, ...toAdd] }
                    : l
                ),
              }
            : c
        );
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });
      return { imported: count };
    },
    []
  );

  const exportCurriculum = useCallback(
    (curriculumId: string): string => {
      const curriculum = curriculums.find((c) => c.id === curriculumId);
      if (!curriculum) return "{}";
      const data = {
        curriculum: curriculum.name,
        lessons: curriculum.lessons.map((l) => ({
          name: l.name,
          vocabulary: l.vocabulary,
        })),
      };
      return JSON.stringify(data, null, 2);
    },
    [curriculums]
  );

  const importCurriculumJson = useCallback(
    (jsonString: string): { imported: number; error?: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        return { imported: 0, error: "File JSON không hợp lệ." };
      }

      const raw = parsed as {
        curriculum?: string;
        lessons?: Array<{ name?: string; vocabulary?: unknown[] }>;
      };

      if (!raw.curriculum || !Array.isArray(raw.lessons)) {
        return { imported: 0, error: 'JSON phải có "curriculum" và "lessons".' };
      }

      // Check for duplicate curriculum name
      const curriculumName = raw.curriculum.trim();
      const duplicate = curriculums.find((c) => c.name.toLowerCase() === curriculumName.toLowerCase());
      if (duplicate) {
        return { imported: 0, error: `Giáo trình "${curriculumName}" đã tồn tại.` };
      }

      let count = 0;
      setCurriculums((prev) => {
        const newCurriculum: Curriculum = {
          id: generateId("curr"),
          name: curriculumName,
          createdAt: new Date().toISOString(),
          lessons: [],
        };

        for (const lesson of raw.lessons!) {
          if (!lesson.name || !Array.isArray(lesson.vocabulary)) continue;

          const newLesson: LessonInCurriculum = {
            id: generateId("lesson"),
            name: lesson.name,
            vocabulary: lesson.vocabulary.map((v: unknown, idx: number) => {
              const item = v as Record<string, unknown>;
              return {
                id: `v-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
                kanji: (item.kanji as string) || undefined,
                hiragana: (item.hiragana as string) || undefined,
                onyomi: (item.onyomi as string) || undefined,
                meaning: (item.meaning as string) || undefined,
                phonetic: (item.phonetic as string) || undefined,
              };
            }),
          };
          newCurriculum.lessons.push(newLesson);
          count += newLesson.vocabulary.length;
        }

        const updated = [...prev, newCurriculum];
        setItem<CurriculumsData>(StorageKeys.CURRICULUMS, { curriculums: updated });
        autoSync();
        return updated;
      });

      return { imported: count };
    },
    []
  );

  const exportAllCurriculums = useCallback(
    (): string => {
      return JSON.stringify({ curriculums }, null, 2);
    },
    [curriculums]
  );

  return {
    curriculums: visibleCurriculums,
    activeCurriculums,
    rawCurriculums: curriculums,
    save,
    addCurriculum,
    updateCurriculum,
    deleteCurriculum,
    getCurriculumById,
    addLesson,
    updateLesson,
    deleteLesson,
    getLessonById,
    addLessonsToExistingCurriculum,
    addVocab,
    updateVocab,
    deleteVocab,
    checkDuplicate,
    exportLesson,
    importVocabFromJson,
    exportCurriculum,
    exportAllCurriculums,
    importCurriculumJson,
  };
}
