"use client";

import { useState, useEffect, useCallback } from "react";
import { ProgressMap, VocabProgress } from "@/types";
import { getItem, setItem, StorageKeys, updateStreak } from "@/lib/storage";
import { autoSync, checkAuthStatus, loadProgressFromServer, patchProgressOnServer } from "@/lib/syncService";

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
    async (id: string) => {
      // 1. Calculate values synchronously first
      const current = progress[id] ?? defaultProgress();
      const learned = !current.learned;
      const newPatch = {
        learned,
        learnedAt: learned ? new Date().toISOString() : undefined,
      };

      // 2. Update locally first (optimistic)
      setProgress((prev) => {
        const updated: ProgressMap = {
          ...prev,
          [id]: { ...(prev[id] ?? defaultProgress()), ...newPatch },
        };
        setItem(StorageKeys.PROGRESS, updated);
        return updated;
      });

      if (learned) {
        updateStreak();
      }

      // 3. Delta sync to server
      if (checkAuthStatus()) {
        const result = await patchProgressOnServer(id, newPatch);
        if (!result.success) {
          console.error("Patch progress (learned) failed:", result.error);
          autoSync(); // Fallback full sync
        }
      } else {
        autoSync();
      }
    },
    [progress]
  );

  const toggleFavorite = useCallback(async (id: string) => {
    // 1. Calculate values synchronously first
    const current = progress[id] ?? defaultProgress();
    const newPatch = { favorite: !current.favorite };

    // 2. Update locally first (optimistic)
    setProgress((prev) => {
      const updated: ProgressMap = {
        ...prev,
        [id]: { ...(prev[id] ?? defaultProgress()), ...newPatch },
      };
      setItem(StorageKeys.PROGRESS, updated);
      return updated;
    });

    // 3. Delta sync to server
    if (checkAuthStatus()) {
      const result = await patchProgressOnServer(id, newPatch);
      if (!result.success) {
        console.error("Patch progress (favorite) failed:", result.error);
        autoSync(); // Fallback full sync
      }
    } else {
      autoSync();
    }
  }, [progress]);

  const getVocabProgress = useCallback(
    (id: string): VocabProgress => progress[id] ?? defaultProgress(),
    [progress]
  );

  return { progress, toggleLearned, toggleFavorite, updateProgress, getVocabProgress };
}
