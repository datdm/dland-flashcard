"use client";

import { Vocabulary, CardSideSettings, FIELD_LABELS, ALL_FIELDS } from "@/types";

interface FlashCardFaceProps {
  vocab: Vocabulary;
  settings: CardSideSettings;
}

function FlashCardFace({ vocab, settings }: FlashCardFaceProps) {
  const visibleFields = ALL_FIELDS.filter((f) => settings[f] && vocab[f]);
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
      {visibleFields.length === 0 ? (
        <p className="text-gray-400 text-sm">Không có trường nào được chọn</p>
      ) : (
        visibleFields.map((field) => (
          <div key={field} className="flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">
              {FIELD_LABELS[field]}
            </span>
            <span
              className={
                field === "kanji"
                  ? "text-4xl font-bold text-gray-800"
                  : field === "hiragana"
                  ? "text-2xl text-indigo-700"
                  : field === "onyomi"
                  ? "text-xl text-purple-600"
                  : field === "meaning"
                  ? "text-2xl font-semibold text-emerald-700"
                  : "text-lg text-gray-600 italic"
              }
            >
              {vocab[field]}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

interface FlashCardProps {
  vocab: Vocabulary;
  frontSettings: CardSideSettings;
  backSettings: CardSideSettings;
  flipped: boolean;
  onClick: () => void;
}

export default function FlashCard({
  vocab,
  frontSettings,
  backSettings,
  flipped,
  onClick,
}: FlashCardProps) {
  return (
    <div
      className="w-full h-64 cursor-pointer select-none"
      style={{ perspective: "1000px" }}
      onClick={onClick}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl border border-gray-200 bg-white shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <FlashCardFace vocab={vocab} settings={frontSettings} />
          <span className="absolute bottom-3 right-4 text-xs text-gray-300">Nhấn để lật</span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl border border-indigo-100 bg-indigo-50 shadow-lg"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <FlashCardFace vocab={vocab} settings={backSettings} />
          <span className="absolute bottom-3 right-4 text-xs text-indigo-200">Nhấn để lật</span>
        </div>
      </div>
    </div>
  );
}
