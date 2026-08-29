"use client";

import { useState, useEffect, useCallback } from "react";
import { GrammarProgress, GrammarProgressMap } from "@/types";
import { getItem, setItem, StorageKeys, updateStreak } from "@/lib/storage";
import { autoSync, checkAuthStatus, loadProgressFromServer } from "@/lib/syncService";

const defaultGrammarProgress = (): GrammarProgress => ({
  learned: false,
  favorite: false,
  masteryLevel: 0,
});

export function useGrammarProgress() {
  const [progress, setProgress] = useState<GrammarProgressMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load local data first
    try {
      const data = getItem<GrammarProgressMap>(StorageKeys.GRAMMAR_PROGRESS);
      if (data) setProgress(data);
    } finally {
      setIsLoading(false);
    }

    // Sync from database if logged in
    const syncGrammarProgress = async () => {
      if (checkAuthStatus()) {
        try {
          const serverData = await loadProgressFromServer();
          const grammarProgressData = serverData?.grammar;
          if (grammarProgressData && typeof grammarProgressData === "object") {
            setProgress(grammarProgressData);
            setItem(StorageKeys.GRAMMAR_PROGRESS, grammarProgressData);
          }
        } catch (error) {
          console.error("Failed to load grammar progress from server:", error);
        }
      }
    };

    syncGrammarProgress();
  }, []);

  const updateProgress = useCallback(
    (grammarId: string, patch: Partial<GrammarProgress>) => {
      setProgress((prev) => {
        const current = prev[grammarId] ?? defaultGrammarProgress();
        const updated: GrammarProgressMap = {
          ...prev,
          [grammarId]: { ...current, ...patch },
        };
        setItem(StorageKeys.GRAMMAR_PROGRESS, updated);
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const toggleLearned = useCallback(
    (grammarId: string) => {
      setProgress((prev) => {
        const current = prev[grammarId] ?? defaultGrammarProgress();
        const learned = !current.learned;
        const updated: GrammarProgressMap = {
          ...prev,
          [grammarId]: {
            ...current,
            learned,
            learnedAt: learned ? new Date().toISOString() : undefined,
          },
        };
        if (learned) {
          updateStreak();
        }
        setItem(StorageKeys.GRAMMAR_PROGRESS, updated);
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const toggleFavorite = useCallback(
    (grammarId: string) => {
      setProgress((prev) => {
        const current = prev[grammarId] ?? defaultGrammarProgress();
        const updated: GrammarProgressMap = {
          ...prev,
          [grammarId]: { ...current, favorite: !current.favorite },
        };
        setItem(StorageKeys.GRAMMAR_PROGRESS, updated);
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const updateMastery = useCallback(
    (grammarId: string, level: number) => {
      setProgress((prev) => {
        const current = prev[grammarId] ?? defaultGrammarProgress();
        const updated: GrammarProgressMap = {
          ...prev,
          [grammarId]: {
            ...current,
            masteryLevel: Math.max(0, Math.min(5, level)), // Clamp to 0-5
          },
        };
        setItem(StorageKeys.GRAMMAR_PROGRESS, updated);
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const markPracticed = useCallback(
    (grammarId: string) => {
      setProgress((prev) => {
        const current = prev[grammarId] ?? defaultGrammarProgress();
        const updated: GrammarProgressMap = {
          ...prev,
          [grammarId]: {
            ...current,
            lastPracticedAt: new Date().toISOString(),
          },
        };
        setItem(StorageKeys.GRAMMAR_PROGRESS, updated);
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const getGrammarProgress = useCallback(
    (grammarId: string): GrammarProgress =>
      progress[grammarId] ?? defaultGrammarProgress(),
    [progress]
  );

  return {
    isLoading,
    progress,
    updateProgress,
    toggleLearned,
    toggleFavorite,
    updateMastery,
    markPracticed,
    getGrammarProgress,
  };
}

