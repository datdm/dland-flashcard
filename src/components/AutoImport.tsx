"use client";

import { useEffect } from "react";
import { DEFAULT_VOCABULARY, DATA_VERSION } from "@/data";
import { getItem, setItem, StorageKeys } from "@/lib/storage";
import type { LessonsData, Lesson } from "@/types";

const VERSION_KEY = "flashcash-data-version";

export default function AutoImport() {
  useEffect(() => {
    const savedVersion = localStorage.getItem(VERSION_KEY);
    const existing = getItem<LessonsData>(StorageKeys.LESSONS);

    // First launch: no data at all → import everything
    if (!existing || existing.lessons.length === 0) {
      setItem(StorageKeys.LESSONS, DEFAULT_VOCABULARY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
      return;
    }

    // Version changed → merge new lessons (don't overwrite existing ones)
    if (savedVersion !== DATA_VERSION) {
      // const merged: Lesson[] = [...existing.lessons];
      const merged: Lesson[] = [];
      for (const lesson of DEFAULT_VOCABULARY.lessons) {
        merged.push(lesson);
        // const alreadyExists = merged.some((l) => l.id === lesson.id);
        // if (!alreadyExists) {
        //   merged.push(lesson);
        // }
      }
      setItem(StorageKeys.LESSONS, { lessons: merged });
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
    }
  }, []);

  return null;
}
