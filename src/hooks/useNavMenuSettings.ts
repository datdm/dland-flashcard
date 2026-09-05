"use client";

import { useState, useEffect, useCallback } from "react";
import { autoSync } from "@/lib/syncService";

const STORAGE_KEY = "dland_nav_menu_settings";
const ADMIN_DEV_KEY = "dland_admin_dev_features_enabled";

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

export function loadDevFeaturesEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_DEV_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveDevFeaturesEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_DEV_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
}

export function useNavMenuSettings() {
  const [settings, setSettings] = useState<NavMenuSettings>(() => loadSettings());
  const [devFeaturesEnabled, setDevFeaturesEnabledState] = useState<boolean>(() => loadDevFeaturesEnabled());

  useEffect(() => {
    setSettings(loadSettings());
    setDevFeaturesEnabledState(loadDevFeaturesEnabled());
  }, []);

  const isVisible = useCallback(
    (langCode: string, href: string): boolean => {
      const langSettings = settings[langCode];
      if (!langSettings || langSettings[href] === undefined) return true;
      return langSettings[href];
    },
    [settings]
  );

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
        window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
        autoSync();
        return updated;
      });
    },
    []
  );

  const setDevFeaturesEnabled = useCallback((enabled: boolean) => {
    saveDevFeaturesEnabled(enabled);
    setDevFeaturesEnabledState(enabled);
  }, []);

  const resetLang = useCallback((langCode: string) => {
    setSettings((prev) => {
      const updated = { ...prev };
      delete updated[langCode];
      saveSettingsToStorage(updated);
      window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
      autoSync();
      return updated;
    });
  }, []);

  useEffect(() => {
    const handler = () => {
      setSettings(loadSettings());
      setDevFeaturesEnabledState(loadDevFeaturesEnabled());
    };
    window.addEventListener("nav-menu-settings-changed", handler);
    return () => window.removeEventListener("nav-menu-settings-changed", handler);
  }, []);

  return { settings, isVisible, toggleItem, resetLang, devFeaturesEnabled, setDevFeaturesEnabled };
}
