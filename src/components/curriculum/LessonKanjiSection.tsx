"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { KanjiItem } from "@/lib/repositories/types";
import { KanjiProgress } from "@/hooks/useKanjiProgress";
import KanjiStrokeViewer from "@/components/KanjiStrokeViewer";

interface Props {
  kanjiItems: KanjiItem[];
  getKanjiProgress: (id: string) => KanjiProgress;
  toggleKanjiLearned: (id: string) => void;
  toggleKanjiFavorite: (id: string) => void;
  updateKanjiProgress: (id: string, patch: Partial<KanjiProgress>) => void;
}

interface KanjiQuizQuestion {
  kanji: KanjiItem;
  type: "kanji_to_hanviet" | "hanviet_to_kanji";
  questionText: string;
  subText?: string;
  correctAnswer: string;
  options: string[];
}

export default function LessonKanjiSection({
  kanjiItems,
  getKanjiProgress,
  toggleKanjiLearned,
  toggleKanjiFavorite,
  updateKanjiProgress,
}: Props) {
  const [mode, setMode] = useState<"list" | "study" | "quiz">("list");
  const [searchQuery, setSearchQuery] = useState("");

  // ====================== STUDY MODE STATES ======================
  const [studyIndex, setStudyIndex] = useState(0);
  const [studyList, setStudyList] = useState<KanjiItem[]>(kanjiItems);

  useEffect(() => {
    setStudyList(kanjiItems);
    setStudyIndex(0);
  }, [kanjiItems]);

  const handleShuffleStudy = () => {
    const shuffled = [...studyList].sort(() => Math.random() - 0.5);
    setStudyList(shuffled);
    setStudyIndex(0);
  };

  const currentStudyItem = studyList[studyIndex] || null;

  // ====================== QUIZ MODE STATES ======================
  const [quizQuestions, setQuizQuestions] = useState<KanjiQuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [newlyPassedIds, setNewlyPassedIds] = useState<string[]>([]);
  const [incorrectItems, setIncorrectItems] = useState<KanjiItem[]>([]);

  const generateQuiz = useCallback(() => {
    if (!kanjiItems || kanjiItems.length === 0) return;

    const questions: KanjiQuizQuestion[] = kanjiItems.map((item, index) => {
      const isKanjiToMeaning = index % 2 === 0;

      if (isKanjiToMeaning) {
        const correctAnswer = `${item.hanViet} (${item.meaning})`;
        const distractors = kanjiItems
          .filter((k) => k.id !== item.id)
          .map((k) => `${k.hanViet} (${k.meaning})`);

        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        const fallbackOptions = ["NHẬT (Mặt trời)", "NGUYỆT (Mặt trăng)", "HOẢ (Lửa)", "THUỶ (Nước)"];
        while (shuffledDistractors.length < 3) {
          const fb = fallbackOptions[shuffledDistractors.length % fallbackOptions.length];
          if (!shuffledDistractors.includes(fb) && fb !== correctAnswer) {
            shuffledDistractors.push(fb);
          } else {
            shuffledDistractors.push(`Hán tự ${shuffledDistractors.length + 2}`);
          }
        }

        const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);

        return {
          kanji: item,
          type: "kanji_to_hanviet",
          questionText: item.kanji,
          subText: "Chọn Âm Hán Việt và Ý Nghĩa tương ứng của chữ Hán trên:",
          correctAnswer,
          options,
        };
      } else {
        const correctAnswer = item.kanji;
        const distractors = kanjiItems
          .filter((k) => k.id !== item.id)
          .map((k) => k.kanji);

        const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
        const fallbackOptions = ["日", "月", "火", "水", "木", "金", "土"];
        while (shuffledDistractors.length < 3) {
          const fb = fallbackOptions[shuffledDistractors.length % fallbackOptions.length];
          if (!shuffledDistractors.includes(fb) && fb !== correctAnswer) {
            shuffledDistractors.push(fb);
          } else {
            shuffledDistractors.push(`字${shuffledDistractors.length + 2}`);
          }
        }

        const options = [correctAnswer, ...shuffledDistractors].sort(() => Math.random() - 0.5);

        return {
          kanji: item,
          type: "hanviet_to_kanji",
          questionText: `${item.hanViet}`,
          subText: `Chọn chữ Hán mang nghĩa "${item.meaning}":`,
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
  }, [kanjiItems]);

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

      // AUTOMATIC PASS LOGIC:
      const currentProg = getKanjiProgress(currentQ.kanji.id);
      if (!currentProg.learned) {
        updateKanjiProgress(currentQ.kanji.id, {
          learned: true,
          learnedAt: new Date().toISOString(),
        });
        setNewlyPassedIds((prev) => [...prev, currentQ.kanji.id]);
      }
    } else {
      setIncorrectItems((prev) => [...prev, currentQ.kanji]);
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

  // Filtered Kanji for list view
  const filteredKanji = useMemo(() => {
    if (!searchQuery.trim()) return kanjiItems;
    const q = searchQuery.toLowerCase().trim();
    return kanjiItems.filter(
      (k) =>
        k.kanji?.toLowerCase().includes(q) ||
        k.hanViet?.toLowerCase().includes(q) ||
        k.meaning?.toLowerCase().includes(q) ||
        k.radical?.toLowerCase().includes(q)
    );
  }, [kanjiItems, searchQuery]);

  const totalCount = kanjiItems.length;
  const learnedCount = kanjiItems.filter((k) => getKanjiProgress(k.id).learned).length;
  const percentLearned = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Không có chữ Hán nào trong bài học này
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
                ? "bg-white text-purple-700 shadow-xs font-extrabold"
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
                ? "bg-white text-purple-700 shadow-xs font-extrabold"
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
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 p-4 rounded-2xl border border-purple-100/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="text-sm font-extrabold text-purple-950 flex items-center gap-1.5">
                <span>🉐 Chữ Hán / Kanji bài học</span>
                <span className="text-[11px] bg-purple-200/80 text-purple-800 px-2 py-0.5 rounded-full">
                  {learnedCount >= totalCount ? "Hoàn thành 100% 🎉" : `Còn ${totalCount - learnedCount} chữ chưa Pass`}
                </span>
              </h4>
              <p className="text-xs text-gray-600">
                Luyện nét viết, âm Hán Việt và từ ghép, sau đó làm trắc nghiệm để tự động <strong>Pass</strong> chữ Hán!
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
                <span>🎴 Học chữ Hán</span>
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
              placeholder="🔍 Tìm nhanh Hán tự (Kanji, Âm Hán Việt, Nghĩa tiếng Việt, Bộ thủ)..."
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
            {filteredKanji.map((kanji) => (
              <KanjiStrokeViewer
                key={kanji.id}
                kanji={kanji}
                progress={getKanjiProgress(kanji.id)}
                onToggleLearned={toggleKanjiLearned}
                onToggleFavorite={toggleKanjiFavorite}
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
          {/* Header */}
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
                Chữ Hán {studyIndex + 1} / {studyList.length}
              </span>
            </div>
          </div>

          {/* Kanji Card Viewer Reuse */}
          <div className="space-y-4">
            <KanjiStrokeViewer
              kanji={currentStudyItem}
              progress={getKanjiProgress(currentStudyItem.id)}
              onToggleLearned={toggleKanjiLearned}
              onToggleFavorite={toggleKanjiFavorite}
            />
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
              ← Chữ trước
            </button>

            <button
              onClick={() => {
                if (studyIndex < studyList.length - 1) setStudyIndex((prev) => prev + 1);
              }}
              disabled={studyIndex === studyList.length - 1}
              className="flex-1 py-3 px-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs flex items-center justify-center gap-1 shadow-xs"
            >
              Chữ tiếp theo →
            </button>
          </div>

          {/* CTA to Quiz */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center space-y-2 mt-4">
            <p className="text-xs text-emerald-900 font-medium">
              Kiểm tra khả năng nhận diện Hán tự và âm Hán Việt để tự động <strong>Pass</strong> bài học!
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
                  <div className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
                    {quizQuestions[quizIndex].questionText}
                  </div>
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
                          🎉 Chính xác! Bạn đã PASS chữ Hán này.
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
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-4xl text-white shadow-md">
                🏆
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">
                  Hoàn Thành Trắc Nghiệm Kanji!
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
                    🌟 Tuyệt vời! Bạn vừa <strong>Pass thành công {newlyPassedIds.length} chữ Hán mới</strong> trong bài này!
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
                    ⚠️ Các chữ Hán cần xem lại ({incorrectItems.length}):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {incorrectItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center justify-between"
                      >
                        <span className="text-lg font-bold text-gray-900">
                          {item.kanji}
                        </span>
                        <span className="text-gray-500 truncate max-w-[60%]">
                          {item.hanViet} ({item.meaning})
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
