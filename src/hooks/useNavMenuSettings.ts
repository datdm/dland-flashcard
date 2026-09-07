"use client";

import { useState, useEffect, useCallback } from "react";
import { autoSync } from "@/lib/syncService";

const STORAGE_KEY = "dland_nav_menu_settings";
const ADMIN_DEV_KEY = "dland_admin_dev_features_enabled";
const ADMIN_DEV_ITEMS_KEY = "dland_admin_dev_item_overrides";

// Per-language map of href → visible (true = show)
export type NavMenuSettings = Record<string, Record<string, boolean>>;
// Per-language map of href → isDevOnly override (true = dev only, false = regular)
export type NavMenuDevOverrides = Record<string, Record<string, boolean>>;

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

export function loadDevItemOverrides(): NavMenuDevOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ADMIN_DEV_ITEMS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDevItemOverrides(overrides: NavMenuDevOverrides) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_DEV_ITEMS_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
}

export function useNavMenuSettings() {
  const [settings, setSettings] = useState<NavMenuSettings>(() => loadSettings());
  const [devFeaturesEnabled, setDevFeaturesEnabledState] = useState<boolean>(() => loadDevFeaturesEnabled());
  const [devItemOverrides, setDevItemOverrides] = useState<NavMenuDevOverrides>(() => loadDevItemOverrides());

  useEffect(() => {
    setSettings(loadSettings());
    setDevFeaturesEnabledState(loadDevFeaturesEnabled());
    setDevItemOverrides(loadDevItemOverrides());
  }, []);

  const isItemDevOnly = useCallback(
    (langCode: string, href: string, defaultDevOnly: boolean = false): boolean => {
      const langOverrides = devItemOverrides[langCode];
      if (langOverrides && langOverrides[href] !== undefined) {
        return langOverrides[href];
      }
      return defaultDevOnly;
    },
    [devItemOverrides]
  );

  const isVisible = useCallback(
    (langCode: string, href: string, isAdmin: boolean = false, defaultDevOnly: boolean = false): boolean => {
      const isDev = isItemDevOnly(langCode, href, defaultDevOnly);
      if (isDev && !isAdmin && !devFeaturesEnabled) {
        return false;
      }
      const langSettings = settings[langCode];
      if (!langSettings || langSettings[href] === undefined) {
        return isDev && !isAdmin ? false : true;
      }
      if (isDev && !isAdmin && !devFeaturesEnabled && langSettings[href] === true) {
        return false;
      }
      return langSettings[href];
    },
    [settings, isItemDevOnly, devFeaturesEnabled]
  );

  const toggleItem = useCallback(
    (langCode: string, href: string, isAdmin: boolean = false, defaultDevOnly: boolean = false) => {
      const isDev = isItemDevOnly(langCode, href, defaultDevOnly);
      // Non-admin users cannot change an in-development item to visible
      if (!isAdmin && isDev) {
        return;
      }
      setSettings((prev) => {
        const langSettings = prev[langCode] ?? {};
        const current = langSettings[href] === undefined ? (isDev && !isAdmin ? false : true) : langSettings[href];
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
    [isItemDevOnly]
  );

  const toggleItemDevOnly = useCallback(
    (langCode: string, href: string, defaultDevOnly: boolean = false) => {
      setDevItemOverrides((prev) => {
        const langOverrides = prev[langCode] ?? {};
        const current = langOverrides[href] !== undefined ? langOverrides[href] : defaultDevOnly;
        const updated: NavMenuDevOverrides = {
          ...prev,
          [langCode]: {
            ...langOverrides,
            [href]: !current,
          },
        };
        saveDevItemOverrides(updated);
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
      setDevItemOverrides(loadDevItemOverrides());
    };
    window.addEventListener("nav-menu-settings-changed", handler);
    return () => window.removeEventListener("nav-menu-settings-changed", handler);
  }, []);

  return {
    settings,
    isVisible,
    toggleItem,
    resetLang,
    devFeaturesEnabled,
    setDevFeaturesEnabled,
    isItemDevOnly,
    toggleItemDevOnly,
    devItemOverrides,
  };
}
