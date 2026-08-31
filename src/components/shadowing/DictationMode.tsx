"use client";

import React, { useState, useEffect } from "react";
import { SubtitleChunk } from "@/types/shadowing";

interface Props {
  chunk: SubtitleChunk;
  onNextSentence: () => void;
  onPrevSentence: () => void;
  onPlayAudio: () => void;
}

export default function DictationMode({
  chunk,
  onNextSentence,
  onPrevSentence,
  onPlayAudio,
}: Props) {
  const [userInput, setUserInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setUserInput("");
    setChecked(false);
    setShowHint(false);
  }, [chunk.id]);

  const cleanTarget = chunk.japanese.replace(/[\s、。！？,.!?]/g, "");
  const cleanInput = userInput.replace(/[\s、。！？,.!?]/g, "");
  const isExact = cleanTarget === cleanInput;

  const handleCheck = () => {
    setChecked(true);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-100 shadow-md space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100">
          ✍️ Chế độ Nghe & Gõ chính tả
        </span>
        <button
          onClick={onPlayAudio}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>🔊</span>
          <span>Nghe lại câu này</span>
        </button>
      </div>

      {/* Target prompt instructions */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-500 font-medium mb-2">
          Hãy lắng nghe video và gõ lại chính xác câu tiếng Nhật bạn nghe được:
        </p>
        <p className="text-sm sm:text-base text-gray-700 font-semibold italic">
          &ldquo;{chunk.vietnamese}&rdquo;
        </p>
      </div>

      {/* Input Field */}
      <div className="space-y-3">
        <textarea
          value={userInput}
          onChange={(e) => {
            setUserInput(e.target.value);
            setChecked(false);
          }}
          placeholder="Nhập câu tiếng Nhật bạn nghe được tại đây..."
          rows={3}
          className="w-full p-4 rounded-2xl border-2 border-gray-200 text-base sm:text-lg focus:border-emerald-500 focus:outline-none transition-colors"
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => setShowHint((prev) => !prev)}
            className="text-xs font-bold text-gray-500 hover:text-indigo-600 underline cursor-pointer"
          >
            {showHint ? "Ẩn gợi ý chữ cái đầu" : "💡 Xem gợi ý ký tự"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={!userInput.trim()}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              Kiểm tra đáp án
            </button>
            <button
              onClick={onNextSentence}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Câu tiếp theo →
            </button>
          </div>
        </div>
      </div>

      {/* Hint display */}
      {showHint && (
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-mono">
          Gợi ý: {chunk.japanese.slice(0, Math.ceil(chunk.japanese.length / 2))}...
        </div>
      )}

      {/* Result feedback */}
      {checked && (
        <div
          className={`p-4 rounded-2xl border animate-in fade-in space-y-2 ${
            isExact
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2 font-black text-sm">
            <span>{isExact ? "🎉 Chính xác 100%!" : "⚠️ Chưa hoàn toàn chính xác"}</span>
          </div>
          <div className="text-xs space-y-1">
            <p>
              <strong className="text-gray-600">Đáp án chuẩn:</strong> {chunk.japanese}
            </p>
            {chunk.romaji && (
              <p>
                <strong className="text-gray-600">Romaji:</strong> {chunk.romaji}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
