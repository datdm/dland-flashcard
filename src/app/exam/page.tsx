"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { getAllExams, getAllResults, deleteCustomExam } from "@/lib/examStorage";
import { StoredExam, ExamResult } from "@/types/exam";
import ExamUploadModal from "@/components/exam/ExamUploadModal";
import ExamStructureModal from "@/components/exam/ExamStructureModal";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

const LEVEL_COLORS: Record<string, { badge: string; border: string }> = {
  N1: { badge: "bg-purple-100 text-purple-800 border-purple-200", border: "hover:border-purple-300" },
  N2: { badge: "bg-rose-100 text-rose-800 border-rose-200", border: "hover:border-rose-300" },
  N3: { badge: "bg-amber-100 text-amber-800 border-amber-200", border: "hover:border-amber-300" },
  N4: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", border: "hover:border-emerald-300" },
  N5: { badge: "bg-blue-100 text-blue-800 border-blue-200", border: "hover:border-blue-300" },
};

export default function ExamHubPage() {
  const router = useRouter();
  const { activeLanguage } = useLanguageSetting();
  const [exams, setExams] = useState<StoredExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showStructureModal, setShowStructureModal] = useState<boolean>(false);

  const loadData = () => {
    setExams(getAllExams());
    setResults(getAllResults());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("exams-updated", loadData);
    window.addEventListener("exam-results-updated", loadData);
    return () => {
      window.removeEventListener("exams-updated", loadData);
      window.removeEventListener("exam-results-updated", loadData);
    };
  }, []);

  const filteredExams = exams.filter((e) => {
    const matchLevel =
      selectedLevel === "all" || e.data.meta.level.toUpperCase() === selectedLevel.toUpperCase();
    const matchQuery =
      !searchQuery.trim() ||
      e.data.meta.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.data.meta.year && e.data.meta.year.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchLevel && matchQuery;
  });

  const totalAttempts = results.length;
  const passedAttempts = results.filter((r) => r.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;

  return (
    <AuthGuard
      featureName="Luyện Thi & Thi Thử JLPT"
      description="Đăng nhập để làm các đề thi thử JLPT chuẩn cấu trúc N5 - N1, bấm giờ làm bài, chấm điểm và lưu lịch sử kết quả."
    >
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6 sm:space-y-8">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-rose-900 via-indigo-900 to-purple-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
                  🇯🇵 Dland JLPT Exam Hub
                </span>
                <span className="px-3 py-1 bg-amber-400/30 text-amber-200 border border-amber-300/30 backdrop-blur-md rounded-full text-xs font-bold">
                  Kỳ thi N1 ➔ N5
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black mt-2">
                Luyện Thi & Thi Thử JLPT Trực Tuyến
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 mt-2 max-w-2xl leading-relaxed">
                Hệ thống thi thử mô phỏng thời gian thực với đề thi chính thức các năm (07/2025, 12/2024...), chấm điểm tự động, giải thích chi tiết đáp án và tra cứu từ vựng trực tiếp.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowStructureModal(true)}
                className="px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-xs border border-white/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>📋</span>
                <span>Cấu trúc đề thi N1-N5</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-3 rounded-2xl bg-white text-indigo-950 font-extrabold text-xs shadow-lg hover:bg-gray-100 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>📥</span>
                <span>Nhập đề JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
              📚
            </div>
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Tổng số đề thi
              </div>
              <div className="text-2xl font-black text-gray-900 mt-0.5">
                {exams.length} <span className="text-xs font-medium text-gray-400">bộ đề</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Lượt làm bài thi
              </div>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {totalAttempts} <span className="text-xs font-medium text-gray-400">lần thi</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
              📈
            </div>
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Tỷ lệ thông qua (Đạt)
              </div>
              <div className="text-2xl font-black text-amber-600 mt-0.5">
                {passRate}%{" "}
                <span className="text-xs font-medium text-gray-400">
                  ({passedAttempts}/{totalAttempts})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Level Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-2xs">
          {/* Level Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["all", "N1", "N2", "N3", "N4", "N5"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  selectedLevel === lvl
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lvl === "all" ? "🌟 Tất cả cấp độ" : `Cấp độ ${lvl}`}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm đề thi..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
          </div>
        </div>

        {/* Exam Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredExams.map((exam) => {
            const meta = exam.data.meta;
            const levelStyle =
              LEVEL_COLORS[meta.level] || {
                badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
                border: "hover:border-indigo-300",
              };
            const timeMins = Math.round(meta.timeLimit / 60);

            // Find best score for this exam
            const pastResults = results.filter((r) => r.examId === exam.id);
            const bestResult = pastResults.sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs transition-all duration-200 hover:shadow-md flex flex-col justify-between ${levelStyle.border}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black border ${levelStyle.badge}`}
                    >
                      JLPT {meta.level}
                    </span>

                    <div className="flex items-center gap-2">
                      {meta.year && (
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
                          📅 {meta.year}
                        </span>
                      )}
                      {!exam.isBuiltin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa đề thi "${meta.title}" không?`)) {
                              deleteCustomExam(exam.id);
                            }
                          }}
                          className="text-gray-400 hover:text-rose-600 transition-colors p-1 text-xs cursor-pointer"
                          title="Xóa đề tùy chỉnh"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900 leading-snug mb-2">
                    {meta.title}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {meta.description || `Đề thi thử ${meta.level} với đầy đủ các phần thi và giải thích đáp án.`}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 py-3 border-y border-gray-100 mb-4 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <span>❓</span> {meta.totalQuestions} câu hỏi
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>⏱️</span> {timeMins} phút
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span>🎯</span> Điểm đỗ: {meta.passMark || 90}đ
                    </span>
                  </div>
                </div>

                <div>
                  {/* Past score badge if attempted */}
                  {bestResult && (
                    <div className="mb-3 px-3 py-2 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-bold flex items-center gap-1">
                        <span>🎖️</span> Điểm cao nhất:
                      </span>
                      <span className="text-emerald-700 font-black">
                        {bestResult.correctCount}/{bestResult.totalQuestions} ({bestResult.scorePercentage}%) —{" "}
                        {bestResult.passed ? "Đạt" : "Chưa đạt"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/exam/${exam.id}`}
                      className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <span>✍️</span>
                      <span>Vào Làm Bài Thi →</span>
                    </Link>

                    {bestResult && (
                      <Link
                        href={`/exam/result/${bestResult.id}`}
                        className="py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors shrink-0"
                      >
                        📊 Kết quả
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredExams.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm font-bold text-gray-700">Không tìm thấy đề thi nào phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Hãy thử chọn cấp độ khác hoặc nhập đề thi JSON mới.</p>
          </div>
        )}

        {/* Modal upload */}
        <ExamUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={(examId) => {
            loadData();
            router.push(`/exam/${examId}`);
          }}
        />

        {/* Modal Structure Blueprint */}
        <ExamStructureModal
          isOpen={showStructureModal}
          onClose={() => setShowStructureModal(false)}
          initialLevel={selectedLevel === "all" ? "N2" : selectedLevel}
        />
      </div>
    </AuthGuard>
  );
}
