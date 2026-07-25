"use client";

import { Vocabulary, CardSideSettings, FIELD_LABELS, ALL_FIELDS } from "@/types";

interface FlashCardFaceProps {
  vocab: Vocabulary;
  settings: CardSideSettings;
}

function FlashCardFace({ vocab, settings }: FlashCardFaceProps) {
  const visibleFields = ALL_FIELDS.filter((f) => settings[f] && vocab[f]);

  const speakText = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const japaneseText = vocab.kanji || vocab.hiragana || "";

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center relative">
      {japaneseText && (
        <button
          onClick={(e) => speakText(e, japaneseText)}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors text-base"
          title="Nghe phát âm"
        >
          🔊
        </button>
      )}

      {visibleFields.length === 0 ? (
        <p className="text-gray-400 text-xs">Không có trường nào được chọn hiển thị</p>
      ) : (
        visibleFields.map((field) => (
          <div key={field} className="flex flex-col items-center">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">
              {FIELD_LABELS[field]}
            </span>
            <span
              className={
                field === "kanji"
                  ? "text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight"
                  : field === "hiragana"
                  ? "text-2xl font-bold text-indigo-600 font-mono"
                  : field === "onyomi"
                  ? "text-lg font-semibold text-purple-600"
                  : field === "meaning"
                  ? "text-2xl font-extrabold text-emerald-700"
                  : "text-base text-gray-500 italic"
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
      className="w-full h-72 sm:h-80 cursor-pointer select-none"
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
        {/* Front Side */}
        <div
          className="absolute inset-0 rounded-3xl border border-gray-100 bg-white shadow-lg flex flex-col justify-between overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <FlashCardFace vocab={vocab} settings={frontSettings} />
          <div className="bg-gray-50/80 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span>Mặt trước (Front)</span>
            <span className="font-semibold text-indigo-600">Nhấn để lật thẻ ↻</span>
          </div>
        </div>

        {/* Back Side */}
        <div
          className="absolute inset-0 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 shadow-lg flex flex-col justify-between overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <FlashCardFace vocab={vocab} settings={backSettings} />
          <div className="bg-indigo-100/50 px-4 py-2 border-t border-indigo-100 flex items-center justify-between text-[11px] text-indigo-600">
            <span>Mặt sau (Back)</span>
            <span className="font-semibold text-purple-600">Nhấn để lật thẻ ↺</span>
          </div>
        </div>
      </div>
    </div>
  );
}
