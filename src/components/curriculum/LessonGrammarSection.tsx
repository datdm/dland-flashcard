"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { GrammarPoint, GrammarProgress } from "@/types";
import GrammarCard from "@/components/GrammarCard";

interface Props {
  grammarPoints: GrammarPoint[];
  getGrammarProgress: (id: string) => GrammarProgress;
  toggleGrammarLearned: (id: string) => void;
  toggleGrammarFavorite: (id: string) => void;
  updateGrammarProgress: (id: string, patch: Partial<GrammarProgress>) => void;
  langCode?: string;
}

interface GrammarQuizQuestion {
  grammar: GrammarPoint;
  type: "meaning" | "fill_blank" | "structure";
  questionText: string;
  subText?: string;
  vietnameseMeaning?: string;
  correctAnswer: string;
  options: string[];
}

export default function LessonGrammarSection({
  grammarPoints,
  getGrammarProgress,
  toggleGrammarLearned,
  toggleGrammarFavorite,
  updateGrammarProgress,
  langCode = "ja",
}: Props) {
  const [mode, setMode] = useState<"list" | "study" | "quiz">("list");
  const [searchQuery, setSearchQuery] = useState("");

  // ====================== STUDY MODE STATES ======================
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyList, setStudyList] = useState<GrammarPoint[]>(grammarPoints);

  useEffect(() => {
    setStudyList(grammarPoints);
    setStudyIndex(0);
  }, [grammarPoints]);

  const handleShuffleStudy = () => {
    const shuffled = [...studyList].sort(() => Math.random() - 0.5);
    setStudyList(shuffled);
    setStudyIndex(0);
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
  const [quizQuestions, setQuizQuestions] = useState<GrammarQuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [newlyPassedIds, setNewlyPassedIds] = useState<string[]>([]);
  const [incorrectItems, setIncorrectItems] = useState<GrammarPoint[]>([]);

  // Function to generate 4-choice questions for grammar
  const generateQuiz = useCallback(() => {
    if (!grammarPoints || grammarPoints.length === 0) return;

    const questions: GrammarQuizQuestion[] = grammarPoints.map((item, index) => {
      // Rotate question types
      const hasExamples = item.examples && item.examples.length > 0;
      const typeChoice = index % 3;

      if (typeChoice === 1 && hasExamples) {
        // TYPE: Fill in the blank
        const example = item.examples[0];
        // Clean structure symbol like ～ or ~
        const cleanStructure = item.structure.replace(/^[～~]/, "").trim();
        let maskedSentence = example.sentence;
        if (cleanStructure && maskedSentence.includes(cleanStructure)) {
          maskedSentence = maskedSentence.replace(cleanStructure, "【 _____ 】");
        } else {
          maskedSentence = `${example.sentence} (Sử dụng cấu trúc:【 _____ 】)`;
        }

        const correctAnswer = item.structure;
        const distractors = grammarPoints
          .filter((g) => g.id !== item.id && g.structure !== correctAnswer)
          .map((g) => g.structure);

        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        const fallbackOptions = ["～てください", "～てもいいです", "～なければならない", "～たことがある"];
        while (shuffledDistractors.length < 3) {
          const fb = fallbackOptions[shuffledDistractors.length % fallbackOptions.length];
          if (!shuffledDistractors.includes(fb) && fb !== correctAnswer) {
            shuffledDistractors.push(fb);
          } else {
            shuffledDistractors.push(`Cấu trúc ${shuffledDistractors.length + 2}`);
          }
        }

        const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);

        return {
          grammar: item,
          type: "fill_blank",
          questionText: maskedSentence,
          subText: "Điền cấu trúc thích hợp vào chỗ trống:",
          vietnameseMeaning: example.meaning,
          correctAnswer,
          options,
        };
      } else if (typeChoice === 2) {
        // TYPE: Reverse meaning -> Structure
        const correctAnswer = item.structure;
        const distractors = grammarPoints
          .filter((g) => g.id !== item.id && g.structure !== correctAnswer)
          .map((g) => g.structure);

        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        const fallbackOptions = ["～ている", "～てから", "～たほうがいい", "～まえに"];
        while (shuffledDistractors.length < 3) {
          const fb = fallbackOptions[shuffledDistractors.length % fallbackOptions.length];
          if (!shuffledDistractors.includes(fb) && fb !== correctAnswer) {
            shuffledDistractors.push(fb);
          } else {
            shuffledDistractors.push(`Cấu trúc ${shuffledDistractors.length + 2}`);
          }
        }

        const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);

        return {
          grammar: item,
          type: "structure",
          questionText: `Cấu trúc nào mang ý nghĩa: "${item.meaning}"?`,
          subText: item.level ? `Trình độ ${item.level}` : undefined,
          correctAnswer,
          options,
        };
      } else {
        // TYPE: Structure -> Meaning
        const correctAnswer = item.meaning;
        const distractors = grammarPoints
          .filter((g) => g.id !== item.id && g.meaning !== correctAnswer)
          .map((g) => g.meaning);

        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        const fallbackOptions = [
          "Biểu thị hành động đang diễn ra",
          "Biểu thị sự cho phép làm gì",
          "Diễn tả ý định sẽ thực hiện",
          "Đưa ra lời khuyên nên làm gì",
        ];
        while (shuffledDistractors.length < 3) {
          const fb = fallbackOptions[shuffledDistractors.length % fallbackOptions.length];
          if (!shuffledDistractors.includes(fb) && fb !== correctAnswer) {
            shuffledDistractors.push(fb);
          } else {
            shuffledDistractors.push(`Ý nghĩa ${shuffledDistractors.length + 2}`);
          }
        }

        const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);

        return {
          grammar: item,
          type: "meaning",
          questionText: item.structure,
          subText: "Ý nghĩa / cách dùng chính xác của cấu trúc trên là gì?",
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
  }, [grammarPoints]);

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
      // Speak the grammar structure
      speakText(currentQ.grammar.structure.replace(/^[～~]/, ""));

      // AUTOMATIC PASS LOGIC:
      const currentProg = getGrammarProgress(currentQ.grammar.id);
      if (!currentProg.learned) {
        updateGrammarProgress(currentQ.grammar.id, {
          learned: true,
          learnedAt: new Date().toISOString(),
        });
        setNewlyPassedIds((prev) => [...prev, currentQ.grammar.id]);
      }
    } else {
      setIncorrectItems((prev) => [...prev, currentQ.grammar]);
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

  // Filtered grammar for list view
  const filteredGrammar = useMemo(() => {
    if (!searchQuery.trim()) return grammarPoints;
    const q = searchQuery.toLowerCase().trim();
    return grammarPoints.filter(
      (g) =>
        g.structure?.toLowerCase().includes(q) ||
        g.meaning?.toLowerCase().includes(q) ||
        g.explanation?.toLowerCase().includes(q)
    );
  }, [grammarPoints, searchQuery]);

  const totalCount = grammarPoints.length;
  const learnedCount = grammarPoints.filter((g) => getGrammarProgress(g.id).learned).length;
  const percentLearned = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Không có mục ngữ pháp nào trong bài học này
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
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-4 rounded-2xl border border-purple-100/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-purple-950 flex items-center gap-1.5">
                <span>📐 Điểm ngữ pháp trọng tâm bài học</span>
                <span className="text-[11px] bg-purple-200/80 text-purple-800 px-2 py-0.5 rounded-full">
                  {learnedCount >= totalCount ? "Hoàn thành 100% 🎉" : `Còn ${totalCount - learnedCount} cấu trúc chưa Pass`}
                </span>
              </h4>
              <p className="text-xs text-gray-600">
                Ôn cấu trúc & câu ví dụ mẫu, sau đó làm bài trắc nghiệm để hệ thống tự động ghi nhận <strong>Pass</strong> ngữ pháp!
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => {
                  setStudyIndex(0);
                  setMode("study");
                }}
                className="flex-1 md:flex-initial px-4 py-2 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
              >
                <span>🎴 Học mẫu câu</span>
              </button>
              <button
                onClick={handleStartQuiz}
                className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:opacity-95 flex items-center justify-center gap-1.5"
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
              placeholder="🔍 Tìm nhanh ngữ pháp (Cấu trúc, Ý nghĩa, Giải thích)..."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-2xs"
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
          <div className="space-y-4">
            {filteredGrammar.map((grammar) => (
              <GrammarCard
                key={grammar.id}
                grammar={grammar}
                progress={getGrammarProgress(grammar.id)}
                onToggleLearned={toggleGrammarLearned}
                onToggleFavorite={toggleGrammarFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. STUDY MODE */}
      {/* ============================================================ */}
      {mode === "study" && currentStudyItem && (
        <div className="space-y-4 max-w-2xl mx-auto py-2">
          {/* Study Header Navigation */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <button
              onClick={() => setMode("list")}
              className="text-purple-600 hover:underline flex items-center gap-1 font-bold"
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
                Cấu trúc {studyIndex + 1} / {studyList.length}
              </span>
            </div>
          </div>

          {/* Grammar Study Card */}
          <div className="bg-white rounded-3xl border-2 border-purple-100 shadow-md p-6 sm:p-8 space-y-6">
            {/* Top Row: Structure & Badge */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                    {currentStudyItem.level || "Ngữ pháp"}
                  </span>
                  {getGrammarProgress(currentStudyItem.id).learned && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Đã Pass
                    </span>
                  )}
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight pt-1">
                  {currentStudyItem.structure}
                </h2>
              </div>

              <button
                onClick={() => speakText(currentStudyItem.structure.replace(/^[～~]/, ""))}
                className="w-11 h-11 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-600 flex items-center justify-center transition-colors text-xl shrink-0"
                title="Nghe phát âm cấu trúc"
              >
                🔊
              </button>
            </div>

            {/* Meaning & Explanation */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                  Ý Nghĩa
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-800 mt-1">
                  {currentStudyItem.meaning}
                </p>
              </div>

              {currentStudyItem.explanation && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-gray-900 block mb-1">📖 Cách dùng:</span>
                  {currentStudyItem.explanation}
                </div>
              )}

              {currentStudyItem.mnemonic && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <div>
                    <span className="font-bold">Mẹo ghi nhớ:</span> {currentStudyItem.mnemonic}
                  </div>
                </div>
              )}
            </div>

            {/* Example Sentences */}
            {currentStudyItem.examples && currentStudyItem.examples.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                  <span>🗣️ Câu ví dụ thực tế ({currentStudyItem.examples.length})</span>
                </span>

                <div className="space-y-2.5">
                  {currentStudyItem.examples.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100/70 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm sm:text-base font-extrabold text-gray-900 leading-relaxed">
                          {ex.sentence}
                        </p>
                        <button
                          onClick={() => speakText(ex.sentence)}
                          className="w-8 h-8 rounded-xl bg-white hover:bg-purple-100 text-purple-600 flex items-center justify-center transition-colors text-sm shrink-0 border border-purple-100"
                          title="Nghe câu ví dụ"
                        >
                          🔊
                        </button>
                      </div>

                      {ex.romaji && (
                        <p className="text-xs text-gray-400 font-mono">{ex.romaji}</p>
                      )}

                      <p className="text-xs text-purple-900 font-medium pt-0.5">
                        👉 {ex.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Mark Actions */}
            <div className="border-t border-gray-100 pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => toggleGrammarLearned(currentStudyItem.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  getGrammarProgress(currentStudyItem.id).learned
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {getGrammarProgress(currentStudyItem.id).learned ? "✓ Đã thuộc (Đã Pass)" : "⭕ Đánh dấu đã thuộc"}
              </button>

              <button
                onClick={() => toggleGrammarFavorite(currentStudyItem.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  getGrammarProgress(currentStudyItem.id).favorite
                    ? "bg-amber-50 border-amber-300 text-amber-600"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                ★ {getGrammarProgress(currentStudyItem.id).favorite ? "Đã thích" : "Yêu thích"}
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (studyIndex > 0) setStudyIndex((prev) => prev - 1);
              }}
              disabled={studyIndex === 0}
              className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs flex items-center justify-center gap-1"
            >
              ← Cấu trúc trước
            </button>

            <button
              onClick={() => {
                if (studyIndex < studyList.length - 1) setStudyIndex((prev) => prev + 1);
              }}
              disabled={studyIndex === studyList.length - 1}
              className="flex-1 py-3 px-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs flex items-center justify-center gap-1 shadow-xs"
            >
              Cấu trúc tiếp theo →
            </button>
          </div>

          {/* CTA to Quiz */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center space-y-2 mt-4">
            <p className="text-xs text-emerald-900 font-medium">
              Kiểm tra khả năng vận dụng ngữ pháp với các câu hỏi tình huống & trắc nghiệm để tự động <strong>Pass</strong> bài học!
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
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
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
                  {quizQuestions[quizIndex].subText && (
                    <p className="text-xs text-purple-700 font-bold">
                      {quizQuestions[quizIndex].subText}
                    </p>
                  )}
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-relaxed">
                    {quizQuestions[quizIndex].questionText}
                  </div>
                  {quizQuestions[quizIndex].vietnameseMeaning && (
                    <p className="text-xs text-gray-500 italic">
                      ({quizQuestions[quizIndex].vietnameseMeaning})
                    </p>
                  )}
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 gap-2.5">
                  {quizQuestions[quizIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = opt === quizQuestions[quizIndex].correctAnswer;

                    let btnStyle = "border-gray-200 bg-white text-gray-800 hover:bg-purple-50/50 hover:border-purple-200";

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
                          🎉 Chính xác! Bạn đã PASS cấu trúc ngữ pháp này.
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
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-sm rounded-2xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
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
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-4xl text-white shadow-md">
                🏆
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">
                  Hoàn Thành Trắc Nghiệm Ngữ Pháp!
                </h3>
                <p className="text-sm text-gray-600">
                  Bạn đã trả lời đúng{" "}
                  <span className="font-black text-purple-600 text-base">
                    {correctCount} / {quizQuestions.length}
                  </span>{" "}
                  câu hỏi.
                </p>
              </div>

              {/* Passed notice */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                {newlyPassedIds.length > 0 ? (
                  <span>
                    🌟 Tuyệt vời! Bạn vừa <strong>Pass thành công {newlyPassedIds.length} cấu trúc ngữ pháp mới</strong> trong bài này!
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
                    ⚠️ Các cấu trúc cần xem lại ({incorrectItems.length}):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {incorrectItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between"
                      >
                        <span className="font-bold text-gray-900">
                          {item.structure}
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
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xs text-xs hover:opacity-95 transition-all"
                >
                  🔄 Làm lại trắc nghiệm
                </button>

                <button
                  onClick={() => {
                    setStudyIndex(0);
                    setMode("study");
                  }}
                  className="flex-1 py-3 px-4 bg-purple-50 text-purple-700 border border-purple-200 font-bold rounded-2xl text-xs hover:bg-purple-100 transition-all"
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
