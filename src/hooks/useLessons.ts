"use client";

import { useState, useEffect, useCallback } from "react";
import { Lesson, LessonsData } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    const data = getItem<LessonsData>(StorageKeys.LESSONS);
    if (data?.lessons) {
      setLessons(data.lessons);
    }
  }, []);

  const saveLessons = useCallback((newLessons: Lesson[]) => {
    setLessons(newLessons);
    setItem<LessonsData>(StorageKeys.LESSONS, { lessons: newLessons });
  }, []);

  const addLessons = useCallback(
    (incoming: Lesson[]) => {
      setLessons((prev) => {
        const merged = [...prev];
        for (const lesson of incoming) {
          const idx = merged.findIndex((l) => l.id === lesson.id);
          if (idx >= 0) {
            merged[idx] = lesson;
          } else {
            merged.push(lesson);
          }
        }
        setItem<LessonsData>(StorageKeys.LESSONS, { lessons: merged });
        return merged;
      });
    },
    []
  );

  const deleteLesson = useCallback((id: string) => {
    setLessons((prev) => {
      const next = prev.filter((l) => l.id !== id);
      setItem<LessonsData>(StorageKeys.LESSONS, { lessons: next });
      return next;
    });
  }, []);

  const getLessonById = useCallback(
    (id: string): Lesson | undefined => lessons.find((l) => l.id === id),
    [lessons]
  );

  return { lessons, saveLessons, addLessons, deleteLesson, getLessonById };
}
