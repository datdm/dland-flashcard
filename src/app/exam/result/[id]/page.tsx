"use client";

import React, { useEffect, useState, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { getResultById, getExamById } from "@/lib/examStorage";
import { ExamResult, StoredExam, ExamMajorSection } from "@/types/exam";
import ExamQuestionCard from "@/components/exam/ExamQuestionCard";
import ExamPassageCard from "@/components/exam/ExamPassageCard";
import ExamSectionNav from "@/components/exam/ExamSectionNav";
import MaziiQuickLookupModal from "@/components/MaziiQuickLookupModal";
import SelectionLookupTooltip from "@/components/SelectionLookupTooltip";
import AddToNotebookModal from "@/components/AddToNotebookModal";
import { getStructuredMajorSections } from "@/lib/examUtils";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ExamResultPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [exam, setExam] = useState<StoredExam | null>(null);
  const [showFullReview, setShowFullReview] = useState<boolean>(true);
  const [selectedReviewTab, setSelectedReviewTab] = useState<string>("all");
  const [selectedWordForNotebook, setSelectedWordForNotebook] = useState<any | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Mazii Quick Lookup Modal state
  const [maziiState, setMaziiState] = useState<{
    isOpen: boolean;
    queryWord: string;
  }>({
    isOpen: false,
    queryWord: "",
  });

  useEffect(() => {
    const loadedResult = getResultById(id);
    if (!loadedResult) {
      router.push("/exam");
      return;
    }
    setResult(loadedResult);

    const loadedExam = getExamById(loadedResult.examId);
    if (loadedExam) {
      setExam(loadedExam);
    }
  }, [id, router]);

  const allMajorSections = useMemo<ExamMajorSection[]>(() => {
    if (!exam) return [];
    return getStructuredMajorSections(exam.data);
  }, [exam]);

  const availableMajorSections = useMemo<ExamMajorSection[]>(() => {
    if (result?.selectedSectionIds && result.selectedSectionIds.length > 0) {
      return allMajorSections.filter((sec) => result.selectedSectionIds!.includes(sec.id));
    }
    return allMajorSections;
  }, [allMajorSections, result]);

  if (!result || !exam) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Đang tải kết quả bài thi...</p>
        </div>
      </div>
    );
  }

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins} phút ${secs} giây`;
  };

  // Build map of question correctness
  const allQList = [
    ...exam.data.questions,
    ...(exam.data.passages || []).flatMap((p) => p.questions),
  ];

  const resultsMap: Record<number, boolean> = {};
  allQList.forEach((q) => {
    const userAns = result.answers[q.id] || [];
    const isCorrect =
      userAns.length === q.answers.length &&
      userAns.every((a) => q.answers.includes(a));
    resultsMap[q.id] = isCorrect;
  });

  // Passage start map
  const passageStartMap: Record<string, number> = {};
  let curIdx = exam.data.questions.length + 1;
  (exam.data.passages || []).forEach((pg) => {
    passageStartMap[pg.id] = curIdx;
    curIdx += pg.questions.length;
  });

  const questionMap = new Map<number, any>();
  exam.data.questions.forEach((q) => questionMap.set(q.id, q));
  const passageMap = new Map<string, any>();
  (exam.data.passages || []).forEach((p) => passageMap.set(p.id, p));

  const filteredMajorSections = availableMajorSections.filter(
    (major) => selectedReviewTab === "all" || major.id === selectedReviewTab
  );

  const maxScore = result.maxScore || 180;
  const scaledScore =
    result.scaledScore ??
    Math.round((result.correctCount / (result.totalQuestions || 1)) * maxScore);

  const isCustomSectionExam = Boolean(
    result.selectedSectionIds &&
    result.selectedSectionIds.length > 0 &&
    allMajorSections.length > 0 &&
    result.selectedSectionIds.length < allMajorSections.length
  );

  return (
    <AuthGuard featureName="Kết Quả Thi JLPT">
      <div className="min-h-screen bg-gray-50/60 pb-8 md:pb-4">
        <SelectionLookupTooltip
          onLookup={(text) => setMaziiState({ isOpen: true, queryWord: text })}
        />

        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 shadow-3xs">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            <Link
              href="/exam"
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Danh sách đề thi</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href={`/exam/${result.examId}`}
                className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-extrabold transition-colors flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Làm lại đề thi</span>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5">
          {/* Main Score Hero Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm text-center relative overflow-hidden">
            {isCustomSectionExam && (
              <div className="mb-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                  <span>🎯</span>
                  <span>
                    Bài thi tùy chọn: {result.selectedSectionIds?.length} phần đã làm (
                    {result.selectedSectionIds
                      ?.map((sid) => allMajorSections.find((s) => s.id === sid)?.name || sid)
                      .join(", ")}
                    )
                  </span>
                </span>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-extrabold border border-indigo-100">
                JLPT {result.level}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(result.finishedAt).toLocaleDateString("vi-VN")}{" "}
                {new Date(result.finishedAt).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 max-w-xl mx-auto">
              {result.examTitle}
            </h1>

            {/* Score Ring / Badge */}
            <div className="my-5 inline-flex flex-col items-center justify-center">
              <div
                className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-8 shadow-inner ${
                  result.passed
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "bg-rose-50 border-rose-500 text-rose-700"
                }`}
              >
                <span className="text-3xl font-black">{result.scorePercentage}%</span>
                <span className="text-[11px] font-bold text-gray-500 mt-0.5">
                  {result.correctCount}/{result.totalQuestions} câu đúng
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 flex-wrap mb-2">
              <span
                className={`px-4 py-1.5 rounded-xl text-xs font-black tracking-wide shadow-xs flex items-center gap-1.5 ${
                  result.passed
                    ? "bg-emerald-600 text-white shadow-emerald-200"
                    : "bg-rose-600 text-white shadow-rose-200"
                }`}
              >
                <span>{result.passed ? "🎉" : "⚠️"}</span>
                <span>
                  {result.passed ? "KẾT QUẢ: ĐẠT (PASS)" : "KẾT QUẢ: CHƯA ĐẠT (FAIL)"}
                </span>
              </span>

              <span className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5">
                <span>⏱️</span>
                <span>Thời gian: {formatTime(result.timeTaken)}</span>
              </span>

              <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5">
                <span>🎯</span>
                <span>Điểm quy đổi: {scaledScore}/{maxScore} điểm</span>
              </span>
            </div>
          </div>

          {/* Section & Mondai Results Breakdown */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-4">
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
              <span>📊</span>
              <span>Chi Tiết Điểm Số Theo Mục Lớn & Mondai</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.sectionResults.map((sec, idx) => {
                const secPct =
                  sec.total > 0 ? Math.round((sec.correct / sec.total) * 100) : 0;
                const isSecPassed = secPct >= 32;

                return (
                  <div
                    key={idx}
                    className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-extrabold">
                        <span className="text-gray-900 font-black">{sec.name}</span>
                        <span className={isSecPassed ? "text-indigo-600 font-black" : "text-rose-600 font-black"}>
                          {sec.correct}/{sec.total} ({secPct}%)
                        </span>
                      </div>

                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            secPct >= 60
                              ? "bg-emerald-500"
                              : secPct >= 35
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${secPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                        <span>Điểm phần: {sec.score || 0}/60đ</span>
                        <span>{isSecPassed ? "✅ Đạt chuẩn" : "❌ Liệt phần"}</span>
                      </div>
                    </div>

                    {/* Mondai Breakdown Mini List */}
                    {sec.mondaiResults && sec.mondaiResults.length > 0 && (
                      <div className="pt-2.5 border-t border-gray-200/60 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                          Chi tiết các Mondai:
                        </span>
                        {sec.mondaiResults.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="flex items-center justify-between text-[11px] text-gray-600 bg-white px-2 py-1 rounded-lg border border-gray-100"
                          >
                            <span className="truncate max-w-[170px] font-medium">{m.mondaiTitle}</span>
                            <span className="font-extrabold text-indigo-700 shrink-0">
                              {m.correct}/{m.total}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Major Section Filter Tabs for Review */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                onClick={() => setSelectedReviewTab("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedReviewTab === "all"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                🌟 Tất cả câu hỏi ({result.totalQuestions})
              </button>

              {availableMajorSections.map((major) => {
                const isSelected = selectedReviewTab === major.id;
                return (
                  <button
                    key={major.id}
                    onClick={() => setSelectedReviewTab(major.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span>{major.icon}</span>
                    <span>{major.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowFullReview((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-all cursor-pointer"
            >
              {showFullReview ? "▲ Thu gọn bài thi" : "▼ Xem toàn bộ câu hỏi"}
            </button>
          </div>

          {/* Full Exam Review Layout */}
          {showFullReview && (
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              {/* Questions Stream grouped by Major Section & Mondai with Explanations */}
              <div className="flex-1 min-w-0 space-y-5">
                {filteredMajorSections.map((major) => (
                  <section
                    key={major.id}
                    id={`major-review-${major.id}`}
                    className="space-y-4 scroll-mt-24"
                  >
                    {/* Major Section Header */}
                    <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-4 sm:p-4.5 text-white shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                          {major.icon}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                            {major.japaneseName}
                          </span>
                          <h2 className="text-base sm:text-lg font-black">{major.name}</h2>
                        </div>
                      </div>
                    </div>

                    {/* Mondai Blocks */}
                    {major.mondais.map((mondai) => (
                      <div
                        key={mondai.id}
                        id={`mondai-review-${mondai.id}`}
                        className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/90 shadow-xs space-y-3.5 scroll-mt-20"
                      >
                        {/* Mondai Header Card */}
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3">
                          <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5 mb-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            <span>{mondai.title}</span>
                          </span>
                          {mondai.instruction && (
                            <p className="text-xs font-medium text-gray-700 leading-relaxed pt-1 border-t border-indigo-100/60 select-text">
                              {mondai.instruction}
                            </p>
                          )}
                        </div>

                        {/* Questions in this Mondai */}
                        <div className="space-y-3 pt-0.5">
                          {(mondai.questionIds || []).map((qid) => {
                            const q = questionMap.get(qid);
                            if (!q) return null;
                            const qIndex = exam.data.questions.findIndex((x) => x.id === qid) + 1;
                            return (
                              <ExamQuestionCard
                                key={q.id}
                                question={q}
                                index={qIndex}
                                selected={result.answers[q.id] || []}
                                onChange={() => {}}
                                showResult={true}
                                onOpenMazii={(word) =>
                                  setMaziiState({ isOpen: true, queryWord: word })
                                }
                              />
                            );
                          })}

                          {/* Passages in this Mondai */}
                          {(mondai.passageIds || []).map((pid) => {
                            const pg = passageMap.get(pid);
                            if (!pg) return null;
                            return (
                              <ExamPassageCard
                                key={pg.id}
                                passage={pg}
                                startIndex={passageStartMap[pg.id] || 1}
                                answers={result.answers}
                                onChange={() => {}}
                                showResult={true}
                                onOpenMazii={(word) =>
                                  setMaziiState({ isOpen: true, queryWord: word })
                                }
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </section>
                ))}
              </div>

              {/* Sidebar Navigator - Sticky */}
              <div className="hidden lg:block w-80 shrink-0 sticky top-20 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar z-30">
                <div className="text-xs font-extrabold text-gray-700 pb-2.5 mb-2.5 border-b border-gray-100 flex items-center justify-between">
                  <span>Bảng đáp án</span>
                  <span className="text-emerald-600 font-black">
                    {result.correctCount}/{result.totalQuestions} Đúng
                  </span>
                </div>

                <ExamSectionNav
                  examData={exam.data}
                  answers={result.answers}
                  selectedSectionIds={result.selectedSectionIds}
                  currentQuestionId={null}
                  onNavigate={(qid) => {
                    document.getElementById(`question-${qid}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                  onNavigatePassage={(pid) => {
                    document.getElementById(`passage-${pid}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  onNavigateMondai={(mondaiId) => {
                    document.getElementById(`mondai-review-${mondaiId}`)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  resultsMap={resultsMap}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mazii Quick Lookup Modal */}
        <MaziiQuickLookupModal
          isOpen={maziiState.isOpen}
          queryWord={maziiState.queryWord}
          onClose={() => setMaziiState({ isOpen: false, queryWord: "" })}
          onAddToNotebook={(word) => setSelectedWordForNotebook(word)}
        />

        {/* Add to Notebook Modal */}
        {selectedWordForNotebook && (
          <AddToNotebookModal
            selectedWord={{
              id: `exam-${Date.now()}`,
              kanji: selectedWordForNotebook.kanji || selectedWordForNotebook.word || "",
              hiragana: selectedWordForNotebook.hiragana || selectedWordForNotebook.phonetic || selectedWordForNotebook.reading || "",
              meaning: selectedWordForNotebook.meaning || selectedWordForNotebook.vietnamese || "",
            }}
            onClose={() => setSelectedWordForNotebook(null)}
            onSuccess={() => {
              setSelectedWordForNotebook(null);
              setSaveSuccessMsg("Đã thêm từ vào sổ tay thành công!");
              setTimeout(() => setSaveSuccessMsg(null), 3000);
            }}
          />
        )}

        {/* Save success toast */}
        {saveSuccessMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
            <span>✓</span>
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
