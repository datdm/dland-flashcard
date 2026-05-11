"use client";

import { useEffect } from "react";
import { DEFAULT_VOCABULARY, DATA_VERSION } from "@/data";
import { getItem, setItem, StorageKeys } from "@/lib/storage";
import type { CurriculumsData, Curriculum, LessonInCurriculum, LessonsData } from "@/types";

const VERSION_KEY = "flashcash-data-version";
const MIGRATION_KEY = "flashcash-migrated-to-curriculums";

export default function AutoImport() {
  useEffect(() => {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    const existingCurriculums = getItem<CurriculumsData>(StorageKeys.CURRICULUMS);
    const oldLessonsData = getItem<LessonsData>(StorageKeys.LESSONS);
    const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);

    // Convert Lessons format to Curriculums format
    const convertToCurriculums = (lessonsList: any[]): Curriculum[] => {
      const curriculumMap = new Map<string, LessonInCurriculum[]>();

      for (const lesson of lessonsList) {
        const curriculumName = lesson.curriculum || "Chưa phân loại";
        if (!curriculumMap.has(curriculumName)) {
          curriculumMap.set(curriculumName, []);
        }

        const lessonInCurriculum: LessonInCurriculum = {
          id: lesson.id,
          name: lesson.name,
          vocabulary: lesson.vocabulary,
        };

        curriculumMap.get(curriculumName)!.push(lessonInCurriculum);
      }

      // Convert map to Curriculum array
      const curriculums: Curriculum[] = Array.from(curriculumMap.entries()).map(
        ([name, lessons]) => ({
          id: `curr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name,
          createdAt: new Date().toISOString(),
          lessons,
        })
      );

      return curriculums;
    };

    // Step 1: Migrate old flashcash-lessons to flashcash-curriculums
    // Progress data (learned/favorite) is already in flashcash-progress keyed by vocab ID
    if (oldLessonsData && oldLessonsData.lessons.length > 0 && !alreadyMigrated) {
      const migratedFromLessons = convertToCurriculums(oldLessonsData.lessons);
      const existingCurrs = existingCurriculums?.curriculums || [];

      // Merge: old lessons data + existing curriculums
      const merged: Curriculum[] = [...existingCurrs];

      for (const newCurr of migratedFromLessons) {
        const alreadyExists = merged.some((c) => c.id === newCurr.id);
        if (!alreadyExists) {
          merged.push(newCurr);
        }
      }

      setItem<CurriculumsData>(StorageKeys.CURRICULUMS, {
        curriculums: merged,
      });

      // Mark migration complete (prevents duplicate migrations)
      localStorage.setItem(MIGRATION_KEY, "true");
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
      return;
    }

    // Step 2: First launch (no old data, no curriculums) → import defaults
    if (!existingCurriculums || existingCurriculums.curriculums.length === 0) {
      setItem<CurriculumsData>(StorageKeys.CURRICULUMS, DEFAULT_VOCABULARY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
      localStorage.setItem(MIGRATION_KEY, "true");
      return;
    }

    // Step 3: Version changed → merge new curriculums (don't overwrite existing ones)
    if (savedVersion !== DATA_VERSION) {
      const merged = [...existingCurriculums.curriculums];

      for (const newCurr of DEFAULT_VOCABULARY.curriculums) {
        const alreadyExists = merged.some((c) => c.id === newCurr.id);
        if (!alreadyExists) {
          merged.push(newCurr);
        }
      }

      setItem<CurriculumsData>(StorageKeys.CURRICULUMS, {
        curriculums: merged,
      });
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
    }
  }, []);

  return null;
}
