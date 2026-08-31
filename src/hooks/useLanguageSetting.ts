"use client";

import { useState, useEffect, useCallback } from "react";
import { getItem, setItem } from "@/lib/storage";
import { autoSync } from "@/lib/syncService";

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

export function useLanguageSetting() {
  const [activeLangCode, setActiveLangCode] = useState<string>("ja");
  const [draftLangCode, setDraftLangCode] = useState<string>("ja");

  useEffect(() => {
    const handleLangUpdate = () => {
      const saved = getItem<string>(LANGUAGE_STORAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setActiveLangCode(saved);
        setDraftLangCode(saved);
      }
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

  const saveLanguage = useCallback(() => {
    setActiveLangCode(draftLangCode);
    setItem<string>(LANGUAGE_STORAGE_KEY, draftLangCode);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("language-changed"));
      autoSync();
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
