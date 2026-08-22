"use client";

import { useState } from "react";
import { GrammarPoint, GrammarProgress } from "@/types";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

interface Props {
  grammar: GrammarPoint;
  progress?: GrammarProgress;
  onToggleLearned?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onAddToCollection?: (grammar: GrammarPoint) => void;
}

export default function GrammarCard({ grammar, progress, onToggleLearned, onToggleFavorite, onAddToCollection }: Props) {
  const [showExamples, setShowExamples] = useState(true);
  const { activeLanguage } = useLanguageSetting();
  const langCode = activeLanguage.code;

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === "de" ? "de-DE" : langCode === "en" ? "en-US" : "ja-JP";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all shadow-2xs hover:shadow-md ${
      progress?.learned ? "border-emerald-200 bg-emerald-50/20" : "border-gray-100"
    }`}>
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-extrabold text-indigo-700 font-mono tracking-wide">
              {grammar.structure}
            </h3>
            {grammar.level && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-3xs">
                {grammar.level}
              </span>
            )}
            {progress?.learned && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                ✓ Đã thuộc
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1.5 leading-relaxed">
            {grammar.meaning}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-start">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(grammar.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl border text-sm transition-all cursor-pointer ${
                progress?.favorite
                  ? "bg-amber-50 border-amber-300 text-amber-500 shadow-3xs"
                  : "bg-white border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500"
              }`}
              title={progress?.favorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            >
              ★
            </button>
          )}

          {onToggleLearned && (
            <button
              onClick={() => onToggleLearned(grammar.id)}
              className={`w-8 h-8 flex items-center justify-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                progress?.learned
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-3xs"
                  : "bg-white border-gray-200 text-gray-400 hover:border-emerald-400 hover:text-emerald-600"
              }`}
              title={progress?.learned ? "Đánh dấu chưa học" : "Đánh dấu đã học"}
            >
              ✓
            </button>
          )}

          {onAddToCollection && (
            <button
              onClick={() => onAddToCollection(grammar)}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
              title="Lưu vào bộ sưu tập cá nhân"
            >
              <span>➕</span>
              <span className="hidden sm:inline">Bộ sưu tập</span>
            </button>
          )}

          {grammar.examples && grammar.examples.length > 0 && (
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer"
            >
              {showExamples ? "Ẩn ví dụ" : "Ví dụ"} ({grammar.examples.length})
            </button>
          )}
        </div>
      </div>

      {grammar.explanation && (
        <div className="mt-3.5 text-xs text-gray-600 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 leading-relaxed">
          <span className="font-bold text-gray-800">💡 Giải thích chi tiết: </span>
          {grammar.explanation}
        </div>
      )}

      {grammar.mnemonic && (
        <div className="mt-2.5 text-xs text-amber-900 bg-amber-50/90 p-3 rounded-2xl border border-amber-200/80 leading-relaxed">
          <span className="font-bold">✨ Mẹo ghi nhớ: </span> {grammar.mnemonic}
        </div>
      )}

      {showExamples && grammar.examples && grammar.examples.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-2.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Ví dụ mẫu câu thực tế:
          </h4>
          <div className="space-y-2">
            {grammar.examples.map((eg) => (
              <div
                key={eg.id}
                className="p-3 rounded-2xl bg-indigo-50/40 hover:bg-indigo-50/70 border border-indigo-100/60 transition-colors flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5 flex-1">
                  <p className="text-sm font-bold text-gray-900 leading-snug">{eg.sentence}</p>
                  {eg.romaji && (
                    <p className="text-[10px] text-gray-400 font-mono italic">{eg.romaji}</p>
                  )}
                  <p className="text-xs text-indigo-700 font-medium">{eg.meaning}</p>
                </div>
                <button
                  type="button"
                  onClick={() => speakText(eg.sentence)}
                  className="w-8 h-8 rounded-xl bg-white hover:bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm transition-colors border border-indigo-100 shrink-0 cursor-pointer shadow-3xs"
                  title="Nghe phát âm chuẩn"
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
