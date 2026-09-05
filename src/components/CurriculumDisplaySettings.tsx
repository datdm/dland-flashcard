"use client";

import { useState, useEffect, useMemo } from "react";
import { useFlashCardSettings } from "@/hooks/useFlashCardSettings";
import { useLanguageSetting, SUPPORTED_LANGUAGES } from "@/hooks/useLanguageSetting";
import { getCurriculumRepository } from "@/lib/repositories";
import { autoSync } from "@/lib/syncService";

export const ADMIN_HIDDEN_CURRICULUMS_KEY = "dland_admin_hidden_curriculums";

export default function CurriculumDisplaySettings() {
  const { settings, saveSettings } = useFlashCardSettings();
  const { activeLanguage } = useLanguageSetting();
  
  // Allow admin to switch language to manage, defaulting to the currently active language
  const [selectedLang, setSelectedLang] = useState<string>(activeLanguage.code);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);

  // Sync selectedLang if activeLanguage changes and user hasn't manually switched
  useEffect(() => {
    setSelectedLang(activeLanguage.code);
  }, [activeLanguage.code]);

  useEffect(() => {
    let isMounted = true;
    async function loadBooks() {
      setLoading(true);
      try {
        const repo = getCurriculumRepository();
        const data = await repo.getCurriculums(selectedLang);
        if (isMounted) {
          setGroups(data || []);
          setSelectedLevel("all");
        }
      } catch (err) {
        console.error("Failed to load curriculums for display settings:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBooks();
    return () => {
      isMounted = false;
    };
  }, [selectedLang]);

  const availableLevels = useMemo(() => {
    const list: string[] = [];
    groups.forEach((g) => {
      if (g.level && !list.includes(g.level)) {
        list.push(g.level);
      }
    });
    return list;
  }, [groups]);

  const filteredBooks = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();
    groups.forEach((g) => {
      if (selectedLevel !== "all" && g.level !== selectedLevel) return;
      (g.books || []).forEach((b: any) => {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          list.push({ ...b, level: g.level });
        }
      });
    });
    return list;
  }, [groups, selectedLevel]);

  // Combine hidden IDs from settings and global admin storage
  const hiddenCurriculumIds = useMemo(() => {
    let adminHidden: string[] = [];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(ADMIN_HIDDEN_CURRICULUMS_KEY);
        if (raw) adminHidden = JSON.parse(raw);
      } catch {}
    }
    const settingsHidden = settings.hiddenCurriculumIds || [];
    return Array.from(new Set([...settingsHidden, ...adminHidden]));
  }, [settings.hiddenCurriculumIds]);

  const toggleCurriculum = (id: string) => {
    const isCurrentlyHidden =
      hiddenCurriculumIds.includes(id) ||
      (id === "default-n5-super-master-tango" && settings.hideSuperMasterN5);

    const nextHiddenIds = isCurrentlyHidden
      ? hiddenCurriculumIds.filter((x) => x !== id)
      : [...hiddenCurriculumIds, id];

    let nextHideSuperMasterN5 = settings.hideSuperMasterN5;
    if (id === "default-n5-super-master-tango") {
      nextHideSuperMasterN5 = !isCurrentlyHidden;
    }

    // Save to settings
    saveSettings({
      ...settings,
      hideSuperMasterN5: nextHideSuperMasterN5,
      hiddenCurriculumIds: nextHiddenIds,
    });

    // Save to global admin storage key
    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_HIDDEN_CURRICULUMS_KEY, JSON.stringify(nextHiddenIds));
      window.dispatchEvent(new Event("settings-updated"));
      window.dispatchEvent(new Event("storage"));
    }
    autoSync();
  };

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || activeLanguage;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">
              🙈 Quản Lý Hiển Thị Giáo Trình Mẫu
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
              🛡️ Dành cho Admin
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Chỉ Quản trị viên mới có quyền ẩn hoặc hiện các bộ giáo trình mẫu mặc định trên toàn hệ thống học tập.
          </p>
        </div>

        {/* Language switcher tabs for admin */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 overflow-x-auto">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setSelectedLang(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedLang === lang.code
                  ? "bg-white text-indigo-700 shadow-3xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{lang.flag}</span>
              <span className="hidden sm:inline">{lang.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level Filter Tabs */}
      {availableLevels.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedLevel("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              selectedLevel === "all"
                ? "bg-indigo-600 text-white shadow-3xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Tất cả cấp độ
          </button>
          {availableLevels.map((lvl: string) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                selectedLevel === lvl
                  ? "bg-indigo-600 text-white shadow-3xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cấp độ {lvl}
            </button>
          ))}
        </div>
      )}

      {/* Curriculums List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-6 text-xs text-gray-400">Đang tải danh sách giáo trình mẫu...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 italic">
            Không có giáo trình mẫu nào cho {currentLangObj.name} {selectedLevel !== "all" ? `(Cấp độ ${selectedLevel})` : ""}.
          </div>
        ) : (
          filteredBooks.map((book: any) => {
            const isHidden =
              hiddenCurriculumIds.includes(book.id) ||
              (book.id === "default-n5-super-master-tango" && settings.hideSuperMasterN5);

            return (
              <div
                key={book.id}
                className={`rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border transition-colors ${
                  isHidden
                    ? "bg-amber-50/40 border-amber-200/80"
                    : "bg-gray-50/80 border-gray-100 hover:bg-gray-50"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {book.name}
                    </span>
                    {book.level && (
                      <span className="px-2 py-0.2 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                        {book.level}
                      </span>
                    )}
                    {isHidden ? (
                      <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        🚫 Đang ẩn khỏi học viên
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ✓ Đang hiển thị
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
                    {book.description || `Bộ giáo trình chuẩn mặc định cho ${currentLangObj.name}.`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">
                    {isHidden ? "Ẩn" : "Hiện"}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleCurriculum(book.id)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isHidden ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    title={isHidden ? "Nhấp để hiển thị lại giáo trình này" : "Nhấp để ẩn giáo trình này"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isHidden ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
