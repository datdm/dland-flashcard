"use client";

import React from "react";
import { SubtitleChunk } from "@/types/shadowing";

interface Props {
  chunk: SubtitleChunk;
  onRecordVoice: () => void;
  isRecording: boolean;
  speechScore: number | null;
  speechTranscript: string | null;
  onPlayNativeAudio: () => void;
}

export default function PronunciationMode({
  chunk,
  onRecordVoice,
  isRecording,
  speechScore,
  speechTranscript,
  onPlayNativeAudio,
}: Props) {
  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-purple-100 shadow-md space-y-6">
      <div className="flex items-center justify-between gap-3">
        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-black border border-purple-100">
          🎙️ Phân Tích & Chỉnh Phát Âm Chuyên Sâu
        </span>
        <button
          onClick={onPlayNativeAudio}
          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>🔊</span>
          <span>Nghe giọng bản xứ</span>
        </button>
      </div>

      {/* Target Japanese Text */}
      <div className="text-center py-2 space-y-2">
        <p className="text-2xl sm:text-3xl font-black text-gray-900 leading-relaxed">
          {chunk.japanese}
        </p>
        <p className="text-sm text-purple-600 font-medium">{chunk.romaji || chunk.vietnamese}</p>
      </div>

      {/* Recording Control Button */}
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        <button
          onClick={onRecordVoice}
          disabled={isRecording}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all cursor-pointer active:scale-95 ${
            isRecording
              ? "bg-rose-600 text-white animate-ping"
              : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white hover:scale-105 shadow-purple-200"
          }`}
        >
          {isRecording ? "⏹" : "🎙️"}
        </button>
        <p className="text-xs font-bold text-gray-500">
          {isRecording ? "Đang ghi âm giọng nói..." : "Nhấn Micro và nói rõ ràng câu trên"}
        </p>
      </div>

      {/* Syllable and Pronunciation Breakdown */}
      {speechScore !== null && (
        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-700">Điểm độ chính xác phát âm</span>
            <span
              className={`text-lg font-black px-3 py-1 rounded-xl ${
                speechScore >= 80
                  ? "bg-emerald-100 text-emerald-700"
                  : speechScore >= 50
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {speechScore}%
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Câu nhận diện từ giọng của bạn:
            </span>
            <p className="text-sm font-bold text-gray-800 bg-white p-3 rounded-xl border border-gray-200">
              {speechTranscript || "Chưa nhận diện được giọng nói"}
            </p>
          </div>

          <div className="p-3 bg-purple-50 rounded-xl text-xs text-purple-800 space-y-1">
            <p className="font-bold">💡 Lời khuyên ngữ điệu:</p>
            <p>
              Hãy chú ý nhịp ngắt ở các trợ từ (が, を, に) và hạ thấp giọng ở cuối câu khẳng định để âm điệu tự nhiên như người Tokyo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
