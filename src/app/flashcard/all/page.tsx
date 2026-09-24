"use client";

import { useState, useMemo, useEffect } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useProgress } from "@/hooks/useProgress";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { autoSync } from "@/lib/syncService";

type SourceFilter = "all" | "all_curriculums" | "all_notebooks" | string;

export default function FlashCardAllPage() {
  const { activeLanguage } = useLanguageSetting();
  const { activeCurriculums: curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const { progress } = useProgress();
  const [source, setSource] = useState<SourceFilter>("all");
  const [isDaily50, setIsDaily50] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("daily50") === "true") {
        setIsDaily50(true);
        localStorage.setItem("flashcash-is-daily-50", "true");
      } else {
        const stored = localStorage.getItem("flashcash-is-daily-50");
        if (stored !== null) {
          setIsDaily50(stored === "true");
        }
      }
    }
  }, []);

  const handleToggleDaily50 = () => {
    const nextVal = !isDaily50;
    setIsDaily50(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("flashcash-is-daily-50", nextVal ? "true" : "false");
      autoSync();
    }
  };

  const langNotebooks = useMemo(() => {
    return notebooks.filter((nb) => (nb.lang || "ja") === activeLanguage.code);
  }, [notebooks, activeLanguage.code]);

  const totalCurriculumVocabCount = useMemo(() => {
    return curriculums.reduce((acc, c) => acc + (c.lessons?.reduce((lAcc, l) => lAcc + (l.vocabulary?.length || 0), 0) || 0), 0);
  }, [curriculums]);

  const totalNotebookVocabCount = useMemo(() => {
    return langNotebooks.reduce((acc, nb) => acc + (nb.vocabulary?.length || 0), 0);
  }, [langNotebooks]);

  // Get all vocabulary based on filter
  const allVocab = useMemo(() => {
    const curriculumVocab = curriculums.flatMap((c) =>
      c.lessons.flatMap((l) =>
        (l.vocabulary || []).map((v) => ({
          ...v,
          sourceType: "curriculum" as const,
          sourceName: `${c.name} • ${l.name}`,
        }))
      )
    );
    const notebookVocab = langNotebooks.flatMap((nb) =>
      (nb.vocabulary || []).map((v) => ({
        ...v,
        sourceType: "notebook" as const,
        sourceName: `Sổ tay: ${nb.name}`,
      }))
    );

    if (source === "all") {
      const seen = new Set<string>();
      const combined = [...curriculumVocab, ...notebookVocab];
      return combined.filter((v) => {
        const key = `${v.kanji || ""}_${v.hiragana || ""}_${v.meaning || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (source === "all_curriculums") {
      const seen = new Set<string>();
      return curriculumVocab.filter((v) => {
        const key = `${v.kanji || ""}_${v.hiragana || ""}_${v.meaning || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    if (source === "all_notebooks") {
      const seen = new Set<string>();
      return notebookVocab.filter((v) => {
        const key = `${v.kanji || ""}_${v.hiragana || ""}_${v.meaning || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    
    // Check if it's a curriculum ID
    const curriculum = curriculums.find((c) => c.id === source);
    if (curriculum) {
      return curriculum.lessons.flatMap((l) =>
        (l.vocabulary || []).map((v) => ({
          ...v,
          sourceType: "curriculum" as const,
          sourceName: `${curriculum.name} • ${l.name}`,
        }))
      );
    }
    
    // Otherwise it's a notebook ID
    const notebook = langNotebooks.find((nb) => nb.id === source);
    if (notebook) {
      return (notebook.vocabulary || []).map((v) => ({
        ...v,
        sourceType: "notebook" as const,
        sourceName: `Sổ tay: ${notebook.name}`,
      }));
    }
    
    return [];
  }, [source, curriculums, langNotebooks]);

  const todayDateStr = useMemo(() => new Date().toDateString(), []);

  const currentVocabIds = useMemo(() => {
    return new Set(allVocab.map((v) => v.id));
  }, [allVocab]);

  const daily50Progress = useMemo(() => {
    const learnedTodayList = Object.entries(progress).filter(([id, p]) => {
      if (!p.learned || !p.learnedAt) return false;
      const isToday = new Date(p.learnedAt).toDateString() === todayDateStr;
      if (!isToday) return false;
      return currentVocabIds.size === 0 || currentVocabIds.has(id);
    });

    const learnedCount = learnedTodayList.length;
    const target = 50;
    const remaining = Math.max(0, target - learnedCount);
    const percentage = Math.min(100, Math.round((learnedCount / target) * 100));

    return {
      learnedCount,
      target,
      remaining,
      percentage,
      isCompleted: learnedCount >= target,
    };
  }, [progress, todayDateStr, currentVocabIds]);

  if (curriculums.length === 0 && notebooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 max-w-2xl mx-auto mt-8">
        <div className="text-5xl mb-2">📭</div>
        <p className="text-gray-500 font-medium">Chưa có từ vựng nào. Hãy thêm từ vựng hoặc đổi nguồn học.</p>
        <Link href="/curriculum" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors">
          Đến trang Giáo trình
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard featureName="Ôn Tập Flashcard Tổng Hợp" description="Đăng nhập để lật thẻ Flashcard, ghi nhớ từ vựng và tự động cập nhật độ thông thạo SRS.">
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
                Flashcard Master
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                Ôn Tập Flashcard Tổng Hợp
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed max-w-xl">
                Lọc và ôn tập tất cả từ vựng theo giáo trình hoặc từng sổ tay cá nhân của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Daily 50 Toggle Card */}
        <div
          className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-300 shadow-2xs mb-4 ${
            isDaily50
              ? "border-amber-200/90 bg-gradient-to-b from-amber-50/40 via-white to-white ring-1 ring-amber-200/50"
              : "border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-all ${
                  isDaily50
                    ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                    : "bg-amber-50 text-amber-600"
                }`}
              >
                🎲
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                    Luyện 50 từ ngẫu nhiên mỗi ngày
                  </h3>
                  {isDaily50 && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        daily50Progress.isCompleted
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200/80"
                      }`}
                    >
                      {daily50Progress.isCompleted ? "🎉 Đã hoàn thành" : "Đang thực hiện"}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Xáo trộn cố định 50 từ trong ngày (hỗ trợ cả Thẻ Flashcard và Trắc Nghiệm 4 đáp án)
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleDaily50}
              aria-label="Bật hoặc tắt chế độ 50 từ ngẫu nhiên"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                isDaily50 ? "bg-amber-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isDaily50 ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Progress của 50 từ nếu chọn 50 từ ngẫu nhiên */}
          {isDaily50 && (
            <div className="mt-5 pt-4 border-t border-amber-100/90 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <span>📊</span> Tiến độ mục tiêu 50 từ hôm nay:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-100 text-amber-950 border border-amber-200">
                    {daily50Progress.learnedCount} / 50 từ
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {daily50Progress.isCompleted ? (
                    <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                      <span>✨</span> Xuất sắc! Đã đạt 100% mục tiêu hôm nay
                    </span>
                  ) : (
                    <span className="text-gray-500 font-medium">
                      Còn lại: <strong className="text-amber-800 font-bold">{daily50Progress.remaining} từ</strong>
                    </span>
                  )}
                  <span className="text-gray-300 hidden sm:inline">•</span>
                  <span className="font-black text-amber-700">{daily50Progress.percentage}%</span>
                </div>
              </div>

              {/* Thanh tiến độ */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    daily50Progress.isCompleted
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xs"
                      : "bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500"
                  }`}
                  style={{ width: `${daily50Progress.percentage}%` }}
                />
              </div>

              {/* Thống kê 3 chỉ số */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                <div className="bg-white/90 rounded-2xl p-2.5 border border-gray-100 shadow-3xs">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mục tiêu</div>
                  <div className="text-xs sm:text-sm font-black text-gray-800 mt-0.5">50 từ</div>
                </div>
                <div className="bg-white/90 rounded-2xl p-2.5 border border-gray-100 shadow-3xs">
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Đã học hôm nay</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-700 mt-0.5">{daily50Progress.learnedCount} từ</div>
                </div>
                <div className="bg-white/90 rounded-2xl p-2.5 border border-gray-100 shadow-3xs">
                  <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Cần học thêm</div>
                  <div className="text-xs sm:text-sm font-black text-amber-700 mt-0.5">{daily50Progress.remaining} từ</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 shrink-0">
            <span>🎯</span> Chọn nguồn ôn tập
          </h2>
          
          <div className="relative w-full sm:max-w-md">
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-2xl appearance-none pr-10 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer shadow-xs"
            >
              <option value="all">🌟 Tất cả từ vựng (Toàn bộ Giáo trình & Sổ tay)</option>
              <option value="all_curriculums">📚 Tất cả Giáo trình ({totalCurriculumVocabCount} từ)</option>
              <option value="all_notebooks">📓 Tất cả Sổ tay cá nhân ({totalNotebookVocabCount} từ)</option>

              {curriculums.length > 0 && (
                <optgroup label="📚 Giáo trình từng sách" className="font-bold text-gray-400">
                  {curriculums.map((c) => {
                    const count = c.lessons?.reduce((acc, l) => acc + (l.vocabulary?.length || 0), 0) || 0;
                    return (
                      <option key={c.id} value={c.id} className="text-gray-700 font-semibold">
                        📖 {c.name} {count > 0 ? `(${count} từ)` : ""}
                      </option>
                    );
                  })}
                </optgroup>
              )}
              {notebooks.length > 0 && (
                <optgroup label="📓 Sổ tay cá nhân từng sổ" className="font-bold text-gray-400">
                  {notebooks.map((nb) => (
                    <option key={nb.id} value={nb.id} className="text-gray-700 font-semibold">
                      📓 {nb.name} ({nb.vocabulary?.length || 0} từ)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* Flashcard Viewer Section */}
        <div className="mt-8">
          {allVocab.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 text-center max-w-xl mx-auto">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="font-bold text-gray-900 text-lg mb-1">Không có từ vựng nào</h3>
              <p className="text-sm text-gray-500">Nguồn được chọn chưa có bất kỳ từ vựng nào.</p>
            </div>
          ) : (
            <FlashCardViewer 
              vocabulary={allVocab} 
              title={
                source === "all" 
                  ? "Ôn tập tổng hợp" 
                  : source === "all_curriculums"
                  ? "Tất cả Giáo trình"
                  : source === "all_notebooks"
                  ? "Tất cả Sổ tay"
                  : curriculums.find(c => c.id === source)?.name || notebooks.find(nb => nb.id === source)?.name || "Ôn tập"
              } 
              dailyLimit={isDaily50 ? 50 : undefined}
            />
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
