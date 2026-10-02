"use client";

import { useState, useEffect, useCallback } from "react";
import { ProgressMap, VocabProgress } from "@/types";
import { getItem, setItem, StorageKeys, updateStreak } from "@/lib/storage";
import { autoSync, checkAuthStatus, loadProgressFromServer, patchProgressOnServer } from "@/lib/syncService";
import { getEquivalentVocabIds, loadAllSystemCurriculums } from "@/lib/curriculumRegistry";

const defaultProgress = (): VocabProgress => ({ learned: false, favorite: false });

export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(() => {
    if (typeof window !== "undefined") {
      return getItem<ProgressMap>(StorageKeys.PROGRESS) || {};
    }
    return {};
  });

  const reloadProgress = useCallback(() => {
    const data = getItem<ProgressMap>(StorageKeys.PROGRESS);
    if (data) setProgress(data);
  }, []);

  useEffect(() => {
    // Prime system curriculum signature maps for cross-textbook word sync
    loadAllSystemCurriculums().catch(() => {});

    // Load local data first
    reloadProgress();

    // Sync from database if logged in
    const syncProgress = async () => {
      if (checkAuthStatus()) {
        try {
          const serverData = await loadProgressFromServer();
          const serverVocab = serverData?.vocabulary;
          if (serverVocab && typeof serverVocab === "object" && Object.keys(serverVocab).length > 0) {
            setProgress((prev) => {
              const merged: ProgressMap = { ...prev };
              for (const [id, sItem] of Object.entries(serverVocab)) {
                const localItem = merged[id];
                if (!localItem) {
                  merged[id] = sItem as VocabProgress;
                } else {
                  merged[id] = {
                    ...localItem,
                    ...sItem,
                    learned: localItem.learned || (sItem as VocabProgress).learned,
                    favorite: localItem.favorite || (sItem as VocabProgress).favorite,
                    learnedAt: localItem.learnedAt || (sItem as VocabProgress).learnedAt,
                  };
                }
              }
              setItem(StorageKeys.PROGRESS, merged);
              return merged;
            });
          }
        } catch (error) {
          console.error("Failed to load progress from server:", error);
        }
      }
    };

    syncProgress();

    window.addEventListener("progress-updated", reloadProgress);
    window.addEventListener("storage", reloadProgress);
    return () => {
      window.removeEventListener("progress-updated", reloadProgress);
      window.removeEventListener("storage", reloadProgress);
    };
  }, [reloadProgress]);

  const updateProgress = useCallback((id: string, patch: Partial<VocabProgress>) => {
    const targetIds = getEquivalentVocabIds(id);
    if (!targetIds.includes(id)) targetIds.push(id);

    setProgress((prev) => {
      const updated: ProgressMap = { ...prev };
      for (const targetId of targetIds) {
        const current = updated[targetId] ?? defaultProgress();
        const isLearned = patch.learned !== undefined ? patch.learned : current.learned;
        const learnedAt = isLearned
          ? (patch.learnedAt || current.learnedAt || new Date().toISOString())
          : undefined;

        updated[targetId] = { ...current, ...patch, learned: isLearned, learnedAt };
      }

      setItem(StorageKeys.PROGRESS, updated);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("progress-updated"));
      }
      autoSync(); // Auto-sync after save
      return updated;
    });
  }, []);

  const toggleLearned = useCallback(
    async (id: string) => {
      const targetIds = getEquivalentVocabIds(id);
      if (!targetIds.includes(id)) targetIds.push(id);

      const current = progress[id] ?? defaultProgress();
      const learned = !current.learned;
      const newPatch = {
        learned,
        learnedAt: learned ? new Date().toISOString() : undefined,
      };

      // 2. Update locally first for all matching vocabulary IDs across textbooks
      setProgress((prev) => {
        const updated: ProgressMap = { ...prev };
        for (const targetId of targetIds) {
          const itemCurrent = updated[targetId] ?? defaultProgress();
          updated[targetId] = { ...itemCurrent, ...newPatch };
        }
        setItem(StorageKeys.PROGRESS, updated);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("progress-updated"));
        }
        return updated;
      });

      if (learned) {
        updateStreak();
      }

      // 3. Delta sync to server for all matching IDs
      if (checkAuthStatus()) {
        for (const targetId of targetIds) {
          await patchProgressOnServer(targetId, newPatch);
        }
      } else {
        autoSync();
      }
    },
    [progress]
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      const targetIds = getEquivalentVocabIds(id);
      if (!targetIds.includes(id)) targetIds.push(id);

      const current = progress[id] ?? defaultProgress();
      const newPatch = { favorite: !current.favorite };

      // Update locally for all matching IDs
      setProgress((prev) => {
        const updated: ProgressMap = { ...prev };
        for (const targetId of targetIds) {
          const itemCurrent = updated[targetId] ?? defaultProgress();
          updated[targetId] = { ...itemCurrent, ...newPatch };
        }
        setItem(StorageKeys.PROGRESS, updated);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("progress-updated"));
        }
        return updated;
      });

      // Delta sync to server
      if (checkAuthStatus()) {
        for (const targetId of targetIds) {
          await patchProgressOnServer(targetId, newPatch);
        }
      } else {
        autoSync();
      }
    },
    [progress]
  );

  const getVocabProgress = useCallback(
    (id: string): VocabProgress => progress[id] ?? defaultProgress(),
    [progress]
  );

  return { progress, toggleLearned, toggleFavorite, updateProgress, getVocabProgress };
}

