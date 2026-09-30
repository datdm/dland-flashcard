"use client";

import { useState, useEffect, useCallback } from "react";
import { DetailedLesson } from "@/lib/repositories/types";

interface Props {
  lesson: DetailedLesson;
  isPassed: boolean;
  onPass: () => void;
  langCode?: string;
}

interface Question {
  id: number;
  type: "vocab" | "grammar";
  title: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function LessonExerciseSection({
  lesson,
  isPassed,
  onPass,
  langCode = "ja",
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Generate interactive exercise questions from lesson vocabulary & grammar
  const generateQuestions = useCallback(() => {
    const list: Question[] = [];
    const vocabs = lesson.vocabulary || [];
    const grammars = lesson.grammarPoints || [];

    let qId = 1;

    // 1. Generate Vocab questions
    vocabs.slice(0, 5).forEach((v, idx) => {
      const jp = v.kanji || v.hiragana || "";
      const meaning = v.meaning || "";

      // Distractors from other vocabs
      const distractors = vocabs
        .filter((item) => item.id !== v.id && item.meaning)
        .map((item) => item.meaning!)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const defaultFallbacks = ["Trường học", "Cảm ơn", "Bạn bè", "Gia đình", "Thời gian"];
      while (distractors.length < 3) {
        const fb = defaultFallbacks[distractors.length];
        if (!distractors.includes(fb) && fb !== meaning) distractors.push(fb);
      }

      const options = [meaning, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.indexOf(meaning);

      list.push({
        id: qId++,
        type: "vocab",
        title: `Từ vựng ${idx + 1}`,
        prompt: `Nghĩa chính xác của từ "${jp}" (${v.hiragana || ""}) là gì?`,
        options,
        correctIndex: correctIdx,
        explanation: `Từ "${jp}" mang nghĩa là "${meaning}".`,
      });
    });

    // 2. Generate Grammar questions
    grammars.slice(0, 4).forEach((g, idx) => {
      const struct = g.structure || "";
      const meaning = g.meaning || "";

      const distractors = grammars
        .filter((item) => item.id !== g.id && item.meaning)
        .map((item) => item.meaning!)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const defaultFallbacks = [
        "Diễn tả hành động đang diễn ra",
        "Dùng để giải thích lý do",
        "Biểu thị khả năng hoặc đề nghị",
        "Dùng để hỏi ý kiến người nghe"
      ];
      while (distractors.length < 3) {
        const fb = defaultFallbacks[distractors.length];
        if (!distractors.includes(fb) && fb !== meaning) distractors.push(fb);
      }

      const options = [meaning, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.indexOf(meaning);

      list.push({
        id: qId++,
        type: "grammar",
        title: `Ngữ pháp ${idx + 1}`,
        prompt: `Ý nghĩa và cách dùng của mẫu câu "${struct}" là gì?`,
        options,
        correctIndex: correctIdx,
        explanation: `Cấu trúc "${struct}" được dùng để: ${meaning}.`,
      });
    });

    // Shuffle questions
    setQuestions(list.sort(() => Math.random() - 0.5));
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
  }, [lesson]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  const handleSelectOption = (qId: number, optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = () => {
    if (questions.length === 0) return;

    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    setScore(correct);
    setSubmitted(true);

    const percentage = Math.round((correct / questions.length) * 100);
    // Pass if score >= 70% or all correct if small test
    if (percentage >= 70 || correct === questions.length) {
      onPass();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center text-gray-400 text-xs">
        Bài học này không có câu hỏi bài tập tự động.
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === questions.length;
  const passPercentage = Math.round((score / questions.length) * 100);
  const isPassScore = passPercentage >= 70;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Exercise Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            ✏️ BÀI TẬP BẮT BUỘC HOÀN THÀNH BÀI HỌC
          </span>
          <h2 className="text-xl font-black mt-2">Bài Tập Tổng Hợp Bài Học</h2>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Hoàn thành các câu hỏi kiểm tra từ vựng & ngữ pháp bên dưới với điểm số đạt từ **70% trở lên** để hoàn thành điều kiện Bài tập.
          </p>
        </div>

        <div className="shrink-0 text-right">
          {isPassed ? (
            <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-2xl font-black text-xs inline-flex items-center gap-1.5 shadow-md">
              ✓ ĐÃ PASS BÀI TẬP
            </span>
          ) : (
            <span className="px-4 py-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-2xl font-black text-xs inline-flex items-center gap-1.5">
              ⏳ CHƯA ĐẠT (Cần Pass)
            </span>
          )}
        </div>
      </div>

      {/* Submitted Result Summary */}
      {submitted && (
        <div className={`p-6 rounded-3xl border shadow-md space-y-3 text-center ${
          isPassScore ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-rose-50 border-rose-200 text-rose-950"
        }`}>
          <div className="text-4xl">{isPassScore ? "🎉" : "⚠️"}</div>
          <h3 className="text-lg font-black">
            {isPassScore ? "Chúc Mừng! Bạn Đã Đạt Bài Tập!" : "Chưa Đạt Điểm Yêu Cầu!"}
          </h3>
          <p className="text-xs font-medium">
            Bạn đã trả lời đúng <strong className="text-sm font-black">{score} / {questions.length}</strong> câu ({passPercentage}%).
            {isPassScore ? " Điều kiện Bài tập của bài học này đã được ghi nhận hoàn thành!" : " Vui lòng xem lại các câu chưa chính xác và thử làm lại."}
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={generateQuestions}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              🔄 Làm lại bài tập
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const selectedOpt = selectedAnswers[q.id];
          const isAnswered = selectedOpt !== undefined;

          return (
            <div key={q.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                  q.type === "vocab" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                }`}>
                  Câu {idx + 1} • {q.title}
                </span>

                {submitted && (
                  <span className={`text-xs font-black ${
                    selectedOpt === q.correctIndex ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {selectedOpt === q.correctIndex ? "✓ Đúng" : "✕ Sai"}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-extrabold text-gray-900 leading-snug">{q.prompt}</h4>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  const isCorrect = optIdx === q.correctIndex;

                  let style = "bg-gray-50/60 border-gray-150 text-gray-800 hover:bg-indigo-50/40 hover:border-indigo-200 cursor-pointer";

                  if (submitted) {
                    if (isCorrect) {
                      style = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-200";
                    } else if (isSelected) {
                      style = "bg-rose-50 border-rose-400 text-rose-950 font-bold ring-2 ring-rose-200";
                    } else {
                      style = "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                    }
                  } else if (isSelected) {
                    style = "bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-200";
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${style}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {["A", "B", "C", "D"][optIdx]}
                        </span>
                        <span className="font-semibold truncate">{opt}</span>
                      </div>
                      {submitted && isCorrect && <span className="text-emerald-600 font-black shrink-0">✓</span>}
                      {submitted && isSelected && !isCorrect && <span className="text-rose-600 font-black shrink-0">✕</span>}
                    </button>
                  );
                })}
              </div>

              {/* Explanation on submit */}
              {submitted && (
                <div className="pt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="font-bold text-indigo-700">💡 Giải thích:</span> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs text-gray-500 font-medium">
            Đã trả lời <strong className="text-indigo-600 font-extrabold">{answeredCount} / {questions.length}</strong> câu
          </span>

          <button
            onClick={handleSubmit}
            disabled={!isAllAnswered}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-200 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            🚀 Nộp Bài Tập & Tính Điểm
          </button>
        </div>
      )}
    </div>
  );
}
