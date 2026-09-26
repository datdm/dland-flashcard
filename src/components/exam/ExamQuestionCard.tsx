"use client";

import React from "react";
import { ExamQuestion, ExamSubQuestion } from "@/types/exam";
import AudioSeekPlayer from "@/components/AudioSeekPlayer";

interface Props {
  question: ExamQuestion | ExamSubQuestion;
  index: number;
  selected: number[];
  onChange: (qid: number, selected: number[]) => void;
  showResult?: boolean;
  showMondaiBadge?: boolean;
  onOpenMazii?: (word: string) => void;
  isFocused?: boolean;
}

const OPTION_PREFIXES = ["①", "②", "③", "④", "⑤"];

export default function ExamQuestionCard({
  question,
  index,
  selected,
  onChange,
  showResult = false,
  showMondaiBadge = false,
  onOpenMazii,
  isFocused = false,
}: Props) {
  const [showScript, setShowScript] = React.useState(false);

  const handleSelect = (idx: number) => {
    if (showResult) return;
    if (question.type === "multiple") {
      const next = selected.includes(idx)
        ? selected.filter((i) => i !== idx)
        : [...selected, idx];
      onChange(question.id, next);
    } else {
      onChange(question.id, [idx]);
    }
  };

  const hasAnswered = selected.length > 0;
  const isCorrect =
    showResult &&
    selected.length === question.answers.length &&
    selected.every((a) => question.answers.includes(a));

  return (
    <div
      id={`question-${question.id}`}
      className={`p-3.5 sm:p-4 rounded-2xl mb-3 border transition-all duration-300 scroll-mt-28 ${
        isFocused
          ? "ring-2 ring-indigo-500 border-indigo-500 shadow-md bg-indigo-50/40"
          : showResult
          ? isCorrect
            ? "bg-emerald-50/60 border-emerald-200 shadow-xs"
            : hasAnswered
            ? "bg-rose-50/60 border-rose-200 shadow-xs"
            : "bg-gray-50 border-gray-200"
          : hasAnswered
          ? "bg-indigo-50/40 border-indigo-200/80 shadow-xs"
          : "bg-white border-gray-100 shadow-2xs hover:border-gray-200"
      }`}>
      {/* Optional standalone Mondai header if requested */}
      {showMondaiBadge && "mondai" in question && question.mondai && (
        <div className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-3 py-1 rounded-xl mb-3 inline-block">
          {question.mondai}
        </div>
      )}

      {/* Question Title */}
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 tracking-wide ${
            showResult
              ? isCorrect
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
              : hasAnswered
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 border border-gray-200"
          }`}
        >
          Câu {index}
        </span>

        <div className="flex-1">
          <p
            className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed tracking-wide select-text"
            dangerouslySetInnerHTML={{
              __html: question.question
                // Strip redundant leading numbering (e.g. "1. ", "52. ") since we already have "Câu X" badge
                .replace(/^[0-9０-９]+[\.\s、\s]+/g, "")
                // Format bracketed target words [漢字] as underlined JLPT target words
                .replace(
                  /\[([^\]]+)\]|【([^】]+)】/g,
                  (_match, p1, p2) =>
                    `<span class="font-black text-indigo-700 underline decoration-2 decoration-indigo-500 underline-offset-4 px-0.5">${p1 || p2}</span>`
                )
                // Highlight star in Mondai 8
                .replace(
                  /★/g,
                  '<span class="text-amber-500 font-extrabold text-lg px-0.5">★</span>'
                ),
            }}
          />
        </div>
      </div>

      {/* Audio Playback for Listening questions with seek timeline */}
      {((question as any).audioScript || (question as any).majorSection === "listening") && (
        <div className="mb-4 space-y-2">
          <AudioSeekPlayer
            textToSpeak={(question as any).audioScript || question.question}
            title={(question as any).mondai ? `${(question as any).mondai} - Câu ${index}` : `Câu hỏi ${index}`}
          />
          {showResult && (question as any).audioScript && (
            <button
              type="button"
              onClick={() => setShowScript((prev) => !prev)}
              className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {showScript ? "Ẩn kịch bản (Script)" : "👁️ Xem kịch bản (Script) & Dịch nghĩa"}
            </button>
          )}
        </div>
      )}

      {/* Collapsible Listening Script */}
      {showScript && (question as any).audioScript && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2 select-text">
          <div className="font-extrabold text-amber-900">Kịch bản bài nghe (Script):</div>
          <div className="whitespace-pre-wrap leading-loose font-medium text-gray-900">
            {(question as any).audioScript}
          </div>
          {(question as any).vietnameseTranslation && (
            <div className="pt-2 border-t border-amber-200 text-gray-700 italic">
              <span className="font-bold not-italic text-amber-900">Dịch nghĩa: </span>
              {(question as any).vietnameseTranslation}
            </div>
          )}
        </div>
      )}

      {/* Options List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {question.options.map((opt, idx) => {
          const isSelected = selected.includes(idx);
          const isRightAnswer = showResult && question.answers.includes(idx);
          const isWrongSelection = showResult && isSelected && !isRightAnswer;

          let optionStyle = "bg-gray-50/80 border-gray-200 text-gray-800 hover:bg-indigo-50/50 hover:border-indigo-200";

          if (showResult) {
            if (isRightAnswer) {
              optionStyle = "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-300";
            } else if (isWrongSelection) {
              optionStyle = "bg-rose-100 border-rose-300 text-rose-900 line-through opacity-80";
            } else {
              optionStyle = "bg-gray-50 border-gray-200 text-gray-500 opacity-60";
            }
          } else if (isSelected) {
            optionStyle = "bg-indigo-600 border-indigo-600 text-white font-bold shadow-sm ring-2 ring-indigo-200";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer text-xs sm:text-sm leading-relaxed active:scale-99 ${optionStyle}`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 ${
                  isSelected && !showResult
                    ? "bg-white/20 text-white"
                    : isRightAnswer
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200/80 text-gray-700"
                }`}
              >
                {OPTION_PREFIXES[idx] || idx + 1}
              </span>
              <span className="flex-1 mt-0.5 select-text font-medium text-sm sm:text-base">{opt}</span>
              {showResult && isRightAnswer && <span className="text-base shrink-0">✅</span>}
              {showResult && isWrongSelection && <span className="text-base shrink-0">❌</span>}
            </button>
          );
        })}
      </div>

      {/* Explanation in Review mode */}
      {showResult && question.explanation && (
        <div className="mt-3 p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs sm:text-sm text-amber-950 leading-relaxed">
          <div className="flex items-center gap-1.5 font-black text-amber-900 mb-1.5">
            <span>💡</span>
            <span>Giải thích chi tiết (解説):</span>
          </div>
          <p className="select-text whitespace-pre-wrap leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
