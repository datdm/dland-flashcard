"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getItem, setItem } from "@/lib/storage";

interface Material {
  phase: string;
  name: string;
  type: string;
  description: string;
  source: string;
  importance: string;
  status: string;
}

interface TimetableEntry {
  day: string;
  time: string;
  duration: string;
  skill: string;
  content: string;
  tools: string;
  status: string;
}

interface MockTest {
  id: string;
  testName: string;
  timing: string;
  source: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  overall: number;
  targetBand: string;
  evaluation: string;
}

interface LessonWeek {
  id: string;
  weekNumber: number;
  month: string;
  name: string;
  description: string;
  level: string;
  phase: string;
  phaseCode: string;
  duration: string;
  kpi: string;
  skills: {
    listening: string;
    reading: string;
    writing: string;
    speaking: string;
    grammarVocab: string;
    kpi: string;
  };
}

interface IeltsRoadmapProps {
  lessons: LessonWeek[];
  materials?: Material[];
  timetable?: TimetableEntry[];
  mockTests?: MockTest[];
}

const STORAGE_KEY = "dland_ielts_completed_weeks";

export default function IeltsRoadmapDashboard({
  lessons,
  materials = [],
  timetable = [],
  mockTests = []
}: IeltsRoadmapProps) {
  const [activeTab, setActiveTab] = useState<"weeks" | "schedule" | "materials" | "mock">("weeks");
  const [activePhaseFilter, setActivePhaseFilter] = useState<string>("ALL");
  const [completedWeeks, setCompletedWeeks] = useState<Record<number, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getItem<Record<number, boolean>>(STORAGE_KEY);
    if (saved) {
      setCompletedWeeks(saved);
    }
  }, []);

  const toggleWeekCompleted = (weekNum: number) => {
    const next = { ...completedWeeks, [weekNum]: !completedWeeks[weekNum] };
    setCompletedWeeks(next);
    setItem(STORAGE_KEY, next);
  };

  if (!mounted) {
    return (
      <div className="py-12 text-center text-gray-500 font-medium animate-pulse">
        Đang tải Lộ trình IELTS 7.0...
      </div>
    );
  }

  const completedCount = Object.values(completedWeeks).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 52) * 100);

  // Phase breakdown count
  const phase1Done = lessons.filter(l => l.phaseCode === "GĐ 1" && completedWeeks[l.weekNumber]).length;
  const phase2Done = lessons.filter(l => l.phaseCode === "GĐ 2" && completedWeeks[l.weekNumber]).length;
  const phase3Done = lessons.filter(l => l.phaseCode === "GĐ 3" && completedWeeks[l.weekNumber]).length;
  const phase4Done = lessons.filter(l => l.phaseCode === "GĐ 4" && completedWeeks[l.weekNumber]).length;

  const filteredLessons = lessons.filter(l => {
    if (activePhaseFilter === "ALL") return true;
    return l.phaseCode === activePhaseFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Strategy Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-bold text-indigo-300">
                🇬🇧 MỤC TIÊU IELTS OVERALL 7.0
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-300">
                12 THÁNG / 52 TUẦN
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Lộ Trình IELTS 7.0 Toàn Diện
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Chiến lược đóng góp điểm số: Gánh điểm bởi Listening (7.5) & Reading (7.5) • Vùng an toàn Writing (6.5) & Speaking (6.5).
            </p>
          </div>

          {/* Progress Circle & Counter */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <div className="text-center">
              <div className="text-3xl font-black text-emerald-400">{progressPercent}%</div>
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Tiến độ</div>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <div>
              <div className="text-lg font-bold text-white">{completedCount} / 52</div>
              <div className="text-[10px] text-slate-400">Tuần hoàn thành</div>
            </div>
          </div>
        </div>

        {/* Phase Breakdown Progress Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-indigo-300 font-semibold uppercase">GĐ 1: Foundation</div>
            <div className="font-bold text-white mt-0.5">{phase1Done} / 12 tuần ({Math.round((phase1Done/12)*100)}%)</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-purple-300 font-semibold uppercase">GĐ 2: Format</div>
            <div className="font-bold text-white mt-0.5">{phase2Done} / 14 tuần ({Math.round((phase2Done/14)*100)}%)</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-pink-300 font-semibold uppercase">GĐ 3: Advanced</div>
            <div className="font-bold text-white mt-0.5">{phase3Done} / 13 tuần ({Math.round((phase3Done/13)*100)}%)</div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-amber-300 font-semibold uppercase">GĐ 4: Mock Test</div>
            <div className="font-bold text-white mt-0.5">{phase4Done} / 13 tuần ({Math.round((phase4Done/13)*100)}%)</div>
          </div>
        </div>
      </div>

      {/* Main Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab("weeks")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "weeks"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          📍 Lộ trình 52 Tuần
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "schedule"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🗓️ Lịch Học Tuần (T2-CN)
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "materials"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          📚 Danh Mục Tài Liệu
        </button>
        <button
          onClick={() => setActiveTab("mock")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
            activeTab === "mock"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          🎯 Theo Dõi Thi Thử ({mockTests.length} Checkpoints)
        </button>
      </div>

      {/* TAB 1: 52 WEEKS TRACKER */}
      {activeTab === "weeks" && (
        <div className="space-y-4">
          {/* Phase Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-gray-400">Lọc theo:</span>
            {[
              { code: "ALL", label: "Tất cả (52 Tuần)" },
              { code: "GĐ 1", label: "GĐ 1: Foundation (W1-12)" },
              { code: "GĐ 2", label: "GĐ 2: Format (W13-26)" },
              { code: "GĐ 3", label: "GĐ 3: Advanced (W27-39)" },
              { code: "GĐ 4", label: "GĐ 4: Practice (W40-52)" }
            ].map(p => (
              <button
                key={p.code}
                onClick={() => setActivePhaseFilter(p.code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activePhaseFilter === p.code
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Weeks List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLessons.map((l) => {
              const isChecked = !!completedWeeks[l.weekNumber];

              return (
                <div
                  key={l.id}
                  className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                    isChecked
                      ? "border-emerald-200 bg-emerald-50/20 shadow-xs"
                      : "border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200"
                  }`}
                >
                  <div>
                    {/* Header line */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleWeekCompleted(l.weekNumber)}
                          className="w-4 h-4 text-emerald-600 rounded-md border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                          {l.month} • {l.phaseCode}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {l.level}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base mt-1">
                      {l.name}
                    </h3>

                    {/* Skills Grid */}
                    <div className="mt-3 bg-gray-50/80 rounded-xl p-3 text-xs space-y-1.5 border border-gray-100">
                      <div>
                        <span className="font-bold text-indigo-700">🎧 Listening:</span>{" "}
                        <span className="text-gray-600">{l.skills.listening}</span>
                      </div>
                      <div>
                        <span className="font-bold text-indigo-700">📖 Reading:</span>{" "}
                        <span className="text-gray-600">{l.skills.reading}</span>
                      </div>
                      <div>
                        <span className="font-bold text-indigo-700">✍️ Writing:</span>{" "}
                        <span className="text-gray-600">{l.skills.writing}</span>
                      </div>
                      <div>
                        <span className="font-bold text-indigo-700">🗣️ Speaking:</span>{" "}
                        <span className="text-gray-600">{l.skills.speaking}</span>
                      </div>
                      <div>
                        <span className="font-bold text-purple-700">🧠 Ngữ pháp & Từ vựng:</span>{" "}
                        <span className="text-gray-600">{l.skills.grammarVocab}</span>
                      </div>
                    </div>

                    {/* KPI Badge */}
                    <div className="mt-3 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl font-medium">
                      🎯 <span className="font-bold">KPI Đầu ra:</span> {l.kpi}
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-semibold">
                      ⏱️ Thời lượng: {l.duration}
                    </span>
                    <Link
                      href={`/curriculum/${l.id}`}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Học từ vựng & bài tập →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY TIMETABLE */}
      {activeTab === "schedule" && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              🗓️ Lịch Học Hàng Tuần (1.5 - 2 Tiếng / Buổi Tối)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Phân bổ thời gian giãn cách tối ưu hóa phản xạ 4 kỹ năng trong 12 tháng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {timetable.map((t, idx) => (
              <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-indigo-600 text-base">{t.day}</span>
                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full">
                      {t.time} ({t.duration})
                    </span>
                  </div>
                  <div className="text-xs font-bold text-gray-800 mb-2">
                    🎯 Kỹ năng chính: <span className="text-indigo-600">{t.skill}</span>
                  </div>
                  <div className="text-xs text-gray-600 whitespace-pre-line leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                    {t.content}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200/60 text-[11px] text-gray-500 font-medium">
                  🛠️ Công cụ khuyến nghị: {t.tools}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MATERIALS CATALOG */}
      {activeTab === "materials" && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              📚 Danh Mục Tài Liệu Theo Giai Đoạn (Resource Catalog)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Danh sách giáo trình và tài liệu bắt buộc & khuyên dùng cho lộ trình IELTS 7.0.
            </p>
          </div>

          <div className="space-y-3">
            {materials.map((m, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                      {m.phase}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.importance === "Bắt buộc" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {m.importance}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm">{m.name}</h4>
                  <p className="text-xs text-gray-500">{m.description}</p>
                </div>

                <div className="text-xs text-gray-400 text-right whitespace-nowrap">
                  <div>Nguồn: <span className="font-semibold text-gray-700">{m.source}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MOCK TEST TRACKER */}
      {activeTab === "mock" && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              🎯 Theo Dõi Kết Quả Thi Thử & Checkpoints (Mock Test Tracker)
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              8 cột mốc đánh giá năng lực từ Diagnostic Test đến Thi thử sát thi thật.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="bg-slate-900 text-white rounded-xl">
                  <th className="p-3 rounded-l-xl">Lần Test</th>
                  <th className="p-3">Thời điểm</th>
                  <th className="p-3">Nguồn đề</th>
                  <th className="p-3 text-center">Listening</th>
                  <th className="p-3 text-center">Reading</th>
                  <th className="p-3 text-center">Writing</th>
                  <th className="p-3 text-center">Speaking</th>
                  <th className="p-3 text-center text-emerald-400">OVERALL</th>
                  <th className="p-3 rounded-r-xl">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockTests.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-3 font-bold text-gray-900">{t.testName}</td>
                    <td className="p-3 text-gray-500">{t.timing}</td>
                    <td className="p-3 text-gray-500">{t.source}</td>
                    <td className="p-3 text-center font-semibold text-indigo-600">{t.listening || "-"}</td>
                    <td className="p-3 text-center font-semibold text-indigo-600">{t.reading || "-"}</td>
                    <td className="p-3 text-center font-semibold text-purple-600">{t.writing || "-"}</td>
                    <td className="p-3 text-center font-semibold text-purple-600">{t.speaking || "-"}</td>
                    <td className="p-3 text-center font-black text-emerald-600 text-sm bg-emerald-50/50">
                      {t.overall || "-"}
                    </td>
                    <td className="p-3 text-gray-600 text-[11px] leading-relaxed max-w-xs">{t.evaluation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
