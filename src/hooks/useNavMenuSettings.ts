"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dland_nav_menu_settings";

// Per-language map of href → visible (true = show)
export type NavMenuSettings = Record<string, Record<string, boolean>>;

function loadSettings(): NavMenuSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettingsToStorage(settings: NavMenuSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function useNavMenuSettings() {
  const [settings, setSettings] = useState<NavMenuSettings>(() => loadSettings());

  // Re-read from storage on mount (SSR safe)
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  /**
   * Is a menu item visible for a given language?
   * Defaults to true (visible) if no setting saved yet.
   */
  const isVisible = useCallback(
    (langCode: string, href: string): boolean => {
      const langSettings = settings[langCode];
      if (!langSettings || langSettings[href] === undefined) return true;
      return langSettings[href];
    },
    [settings]
  );

  /**
   * Toggle one menu item for a given language.
   */
  const toggleItem = useCallback(
    (langCode: string, href: string) => {
      setSettings((prev) => {
        const langSettings = prev[langCode] ?? {};
        const current = langSettings[href] === undefined ? true : langSettings[href];
        const updated: NavMenuSettings = {
          ...prev,
          [langCode]: {
            ...langSettings,
            [href]: !current,
          },
        };
        saveSettingsToStorage(updated);
        // Dispatch event so Navbar re-reads immediately
        window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
        return updated;
      });
    },
    []
  );

  /**
   * Reset all menu items for a language back to visible.
   */
  const resetLang = useCallback((langCode: string) => {
    setSettings((prev) => {
      const updated = { ...prev };
      delete updated[langCode];
      saveSettingsToStorage(updated);
      window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
      return updated;
    });
  }, []);

  // Listen for changes from other components / tabs
  useEffect(() => {
    const handler = () => setSettings(loadSettings());
    window.addEventListener("nav-menu-settings-changed", handler);
    return () => window.removeEventListener("nav-menu-settings-changed", handler);
  }, []);

  return { settings, isVisible, toggleItem, resetLang };
}
