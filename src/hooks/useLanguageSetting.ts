"use client";

import { useState, useEffect, useCallback } from "react";
import { uploadToServer } from "@/lib/syncService";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  description: string;
  status: "active" | "coming_soon";
  levels: string[];
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: "ja",
    name: "Tiếng Nhật",
    nativeName: "日本語",
    flag: "🇯🇵",
    description: "Lộ trình học JLPT N5 ➔ N2 (Giáo trình Minna, Soumatome, Kanji SVG, Từ vựng, Ngữ pháp)",
    status: "active",
    levels: ["N5", "N4", "N3", "N2", "N1"],
  },
  {
    code: "en",
    name: "Tiếng Anh",
    nativeName: "English",
    flag: "🇬🇧",
    description: "Lộ trình IELTS 7.0 (12 Tháng / 52 Tuần): Foundation ➔ Format ➔ Advanced ➔ Target 7.0+",
    status: "active",
    levels: ["GĐ 1", "GĐ 2", "GĐ 3", "GĐ 4"],
  },
  {
    code: "de",
    name: "Tiếng Đức",
    nativeName: "Deutsch",
    flag: "🇩🇪",
    description: "Từ vựng Goethe A1 ➔ B2, Quán từ Der/Die/Das, Chia động từ & Cấu trúc câu",
    status: "active",
    levels: ["A1", "A2", "B1", "B2"],
  },
  {
    code: "ko",
    name: "Tiếng Hàn",
    nativeName: "한국어",
    flag: "🇰🇷",
    description: "Từ vựng TOPIK I & II, Bảng chữ cái Hangul, Kính ngữ & Ngữ pháp",
    status: "coming_soon",
    levels: ["TOPIK 1", "TOPIK 2", "TOPIK 3", "TOPIK 4"],
  },
  {
    code: "zh",
    name: "Tiếng Trung",
    nativeName: "中文",
    flag: "🇨🇳",
    description: "Từ vựng HSK 1 ➔ HSK 6, Pinyin, Nét vẽ Hán tự & Ngữ pháp",
    status: "coming_soon",
    levels: ["HSK 1", "HSK 2", "HSK 3", "HSK 4", "HSK 5"],
  },
];

const LANGUAGE_STORAGE_KEY = "dland_target_language";

export function getSavedLanguage(): string {
  if (typeof window === "undefined") return "ja";
  try {
    // 1. Check cookie first
    const match = document.cookie.match(new RegExp("(^| )" + LANGUAGE_STORAGE_KEY + "=([^;]+)"));
    if (match) {
      const val = decodeURIComponent(match[2]);
      if (SUPPORTED_LANGUAGES.some((l) => l.code === val)) {
        return val;
      }
    }
    // 2. Check localStorage (supports both raw string and JSON-stringified)
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string" && SUPPORTED_LANGUAGES.some((l) => l.code === parsed)) {
          return parsed;
        }
      } catch {
        if (SUPPORTED_LANGUAGES.some((l) => l.code === raw)) {
          return raw;
        }
      }
    }
  } catch {
    return "ja";
  }
  return "ja";
}

export function useLanguageSetting() {
  const [activeLangCode, setActiveLangCode] = useState<string>(() => getSavedLanguage());
  const [draftLangCode, setDraftLangCode] = useState<string>(() => getSavedLanguage());

  useEffect(() => {
    const handleLangUpdate = () => {
      const saved = getSavedLanguage();
      setActiveLangCode(saved);
      setDraftLangCode(saved);
    };

    handleLangUpdate();

    window.addEventListener("language-changed", handleLangUpdate);
    window.addEventListener("storage", handleLangUpdate);
    return () => {
      window.removeEventListener("language-changed", handleLangUpdate);
      window.removeEventListener("storage", handleLangUpdate);
    };
  }, []);

  const selectDraftLanguage = useCallback((code: string) => {
    setDraftLangCode(code);
  }, []);

  const saveLanguage = useCallback(async () => {
    setActiveLangCode(draftLangCode);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(draftLangCode));
      document.cookie = `${LANGUAGE_STORAGE_KEY}=${encodeURIComponent(draftLangCode)}; path=/; max-age=31536000; SameSite=Lax`;

      window.dispatchEvent(new Event("language-changed"));

      // Sync immediately to server before reload so DB holds new target language
      try {
        await uploadToServer(true);
      } catch (err) {
        console.error("Failed to sync language setting to server:", err);
      }

      window.location.reload();
    }
  }, [draftLangCode]);

  const activeLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === activeLangCode) || SUPPORTED_LANGUAGES[0];
  const draftLanguage = SUPPORTED_LANGUAGES.find((l) => l.code === draftLangCode) || SUPPORTED_LANGUAGES[0];

  const hasUnsavedChanges = draftLangCode !== activeLangCode;

  return {
    activeLangCode,
    draftLangCode,
    activeLanguage,
    draftLanguage,
    hasUnsavedChanges,
    supportedLanguages: SUPPORTED_LANGUAGES,
    selectDraftLanguage,
    saveLanguage,
  };
}

