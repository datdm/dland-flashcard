"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Vocabulary } from "@/types";
import { useProgress } from "@/hooks/useProgress";
import { useFlashCardSettings } from "@/hooks/useFlashCardSettings";
import { shuffle, seededShuffle } from "@/lib/shuffle";
import FlashCard from "./FlashCard";
import FlashCardSettingsPanel from "./FlashCardSettingsPanel";

interface FlashCardViewerProps {
  vocabulary: Vocabulary[];
  title?: string;
  dailyLimit?: number;
}

export default function FlashCardViewer({ vocabulary, title, dailyLimit }: FlashCardViewerProps) {
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
      
      // If dailyLimit is active, we always default to unlearned words only
      if (unlearnedOnly || dailyLimit) {
        list = list.filter((v) => !getVocabProgress(v.id).learned);
      }
      
      if (dailyLimit && list.length > dailyLimit) {
        const todayStr = new Date().toISOString().split("T")[0];
        const seedStr = todayStr + (title || "daily");
        list = seededShuffle(list, seedStr).slice(0, dailyLimit);
      }
      
      return isShuffled ? shuffle(list) : list;
    },
    [vocabulary, getVocabProgress, dailyLimit, title]
  );

  useEffect(() => {
    setDeck(buildDeck(shuffled, filterUnlearned));
    setIndex(0);
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vocabulary]);

  const handleToggleLearned = useCallback((id: string) => {
    toggleLearned(id);
    
    // If the word was marked as learned, remove it from the current session deck
    const isNowLearned = !getVocabProgress(id).learned;
    if (isNowLearned) {
      setDeck((prevDeck) => {
        const newDeck = prevDeck.filter((v) => v.id !== id);
        // Adjust index if it's now out of bounds
        setIndex((prevIndex) => {
          if (prevIndex >= newDeck.length) {
            return Math.max(0, newDeck.length - 1);
          }
          return prevIndex;
        });
        setFlipped(false);
        return newDeck;
      });
    }
  }, [toggleLearned, getVocabProgress]);

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
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 text-center max-w-xl mx-auto">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="font-bold text-gray-900 text-lg mb-1">Không có từ vựng nào</h3>
        <p className="text-sm text-gray-500">Danh sách hiện tại đang trống.</p>
      </div>
    );
  }

  if (deck.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 text-center max-w-xl mx-auto">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="font-extrabold text-gray-900 text-xl mb-2">Tuyệt vời!</h3>
        <p className="text-sm text-gray-500 mb-6">Tất cả từ vựng đã được học thuộc.</p>
        <button
          onClick={toggleFilter}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors"
        >
          Ôn tập lại tất cả
        </button>
      </div>
    );
  }

  const vocabProgress = current ? getVocabProgress(current.id) : null;
  const progressPercent = deck.length > 0 ? ((index + 1) / deck.length) * 100 : 0;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pb-8">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Phiên ôn tập
            </span>
          </div>
          {title && <h1 className="text-xl font-bold text-gray-900 truncate" title={title}>{title}</h1>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={toggleFilter}
            title="Lọc chưa học"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterUnlearned
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span>{filterUnlearned ? "🎯 Chưa học" : "⭕ Tất cả"}</span>
          </button>
          <button
            onClick={toggleShuffle}
            title="Trộn ngẫu nhiên"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              shuffled
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            <span>🔀 Trộn</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            title="Cài đặt"
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mb-8 px-2">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Tiến độ
          </span>
          <span className="text-sm font-bold text-indigo-600">
            {index + 1} <span className="text-gray-400">/ {deck.length}</span>
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Card — with swipe support */}
      <div className="relative mb-8 z-10 px-2 sm:px-0">
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
            <div className="text-center mt-3 hidden sm:block">
              <span className="text-xs font-semibold text-gray-400">Nhấp vào thẻ hoặc vuốt để lật</span>
            </div>
            <div className="text-center mt-3 sm:hidden">
              <span className="text-xs font-semibold text-gray-400">Vuốt trái/phải để chuyển • Chạm để lật</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons & Navigation */}
      <div className="flex flex-col gap-4 px-2 sm:px-0">
        {/* State Toggles */}
        {current && vocabProgress && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => toggleFavorite(current.id)}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                vocabProgress.favorite
                  ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                  : "bg-white border-gray-100 text-gray-500 hover:border-yellow-200 hover:bg-yellow-50/50"
              }`}
            >
              <span className="text-xl leading-none">{vocabProgress.favorite ? "⭐" : "☆"}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {vocabProgress.favorite ? "Yêu thích" : "Đánh dấu"}
              </span>
            </button>
            <button
              onClick={() => handleToggleLearned(current.id)}
              className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                vocabProgress.learned
                  ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                  : "bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50"
              }`}
            >
              <span className="text-xl leading-none">{vocabProgress.learned ? "✅" : "⭕"}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {vocabProgress.learned ? "Đã học" : "Chưa học"}
              </span>
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            onClick={() => go(-1)}
            disabled={index === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 disabled:opacity-40 disabled:bg-gray-50 hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-sm shadow-xs"
          >
            <span>←</span>
            <span>Quay lại</span>
          </button>
          
          <button
            onClick={() => {
              setIndex(0);
              setFlipped(false);
            }}
            className="p-3.5 sm:p-3 rounded-2xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-xs"
            title="Bắt đầu lại"
          >
            🔄
          </button>
          
          <button
            onClick={() => go(1)}
            disabled={index === deck.length - 1}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-3 rounded-2xl bg-indigo-600 border border-transparent text-white disabled:opacity-40 disabled:bg-gray-300 disabled:border-transparent hover:bg-indigo-700 transition-all font-bold text-sm shadow-sm"
          >
            <span>Tiếp theo</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
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
