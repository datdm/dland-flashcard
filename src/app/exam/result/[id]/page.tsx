"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { getResultById, getExamById } from "@/lib/examStorage";
import { ExamResult, StoredExam } from "@/types/exam";
import ExamQuestionCard from "@/components/exam/ExamQuestionCard";
import ExamPassageCard from "@/components/exam/ExamPassageCard";
import ExamSectionNav from "@/components/exam/ExamSectionNav";
import MaziiQuickLookupModal from "@/components/MaziiQuickLookupModal";
import SelectionLookupTooltip from "@/components/SelectionLookupTooltip";

interface Props {
  params: Promise<{ id: string }>;
}

export default function ExamResultPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [exam, setExam] = useState<StoredExam | null>(null);
  const [showFullReview, setShowFullReview] = useState<boolean>(true);

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

  const scaledScore = Math.round((result.correctCount / result.totalQuestions) * 180);

  return (
    <AuthGuard featureName="Kết Quả Thi JLPT">
      <div className="min-h-screen bg-gray-50/60 pb-28">
        <SelectionLookupTooltip
          onLookup={(text) => setMaziiState({ isOpen: true, queryWord: text })}
        />

        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-3xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
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

        <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Main Score Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl text-center relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-extrabold border border-indigo-100">
                JLPT {result.level}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(result.finishedAt).toLocaleDateString("vi-VN")} {new Date(result.finishedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-1 max-w-xl mx-auto">
              {result.examTitle}
            </h1>

            {/* Score Ring / Badge */}
            <div className="my-6 inline-flex flex-col items-center justify-center">
              <div
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-8 shadow-inner ${
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

            <div className="flex items-center justify-center gap-3 flex-wrap mb-4">
              <span
                className={`px-5 py-2 rounded-2xl text-sm font-black tracking-wide shadow-sm flex items-center gap-2 ${
                  result.passed
                    ? "bg-emerald-600 text-white shadow-emerald-200"
                    : "bg-rose-600 text-white shadow-rose-200"
                }`}
              >
                <span>{result.passed ? "🎉" : "⚠️"}</span>
                <span>{result.passed ? "KẾT QUẢ: ĐẠT (PASS)" : "KẾT QUẢ: CHƯA ĐẠT (FAIL)"}</span>
              </span>

              <span className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5">
                <span>⏱️</span>
                <span>Thời gian: {formatTime(result.timeTaken)}</span>
              </span>

              <span className="px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-1.5">
                <span>🎯</span>
                <span>Điểm quy đổi: {scaledScore}/180 điểm</span>
              </span>
            </div>
          </div>

          {/* Section Results Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <span>📊</span>
              <span>Chi Tiết Điểm Số Từng Phần Thi</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {result.sectionResults.map((sec, idx) => {
                const secPct = sec.total > 0 ? Math.round((sec.correct / sec.total) * 100) : 0;
                const isSecPassed = secPct >= 32; // JLPT minimum section threshold

                return (
                  <div
                    key={idx}
                    className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="text-gray-800">{sec.name}</span>
                      <span className={isSecPassed ? "text-indigo-600" : "text-rose-600"}>
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
                );
              })}
            </div>
          </div>

          {/* Toggle Review Button */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <span>📝</span>
              <span>Xem Lại Đáp Án & Giải Thích Chi Tiết</span>
            </h2>

            <button
              type="button"
              onClick={() => setShowFullReview((prev) => !prev)}
              className="px-4 py-2 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {showFullReview ? "▲ Thu gọn bài thi" : "▼ Xem toàn bộ câu hỏi"}
            </button>
          </div>

          {/* Full Exam Review Layout */}
          {showFullReview && (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Questions Stream with Answers & Explanations */}
              <div className="flex-1 min-w-0 space-y-4">
                {exam.data.questions.map((q, idx) => (
                  <ExamQuestionCard
                    key={q.id}
                    question={q}
                    index={idx + 1}
                    selected={result.answers[q.id] || []}
                    onChange={() => {}}
                    showResult={true}
                    onOpenMazii={(word) =>
                      setMaziiState({ isOpen: true, queryWord: word })
                    }
                  />
                ))}

                {(exam.data.passages || []).map((pg) => (
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
                ))}
              </div>

              {/* Sidebar Navigator */}
              <div className="hidden lg:block w-72 shrink-0 sticky top-20 bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
                <div className="text-xs font-extrabold text-gray-700 pb-3 mb-3 border-b border-gray-100 flex items-center justify-between">
                  <span>Bảng đáp án</span>
                  <span className="text-emerald-600">
                    {result.correctCount}/{result.totalQuestions} Đúng
                  </span>
                </div>

                <ExamSectionNav
                  sections={exam.data.meta.sections}
                  passages={exam.data.passages}
                  answers={result.answers}
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
        />
      </div>
    </AuthGuard>
  );
}
