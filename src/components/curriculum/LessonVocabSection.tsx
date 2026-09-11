"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Vocabulary, VocabProgress, WORD_TYPE_STYLES, WordType } from "@/types";
import VocabularyListItem from "@/components/VocabularyListItem";

interface Props {
  vocabulary: Vocabulary[];
  getVocabProgress: (id: string) => VocabProgress;
  toggleLearned: (id: string) => void;
  toggleFavorite: (id: string) => void;
  updateProgress: (id: string, patch: Partial<VocabProgress>) => void;
  langCode?: string;
}

interface QuizQuestion {
  vocab: Vocabulary;
  type: "jp_to_vi" | "vi_to_jp";
  questionText: string;
  hintText?: string;
  correctAnswer: string;
  options: string[];
}

export default function LessonVocabSection({
  vocabulary,
  getVocabProgress,
  toggleLearned,
  toggleFavorite,
  updateProgress,
  langCode = "ja",
}: Props) {
  const [mode, setMode] = useState<"list" | "study" | "quiz">("list");
  const [searchQuery, setSearchQuery] = useState("");

  // ====================== STUDY MODE STATES ======================
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyList, setStudyList] = useState<Vocabulary[]>(vocabulary);

  useEffect(() => {
    setStudyList(vocabulary);
    setStudyIndex(0);
    setIsFlipped(false);
  }, [vocabulary]);

  const handleShuffleStudy = () => {
    const shuffled = [...studyList].sort(() => Math.random() - 0.5);
    setStudyList(shuffled);
    setStudyIndex(0);
    setIsFlipped(false);
  };

  const currentStudyItem = studyList[studyIndex] || null;

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === "de" ? "de-DE" : langCode === "en" ? "en-US" : "ja-JP";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // ====================== QUIZ MODE STATES ======================
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [newlyPassedIds, setNewlyPassedIds] = useState<string[]>([]);
  const [incorrectItems, setIncorrectItems] = useState<Vocabulary[]>([]);

  // Function to generate 4-choice questions
  const generateQuiz = useCallback(() => {
    if (!vocabulary || vocabulary.length === 0) return;

    const questions: QuizQuestion[] = vocabulary.map((item, index) => {
      // Alternate question styles
      const isJpToVi = index % 2 === 0;
      const primaryJp = item.kanji || item.hiragana || "";
      const primaryVi = item.meaning || "";

      if (isJpToVi) {
        // Japanese -> Vietnamese meaning
        const correctAnswer = primaryVi;
        // Distractors
        const distractors = vocabulary
          .filter((v) => v.id !== item.id && v.meaning && v.meaning !== correctAnswer)
          .map((v) => v.meaning!);

        // Shuffle and pick 3
        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        
        // Fallback distractors if less than 4 words
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
        // Vietnamese meaning -> Japanese
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

    // Shuffle questions order
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffledQuestions);
    setQuizIndex(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setCorrectCount(0);
    setQuizFinished(false);
    setNewlyPassedIds([]);
    setIncorrectItems([]);
  }, [vocabulary]);

  const handleStartQuiz = () => {
    generateQuiz();
    setMode("quiz");
  };

  const handleSelectAnswer = (ans: string) => {
    if (isAnswerChecked || quizFinished) return;

    setSelectedAnswer(ans);
    setIsAnswerChecked(true);

    const currentQ = quizQuestions[quizIndex];
    if (!currentQ) return;

    const isCorrect = ans === currentQ.correctAnswer;

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
      // Speak the Japanese word on correct
      const jpText = currentQ.vocab.kanji || currentQ.vocab.hiragana;
      if (jpText) speakText(jpText);

      // AUTOMATIC PASS LOGIC: If not already marked learned, pass it immediately!
      const currentProg = getVocabProgress(currentQ.vocab.id);
      if (!currentProg.learned) {
        updateProgress(currentQ.vocab.id, {
          learned: true,
          learnedAt: new Date().toISOString(),
        });
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

  // Filtered vocabulary for list view
  const filteredVocab = useMemo(() => {
    if (!searchQuery.trim()) return vocabulary;
    const q = searchQuery.toLowerCase().trim();
    return vocabulary.filter(
      (v) =>
        v.kanji?.toLowerCase().includes(q) ||
        v.hiragana?.toLowerCase().includes(q) ||
        v.meaning?.toLowerCase().includes(q)
    );
  }, [vocabulary, searchQuery]);

  const totalCount = vocabulary.length;
  const learnedCount = vocabulary.filter((v) => getVocabProgress(v.id).learned).length;
  const percentLearned = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Không có từ vựng nào trong bài học này
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sub-Mode Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex bg-slate-100/80 p-1 rounded-xl text-xs font-bold gap-1 self-start sm:self-auto w-full sm:w-auto">
          <button
            onClick={() => setMode("list")}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "list"
                ? "bg-white text-indigo-700 shadow-xs font-extrabold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>📋 Danh sách</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setStudyIndex(0);
              setIsFlipped(false);
              setMode("study");
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "study"
                ? "bg-white text-indigo-700 shadow-xs font-extrabold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span>🎴 Chế độ học Thẻ</span>
          </button>

          <button
            onClick={handleStartQuiz}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === "quiz"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-extrabold"
                : "text-emerald-700 bg-emerald-50/70 hover:bg-emerald-100/70"
            }`}
          >
            <span>🎯 Làm trắc nghiệm Pass</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-black">
              {learnedCount}/{totalCount}
            </span>
          </button>
        </div>

        {/* Progress Tracker Snippet */}
        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-gray-400 font-medium">Đã Pass:</span>
          <span className="font-extrabold text-emerald-600">
            {learnedCount}/{totalCount} ({percentLearned}%)
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. LIST MODE */}
      {/* ============================================================ */}
      {mode === "list" && (
        <div className="space-y-4">
          {/* Quick Action Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 rounded-2xl border border-indigo-100/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
                <span>🚀 Lộ trình bài học từ vựng</span>
                <span className="text-[11px] bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-full">
                  {learnedCount >= totalCount ? "Hoàn thành 100% 🎉" : `Còn ${totalCount - learnedCount} từ chưa Pass`}
                </span>
              </h4>
              <p className="text-xs text-gray-600">
                Hãy lướt qua thẻ học để ghi nhớ, sau đó làm trắc nghiệm để hệ thống tự động ghi nhận <strong>Pass</strong> từ vựng nhé!
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setStudyIndex(0);
                  setIsFlipped(false);
                  setMode("study");
                }}
                className="flex-1 md:flex-initial px-4 py-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>🎴 Học thẻ</span>
              </button>
              <button
                onClick={handleStartQuiz}
                className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:opacity-95 flex items-center justify-center gap-1.5"
              >
                <span>🎯 Làm trắc nghiệm Pass</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Tìm nhanh từ vựng (Hán tự, Hiragana, Nghĩa tiếng Việt)..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2.5">
            {filteredVocab.map((v) => (
              <VocabularyListItem
                key={v.id}
                vocab={v}
                progress={getVocabProgress(v.id)}
                onToggleLearned={toggleLearned}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. STUDY FLASHCARD MODE */}
      {/* ============================================================ */}
      {mode === "study" && currentStudyItem && (
        <div className="space-y-4 max-w-2xl mx-auto py-2">
          {/* Study Header Navigation */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <button
              onClick={() => setMode("list")}
              className="text-indigo-600 hover:underline flex items-center gap-1 font-bold"
            >
              ← Trở về danh sách
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShuffleStudy}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all flex items-center gap-1"
                title="Xáo trộn ngẫu nhiên"
              >
                🔀 Xáo thẻ
              </button>
              <span className="font-extrabold text-gray-800">
                Thẻ {studyIndex + 1} / {studyList.length}
              </span>
            </div>
          </div>

          {/* Flashcard Box with Flip */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[320px] bg-white rounded-3xl border-2 border-indigo-100 shadow-md p-6 sm:p-8 flex flex-col justify-between cursor-pointer select-none transition-all hover:border-indigo-300 relative overflow-hidden group"
          >
            {/* Top row: Word type & Audio */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                {currentStudyItem.wordType && (
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                      (WORD_TYPE_STYLES[currentStudyItem.wordType as WordType] || WORD_TYPE_STYLES["Danh từ"]).bg
                    } ${
                      (WORD_TYPE_STYLES[currentStudyItem.wordType as WordType] || WORD_TYPE_STYLES["Danh từ"]).text
                    } ${
                      (WORD_TYPE_STYLES[currentStudyItem.wordType as WordType] || WORD_TYPE_STYLES["Danh từ"]).border
                    }`}
                  >
                    {currentStudyItem.wordType}
                  </span>
                )}
                {getVocabProgress(currentStudyItem.id).learned && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ Đã Pass
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const t = currentStudyItem.kanji || currentStudyItem.hiragana || "";
                  if (t) speakText(t);
                }}
                className="w-10 h-10 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors text-lg"
                title="Nghe phát âm"
              >
                🔊
              </button>
            </div>

            {/* Card Content (Flip toggle) */}
            <div className="my-6 text-center space-y-3 relative z-10">
              {!isFlipped ? (
                <>
                  <div className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                    {currentStudyItem.kanji || currentStudyItem.hiragana}
                  </div>
                  {currentStudyItem.kanji && currentStudyItem.hiragana && (
                    <div className="text-xl sm:text-2xl font-bold text-indigo-600 font-mono">
                      {currentStudyItem.hiragana}
                    </div>
                  )}
                  {currentStudyItem.phonetic && (
                    <div className="text-xs text-gray-400 font-mono">
                      [{currentStudyItem.phonetic}]
                    </div>
                  )}
                  <p className="text-xs text-gray-400 pt-3">
                    👆 Nhấp vào thẻ để xem Nghĩa tiếng Việt
                  </p>
                </>
              ) : (
                <div className="space-y-3 animate-fadeIn">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">
                    Ý Nghĩa
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">
                    {currentStudyItem.meaning}
                  </div>
                  {currentStudyItem.onyomi && (
                    <p className="text-xs text-purple-600 font-semibold">
                      Âm Hán Việt: {currentStudyItem.onyomi}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 pt-3">
                    👆 Nhấp vào thẻ để lật lại tiếng Nhật
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1 font-semibold text-indigo-600">
                ↻ {isFlipped ? "Mặt sau (Nghĩa)" : "Mặt trước (Tiếng Nhật)"}
              </span>
              <span className="text-[11px]">Nhấn thẻ hoặc nút bên dưới</span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => {
                if (studyIndex > 0) {
                  setStudyIndex((prev) => prev - 1);
                  setIsFlipped(false);
                }
              }}
              disabled={studyIndex === 0}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs flex items-center justify-center gap-1"
            >
              ← Thẻ trước
            </button>

            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="py-3 px-4 bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 transition-all text-xs"
            >
              ↻ Lật thẻ
            </button>

            <button
              onClick={() => {
                if (studyIndex < studyList.length - 1) {
                  setStudyIndex((prev) => prev + 1);
                  setIsFlipped(false);
                }
              }}
              disabled={studyIndex === studyList.length - 1}
              className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs flex items-center justify-center gap-1 shadow-xs"
            >
              Thẻ tiếp theo →
            </button>
          </div>

          {/* Quick Mark Actions */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => toggleLearned(currentStudyItem.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                getVocabProgress(currentStudyItem.id).learned
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {getVocabProgress(currentStudyItem.id).learned ? "✓ Đã thuộc (Đã Pass)" : "⭕ Đánh dấu đã thuộc"}
            </button>

            <button
              onClick={() => toggleFavorite(currentStudyItem.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                getVocabProgress(currentStudyItem.id).favorite
                  ? "bg-amber-50 border-amber-300 text-amber-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              ★ {getVocabProgress(currentStudyItem.id).favorite ? "Đã thích" : "Yêu thích"}
            </button>
          </div>

          {/* CTA to Quiz */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center space-y-2 mt-4">
            <p className="text-xs text-emerald-900 font-medium">
              Bạn đã tự tin với các từ vựng này chưa? Hãy làm trắc nghiệm để tự động <strong>Pass</strong> toàn bộ bài học nhé!
            </p>
            <button
              onClick={handleStartQuiz}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all"
            >
              🎯 Bắt đầu Làm trắc nghiệm Pass ngay →
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. QUIZ PASS MODE */}
      {/* ============================================================ */}
      {mode === "quiz" && (
        <div className="max-w-2xl mx-auto py-2 space-y-4">
          {!quizFinished ? (
            quizQuestions[quizIndex] && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
                {/* Quiz Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      Câu {quizIndex + 1} / {quizQuestions.length}
                    </span>
                    <span className="ml-2 text-xs text-emerald-600 font-bold">
                      Đúng: {correctCount}
                    </span>
                  </div>

                  <button
                    onClick={() => setMode("list")}
                    className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                  >
                    Thoát
                  </button>
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

                    let btnStyle = "border-gray-200 bg-white text-gray-800 hover:bg-indigo-50/50 hover:border-indigo-200";

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
                        onClick={() => handleSelectAnswer(opt)}
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
                          🎉 Chính xác! Bạn đã PASS từ vựng này.
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
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm rounded-2xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
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
                  <span className="font-black text-indigo-600 text-base">
                    {correctCount} / {quizQuestions.length}
                  </span>{" "}
                  câu hỏi.
                </p>
              </div>

              {/* Passed notice */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                {newlyPassedIds.length > 0 ? (
                  <span>
                    🌟 Chúc mừng! Bạn vừa <strong>Pass thành công {newlyPassedIds.length} từ vựng mới</strong> trong bài kiểm tra này!
                  </span>
                ) : (
                  <span>
                    Tiến độ bài học đã được cập nhật thành công vào hệ thống.
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
                  onClick={handleStartQuiz}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-xs text-xs hover:opacity-95 transition-all"
                >
                  🔄 Làm lại trắc nghiệm
                </button>

                <button
                  onClick={() => {
                    setStudyIndex(0);
                    setIsFlipped(false);
                    setMode("study");
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold rounded-2xl text-xs hover:bg-indigo-100 transition-all"
                >
                  🎴 Ôn lại ở Chế độ học
                </button>

                <button
                  onClick={() => setMode("list")}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-2xl text-xs hover:bg-gray-200 transition-all"
                >
                  📋 Xem danh sách
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
