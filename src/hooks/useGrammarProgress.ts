"use client";

import { useState, useEffect, useCallback } from "react";
import { GrammarProgress, GrammarProgressMap } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";
import { autoSync } from "@/lib/syncService";

const defaultGrammarProgress = (): GrammarProgress => ({
  learned: false,
  favorite: false,
  masteryLevel: 0,
});

export function useGrammarProgress() {
  const [progress, setProgress] = useState<GrammarProgressMap>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const data = getItem<GrammarProgressMap>(StorageKeys.GRAMMAR_PROGRESS);
      if (data) setProgress(data);
    } finally {
      setIsLoading(false);
    }
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
