"use client";

import React, { useEffect, useState, useRef, useCallback, use, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import {
  getExamById,
  getExamProgress,
  saveExamProgress,
  clearExamProgress,
  saveExamResult,
  generateExamId,
} from "@/lib/examStorage";
import { StoredExam, ExamResult, SectionResult, ExamMajorSection, MondaiResult } from "@/types/exam";
import ExamTimer from "@/components/exam/ExamTimer";
import ExamQuestionCard from "@/components/exam/ExamQuestionCard";
import ExamPassageCard from "@/components/exam/ExamPassageCard";
import ExamSectionNav from "@/components/exam/ExamSectionNav";
import MaziiQuickLookupModal from "@/components/MaziiQuickLookupModal";
import SelectionLookupTooltip from "@/components/SelectionLookupTooltip";
import ExamStructureModal from "@/components/exam/ExamStructureModal";
import ExamSectionSelectionModal from "@/components/exam/ExamSectionSelectionModal";
import AddToNotebookModal from "@/components/AddToNotebookModal";
import { getStructuredMajorSections } from "@/lib/examUtils";

interface Props {
  params: Promise<{ id: string }>;
}

function ExamTakingPageContent({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSections = searchParams.get("sections");

  const [exam, setExam] = useState<StoredExam | null>(null);
  const [answers, setAnswers] = useState<Record<number, number[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentQId, setCurrentQId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showStructureModal, setShowStructureModal] = useState<boolean>(false);
  const [showSelectionModal, setShowSelectionModal] = useState<boolean>(false);
  const [selectedMajorTab, setSelectedMajorTab] = useState<string>("all");
  const [isRestoredDraft, setIsRestoredDraft] = useState<boolean>(false);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
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

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const timeRef = useRef(timeRemaining);
  timeRef.current = timeRemaining;
  const isLeavingRef = useRef<boolean>(false);
  const selectedSectionIdsRef = useRef(selectedSectionIds);
  selectedSectionIdsRef.current = selectedSectionIds;

  // Load exam and progress
  useEffect(() => {
    const loaded = getExamById(id);
    if (!loaded) {
      router.push("/exam");
      return;
    }
    setExam(loaded);

    const sections = getStructuredMajorSections(loaded.data);
    const savedProgress = getExamProgress(id);
    const urlSectionList = urlSections ? urlSections.split(",").filter(Boolean) : null;

    if (
      savedProgress &&
      (Object.keys(savedProgress.answers || {}).length > 0 ||
        (savedProgress.timeRemaining > 0 && savedProgress.timeRemaining < loaded.data.meta.timeLimit))
    ) {
      setAnswers(savedProgress.answers || {});
      setTimeRemaining(savedProgress.timeRemaining);
      setIsRestoredDraft(true);
      if (urlSectionList && urlSectionList.length > 0) {
        setSelectedSectionIds(urlSectionList);
      } else if (savedProgress.selectedSectionIds && savedProgress.selectedSectionIds.length > 0) {
        setSelectedSectionIds(savedProgress.selectedSectionIds);
      } else {
        setSelectedSectionIds(sections.map((s) => s.id));
      }
    } else {
      setTimeRemaining(loaded.data.meta.timeLimit);
      if (urlSectionList && urlSectionList.length > 0) {
        setSelectedSectionIds(urlSectionList);
      } else {
        setSelectedSectionIds(sections.map((s) => s.id));
      }
    }
  }, [id, router, urlSections]);

  // Periodic auto-save progress every 10 seconds
  useEffect(() => {
    if (!exam || submitted) return;
    const interval = setInterval(() => {
      saveExamProgress({
        examId: id,
        answers: answersRef.current,
        startedAt: Date.now(),
        timeRemaining: timeRef.current,
        selectedSectionIds: selectedSectionIdsRef.current,
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [exam, id, submitted]);

  // Warn before leaving page if unsubmitted
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitted && !isLeavingRef.current) {
        saveExamProgress({
          examId: id,
          answers: answersRef.current,
          startedAt: Date.now(),
          timeRemaining: timeRef.current,
          selectedSectionIds: selectedSectionIdsRef.current,
        });
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [submitted, id]);

  const handleSaveAndExit = useCallback(() => {
    isLeavingRef.current = true;
    saveExamProgress({
      examId: id,
      answers: answersRef.current,
      startedAt: Date.now(),
      timeRemaining: timeRef.current,
      selectedSectionIds: selectedSectionIdsRef.current,
    });
    alert("✅ Đã lưu tạm bài làm thành công! Bạn có thể quay lại làm bài tiếp bất kỳ lúc nào.");
    router.push("/exam");
  }, [id, router]);

  const handleResetProgress = useCallback(() => {
    if (!exam) return;
    if (confirm("Bạn có chắc chắn muốn làm lại từ đầu? Mọi câu trả lời đã lưu tạm sẽ bị xóa.")) {
      clearExamProgress(id);
      setAnswers({});
      answersRef.current = {};
      setTimeRemaining(exam.data.meta.timeLimit);
      timeRef.current = exam.data.meta.timeLimit;
      setIsRestoredDraft(false);
    }
  }, [exam, id]);

  // Track currently visible question on scroll
  useEffect(() => {
    if (!exam) return;
    const observers: IntersectionObserver[] = [];
    const trackQ = (qid: number) => {
      const el = document.getElementById(`question-${qid}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setCurrentQId(qid);
        },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    };

    exam.data.questions.forEach((q) => trackQ(q.id));
    (exam.data.passages || []).forEach((p) =>
      p.questions.forEach((q) => trackQ(q.id))
    );

    return () => observers.forEach((o) => o.disconnect());
  }, [exam]);

  const handleAnswerChange = useCallback((qid: number, selected: number[]) => {
    setAnswers((prev) => {
      const next = { ...prev, [qid]: selected };
      answersRef.current = next;
      // Auto-save immediately on answer change
      saveExamProgress({
        examId: id,
        answers: next,
        startedAt: Date.now(),
        timeRemaining: timeRef.current,
      });
      return next;
    });
  }, [id]);

  const navigateToQuestion = (qid: number) => {
    setIsDrawerOpen(false);
    setCurrentQId(qid);
    setTimeout(() => {
      document.getElementById(`question-${qid}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 80);
  };

  const navigateToPassage = (pid: string) => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      document.getElementById(`passage-${pid}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const navigateToMondai = (mondaiId: string) => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      document.getElementById(`mondai-block-${mondaiId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const toggleSection = (secId: string) => {
    setSelectedSectionIds((prev) => {
      if (prev.includes(secId)) {
        if (prev.length <= 1) {
          alert("Bạn cần chọn ít nhất 1 phần thi để làm bài.");
          return prev;
        }
        return prev.filter((id) => id !== secId);
      } else {
        return [...prev, secId];
      }
    });
  };

  const selectAllSections = () => {
    setSelectedSectionIds(majorSections.map((m) => m.id));
  };

  const majorSections = useMemo<ExamMajorSection[]>(() => {
    if (!exam) return [];
    return getStructuredMajorSections(exam.data);
  }, [exam]);

  const handleSubmit = useCallback(
    (force = false) => {
      if (!exam) return;

      const currentAnswers = answersRef.current;
      const currentSelectedIds = selectedSectionIdsRef.current;
      const activeMajorSections = majorSections.filter((m) =>
        currentSelectedIds.length > 0 ? currentSelectedIds.includes(m.id) : true
      );

      let totalCorrect = 0;
      let totalQuestionsCount = 0;

      const sectionResults: SectionResult[] = activeMajorSections.map((major) => {
        let correct = 0;
        let total = 0;
        const mondaiResults: MondaiResult[] = [];

        major.mondais.forEach((m) => {
          let mCorrect = 0;
          let mTotal = 0;

          (m.questionIds || []).forEach((qid) => {
            const q = exam.data.questions.find((x) => x.id === qid);
            if (!q) return;
            total++;
            mTotal++;
            const userAns = currentAnswers[qid] || [];
            if (
              userAns.length === q.answers.length &&
              userAns.every((a) => q.answers.includes(a))
            ) {
              correct++;
              mCorrect++;
            }
          });

          (m.passageIds || []).forEach((pid) => {
            const pg = (exam.data.passages || []).find((p) => p.id === pid);
            if (!pg) return;
            pg.questions.forEach((q) => {
              total++;
              mTotal++;
              const userAns = currentAnswers[q.id] || [];
              if (
                userAns.length === q.answers.length &&
                userAns.every((a) => q.answers.includes(a))
              ) {
                correct++;
                mCorrect++;
              }
            });
          });

          if (mTotal > 0) {
            mondaiResults.push({
              mondaiTitle: m.title,
              correct: mCorrect,
              total: mTotal,
            });
          }
        });

        totalCorrect += correct;
        totalQuestionsCount += total;
        return {
          name: major.name,
          majorSectionId: major.id,
          correct,
          total,
          score: total > 0 ? Math.round((correct / total) * 60) : 0,
          maxScore: 60,
          mondaiResults,
        };
      });

      const totalQ = totalQuestionsCount;
      const scorePct = totalQ > 0 ? Math.round((totalCorrect / (totalQ || 1)) * 100) : 0;
      const maxPossibleScore = activeMajorSections.length * 60;
      const scaledScore = Math.round((totalCorrect / (totalQ || 1)) * maxPossibleScore);
      const passThreshold = Math.round((maxPossibleScore / 180) * (exam.data.meta.passMark || 90));
      const passed = scaledScore >= passThreshold;

      setSubmitted(true);
      clearExamProgress(id);

      const result: ExamResult = {
        id: generateExamId(),
        examId: id,
        examTitle: exam.data.meta.title,
        subject: exam.data.meta.subject,
        level: exam.data.meta.level,
        finishedAt: new Date().toISOString(),
        totalQuestions: totalQ,
        correctCount: totalCorrect,
        sectionResults,
        answers: currentAnswers,
        timeTaken: exam.data.meta.timeLimit - timeRef.current,
        passed,
        scorePercentage: scorePct,
        selectedSectionIds: currentSelectedIds,
        maxScore: maxPossibleScore,
        scaledScore,
      };

      saveExamResult(result);
      router.push(`/exam/result/${result.id}`);
    },
    [exam, id, router, majorSections]
  );

  const filteredMajorSections = useMemo(() => {
    return majorSections.filter((major) => {
      const isSelected = selectedSectionIds.length === 0 || selectedSectionIds.includes(major.id);
      if (!isSelected) return false;
      if (selectedMajorTab !== "all" && major.id !== selectedMajorTab) return false;
      return true;
    });
  }, [majorSections, selectedSectionIds, selectedMajorTab]);

  const activeQIds = useMemo(() => {
    const set = new Set<number>();
    const activeMajors = majorSections.filter(
      (m) => selectedSectionIds.length === 0 || selectedSectionIds.includes(m.id)
    );
    activeMajors.forEach((major) => {
      major.mondais.forEach((m) => {
        (m.questionIds || []).forEach((qid) => set.add(qid));
        (m.passageIds || []).forEach((pid) => {
          const pg = (exam?.data.passages || []).find((p) => p.id === pid);
          pg?.questions.forEach((q) => set.add(q.id));
        });
      });
    });
    return set;
  }, [selectedSectionIds, majorSections, exam]);

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Đang chuẩn bị đề thi...</p>
        </div>
      </div>
    );
  }

  const totalCount = activeQIds.size;
  const answeredCount = Array.from(activeQIds).filter(
    (qid) => answers[qid] && answers[qid].length > 0
  ).length;
  const progressPercent =
    totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // Passage start index lookup
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

  return (
    <AuthGuard featureName="Luyện Thi JLPT">
      <div className="min-h-screen flex flex-col bg-gray-50/50">
        <SelectionLookupTooltip
          onLookup={(text) => setMaziiState({ isOpen: true, queryWord: text })}
        />

        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 shadow-3xs">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <Link
                href="/exam"
                className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                title="Quay lại danh sách đề thi"
              >
                ←
              </Link>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                    JLPT {exam.data.meta.level}
                  </span>
                  <h1 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                    {exam.data.meta.title}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowSelectionModal(true)}
                className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Thay đổi các phần thi muốn làm"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">Chọn phần thi ({selectedSectionIds.length}/{majorSections.length})</span>
                <span className="sm:hidden">Phần thi</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStructureModal(true)}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors items-center gap-1 cursor-pointer"
                title="Xem phân bổ thời gian và mục tiêu từng Mondai"
              >
                <span>📋</span>
                <span>Cấu trúc đề {exam.data.meta.level}</span>
              </button>

              <ExamTimer
                initialSeconds={timeRemaining}
                onTimeUp={() => handleSubmit(true)}
                onTick={(sec) => {
                  timeRef.current = sec;
                  setTimeRemaining(sec);
                }}
              />

              <button
                type="button"
                onClick={handleSaveAndExit}
                className="px-3 sm:px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                title="Lưu tạm tiến độ bài làm và thoát ra ngoài"
              >
                <span>💾</span>
                <span className="hidden sm:inline">Lưu & Tạm dừng</span>
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-3 sm:px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>📤</span>
                <span className="hidden sm:inline">Nộp bài thi</span>
              </button>

              {/* Mobile Drawer Toggle */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="md:hidden px-2.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-black cursor-pointer flex items-center gap-1"
              >
                <span>📑</span>
                <span>{answeredCount}/{totalCount}</span>
              </button>
            </div>
          </div>

          {/* Major Sections Active Display Bar */}
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                <span>📋</span>
                <span>Phần thi làm:</span>
              </span>
              {(selectedSectionIds.length === 0 ? majorSections : majorSections.filter((m) => selectedSectionIds.includes(m.id))).map((major) => (
                <div
                  key={major.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-800 shadow-3xs"
                >
                  <span className="text-indigo-600 font-black">✓</span>
                  <span>{major.icon}</span>
                  <span>{major.name}</span>
                </div>
              ))}

              {selectedSectionIds.length < majorSections.length && (
                <button
                  type="button"
                  onClick={() => setShowSelectionModal(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-gray-100 border border-dashed border-gray-300 text-gray-600 hover:bg-gray-200 hover:border-gray-400 transition-all cursor-pointer"
                  title="Thay đổi hoặc chọn thêm phần thi"
                >
                  <span>⚙️</span>
                  <span>Thay đổi / Thêm phần thi</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 self-end sm:self-auto shrink-0">
              <span>
                Đang làm: <strong className="text-indigo-600">{selectedSectionIds.length}/{majorSections.length}</strong> phần (<strong>{totalCount}</strong> câu)
              </span>
              {selectedSectionIds.length < majorSections.length && (
                <button
                  type="button"
                  onClick={selectAllSections}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  Làm tất cả các phần
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Restored Draft Banner */}
        {isRestoredDraft && (
          <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-4 lg:px-6 pt-3">
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">✨</span>
                <div>
                  <span className="text-amber-900 font-extrabold block sm:inline">
                    Đã tự động khôi phục bài làm dang dở của bạn!
                  </span>{" "}
                  <span className="text-amber-700">
                    (Đã làm <strong>{answeredCount}/{totalCount}</strong> câu • Thời gian còn lại: <strong>{Math.floor(timeRemaining / 60)} phút {timeRemaining % 60} giây</strong>)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="px-3 py-1.5 bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                >
                  🔄 Làm lại từ đầu
                </button>
                <button
                  type="button"
                  onClick={() => setIsRestoredDraft(false)}
                  className="text-amber-600 hover:text-amber-800 p-1.5 text-xs font-bold"
                  title="Đóng thông báo"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-4 lg:px-5 py-3 sm:py-4 flex gap-4 lg:gap-5 items-start">
          {/* Questions Stream grouped by Major Section & Mondai */}
          <main className="flex-1 min-w-0 space-y-4 sm:space-y-5">
            {filteredMajorSections.map((major) => (
              <section
                key={major.id}
                id={`major-section-${major.id}`}
                className="space-y-3 sm:space-y-4 scroll-mt-28"
              >
                {/* Major Section Banner Header */}
                <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-3.5 sm:p-4 text-white shadow-md flex items-center justify-between">
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
                  <span className="text-xs font-bold bg-white/15 px-2.5 py-1 rounded-full border border-white/20">
                    {major.mondais.length} Mondai
                  </span>
                </div>

                {/* Mondai Blocks */}
                {major.mondais.map((mondai) => (
                  <div
                    key={mondai.id}
                    id={`mondai-block-${mondai.id}`}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-xs space-y-3.5 scroll-mt-24"
                  >
                    {/* Mondai Header Card */}
                    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span>{mondai.title}</span>
                        </span>
                        <span className="text-[11px] font-bold text-indigo-600 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200/60 shadow-3xs">
                          {(mondai.questionIds?.length || 0) +
                            (mondai.passageIds?.reduce(
                              (acc, pid) => acc + (passageMap.get(pid)?.questions?.length || 0),
                              0
                            ) || 0)}{" "}
                          câu hỏi
                        </span>
                      </div>

                      {mondai.instruction && (
                        <p className="text-xs font-medium text-gray-700 leading-relaxed pt-1 border-t border-indigo-100/60 select-text">
                          {mondai.instruction}
                        </p>
                      )}
                    </div>

                    {/* Questions in this Mondai */}
                    <div className="space-y-4 pt-1">
                      {(mondai.questionIds || []).map((qid) => {
                        const q = questionMap.get(qid);
                        if (!q) return null;
                        const qIndex = exam.data.questions.findIndex((x) => x.id === qid) + 1;
                        return (
                          <ExamQuestionCard
                            key={q.id}
                            question={q}
                            index={qIndex}
                            isFocused={currentQId === q.id}
                            selected={answers[q.id] || []}
                            onChange={handleAnswerChange}
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
                            answers={answers}
                            onChange={handleAnswerChange}
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

            {/* Bottom Submit Banner */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center mt-8 space-y-3">
              <div className="text-2xl">📝</div>
              <h3 className="text-base font-extrabold text-gray-900">
                Bạn đã hoàn thành {answeredCount}/{totalCount} câu hỏi
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Kiểm tra lại các câu hỏi chưa làm trong danh sách Mondai trước khi nhấn nộp bài.
              </p>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-98"
              >
                <span>📤 Nộp Bài Thi & Xem Kết Quả →</span>
              </button>
            </div>
          </main>

          {/* Desktop Right Sidebar (Hierarchical Navigation Palette - Sticky) */}
          <aside className="hidden md:flex w-72 lg:w-80 shrink-0 flex-col sticky top-24 lg:top-28 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-200/80 shadow-xs max-h-[calc(100vh-7.5rem)] overflow-hidden z-30">
            {/* Progress Bar */}
            <div className="pb-3 sm:pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between text-xs font-extrabold mb-1.5">
                <span className="text-gray-500">Tiến độ bài thi</span>
                <span className="text-indigo-600">
                  {answeredCount}/{totalCount} ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Hierarchical Question Navigation Palette */}
            <div className="flex-1 overflow-y-auto pt-3 pr-1 space-y-4 custom-scrollbar">
              <ExamSectionNav
                examData={exam.data}
                answers={answers}
                currentQuestionId={currentQId}
                onNavigate={navigateToQuestion}
                onNavigatePassage={navigateToPassage}
                onNavigateMondai={navigateToMondai}
                selectedSectionIds={selectedSectionIds}
              />
            </div>
          </aside>
        </div>

        {/* Mobile Question Palette Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in">
            <div className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col p-5 shadow-2xl animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="font-extrabold text-sm text-gray-900">
                  Danh sách câu hỏi ({answeredCount}/{totalCount})
                </span>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-gray-400 font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                <ExamSectionNav
                  examData={exam.data}
                  answers={answers}
                  currentQuestionId={currentQId}
                  onNavigate={navigateToQuestion}
                  onNavigatePassage={navigateToPassage}
                  onNavigateMondai={navigateToMondai}
                  selectedSectionIds={selectedSectionIds}
                />
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-4 shadow-sm">
                📤
              </div>
              <h3 className="text-lg font-black text-gray-900">
                Xác nhận nộp bài thi?
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Bạn đã hoàn thành{" "}
                <strong className="text-indigo-600">
                  {answeredCount}/{totalCount}
                </strong>{" "}
                câu hỏi.
                {totalCount - answeredCount > 0 && (
                  <span className="block text-rose-600 font-bold mt-1">
                    ⚠️ Còn {totalCount - answeredCount} câu chưa chọn đáp án!
                  </span>
                )}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSubmit(true);
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  Nộp bài ngay →
                </button>
              </div>
            </div>
          </div>
        )}

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
              setSaveSuccessMsg("Đã thêm từ vựng vào sổ tay thành công!");
              setTimeout(() => setSaveSuccessMsg(null), 3000);
            }}
          />
        )}

        {/* Success Toast */}
        {saveSuccessMsg && (
          <div className="fixed bottom-5 right-5 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl z-50 animate-bounce flex items-center gap-1.5">
            <span>✓</span>
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Structure Modal */}
        <ExamStructureModal
          isOpen={showStructureModal}
          onClose={() => setShowStructureModal(false)}
          initialLevel={exam.data.meta.level}
        />

        {/* Section Selection Modal */}
        <ExamSectionSelectionModal
          isOpen={showSelectionModal}
          onClose={() => setShowSelectionModal(false)}
          exam={exam}
          initialSelectedIds={selectedSectionIds}
          hasDraft={isRestoredDraft}
          onConfirm={(newSelectedIds) => {
            setSelectedSectionIds(newSelectedIds);
            setShowSelectionModal(false);
            saveExamProgress({
              examId: id,
              answers: answersRef.current,
              startedAt: Date.now(),
              timeRemaining: timeRef.current,
              selectedSectionIds: newSelectedIds,
            });
          }}
        />
      </div>
    </AuthGuard>
  );
}

export default function ExamTakingPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-gray-500">Đang chuẩn bị đề thi...</p>
          </div>
        </div>
      }
    >
      <ExamTakingPageContent {...props} />
    </Suspense>
  );
}
