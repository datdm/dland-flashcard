"use client";

import Link from "next/link";
import { Vocabulary, VocabProgress, FIELD_LABELS } from "@/types";

interface VocabularyListItemProps {
  vocab: Vocabulary;
  progress: VocabProgress;
  onToggleLearned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit?: (vocab: Vocabulary) => void;
  onDelete?: (id: string) => void;
  onAddToNotebook?: (vocab: Vocabulary) => void;
  notebookInfo?: { id: string; name: string };
  variant?: "list" | "card";
}

export default function VocabularyListItem({
  vocab,
  progress,
  onToggleLearned,
  onToggleFavorite,
  onEdit,
  onDelete,
  onAddToNotebook,
  notebookInfo,
  variant = "list",
}: VocabularyListItemProps) {
  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const mainJapanese = vocab.kanji || vocab.hiragana || "";

  if (variant === "card") {
    return (
      <div
        className={`flex flex-col justify-between rounded-3xl border bg-white shadow-2xs hover:shadow-md transition-all p-4 h-full ${
          progress.learned ? "border-emerald-200 bg-emerald-50/20" : "border-gray-100"
        }`}
      >
        {/* Top: word + audio + icons */}
        <div>
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xl font-extrabold text-gray-900 leading-snug break-words">
                  {vocab.kanji || vocab.hiragana}
                </span>
                {vocab.kanji && vocab.hiragana && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-mono">
                    🗣️ {vocab.hiragana}
                  </span>
                )}
              </div>
              {vocab.onyomi && (
                <p className="text-[11px] text-purple-600 font-medium mt-0.5">
                  Âm Hán: {vocab.onyomi}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {mainJapanese && (
                <button
                  onClick={() => speakText(mainJapanese)}
                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex items-center justify-center transition-colors text-xs"
                  title="Nghe phát âm"
                >
                  🔊
                </button>
              )}
              <button
                onClick={() => onToggleFavorite(vocab.id)}
                title="Yêu thích"
                className={`w-7 h-7 flex items-center justify-center text-sm transition-colors ${
                  progress.favorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                }`}
              >
                ★
              </button>
              <button
                onClick={() => onToggleLearned(vocab.id)}
                title={progress.learned ? "Đã học" : "Chưa học"}
                className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-colors ${
                  progress.learned
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-400 hover:text-emerald-500"
                }`}
              >
                {progress.learned ? "✓" : "○"}
              </button>
            </div>
          </div>

          {/* Meaning */}
          {vocab.meaning && (
            <p className="text-xs font-semibold text-emerald-700 leading-snug break-words mt-1">
              {vocab.meaning}
            </p>
          )}

          {/* Phonetic */}
          {vocab.phonetic && (
            <p className="text-[11px] text-gray-400 italic leading-snug mt-0.5">{vocab.phonetic}</p>
          )}
        </div>

        {/* Bottom status & notebook link */}
        <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between text-[11px]">
          {notebookInfo ? (
            <Link
              href={`/notebooks/${notebookInfo.id}`}
              className="text-purple-600 font-semibold hover:underline flex items-center gap-1 truncate"
            >
              <span>📓</span>
              <span className="truncate">{notebookInfo.name}</span>
            </Link>
          ) : (
            <span className={progress.learned ? "text-emerald-600 font-semibold" : "text-gray-400"}>
              {progress.learned ? "✓ Đã thuộc" : "○ Chưa thuộc"}
            </span>
          )}

          {onAddToNotebook && (
            <button
              onClick={() => onAddToNotebook(vocab)}
              className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors ml-auto"
            >
              + Sổ tay
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default List View
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all shadow-2xs ${
        progress.learned ? "border-emerald-200 bg-emerald-50/20" : "border-gray-100 bg-white"
      }`}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 items-center">
        <div>
          <span className="text-[10px] text-gray-400 uppercase font-semibold">{FIELD_LABELS.kanji}</span>
          <p className="text-lg font-bold text-gray-900 leading-none mt-0.5">
            {vocab.kanji || vocab.hiragana}
          </p>
        </div>
        {vocab.hiragana && vocab.kanji && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">{FIELD_LABELS.hiragana}</span>
            <p className="text-sm font-semibold text-indigo-700 leading-none mt-0.5">{vocab.hiragana}</p>
          </div>
        )}
        {vocab.onyomi && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">{FIELD_LABELS.onyomi}</span>
            <p className="text-xs font-semibold text-purple-600 leading-none mt-0.5">{vocab.onyomi}</p>
          </div>
        )}
        {vocab.meaning && (
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">{FIELD_LABELS.meaning}</span>
            <p className="text-xs font-bold text-emerald-700 leading-none mt-0.5 truncate">{vocab.meaning}</p>
          </div>
        )}
      </div>

      {/* Notebook Link if available */}
      {notebookInfo && (
        <Link
          href={`/notebooks/${notebookInfo.id}`}
          className="hidden lg:flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-xl font-semibold hover:bg-purple-100 transition-colors"
        >
          <span>📓</span>
          <span className="max-w-[100px] truncate">{notebookInfo.name}</span>
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {mainJapanese && (
          <button
            onClick={() => speakText(mainJapanese)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex items-center justify-center transition-colors text-base"
            title="Nghe đọc"
          >
            🔊
          </button>
        )}
        <button
          onClick={() => onToggleFavorite(vocab.id)}
          title="Yêu thích"
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors ${
            progress.favorite ? "text-yellow-400 bg-yellow-50" : "text-gray-300 hover:text-yellow-300"
          }`}
        >
          ★
        </button>
        <button
          onClick={() => onToggleLearned(vocab.id)}
          title="Đã học"
          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs transition-colors ${
            progress.learned
              ? "bg-emerald-600 text-white"
              : "bg-gray-100 text-gray-400 hover:text-emerald-500"
          }`}
        >
          {progress.learned ? "✓" : "○"}
        </button>

        {onAddToNotebook && (
          <button
            onClick={() => onAddToNotebook(vocab)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors"
            title="Thêm vào sổ tay"
          >
            + Sổ tay
          </button>
        )}

        {onEdit && (
          <button
            onClick={() => onEdit(vocab)}
            className="w-9 h-9 rounded-xl text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors"
            title="Sửa"
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (confirm("Xóa từ này?")) onDelete(vocab.id);
            }}
            className="w-9 h-9 rounded-xl text-red-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
            title="Xóa"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
