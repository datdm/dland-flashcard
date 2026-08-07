"use client";

import { useState } from "react";
import { GrammarPoint, GrammarProgress } from "@/types";

interface Props {
  grammar: GrammarPoint;
  progress?: GrammarProgress;
  onToggleLearned?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export default function GrammarCard({ grammar, progress, onToggleLearned, onToggleFavorite }: Props) {
  const [showExamples, setShowExamples] = useState(true);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-indigo-700 font-mono">{grammar.structure}</h3>
            {grammar.level && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-purple-100 text-purple-700">
                {grammar.level}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold text-gray-800 mt-1">{grammar.meaning}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(grammar.id)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border text-sm transition-all ${
                progress?.favorite
                  ? "bg-yellow-50 border-yellow-300 text-yellow-500 shadow-3xs"
                  : "bg-white border-gray-100 text-gray-300 hover:border-yellow-200 hover:text-yellow-400"
              }`}
              title="Yêu thích"
            >
              ★
            </button>
          )}

          {onToggleLearned && (
            <button
              onClick={() => onToggleLearned(grammar.id)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                progress?.learned
                  ? "bg-emerald-50 border-emerald-300 text-emerald-600 shadow-3xs"
                  : "bg-white border-gray-100 text-gray-300 hover:border-emerald-200 hover:text-emerald-500"
              }`}
              title="Đã học"
            >
              ✓
            </button>
          )}

          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 bg-indigo-50 rounded-lg transition-colors"
          >
            {showExamples ? "Ẩn ví dụ" : "Hiện ví dụ"} ({grammar.examples.length})
          </button>
        </div>
      </div>

      {grammar.explanation && (
        <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed">
          <span className="font-semibold text-gray-700">Giải thích: </span>
          {grammar.explanation}
        </div>
      )}

      {grammar.mnemonic && (
        <div className="mt-2 text-xs text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-100">
          💡 <span className="font-semibold">Mẹo ghi nhớ: </span> {grammar.mnemonic}
        </div>
      )}

      {showExamples && grammar.examples.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
          <h4 className="text-xs font-semibold text-gray-400">Ví dụ câu (Examples):</h4>
          {grammar.examples.map((eg) => (
            <div key={eg.id} className="p-2.5 rounded-xl bg-indigo-50/40 hover:bg-indigo-50/80 transition-colors flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-900 leading-snug">{eg.sentence}</p>
                <p className="text-xs text-indigo-700 font-medium mt-0.5">{eg.meaning}</p>
              </div>
              <button
                onClick={() => speakText(eg.sentence)}
                className="text-gray-400 hover:text-indigo-600 transition-colors p-1 text-base leading-none"
                title="Nghe đọc tiếng Nhật"
              >
                🔊
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
