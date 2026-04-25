"use client";

import { useState } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import FilterBar, { FilterTab } from "@/components/FilterBar";
import Link from "next/link";

export default function VocabularyPage() {
  const { lessons } = useLessons();
  const { getVocabProgress, toggleLearned, toggleFavorite, progress } = useProgress();
  const [tab, setTab] = useState<FilterTab>("all");

  const allVocab = lessons.flatMap((l) => l.vocabulary);

  const counts = {
    all: allVocab.length,
    learned: allVocab.filter((v) => progress[v.id]?.learned).length,
    unlearned: allVocab.filter((v) => !progress[v.id]?.learned).length,
    favorite: allVocab.filter((v) => progress[v.id]?.favorite).length,
  };

  const filtered = allVocab.filter((v) => {
    if (tab === "learned") return progress[v.id]?.learned;
    if (tab === "unlearned") return !progress[v.id]?.learned;
    if (tab === "favorite") return progress[v.id]?.favorite;
    return true;
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Từ vựng</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
      </div>
      {allVocab.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-gray-400">Chưa có từ vựng nào</p>
          <Link href="/upload" className="text-indigo-600 underline text-sm">Upload từ vựng</Link>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <FilterBar active={tab} onChange={setTab} counts={counts} />
          </div>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Không có từ vựng nào trong mục này</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((vocab) => (
                <VocabularyListItem
                  key={vocab.id}
                  vocab={vocab}
                  progress={getVocabProgress(vocab.id)}
                  onToggleLearned={toggleLearned}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}