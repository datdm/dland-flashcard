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
      let newPatch: { learned: boolean; learnedAt?: string } = { learned: false };

      // 1. Update locally first (optimistic)
      setProgress((prev) => {
        const current = prev[id] ?? defaultProgress();
        const learned = !current.learned;
        newPatch = {
          learned,
          learnedAt: learned ? new Date().toISOString() : undefined,
        };
        const updated: ProgressMap = {
          ...prev,
          [id]: { ...current, ...newPatch },
        };
        if (learned) updateStreak();
        setItem(StorageKeys.PROGRESS, updated);
        return updated;
      });

      // 2. Delta sync to server
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
    []
  );

  const toggleFavorite = useCallback(async (id: string) => {
    let newPatch: { favorite: boolean } = { favorite: false };

    // 1. Update locally first (optimistic)
    setProgress((prev) => {
      const current = prev[id] ?? defaultProgress();
      newPatch = { favorite: !current.favorite };
      const updated: ProgressMap = {
        ...prev,
        [id]: { ...current, ...newPatch },
      };
      setItem(StorageKeys.PROGRESS, updated);
      return updated;
    });

    // 2. Delta sync to server
    if (checkAuthStatus()) {
      const result = await patchProgressOnServer(id, newPatch);
      if (!result.success) {
        console.error("Patch progress (favorite) failed:", result.error);
        autoSync(); // Fallback full sync
      }
    } else {
      autoSync();
    }
  }, []);

  const getVocabProgress = useCallback(
    (id: string): VocabProgress => progress[id] ?? defaultProgress(),
    [progress]
  );

  return { progress, toggleLearned, toggleFavorite, updateProgress, getVocabProgress };
}
