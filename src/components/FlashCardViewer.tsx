"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Vocabulary } from "@/types";
import { useProgress } from "@/hooks/useProgress";
import { useFlashCardSettings } from "@/hooks/useFlashCardSettings";
import { shuffle, seededShuffle } from "@/lib/shuffle";
import FlashCard from "./FlashCard";
import FlashCardSettingsPanel from "./FlashCardSettingsPanel";

interface FlashCardViewerProps {
  vocabulary: Vocabulary[];
  title?: string;
  dailyLimit?: number;
}

interface QuizQuestion {
  vocab: Vocabulary;
  type: "jp_to_vi" | "vi_to_jp";
  questionText: string;
  hintText?: string;
  correctAnswer: string;
  options: string[];
}

export default function FlashCardViewer({ vocabulary, title, dailyLimit }: FlashCardViewerProps) {
  const { progress, getVocabProgress, toggleLearned, toggleFavorite } = useProgress();
  const { settings, saveSettings } = useFlashCardSettings();

  const [viewMode, setViewMode] = useState<"flashcard" | "quiz">("flashcard");
  const [deck, setDeck] = useState<Vocabulary[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterUnlearned, setFilterUnlearned] = useState(false);
  const [sessionOffset, setSessionOffset] = useState(0);
  const [originalSessionWords, setOriginalSessionWords] = useState<Vocabulary[]>([]);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // ====================== QUIZ STATE ======================
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [newlyPassedIds, setNewlyPassedIds] = useState<string[]>([]);
  const [incorrectItems, setIncorrectItems] = useState<Vocabulary[]>([]);

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  const buildDeck = useCallback(
    (isShuffled: boolean, unlearnedOnly: boolean) => {
      let list = vocabulary;

      // If dailyLimit is active, we always default to unlearned words only
      if (unlearnedOnly || dailyLimit) {
        list = list.filter((v) => !getVocabProgress(v.id).learned);
      }

      if (dailyLimit) {
        const todayDateStr = new Date().toDateString();
        const learnedTodayCount = Object.values(progress).filter(
          (p) => p.learned && p.learnedAt && new Date(p.learnedAt).toDateString() === todayDateStr
        ).length;

        const remainingLimit = sessionOffset === 0
          ? Math.max(0, dailyLimit - learnedTodayCount)
          : dailyLimit;

        const todayStr = new Date().toISOString().split("T")[0];
        const seedStr = todayStr + (title || "daily") + (sessionOffset > 0 ? `-session-${sessionOffset}` : "");
        list = seededShuffle(list, seedStr).slice(0, remainingLimit);
      }

      return isShuffled ? shuffle(list) : list;
    },
    [vocabulary, getVocabProgress, dailyLimit, title, sessionOffset, progress]
  );

  useEffect(() => {
    const initialDeck = buildDeck(shuffled, filterUnlearned);
    setDeck(initialDeck);
    setOriginalSessionWords(initialDeck);
    setIndex(0);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabulary, sessionOffset]);

  const handleToggleLearned = useCallback((id: string) => {
    const currentProgress = getVocabProgress(id);
    const willBeLearned = !currentProgress.learned;

    toggleLearned(id);

    // If the word was marked as learned, remove it from the current session deck
    if (willBeLearned) {
      setDeck((prevDeck) => {
        const newDeck = prevDeck.filter((v) => v.id !== id);
        // Adjust index if it's now out of bounds
        setIndex((prevIndex) => {
          if (prevIndex >= newDeck.length) {
            return Math.max(0, newDeck.length - 1);
          }
          return prevIndex;
        });
        setFlipped(false);
        return newDeck;
      });
    }
  }, [toggleLearned, getVocabProgress]);

  // Generate 4-choice multiple choice questions from session words
  const generateQuiz = useCallback(() => {
    const baseList = originalSessionWords.length > 0
      ? originalSessionWords
      : deck.length > 0
      ? deck
      : vocabulary;

    if (!baseList || baseList.length === 0) return;

    const questions: QuizQuestion[] = baseList.map((item, idx) => {
      const isJpToVi = idx % 2 === 0;
      const primaryJp = item.kanji || item.hiragana || "";
      const primaryVi = item.meaning || "";

      if (isJpToVi) {
        const correctAnswer = primaryVi;
        const distractors = vocabulary
          .filter((v) => v.id !== item.id && v.meaning && v.meaning !== correctAnswer)
          .map((v) => v.meaning!);
        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        const defaultFallbacks = [
          "Chào buổi sáng",
          "Cảm ơn rất nhiều",
          "Học sinh, sinh viên",
          "Công ty, văn phòng",
          "Thời gian, giờ giấc",
        ];
        while (shuffledDistractors.length < 3) {
          const fallback = defaultFallbacks[shuffledDistractors.length % defaultFallbacks.length];
          if (!shuffledDistractors.includes(fallback) && fallback !== correctAnswer) {
            shuffledDistractors.push(fallback);
          } else {
            shuffledDistractors.push(`Lựa chọn ${shuffledDistractors.length + 2}`);
          }
        }
        const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);
        return {
          vocab: item,
          type: "jp_to_vi",
          questionText: primaryJp,
          hintText: item.hiragana && item.kanji ? item.hiragana : undefined,
          correctAnswer,
          options,
        };
      } else {
        const correctAnswer = primaryJp;
        const distractors = vocabulary
          .filter((v) => v.id !== item.id)
          .map((v) => v.kanji || v.hiragana || "")
          .filter((t) => t && t !== correctAnswer);
        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        const defaultFallbacks = ["ほん", "がくせい", "せんせい", "くるま", "ともだち"];
        while (shuffledDistractors.length < 3) {
          const fallback = defaultFallbacks[shuffledDistractors.length % defaultFallbacks.length];
          if (!shuffledDistractors.includes(fallback) && fallback !== correctAnswer) {
            shuffledDistractors.push(fallback);
          } else {
            shuffledDistractors.push(`Từ vựng ${shuffledDistractors.length + 2}`);
          }
        }
        const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);
        return {
          vocab: item,
          type: "vi_to_jp",
          questionText: primaryVi,
          hintText: "Chọn từ tiếng Nhật tương ứng",
          correctAnswer,
          options,
        };
      }
    });

    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffledQuestions);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setCorrectCount(0);
    setQuizFinished(false);
    setNewlyPassedIds([]);
    setIncorrectItems([]);
  }, [originalSessionWords, deck, vocabulary]);

  const handleStartQuizMode = () => {
    generateQuiz();
    setViewMode("quiz");
  };

  const handleSelectQuizAnswer = (ans: string) => {
    if (isAnswerChecked || quizFinished) return;
    setSelectedAnswer(ans);
    setIsAnswerChecked(true);

    const currentQ = quizQuestions[quizIndex];
    if (!currentQ) return;

    const isCorrect = ans === currentQ.correctAnswer;
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      const jpText = currentQ.vocab.kanji || currentQ.vocab.hiragana;
      if (jpText) speakText(jpText);

      // Auto-mark learned and update streak
      const currentProg = getVocabProgress(currentQ.vocab.id);
      if (!currentProg.learned) {
        toggleLearned(currentQ.vocab.id);
        setNewlyPassedIds((prev) => [...prev, currentQ.vocab.id]);
      }
    } else {
      setIncorrectItems((prev) => [...prev, currentQ.vocab]);
    }
  };

  const handleNextQuizQuestion = () => {
    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      setQuizFinished(true);
    }
  };

  const current = deck[index];

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 80) go(1);
    else if (dx < -80) go(-1);
  };

  const go = (dir: -1 | 1) => {
    setIndex((i) => Math.min(Math.max(0, i + dir), deck.length - 1));
    setFlipped(false);
  };

  const toggleShuffle = () => {
    const next = !shuffled;
    setShuffled(next);
    const newDeck = buildDeck(next, filterUnlearned);
    setDeck(newDeck);
    setIndex(0);
    setFlipped(false);
  };

  const toggleFilter = () => {
    const next = !filterUnlearned;
    setFilterUnlearned(next);
    const newDeck = buildDeck(shuffled, next);
    setDeck(newDeck);
    setIndex(0);
    setFlipped(false);
  };

  if (vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 text-center max-w-xl mx-auto">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">Không có từ vựng nào</h3>
        <p className="text-sm text-gray-500">Danh sách hiện tại đang trống.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-8 space-y-4">
      {/* Sub-Mode Switcher Bar (Flashcard vs Quiz) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex bg-slate-100/80 p-1 rounded-xl text-xs font-bold gap-1 w-full sm:w-auto">
          <button
            onClick={() => setViewMode("flashcard")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              viewMode === "flashcard"
                ? "bg-white text-indigo-700 shadow-xs font-extrabold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>🎴 Thẻ Flashcard</span>
            {deck.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {deck.length}
              </span>
            )}
          </button>

          <button
            onClick={handleStartQuizMode}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              viewMode === "quiz"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-extrabold"
                : "text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70"
            }`}
          >
            <span>🎯 Làm Trắc Nghiệm</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-black">
              {dailyLimit ? `${originalSessionWords.length || deck.length} từ` : "Quiz"}
            </span>
          </button>
        </div>

        {dailyLimit ? (
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              ⚡ Mục tiêu 50 từ mỗi ngày
            </span>
          </div>
        ) : (
          title && (
            <div className="text-xs text-gray-400 font-medium truncate max-w-[200px] hidden sm:block">
              {title}
            </div>
          )
        )}
      </div>

      {/* ============================================================ */}
      {/* 1. FLASHCARD MODE */}
      {/* ============================================================ */}
      {viewMode === "flashcard" && (
        <>
          {deck.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 text-center max-w-xl mx-auto">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-extrabold text-gray-900 text-xl mb-2">Hoàn thành mục tiêu!</h3>
              <p className="text-sm text-gray-500 mb-6">
                {dailyLimit
                  ? "Bạn đã hoàn thành việc ôn tập 50 từ vựng của phiên học này."
                  : "Tất cả từ vựng đã được học thuộc."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                {dailyLimit ? (
                  <>
                    <button
                      onClick={() => {
                        setDeck(originalSessionWords);
                        setIndex(0);
                        setFlipped(false);
                      }}
                      className="px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm shadow-xs hover:bg-gray-50 transition-colors"
                    >
                      🔄 Ôn lại 50 từ vừa học
                    </button>

                    <button
                      onClick={handleStartQuizMode}
                      className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-sm shadow-md hover:opacity-95 transition-opacity"
                    >
                      🎯 Làm trắc nghiệm 50 từ này
                    </button>

                    <button
                      onClick={() => {
                        setSessionOffset((prev) => prev + 1);
                      }}
                      className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors"
                    >
                      ⏭️ Luyện tiếp 50 từ mới
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleStartQuizMode}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors"
                    >
                      🎯 Làm trắc nghiệm ôn tập
                    </button>
                    <button
                      onClick={toggleFilter}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors"
                    >
                      Ôn tập lại tất cả
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Header Banner */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {dailyLimit ? "Mục tiêu 50 từ mỗi ngày" : "Phiên ôn tập"}
                    </span>
                  </div>
                  {title && <h1 className="text-xl font-bold text-gray-900 truncate" title={title}>{title}</h1>}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={toggleFilter}
                    title="Lọc chưa học"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      filterUnlearned
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span>{filterUnlearned ? "🎯 Chưa học" : "⭕ Tất cả"}</span>
                  </button>
                  <button
                    onClick={toggleShuffle}
                    title="Trộn ngẫu nhiên"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      shuffled
                        ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <span>🔀 Trộn</span>
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    title="Cài đặt"
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              {/* Progress Section */}
              <div className="px-2">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {dailyLimit ? "Mục tiêu 50 từ" : "Tiến độ"}
                    </span>
                    {dailyLimit && deck.length > 0 && (
                      <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                        Thẻ {index + 1} / {deck.length}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-indigo-600">
                    {dailyLimit
                      ? `${originalSessionWords.length > 0 ? Math.max(0, originalSessionWords.length - deck.length) : 0} / ${originalSessionWords.length || dailyLimit} từ (còn ${deck.length} từ)`
                      : `${index + 1} / ${deck.length}`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${
                        dailyLimit
                          ? (originalSessionWords.length > 0
                              ? ((originalSessionWords.length - deck.length) / originalSessionWords.length) * 100
                              : 0)
                          : deck.length > 0
                          ? ((index + 1) / deck.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Card — with swipe support */}
              <div className="relative z-10 px-2 sm:px-0">
                {current && (
                  <div
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    className="touch-pan-y select-none"
                  >
                    <FlashCard
                      vocab={current}
                      frontSettings={settings.front}
                      backSettings={settings.back}
                      flipped={flipped}
                      onClick={() => setFlipped((f) => !f)}
                    />
                    <div className="text-center mt-3 hidden sm:block">
                      <span className="text-xs font-semibold text-gray-400">Nhấp vào thẻ hoặc vuốt để lật</span>
                    </div>
                    <div className="text-center mt-3 sm:hidden">
                      <span className="text-xs font-semibold text-gray-400">Vuốt trái/phải để chuyển • Chạm để lật</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons & Navigation */}
              <div className="flex flex-col gap-4 px-2 sm:px-0">
                {/* State Toggles */}
                {current && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => toggleFavorite(current.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                        getVocabProgress(current.id).favorite
                          ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                          : "bg-white border-gray-100 text-gray-500 hover:border-yellow-200 hover:bg-yellow-50/50"
                      }`}
                    >
                      <span className="text-xl leading-none">{getVocabProgress(current.id).favorite ? "⭐" : "☆"}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {getVocabProgress(current.id).favorite ? "Yêu thích" : "Đánh dấu"}
                      </span>
                    </button>
                    <button
                      onClick={() => handleToggleLearned(current.id)}
                      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                        getVocabProgress(current.id).learned
                          ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                          : "bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50"
                      }`}
                    >
                      <span className="text-xl leading-none">{getVocabProgress(current.id).learned ? "✅" : "⭕"}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        {getVocabProgress(current.id).learned ? "Đã học" : "Chưa học"}
                      </span>
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3 mt-2">
                  <button
                    onClick={() => go(-1)}
                    disabled={index === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 disabled:bg-gray-50 hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-sm shadow-xs"
                  >
                    <span>←</span>
                    <span>Quay lại</span>
                  </button>

                  <button
                    onClick={() => {
                      setIndex(0);
                      setFlipped(false);
                    }}
                    className="p-3.5 sm:p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-xs"
                    title="Bắt đầu lại"
                  >
                    🔄
                  </button>

                  <button
                    onClick={() => go(1)}
                    disabled={index === deck.length - 1}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-2xl bg-indigo-600 border border-transparent text-white disabled:opacity-40 disabled:bg-gray-300 disabled:border-transparent hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm"
                  >
                    <span>Tiếp theo</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Quick Switch to Quiz banner */}
                <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between gap-3 mt-2">
                  <div className="text-xs text-emerald-950 font-medium">
                    <span>💡 Muốn kiểm tra trí nhớ nhanh?</span>
                    <span className="block text-[11px] text-emerald-700">Làm bài trắc nghiệm 4 đáp án cho các từ vựng này.</span>
                  </div>
                  <button
                    onClick={handleStartQuizMode}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
                  >
                    🎯 Làm Trắc Nghiệm
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 2. QUIZ PASS MODE */}
      {/* ============================================================ */}
      {viewMode === "quiz" && (
        <div className="w-full space-y-4">
          {!quizFinished ? (
            quizQuestions[quizIndex] && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                {/* Quiz Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Câu {quizIndex + 1} / {quizQuestions.length}
                    </span>
                    <span className="ml-2 text-xs text-emerald-600 font-bold">
                      Đúng: {correctCount}
                    </span>
                  </div>

                  <button
                    onClick={() => setViewMode("flashcard")}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Quay lại Thẻ
                  </button>
                </div>

                {/* Quiz Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden -mt-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${quizQuestions.length > 0 ? ((quizIndex + 1) / quizQuestions.length) * 100 : 0}%` }}
                  />
                </div>

                {/* Question Box */}
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-gray-400 font-medium">
                    {quizQuestions[quizIndex].type === "jp_to_vi"
                      ? "Chọn NGHĨA TIẾNG VIỆT chính xác của từ sau:"
                      : "Chọn TỪ TIẾNG NHẬT mang ý nghĩa sau:"}
                  </p>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                    {quizQuestions[quizIndex].questionText}
                  </div>
                  {quizQuestions[quizIndex].hintText && (
                    <p className="text-sm font-bold text-indigo-600 font-mono">
                      {quizQuestions[quizIndex].hintText}
                    </p>
                  )}
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 gap-2.5">
                  {quizQuestions[quizIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = opt === quizQuestions[quizIndex].correctAnswer;

                    let btnStyle = "border-gray-200 bg-white text-gray-800 hover:bg-emerald-50/50 hover:border-emerald-200";

                    if (isAnswerChecked) {
                      if (isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                      } else if (isSelected) {
                        btnStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-300";
                      } else {
                        btnStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        disabled={isAnswerChecked}
                        onClick={() => handleSelectQuizAnswer(opt)}
                        className={`p-4 rounded-2xl border text-left text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-black/5 flex items-center justify-center font-bold text-xs shrink-0">
                            {["A", "B", "C", "D"][optIdx] || optIdx + 1}
                          </span>
                          <span className="font-semibold text-sm sm:text-base">{opt}</span>
                        </div>
                        {isAnswerChecked && isCorrect && (
                          <span className="text-emerald-600 font-bold text-sm shrink-0">✓ Đúng</span>
                        )}
                        {isAnswerChecked && isSelected && !isCorrect && (
                          <span className="text-rose-600 font-bold text-sm shrink-0">✕ Sai</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback & Next Button */}
                {isAnswerChecked && (
                  <div className="pt-2 space-y-3 animate-fadeIn">
                    {selectedAnswer === quizQuestions[quizIndex].correctAnswer ? (
                      <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                        <span className="font-extrabold flex items-center gap-1.5">
                          🎉 Chính xác! Đã đánh dấu thuộc từ này.
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                          ✓ Đã ghi nhận
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-900 space-y-1">
                        <div className="font-extrabold">Chưa chính xác!</div>
                        <div>
                          Đáp án đúng là:{" "}
                          <strong className="text-emerald-700 underline font-bold">
                            {quizQuestions[quizIndex].correctAnswer}
                          </strong>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleNextQuizQuestion}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-sm rounded-2xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      {quizIndex + 1 < quizQuestions.length ? (
                        <span>Câu tiếp theo →</span>
                      ) : (
                        <span>Xem kết quả bài trắc nghiệm 🏆</span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          ) : (
            /* Quiz Completed Summary Screen */
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-md text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-4xl shadow-md">
                🏆
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">
                  Hoàn Thành Bài Trắc Nghiệm!
                </h3>
                <p className="text-sm text-gray-600">
                  Bạn đã trả lời đúng{" "}
                  <span className="font-black text-emerald-600 text-base">
                    {correctCount} / {quizQuestions.length}
                  </span>{" "}
                  câu hỏi.
                </p>
              </div>

              {/* Passed notice */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                {newlyPassedIds.length > 0 ? (
                  <span>
                    🌟 Chúc mừng! Bạn vừa <strong>học thuộc thêm {newlyPassedIds.length} từ vựng mới</strong> trong bài trắc nghiệm này!
                  </span>
                ) : (
                  <span>
                    Tiến độ ôn tập hàng ngày đã được đồng bộ thành công vào hệ thống.
                  </span>
                )}
              </div>

              {/* Incorrect Review */}
              {incorrectItems.length > 0 && (
                <div className="text-left space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-rose-700">
                    ⚠️ Các từ cần ôn lại ({incorrectItems.length}):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {incorrectItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between"
                      >
                        <span className="font-bold text-gray-900">
                          {item.kanji || item.hiragana}
                        </span>
                        <span className="text-gray-500 truncate max-w-[50%]">
                          {item.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={handleStartQuizMode}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-xs text-xs hover:opacity-95 transition-all"
                >
                  🔄 Làm lại trắc nghiệm
                </button>

                <button
                  onClick={() => setViewMode("flashcard")}
                  className="flex-1 py-3 px-4 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold rounded-2xl text-xs hover:bg-indigo-100 transition-all"
                >
                  🎴 Xem Thẻ Flashcard
                </button>

                {dailyLimit && (
                  <button
                    onClick={() => {
                      setSessionOffset((prev) => prev + 1);
                      setViewMode("flashcard");
                    }}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-2xl text-xs hover:bg-indigo-700 transition-all shadow-xs"
                  >
                    ⏭️ Luyện tiếp 50 từ mới
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <FlashCardSettingsPanel
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
