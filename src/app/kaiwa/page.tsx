"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { KAIWA_ROADMAP, KaiwaWeek } from "./roadmapData";
import { autoSync } from "@/lib/syncService";

export default function KaiwaRoadmapPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<KaiwaWeek>(KAIWA_ROADMAP[0]);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);

  // Load progress from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dland_kaiwa_completed");
      if (saved) {
        try {
          setCompletedWeeks(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse completed weeks", e);
        }
      }
    }
  }, []);

  const toggleWeekCompletion = (weekNumber: number) => {
    const isCompleted = completedWeeks.includes(weekNumber);
    let newCompletedList: number[];
    if (isCompleted) {
      newCompletedList = completedWeeks.filter((w) => w !== weekNumber);
    } else {
      newCompletedList = [...completedWeeks, weekNumber];
    }
    setCompletedWeeks(newCompletedList);
    localStorage.setItem("dland_kaiwa_completed", JSON.stringify(newCompletedList));
    autoSync();
  };

  const filteredWeeks = KAIWA_ROADMAP.filter((w) => w.month === selectedMonth);

  // Stats calculation
  const totalWeeks = KAIWA_ROADMAP.length;
  const completedCount = completedWeeks.length;
  const percentCompleted = Math.round((completedCount / totalWeeks) * 100);

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-4">
        <Link href="/" className="text-xs font-semibold text-indigo-600 hover:underline">
          ← Quay về Trang chủ
        </Link>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-semibold tracking-wide text-indigo-300">
              🇯🇵 Lộ Trình Giao Tiếp Tương Tác
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight leading-tight">
              Lộ Trình Học Kaiwa 3 Tháng
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              Luyện phản xạ giao tiếp tự nhiên từ số 0 đến tự tin nói chuyện đời thường. Học cấu trúc thực tế, từ vựng theo chủ đề, kịch bản nhập vai và đối thoại trực tiếp với Gia sư AI.
            </p>
          </div>

          {/* Progress Widget */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shrink-0 w-full md:w-64">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-300">Tiến trình học tập</span>
              <span className="text-sm font-bold text-indigo-300">{completedCount}/{totalWeeks} Tuần</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${percentCompleted}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-slate-400 mt-2 text-right">Hoàn thành {percentCompleted}% chặng đường</div>
          </div>
        </div>
      </div>

      {/* Month Selector Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar gap-2 pb-1">
        {[1, 2, 3].map((month) => (
          <button
            key={month}
            onClick={() => {
              setSelectedMonth(month);
              // Auto select first week of that month
              const firstWeekOfMonth = KAIWA_ROADMAP.find((w) => w.month === month);
              if (firstWeekOfMonth) setSelectedWeek(firstWeekOfMonth);
            }}
            className={`px-6 py-3 font-bold text-sm transition-all whitespace-nowrap border-b-2 -mb-[2px] ${
              selectedMonth === month
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            🌙 Tháng {month}: {month === 1 ? "Phản xạ nền tảng" : month === 2 ? "Hội thoại đời sống" : "Giao tiếp nâng cao"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Weeks List */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Danh sách tuần học</h2>
          <div className="space-y-2">
            {filteredWeeks.map((w) => {
              const isSelected = selectedWeek.week === w.week;
              const isCompleted = completedWeeks.includes(w.week);
              return (
                <div
                  key={w.week}
                  onClick={() => setSelectedWeek(w)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                      : "bg-white hover:bg-gray-50 border-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox for Completion */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWeekCompletion(w.week);
                      }}
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isCompleted
                          ? isSelected
                            ? "bg-white text-indigo-600 border-white"
                            : "bg-emerald-500 text-white border-emerald-500"
                          : isSelected
                          ? "border-white/40 hover:border-white"
                          : "border-gray-300 hover:border-indigo-500"
                      }`}
                    >
                      {isCompleted && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                    <div>
                      <p className={`text-[10px] font-bold tracking-wider uppercase ${isSelected ? "text-indigo-200" : "text-indigo-600"}`}>
                        Tuần {w.week}
                      </p>
                      <h3 className={`font-bold text-sm ${isSelected ? "text-white" : "text-gray-900"} mt-0.5`}>
                        {w.title}
                      </h3>
                    </div>
                  </div>
                  <span className={`text-xs ${isSelected ? "text-white/60" : "text-gray-300 group-hover:text-indigo-500"} transition-colors font-bold`}>
                    →
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Week Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Week Detail Container */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  Tuần {selectedWeek.week} / Tháng {selectedWeek.month}
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-2">{selectedWeek.title}</h2>
              </div>
              <button
                onClick={() => toggleWeekCompletion(selectedWeek.week)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border ${
                  completedWeeks.includes(selectedWeek.week)
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {completedWeeks.includes(selectedWeek.week) ? "✓ Đã Hoàn Thành" : "Đánh Dấu Hoàn Thành"}
              </button>
            </div>

            {/* Objective */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/30">
              <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">🎯 Mục tiêu tuần này</h3>
              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{selectedWeek.objective}</p>
            </div>

            {/* Grouped Patterns (Grammar, Fillers, Aizuchi) */}
            <div className="space-y-6">
              {/* Category 1: Grammar */}
              {selectedWeek.patterns.filter(p => p.category === "grammar").length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-2">
                    <span>📖</span> Ngữ Pháp N2 Giao Tiếp
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedWeek.patterns.filter(p => p.category === "grammar").map((pat, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-extrabold text-base text-indigo-700 leading-tight">{pat.structure}</h4>
                            <span className="px-2 py-0.5 text-[9px] bg-indigo-100 text-indigo-700 font-bold rounded-md shrink-0">
                              N2
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-600 mt-1">Ý nghĩa: {pat.meaning}</p>
                          <p className="text-xs text-gray-500 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100/50 mt-2">
                            <strong>Cách dùng:</strong> {pat.explanation}
                          </p>
                        </div>
                        {pat.examples.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-indigo-50/20 p-2.5 rounded-xl border border-indigo-100/30 text-xs space-y-0.5 mt-auto">
                            <p className="font-bold text-gray-800">{ex.japanese}</p>
                            <p className="text-indigo-600/90 font-medium text-[10px]">{ex.kana}</p>
                            <p className="text-gray-500 mt-1 pt-1 border-t border-indigo-100/10">💡 {ex.vietnamese}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 2: Fillers / Softeners */}
              {selectedWeek.patterns.filter(p => p.category === "filler").length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-l-4 border-pink-500 pl-2">
                    <span>💬</span> Kushon Kotoba & Từ Đệm Tự Nhiên (Fillers)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedWeek.patterns.filter(p => p.category === "filler").map((pat, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-extrabold text-base text-pink-700 leading-tight">{pat.structure}</h4>
                            <span className="px-2 py-0.5 text-[9px] bg-pink-100 text-pink-700 font-bold rounded-md shrink-0">
                              Từ đệm
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-600 mt-1">Ý nghĩa: {pat.meaning}</p>
                          <p className="text-xs text-gray-500 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100/50 mt-2">
                            <strong>Cách dùng:</strong> {pat.explanation}
                          </p>
                        </div>
                        {pat.examples.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-pink-50/20 p-2.5 rounded-xl border border-pink-100/30 text-xs space-y-0.5 mt-auto">
                            <p className="font-bold text-gray-800">{ex.japanese}</p>
                            <p className="text-pink-600/90 font-medium text-[10px]">{ex.kana}</p>
                            <p className="text-gray-500 mt-1 pt-1 border-t border-pink-100/10">💡 {ex.vietnamese}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Category 3: Aizuchi */}
              {selectedWeek.patterns.filter(p => p.category === "aizuchi").length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-l-4 border-emerald-500 pl-2">
                    <span>🗣️</span> Phản Xạ Tự Nhiên & Aizuchi (Backchanneling)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedWeek.patterns.filter(p => p.category === "aizuchi").map((pat, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-extrabold text-base text-emerald-700 leading-tight">{pat.structure}</h4>
                            <span className="px-2 py-0.5 text-[9px] bg-emerald-100 text-emerald-700 font-bold rounded-md shrink-0">
                              Phản xạ
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-600 mt-1">Ý nghĩa: {pat.meaning}</p>
                          <p className="text-xs text-gray-500 leading-relaxed bg-white p-2.5 rounded-lg border border-gray-100/50 mt-2">
                            <strong>Cách dùng:</strong> {pat.explanation}
                          </p>
                        </div>
                        {pat.examples.map((ex, exIdx) => (
                          <div key={exIdx} className="bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-100/30 text-xs space-y-0.5 mt-auto">
                            <p className="font-bold text-gray-800">{ex.japanese}</p>
                            <p className="text-emerald-600/90 font-medium text-[10px]">{ex.kana}</p>
                            <p className="text-gray-500 mt-1 pt-1 border-t border-emerald-100/10">💡 {ex.vietnamese}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Conversational Vocab */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>📝</span> Từ vựng đàm thoại trọng tâm
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedWeek.vocabulary.map((voc, idx) => (
                  <div key={idx} className="bg-white px-3 py-2 border border-gray-100 hover:border-indigo-300 hover:shadow-xs rounded-xl transition-all text-xs flex flex-col items-center min-w-[90px]">
                    <span className="font-bold text-gray-800">{voc.word}</span>
                    <span className="text-indigo-600 text-[10px] mt-0.5">{voc.kana}</span>
                    <span className="text-gray-500 text-[10px] mt-1 border-t border-gray-100 w-full text-center pt-1 truncate max-w-[120px]">
                      {voc.meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Dialogue */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>💬</span> Kịch bản hội thoại thực tế
              </h3>
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-150 space-y-4 max-h-[400px] overflow-y-auto">
                {selectedWeek.dialogue.map((line, idx) => {
                  const isA = line.speaker.startsWith("A");
                  return (
                    <div key={idx} className={`flex flex-col ${isA ? "items-start" : "items-end"}`}>
                      <span className="text-[10px] font-bold text-gray-400 mb-1 px-1">{line.speaker}</span>
                      <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs text-xs space-y-1 ${
                        isA 
                          ? "bg-white text-gray-800 rounded-tl-none border border-gray-100" 
                          : "bg-indigo-50 text-indigo-900 rounded-tr-none border border-indigo-100/50"
                      }`}>
                        <p className="font-bold">{line.japanese}</p>
                        <p className="text-indigo-600/80 text-[10px] font-medium">{line.kana}</p>
                        <p className="text-gray-500 border-t border-gray-100/80 pt-1 mt-1">💡 {line.vietnamese}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Practice Button CTA */}
            <div className="pt-4 border-t border-gray-100 text-center">
              <div className="max-w-xl mx-auto space-y-4">
                <p className="text-xs text-gray-500">
                  Hãy lựa chọn chế độ luyện tập phản xạ hội thoại N2 trực tiếp cùng Gia sư AI:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href={`/chat?prompt=${encodeURIComponent(
                      `Tôi muốn thực hành kịch bản hội thoại thực tế của Tuần ${selectedWeek.week}: ${selectedWeek.title}.\n\nKịch bản mẫu:\n${selectedWeek.dialogue
                        .map((line) => `${line.speaker}: "${line.japanese}" (${line.vietnamese})`)
                        .join("\n")}\n\nHãy đóng vai nhân vật đầu tiên trong kịch bản và nói câu thoại đầu tiên. Tôi sẽ đóng vai nhân vật còn lại. Hãy dẫn dắt tôi đi hết kịch bản này nhé.`
                    )}`}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-indigo-100 transition-all hover:scale-[1.01]"
                  >
                    <span>🗣️</span> Nhập vai luyện theo kịch bản mẫu
                  </Link>

                  <Link
                    href={`/chat?prompt=${encodeURIComponent(
                      `Tôi muốn luyện nói tự do chủ đề N2: ${selectedWeek.title} (Tuần ${selectedWeek.week} của lộ trình Kaiwa 3 tháng).\n\nBối cảnh đóng vai:\n${selectedWeek.roleplayPrompt}\n\nHãy đóng vai nhân vật tương ứng, bắt đầu câu chuyện và cùng tôi hội thoại tự do ở cấp độ N2 nhé.`
                    )}`}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-purple-200 hover:border-purple-300 text-purple-700 hover:bg-purple-50/30 font-extrabold text-xs sm:text-sm rounded-2xl transition-all hover:scale-[1.01]"
                  >
                    <span>🤖</span> Thử thách đàm thoại tự do N2
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
