"use client";

import { useState, useEffect, useCallback } from "react";
import { autoSync, getAuthToken } from "@/lib/syncService";

// User-specific show/hide preferences (per-user, localStorage is fine)
const STORAGE_KEY = "dland_nav_menu_settings";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Per-language map of href → visible (true = show)
export type NavMenuSettings = Record<string, Record<string, boolean>>;
// Per-language map of href → isDevOnly override (true = dev only, false = regular)
export type NavMenuDevOverrides = Record<string, Record<string, boolean>>;

// ── User visibility settings (localStorage, per user) ────────────────────────
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

// ── Admin dev overrides — SERVER ONLY, shared across all users ────────────────
/** Fetch overrides from server — single source of truth for all users */
export async function fetchDevItemOverridesFromServer(): Promise<NavMenuDevOverrides> {
  try {
    const res = await fetch(`${API_URL}/api/admin/nav-dev-overrides`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.overrides || {};
  } catch {
    return {};
  }
}

/** Save overrides to server (admin only) */
export async function saveDevItemOverridesToServer(overrides: NavMenuDevOverrides): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  await fetch(`${API_URL}/api/admin/nav-dev-overrides`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ overrides }),
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useNavMenuSettings() {
  const [settings, setSettings] = useState<NavMenuSettings>(() => loadSettings());
  // Start empty — populated from server only
  const [devItemOverrides, setDevItemOverrides] = useState<NavMenuDevOverrides>({});

  // Hydrate user-specific settings from localStorage
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  // Fetch admin dev overrides from server on mount — shared for ALL users
  useEffect(() => {
    fetchDevItemOverridesFromServer().then((overrides) => {
      setDevItemOverrides(overrides);
    });
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
      if (isDev && !isAdmin) return false;
      const langSettings = settings[langCode];
      if (!langSettings || langSettings[href] === undefined) return true;
      return langSettings[href];
    },
    [settings, isItemDevOnly]
  );

  const toggleItem = useCallback(
    (langCode: string, href: string, isAdmin: boolean = false, defaultDevOnly: boolean = false) => {
      const isDev = isItemDevOnly(langCode, href, defaultDevOnly);
      if (!isAdmin && isDev) return; // non-admin cannot toggle dev item
      setSettings((prev) => {
        const langSettings = prev[langCode] ?? {};
        const current = langSettings[href] === undefined ? true : langSettings[href];
        const updated: NavMenuSettings = {
          ...prev,
          [langCode]: { ...langSettings, [href]: !current },
        };
        saveSettingsToStorage(updated);
        window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
        autoSync();
        return updated;
      });
    },
    [isItemDevOnly]
  );

  /** Admin toggles dev status — saves to server only, no localStorage */
  const toggleItemDevOnly = useCallback(
    (langCode: string, href: string, defaultDevOnly: boolean = false) => {
      setDevItemOverrides((prev) => {
        const langOverrides = prev[langCode] ?? {};
        const current = langOverrides[href] !== undefined ? langOverrides[href] : defaultDevOnly;
        const updated: NavMenuDevOverrides = {
          ...prev,
          [langCode]: { ...langOverrides, [href]: !current },
        };
        // Save to server only — no localStorage
        saveDevItemOverridesToServer(updated).catch(() => {
          // On error: revert state
          setDevItemOverrides(prev);
        });
        return updated;
      });
    },
    []
  );

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

  // Re-hydrate user settings on cross-tab events
  useEffect(() => {
    const handler = () => setSettings(loadSettings());
    window.addEventListener("nav-menu-settings-changed", handler);
    return () => window.removeEventListener("nav-menu-settings-changed", handler);
  }, []);

  return {
    settings,
    isVisible,
    toggleItem,
    resetLang,
    isItemDevOnly,
    toggleItemDevOnly,
    devItemOverrides,
    // Compat stubs (feature removed)
    devFeaturesEnabled: false,
    setDevFeaturesEnabled: (_enabled: boolean) => {},
  };
}
 
