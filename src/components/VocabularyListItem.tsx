"use client";

import { Vocabulary, VocabProgress, FIELD_LABELS } from "@/types";

interface VocabularyListItemProps {
  vocab: Vocabulary;
  progress: VocabProgress;
  onToggleLearned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function VocabularyListItem({
  vocab,
  progress,
  onToggleLearned,
  onToggleFavorite,
}: VocabularyListItemProps) {
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
      <div className="flex flex-col items-center gap-2 shrink-0">
        <button
          onClick={() => onToggleFavorite(vocab.id)}
          title="Yêu thích"
          className={`flex items-center justify-center min-h-[44px] min-w-[44px] text-xl leading-none transition-colors ${
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
      </div>
    </div>
  );
}
