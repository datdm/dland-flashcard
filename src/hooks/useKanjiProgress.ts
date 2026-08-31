"use client";

import { useState, useEffect, useCallback } from "react";
import { getItem, setItem, StorageKeys, updateStreak } from "@/lib/storage";
import { autoSync, checkAuthStatus, loadProgressFromServer } from "@/lib/syncService";

export interface KanjiProgress {
  learned: boolean;
  favorite: boolean;
  learnedAt?: string;
}

export type KanjiProgressMap = Record<string, KanjiProgress>;

const defaultKanjiProgress = (): KanjiProgress => ({
  learned: false,
  favorite: false,
});

export function useKanjiProgress() {
  const [progress, setProgress] = useState<KanjiProgressMap>(() => {
    if (typeof window !== "undefined") {
      return getItem<KanjiProgressMap>(StorageKeys.KANJI_PROGRESS) || {};
    }
    return {};
  });
  const [isLoading, setIsLoading] = useState(true);

  const reloadProgress = useCallback(() => {
    const data = getItem<KanjiProgressMap>(StorageKeys.KANJI_PROGRESS);
    if (data) setProgress(data);
  }, []);

  useEffect(() => {
    // Load local data first
    try {
      reloadProgress();
    } finally {
      setIsLoading(false);
    }

    // Sync from database if logged in
    const syncKanjiProgress = async () => {
      if (checkAuthStatus()) {
        try {
          const serverData = await loadProgressFromServer();
          const kanjiProgressData = serverData?.kanji;
          if (kanjiProgressData && typeof kanjiProgressData === "object") {
            setProgress(kanjiProgressData);
            setItem(StorageKeys.KANJI_PROGRESS, kanjiProgressData);
          }
        } catch (error) {
          console.error("Failed to load kanji progress from server:", error);
        }
      }
    };

    syncKanjiProgress();

    window.addEventListener("progress-updated", reloadProgress);
    window.addEventListener("storage", reloadProgress);
    return () => {
      window.removeEventListener("progress-updated", reloadProgress);
      window.removeEventListener("storage", reloadProgress);
    };
  }, [reloadProgress]);

  const toggleLearned = useCallback(
    (kanjiId: string) => {
      setProgress((prev) => {
        const current = prev[kanjiId] ?? defaultKanjiProgress();
        const learned = !current.learned;
        const updated: KanjiProgressMap = {
          ...prev,
          [kanjiId]: {
            ...current,
            learned,
            learnedAt: learned ? new Date().toISOString() : undefined,
          },
        };
        if (learned) {
          updateStreak();
        }
        setItem(StorageKeys.KANJI_PROGRESS, updated);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("progress-updated"));
        }
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const toggleFavorite = useCallback(
    (kanjiId: string) => {
      setProgress((prev) => {
        const current = prev[kanjiId] ?? defaultKanjiProgress();
        const updated: KanjiProgressMap = {
          ...prev,
          [kanjiId]: { ...current, favorite: !current.favorite },
        };
        setItem(StorageKeys.KANJI_PROGRESS, updated);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("progress-updated"));
        }
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const getKanjiProgress = useCallback(
    (kanjiId: string): KanjiProgress => progress[kanjiId] ?? defaultKanjiProgress(),
    [progress]
  );

  return {
    isLoading,
    progress,
    toggleLearned,
    toggleFavorite,
    getKanjiProgress,
  };
}
