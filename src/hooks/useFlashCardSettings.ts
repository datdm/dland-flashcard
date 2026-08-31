"use client";

import { useState, useEffect, useCallback } from "react";
import { FlashCardSettings, DEFAULT_SETTINGS } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";
import { autoSync } from "@/lib/syncService";

export function useFlashCardSettings() {
  const [settings, setSettings] = useState<FlashCardSettings>(() => {
    if (typeof window !== "undefined") {
      return getItem<FlashCardSettings>(StorageKeys.SETTINGS) || DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  });

  const reloadSettings = useCallback(() => {
    const saved = getItem<FlashCardSettings>(StorageKeys.SETTINGS);
    if (saved) setSettings(saved);
  }, []);

  useEffect(() => {
    reloadSettings();

    window.addEventListener("settings-updated", reloadSettings);
    window.addEventListener("storage", reloadSettings);
    return () => {
      window.removeEventListener("settings-updated", reloadSettings);
      window.removeEventListener("storage", reloadSettings);
    };
  }, [reloadSettings]);

  const saveSettings = useCallback((next: FlashCardSettings) => {
    setSettings(next);
    setItem(StorageKeys.SETTINGS, next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("settings-updated"));
    }
    autoSync(); // Auto-sync after save
  }, []);

  return { settings, saveSettings };
}
