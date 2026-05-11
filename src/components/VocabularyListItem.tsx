"use client";

import { Vocabulary, VocabProgress, FIELD_LABELS } from "@/types";

interface VocabularyListItemProps {
  vocab: Vocabulary;
  progress: VocabProgress;
  onToggleLearned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEdit?: (vocab: Vocabulary) => void;
  onDelete?: (id: string) => void;
  variant?: "list" | "card";
}

export default function VocabularyListItem({
  vocab,
  progress,
  onToggleLearned,
  onToggleFavorite,
  onEdit,
  onDelete,
  variant = "list",
}: VocabularyListItemProps) {
  if (variant === "card") {
    return (
      <div
        className={`flex flex-col rounded-2xl border bg-white shadow-sm transition-colors h-full ${
          progress.learned ? "border-emerald-200" : "border-gray-200"
        }`}
      >
        {/* Top: word + icons */}
        <div className="flex items-start justify-between gap-1 px-3 pt-3 pb-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-indigo-600 leading-snug break-words">
              {vocab.kanji || vocab.hiragana}
              {vocab.kanji && (vocab.hiragana || vocab.onyomi) && (
                <span className="font-normal text-gray-500 text-xs">
                  {"\u300c"}{[vocab.hiragana, vocab.onyomi].filter(Boolean).join(" ")}{"\u300d"}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center shrink-0">
            <button
              onClick={() => onToggleFavorite(vocab.id)}
              title="Yêu thích"
              className={`w-7 h-7 flex items-center justify-center text-base transition-colors ${
                progress.favorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
              }`}
            >
              {"\u2605"}
            </button>
            <button
              onClick={() => onToggleLearned(vocab.id)}
              title={progress.learned ? "Đã học" : "Chưa học"}
              className={`w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors ${
                progress.learned
                  ? "text-emerald-500 hover:text-emerald-600"
                  : "text-gray-300 hover:text-emerald-400"
              }`}
            >
              {progress.learned ? "\u2713" : "\u25cb"}
            </button>
          </div>
        </div>

        {/* Meaning */}
        {vocab.meaning && (
          <p className="px-3 pb-1 text-xs text-gray-700 leading-snug break-words">{vocab.meaning}</p>
        )}

        {/* Phonetic */}
        {vocab.phonetic && (
          <p className="px-3 pb-2 text-xs text-gray-400 italic leading-snug">{vocab.phonetic}</p>
        )}

        {/* Bottom status strip */}
        <div
          className={`mt-auto px-3 py-1.5 rounded-b-2xl border-t text-xs ${
            progress.learned
              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
              : "bg-gray-50 border-gray-100 text-gray-400"
          }`}
        >
          {progress.learned ? "\u2713 \u0110\u00e3 h\u1ecdc" : "\u2013 Ch\u01b0a h\u1ecdc"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
        progress.learned ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"
      }`}
    >
      {/* Main content */}
      <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
        {vocab.kanji && (
          <div>
            <span className="text-xs text-gray-400">{FIELD_LABELS.kanji}</span>
            <p className="text-xl font-bold text-gray-800">{vocab.kanji}</p>
          </div>
        )}
        {vocab.hiragana && (
          <div>
            <span className="text-xs text-gray-400">{FIELD_LABELS.hiragana}</span>
            <p className="text-base text-indigo-700">{vocab.hiragana}</p>
          </div>
        )}
        {vocab.onyomi && (
          <div>
            <span className="text-xs text-gray-400">{FIELD_LABELS.onyomi}</span>
            <p className="text-sm text-purple-600">{vocab.onyomi}</p>
          </div>
        )}
        {vocab.meaning && (
          <div>
            <span className="text-xs text-gray-400">{FIELD_LABELS.meaning}</span>
            <p className="text-sm font-semibold text-emerald-700">{vocab.meaning}</p>
          </div>
        )}
        {vocab.phonetic && (
          <div>
            <span className="text-xs text-gray-400">{FIELD_LABELS.phonetic}</span>
            <p className="text-sm text-gray-500 italic">{vocab.phonetic}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onToggleFavorite(vocab.id)}
          title="Yêu thích"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center text-xl leading-none transition-colors ${
            progress.favorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
          }`}
        >
          ★
        </button>
        <button
          onClick={() => onToggleLearned(vocab.id)}
          title="Đã học"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border-2 transition-colors text-xs font-bold ${
            progress.learned
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-gray-300 text-gray-300 hover:border-emerald-400"
          }`}
        >
          {progress.learned ? "✓" : ""}
        </button>
        {onEdit && (
          <button
            onClick={() => onEdit(vocab)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Sửa"
          >
            <span className="text-base">✎</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => {
              if (confirm("Xóa từ này?")) onDelete(vocab.id);
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Xóa"
          >
            <span className="text-base">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
