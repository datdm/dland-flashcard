"use client";

import { useState, useEffect, useCallback } from "react";
import { FlashCardSettings, DEFAULT_SETTINGS } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";
import { autoSync } from "@/lib/syncService";

export function useFlashCardSettings() {
  const [settings, setSettings] = useState<FlashCardSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const saved = getItem<FlashCardSettings>(StorageKeys.SETTINGS);
    if (saved) setSettings(saved);
  }, []);

  const saveSettings = useCallback((next: FlashCardSettings) => {
    setSettings(next);
    setItem(StorageKeys.SETTINGS, next);
    autoSync(); // Auto-sync after save
  }, []);

  return { settings, saveSettings };
}
