"use client";

import { useState, useEffect, useCallback } from "react";
import { ProgressMap, VocabProgress } from "@/types";
import { getItem, setItem, StorageKeys, updateStreak } from "@/lib/storage";
import { autoSync, checkAuthStatus, loadProgressFromServer } from "@/lib/syncService";

const defaultProgress = (): VocabProgress => ({ learned: false, favorite: false });

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>({});

  useEffect(() => {
    // Load local data first
    const data = getItem<ProgressMap>(StorageKeys.PROGRESS);
    if (data) setProgress(data);

    // Sync from database if logged in
    const syncProgress = async () => {
      if (checkAuthStatus()) {
        try {
          const serverData = await loadProgressFromServer();
          const vocabProgress = serverData?.vocabulary || {};
          if (Object.keys(vocabProgress).length > 0) {
            setProgress(vocabProgress);
            setItem(StorageKeys.PROGRESS, vocabProgress);
          }
        } catch (error) {
          console.error("Failed to load progress from server:", error);
        }
      }
    };

    syncProgress();
  }, []);

  const updateProgress = useCallback((id: string, patch: Partial<VocabProgress>) => {
    setProgress((prev) => {
      const current = prev[id] ?? defaultProgress();
      const updated: ProgressMap = {
        ...prev,
        [id]: { ...current, ...patch },
      };
      setItem(StorageKeys.PROGRESS, updated);
      autoSync(); // Auto-sync after save
      return updated;
    });
  }, []);

  const toggleLearned = useCallback(
    (id: string) => {
      setProgress((prev) => {
        const current = prev[id] ?? defaultProgress();
        const learned = !current.learned;
        const updated: ProgressMap = {
          ...prev,
          [id]: {
            ...current,
            learned,
            learnedAt: learned ? new Date().toISOString() : undefined,
          },
        };
        if (learned) {
          updateStreak();
        }
        setItem(StorageKeys.PROGRESS, updated);
        autoSync(); // Auto-sync after save
        return updated;
      });
    },
    []
  );

  const toggleFavorite = useCallback((id: string) => {
    setProgress((prev) => {
      const current = prev[id] ?? defaultProgress();
      const updated: ProgressMap = {
        ...prev,
        [id]: { ...current, favorite: !current.favorite },
      };
      setItem(StorageKeys.PROGRESS, updated);
      autoSync(); // Auto-sync after save
      return updated;
    });
  }, []);

  const getVocabProgress = useCallback(
    (id: string): VocabProgress => progress[id] ?? defaultProgress(),
    [progress]
  );

  return { progress, toggleLearned, toggleFavorite, updateProgress, getVocabProgress };
}

