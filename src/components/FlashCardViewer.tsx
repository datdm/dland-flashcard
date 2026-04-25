"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Vocabulary } from "@/types";
import { useProgress } from "@/hooks/useProgress";
import { useFlashCardSettings } from "@/hooks/useFlashCardSettings";
import { shuffle } from "@/lib/shuffle";
import FlashCard from "./FlashCard";
import FlashCardSettingsPanel from "./FlashCardSettingsPanel";

interface FlashCardViewerProps {
  vocabulary: Vocabulary[];
  title?: string;
}

export default function FlashCardViewer({ vocabulary, title }: FlashCardViewerProps) {
  const { getVocabProgress, toggleLearned, toggleFavorite } = useProgress();
  const { settings, saveSettings } = useFlashCardSettings();

  const [deck, setDeck] = useState<Vocabulary[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [filterUnlearned, setFilterUnlearned] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const buildDeck = useCallback(
    (isShuffled: boolean, unlearnedOnly: boolean) => {
      let list = vocabulary;
      if (unlearnedOnly) {
        list = list.filter((v) => !getVocabProgress(v.id).learned);
      }
      return isShuffled ? shuffle(list) : list;
    },
    [vocabulary, getVocabProgress]
  );

  useEffect(() => {
    setDeck(buildDeck(shuffled, filterUnlearned));
    setIndex(0);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabulary]);

  const current = deck[index];

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    // Ignore if vertical swipe dominates (scrolling)
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx > 80) go(1);
    else if (dx < -80) go(-1);
  };

  const go = (dir: -1 | 1) => {
    setIndex((i) => Math.min(Math.max(0, i + dir), deck.length - 1));
    setFlipped(false);
  };

  const toggleShuffle = () => {
    const next = !shuffled;
    setShuffled(next);
    const newDeck = buildDeck(next, filterUnlearned);
    setDeck(newDeck);
    setIndex(0);
    setFlipped(false);
  };

  const toggleFilter = () => {
    const next = !filterUnlearned;
    setFilterUnlearned(next);
    const newDeck = buildDeck(shuffled, next);
    setDeck(newDeck);
    setIndex(0);
    setFlipped(false);
  };

  if (vocabulary.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        Không có từ vựng nào.
      </div>
    );
  }

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-gray-500">Tất cả từ đã được học!</p>
        <button
          onClick={toggleFilter}
          className="text-indigo-600 text-sm underline"
        >
          Hiện tất cả từ vựng
        </button>
      </div>
    );
  }

  const vocabProgress = current ? getVocabProgress(current.id) : null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        {title && <h1 className="text-xl font-bold text-gray-800 truncate">{title}</h1>}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={toggleFilter}
            title="Lọc chưa học"
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filterUnlearned
                ? "bg-amber-500 border-amber-500 text-white"
                : "border-gray-300 text-gray-500 hover:border-amber-400"
            }`}
          >
            Chưa học
          </button>
          <button
            onClick={toggleShuffle}
            title="Trộn ngẫu nhiên"
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              shuffled
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "border-gray-300 text-gray-500 hover:border-indigo-400"
            }`}
          >
            🔀 Trộn
          </button>
          <button
            onClick={() => setShowSettings(true)}
            title="Cài đặt"
            className="text-xs px-2.5 py-1 rounded-full border border-gray-300 text-gray-500 hover:border-indigo-400 transition-colors"
          >
            ⚙ Cài đặt
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((index + 1) / deck.length) * 100}%` }}
        />
      </div>
      <p className="text-right text-xs text-gray-400 -mt-2">
        {index + 1} / {deck.length}
      </p>

      {/* Card — with swipe support */}
      {current && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="touch-pan-y select-none"
        >
          <FlashCard
            vocab={current}
            frontSettings={settings.front}
            backSettings={settings.back}
            flipped={flipped}
            onClick={() => setFlipped((f) => !f)}
          />
          <p className="text-center text-xs text-gray-300 mt-2 sm:hidden">
            ← Vuốt trái/phải để chuyển thẻ →
          </p>
        </div>
      )}

      {/* Action buttons */}
      {current && vocabProgress && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => toggleFavorite(current.id)}
            title="Yêu thích"
            className={`flex items-center gap-1.5 px-4 py-3 sm:py-2 rounded-xl border text-sm font-medium transition-colors min-h-[44px] ${
              vocabProgress.favorite
                ? "bg-yellow-400 border-yellow-400 text-white"
                : "border-gray-300 text-gray-500 hover:border-yellow-300"
            }`}
          >
            ★ {vocabProgress.favorite ? "Đã yêu thích" : "Yêu thích"}
          </button>
          <button
            onClick={() => toggleLearned(current.id)}
            title="Đánh dấu đã học"
            className={`flex items-center gap-1.5 px-4 py-3 sm:py-2 rounded-xl border text-sm font-medium transition-colors min-h-[44px] ${
              vocabProgress.learned
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "border-gray-300 text-gray-500 hover:border-emerald-400"
            }`}
          >
            ✓ {vocabProgress.learned ? "Đã học" : "Đánh dấu đã học"}
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="px-5 py-3 sm:py-2 rounded-xl border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors font-medium min-h-[44px]"
        >
          ← Trước
        </button>
        <button
          onClick={() => {
            setIndex(0);
            setFlipped(false);
          }}
          className="text-sm text-gray-400 hover:text-indigo-600 transition-colors py-3 sm:py-0"
        >
          Bắt đầu lại
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === deck.length - 1}
          className="px-5 py-3 sm:py-2 rounded-xl border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors font-medium min-h-[44px]"
        >
          Sau →
        </button>
      </div>

      {showSettings && (
        <FlashCardSettingsPanel
          settings={settings}
          onSave={saveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
