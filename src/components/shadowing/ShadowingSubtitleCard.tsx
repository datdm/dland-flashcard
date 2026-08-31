"use client";

import React, { useState } from "react";
import { SubtitleChunk, FuriganaToken } from "@/types/shadowing";

interface Props {
  chunk: SubtitleChunk;
  showTranslation: boolean;
  showFurigana: boolean;
  onOpenMazii?: (word: string) => void;
  onRecordVoice?: () => void;
  isRecording?: boolean;
  speechScore?: number | null;
  speechTranscript?: string | null;
}

export default function ShadowingSubtitleCard({
  chunk,
  showTranslation,
  showFurigana,
  onOpenMazii,
  isRecording = false,
  speechScore = null,
  speechTranscript = null,
}: Props) {
  const [, setHoveredWord] = useState<string | null>(null);

  const tokens: FuriganaToken[] = chunk.furiganaTokens || [{ surface: chunk.japanese }];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-100 shadow-md relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-full pointer-events-none" />

      <div className="text-center sm:text-left py-2">
        <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-[2.6] tracking-wide text-gray-900 select-text flex flex-wrap items-end justify-center sm:justify-start gap-x-1.5 gap-y-3">
          {tokens.map((token: FuriganaToken, idx: number) => {
            const hasRuby = showFurigana && token.reading && token.surface !== token.reading;
            const isHighlighted = chunk.highlightPhrases?.some((h: { phrase: string }) =>
              token.surface.includes(h.phrase) || h.phrase.includes(token.surface)
            );

            return (
              <span
                key={idx}
                onClick={() => onOpenMazii && onOpenMazii(token.surface)}
                onMouseEnter={() => setHoveredWord(token.meaning || token.surface)}
                onMouseLeave={() => setHoveredWord(null)}
                className={`relative inline-flex flex-col items-center cursor-pointer transition-all duration-150 rounded-lg px-1 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 ${
                  isHighlighted ? "text-indigo-600 font-black border-b-2 border-indigo-500 pb-0.5" : ""
                }`}
                title={token.meaning ? `${token.surface}: ${token.meaning}` : "Bấm để tra từ điển"}
              >
                {hasRuby ? (
                  <ruby className="ruby-text">
                    <span className="text-gray-900">{token.surface}</span>
                    <rt className="text-xs sm:text-sm font-semibold text-indigo-500 select-none pb-0.5">
                      {token.reading}
                    </rt>
                  </ruby>
                ) : (
                  <span>{token.surface}</span>
                )}
              </span>
            );
          })}
        </div>

        {showTranslation && (
          <div className="mt-4 pt-3 border-t border-gray-100/90 text-sm sm:text-base text-gray-600 font-medium leading-relaxed italic select-text flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider not-italic bg-indigo-50 px-2 py-0.5 rounded-md">
              Dịch
            </span>
            <span>{chunk.vietnamese}</span>
          </div>
        )}

        {chunk.highlightPhrases && chunk.highlightPhrases.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Trọng tâm:
            </span>
            {chunk.highlightPhrases.map((hp: { phrase: string; meaning?: string }, hIdx: number) => (
              <span
                key={hIdx}
                className="px-2.5 py-1 bg-indigo-50/80 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1 shadow-3xs"
              >
                <span>✨ {hp.phrase}</span>
                {hp.meaning && <span className="text-gray-500 font-normal">({hp.meaning})</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {(isRecording || speechScore !== null || speechTranscript) && (
        <div className="mt-6 p-4 rounded-2xl bg-indigo-950 text-white shadow-inner flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                {isRecording ? "Đang lắng nghe giọng nói của bạn..." : "Kết quả phát âm của bạn"}
              </span>
            </div>
            {speechTranscript && (
              <p className="text-sm font-semibold text-white tracking-wide">
                &ldquo;{speechTranscript}&rdquo;
              </p>
            )}
          </div>

          {speechScore !== null && (
            <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
              <div
                className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-1.5 shadow-md ${
                  speechScore >= 80
                    ? "bg-emerald-500 text-white"
                    : speechScore >= 50
                    ? "bg-amber-500 text-white"
                    : "bg-rose-500 text-white"
                }`}
              >
                <span>{speechScore >= 80 ? "🌟 Tuyệt vời!" : speechScore >= 50 ? "👍 Tốt" : "💪 Cần luyện thêm"}</span>
                <span>{speechScore}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
