"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { getAllExams, getAllResults, deleteCustomExam, getExamProgress, clearExamProgress } from "@/lib/examStorage";
import { getExamCategory } from "@/lib/examUtils";
import { StoredExam, ExamResult, ExamProgress } from "@/types/exam";
import ExamUploadModal from "@/components/exam/ExamUploadModal";
import ExamStructureModal from "@/components/exam/ExamStructureModal";
import ExamSectionSelectionModal from "@/components/exam/ExamSectionSelectionModal";
import ExamHistoryModal from "@/components/exam/ExamHistoryModal";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useAuth } from "@/context/AuthContext";
import BreadcrumbNav from "@/components/BreadcrumbNav";

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
  const { user } = useAuth();
  const [exams, setExams] = useState<StoredExam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ExamProgress | null>>({});
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [showStructureModal, setShowStructureModal] = useState<boolean>(false);
  const [selectedExamForModal, setSelectedExamForModal] = useState<StoredExam | null>(null);
  const [historyModalConfig, setHistoryModalConfig] = useState<{
    isOpen: boolean;
    exam?: StoredExam | null;
  }>({ isOpen: false, exam: null });

  const loadData = () => {
    const allExams = getAllExams();
    setExams(allExams);
    setResults(getAllResults());

    const pMap: Record<string, ExamProgress | null> = {};
    allExams.forEach((e) => {
      pMap[e.id] = getExamProgress(e.id);
    });
    setProgressMap(pMap);
  };

  useEffect(() => {
    loadData();
    window.addEventListener("exams-updated", loadData);
    window.addEventListener("exam-results-updated", loadData);
    window.addEventListener("exam-progress-updated", loadData);
    return () => {
      window.removeEventListener("exams-updated", loadData);
      window.removeEventListener("exam-results-updated", loadData);
      window.removeEventListener("exam-progress-updated", loadData);
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
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-8 md:pb-4">
        {/* Breadcrumb Bar */}
        <BreadcrumbNav items={[{ label: "Luyện Thi JLPT", icon: "📝" }]} />

        {/* Header Hero Banner (Compact Minimalist - Light Theme matching background) */}
        <div className={`rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-2xs border relative overflow-hidden transition-all duration-300 bg-gradient-to-r ${
          activeLanguage.code === "en"
            ? "from-white via-blue-50/40 to-indigo-50/30 border-blue-100/80"
            : activeLanguage.code === "de"
            ? "from-white via-amber-50/40 to-orange-50/30 border-amber-100/80"
            : activeLanguage.code === "ko"
            ? "from-white via-rose-50/40 to-pink-50/30 border-rose-100/80"
            : activeLanguage.code === "zh"
            ? "from-white via-red-50/40 to-amber-50/30 border-red-100/80"
            : "from-white via-teal-50/40 to-indigo-50/30 border-teal-100/80"
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase shrink-0 border ${
                activeLanguage.code === "en"
                  ? "bg-blue-50 text-blue-700 border-blue-200/80"
                  : activeLanguage.code === "de"
                  ? "bg-amber-50 text-amber-800 border-amber-200/80"
                  : activeLanguage.code === "ko"
                  ? "bg-rose-50 text-rose-700 border-rose-200/80"
                  : activeLanguage.code === "zh"
                  ? "bg-red-50 text-red-700 border-red-200/80"
                  : "bg-teal-50 text-teal-700 border-teal-200/80"
              }`}>
                {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
              </span>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-md text-[10px] font-bold shrink-0 hidden sm:inline">
                N1 ➔ N5
              </span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-black text-gray-900 truncate">
                  Luyện Thi & Thi Thử JLPT Trực Tuyến
                </h1>
                <p className="text-[11px] text-gray-500 truncate hidden lg:block">
                  Thi thử thời gian thực, đề chính thức các năm, chấm điểm & giải thích chi tiết
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => setHistoryModalConfig({ isOpen: true, exam: null })}
                className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200/80 transition-all flex items-center gap-1 cursor-pointer active:scale-98 shadow-3xs"
              >
                <span>📜</span>
                <span>Lịch sử ({results.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStructureModal(true)}
                className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-200 shadow-3xs transition-all flex items-center gap-1 cursor-pointer active:scale-98"
              >
                <span>📋</span>
                <span>Cấu trúc đề</span>
              </button>

              {user?.isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-3 py-1.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-98"
                >
                  <span>📥</span>
                  <span>Nhập đề</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl">
              📚
            </div>
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Tổng số đề thi
              </div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
                {exams.length} <span className="text-xs font-medium text-gray-400">bộ đề</span>
              </div>
            </div>
          </div>

          <div
            onClick={() => setHistoryModalConfig({ isOpen: true, exam: null })}
            className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex items-center justify-between gap-3.5 cursor-pointer hover:border-emerald-200 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl">
                🏆
              </div>
              <div>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                  Lượt làm bài thi
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                  {totalAttempts} <span className="text-xs font-medium text-gray-400">lần thi</span>
                </div>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 shrink-0">
              Xem hết ➔
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl">
              📈
            </div>
            <div>
              <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                Tỷ lệ thông qua (Đạt)
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                {passRate}%{" "}
                <span className="text-xs font-medium text-gray-400">
                  ({passedAttempts}/{totalAttempts})
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Level Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-100 shadow-xs">
          {/* Level Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {["all", "N1", "N2", "N3", "N4", "N5"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
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
              className="w-full pl-8 pr-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <span className="absolute left-2.5 top-2 text-xs text-gray-400">🔍</span>
          </div>
        </div>

        {/* Exam Card Component Renderer */}
        {(() => {
          const renderExamCard = (exam: StoredExam) => {
            const meta = exam.data.meta;
            const isReal = getExamCategory(exam) === "real";
            const levelStyle =
              LEVEL_COLORS[meta.level] || {
                badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
                border: "hover:border-indigo-300",
              };
            const timeMins = Math.round(meta.timeLimit / 60);

            // Find best score & all past attempts for this exam
            const pastResults = results.filter((r) => r.examId === exam.id);
            const bestResult = [...pastResults].sort((a, b) => b.scorePercentage - a.scorePercentage)[0];

            // Check draft progress
            const currentProgress = progressMap[exam.id];
            const hasDraft =
              currentProgress &&
              (Object.keys(currentProgress.answers || {}).length > 0 ||
                (currentProgress.timeRemaining > 0 && currentProgress.timeRemaining < meta.timeLimit));
            const answeredCount = hasDraft ? Object.keys(currentProgress.answers || {}).length : 0;
            const minsLeft = hasDraft ? Math.floor(currentProgress.timeRemaining / 60) : 0;
            const secsLeft = hasDraft ? currentProgress.timeRemaining % 60 : 0;

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs transition-all duration-200 hover:shadow-sm flex flex-col justify-between ${levelStyle.border}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black border ${levelStyle.badge}`}
                      >
                        JLPT {meta.level}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                          isReal
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : "bg-purple-50 text-purple-900 border-purple-200"
                        }`}
                      >
                        {isReal ? "🏛️ Đề thi thật" : "📝 Đề thi thử"}
                      </span>
                    </div>

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
                    {meta.description || `Đề thi ${isReal ? "chính thức" : "thi thử"} ${meta.level} với đầy đủ các phần thi và giải thích đáp án.`}
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
                  {/* Draft in-progress badge */}
                  {hasDraft && (
                    <div className="mb-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs gap-2">
                      <span className="text-amber-900 font-extrabold flex items-center gap-1.5 shrink-0">
                        <span className="text-sm">⏳</span> Đang làm dở:
                      </span>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-amber-800 font-bold truncate">
                          {answeredCount}/{meta.totalQuestions} câu • Còn {minsLeft}:{secsLeft < 10 ? `0${secsLeft}` : secsLeft}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Bạn có chắc muốn xóa bản làm dở của bài thi "${meta.title}" không?`)) {
                              clearExamProgress(exam.id);
                            }
                          }}
                          className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0"
                          title="Xóa bản lưu tạm này"
                        >
                          🗑️ Xóa nháp
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Past score badge & attempt history link */}
                  {bestResult && !hasDraft && (
                    <div className="mb-3 px-3 py-2 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-emerald-900 font-bold flex items-center gap-1 text-[11px]">
                          <span>🎖️</span> Cao nhất: {bestResult.correctCount}/{bestResult.totalQuestions} ({bestResult.scorePercentage}%) — {bestResult.passed ? "Đạt" : "Chưa đạt"}
                        </span>
                        <span className="text-emerald-700 text-[10px] font-semibold">
                          Đã thi {pastResults.length} lần
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setHistoryModalConfig({ isOpen: true, exam })}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-extrabold border border-emerald-200 shadow-3xs transition-all cursor-pointer shrink-0"
                        title="Xem tất cả các lần thi của đề này"
                      >
                        📜 Lịch sử ({pastResults.length})
                      </button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    {hasDraft ? (
                      <>
                        <button
                          type="button"
                          onClick={() => router.push(`/exam/${exam.id}`)}
                          className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <span>▶️</span>
                          <span>Tiếp Tục Làm Bài</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Bạn có chắc muốn xóa bản lưu tạm và bắt đầu lại bài thi "${meta.title}" từ đầu?`
                              )
                            ) {
                              clearExamProgress(exam.id);
                              setSelectedExamForModal(exam);
                            }
                          }}
                          className="w-full sm:w-auto py-3 px-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                          title="Làm lại đề thi từ đầu"
                        >
                          <span>🔄</span>
                          <span className="sm:hidden">Làm mới</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          clearExamProgress(exam.id);
                          setSelectedExamForModal(exam);
                        }}
                        className={`flex-1 w-full py-3 px-4 rounded-2xl text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                          isReal
                            ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                            : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                        }`}
                      >
                        <span>✍️</span>
                        <span>{pastResults.length > 0 ? "Thi Lại Bài Này →" : "Vào Làm Bài Thi →"}</span>
                      </button>
                    )}

                    {pastResults.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistoryModalConfig({ isOpen: true, exam })}
                        className="py-3 px-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                        title="Xem lịch sử tất cả các lượt thi"
                      >
                        📜 <span className="hidden sm:inline ml-1">Lịch sử ({pastResults.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div>
              {filteredExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                  {filteredExams.map(renderExamCard)}
                </div>
              ) : (
                <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm font-bold text-gray-700">Không tìm thấy đề thi nào phù hợp</p>
                  <p className="text-xs text-gray-400 mt-1">Hãy thử chọn cấp độ khác hoặc tìm từ khóa khác.</p>
                </div>
              )}
            </div>
          );
        })()}

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

        {/* Modal Section Selection */}
        <ExamSectionSelectionModal
          isOpen={!!selectedExamForModal}
          onClose={() => setSelectedExamForModal(null)}
          exam={selectedExamForModal}
          initialSelectedIds={
            selectedExamForModal && progressMap[selectedExamForModal.id]?.selectedSectionIds
              ? progressMap[selectedExamForModal.id]!.selectedSectionIds
              : undefined
          }
          hasDraft={selectedExamForModal ? !!progressMap[selectedExamForModal.id] : false}
          onConfirm={(selectedSectionIds) => {
            if (!selectedExamForModal) return;
            const examId = selectedExamForModal.id;
            setSelectedExamForModal(null);
            router.push(`/exam/${examId}?sections=${selectedSectionIds.join(",")}`);
          }}
        />

        {/* Modal History */}
        <ExamHistoryModal
          isOpen={historyModalConfig.isOpen}
          onClose={() => setHistoryModalConfig({ isOpen: false, exam: null })}
          exam={historyModalConfig.exam}
          results={results}
          onRetakeExam={(examId) => {
            clearExamProgress(examId);
            const targetExam = exams.find((e) => e.id === examId);
            if (targetExam) {
              setSelectedExamForModal(targetExam);
            }
          }}
        />
      </div>
    </AuthGuard>
  );
}
