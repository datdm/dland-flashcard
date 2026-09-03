"use client";

import React from "react";
import { ExamQuestion, ExamSubQuestion } from "@/types/exam";

interface Props {
  question: ExamQuestion | ExamSubQuestion;
  index: number;
  selected: number[];
  onChange: (qid: number, selected: number[]) => void;
  showResult?: boolean;
  showMondaiBadge?: boolean;
  onOpenMazii?: (word: string) => void;
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
}: Props) {
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const [showScript, setShowScript] = React.useState(false);

  const handleToggleAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const scriptToSpeak = (question as any).audioScript || question.question;
    const utterance = new SpeechSynthesisUtterance(scriptToSpeak);
    utterance.lang = "ja-JP";
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

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
      className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl mb-3.5 sm:mb-4 border transition-all scroll-mt-24 ${
        showResult
          ? isCorrect
            ? "bg-emerald-50/60 border-emerald-200 shadow-xs"
            : hasAnswered
            ? "bg-rose-50/60 border-rose-200 shadow-xs"
            : "bg-gray-50 border-gray-200"
          : hasAnswered
          ? "bg-indigo-50/40 border-indigo-200/80 shadow-xs"
          : "bg-white border-gray-100 shadow-2xs hover:border-gray-200"
      }`}
    >
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
                  /\[([^\]]+)\]/g,
                  '<span class="font-black text-indigo-700 underline decoration-2 decoration-indigo-500 underline-offset-4 px-0.5">$1</span>'
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

      {/* Audio Playback for Listening questions */}
      {((question as any).audioScript || (question as any).majorSection === "listening") && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-amber-500/10 border border-amber-200/80 rounded-2xl flex-wrap">
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              isPlayingAudio
                ? "bg-rose-500 text-white animate-pulse"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            <span>{isPlayingAudio ? "⏹ Dừng nghe" : "▶️ Nghe bài đọc (Audio)"}</span>
          </button>
          
          {showResult && (question as any).audioScript && (
            <button
              type="button"
              onClick={() => setShowScript((prev) => !prev)}
              className="px-3 py-2 bg-white hover:bg-gray-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {showScript ? "Ẩn kịch bản (Script)" : "Xem kịch bản (Script)"}
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
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer text-sm sm:text-base leading-relaxed active:scale-99 ${optionStyle}`}
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
