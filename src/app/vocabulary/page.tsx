"use client";

import { useState, useMemo } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import FilterBar, { FilterTab } from "@/components/FilterBar";
import Link from "next/link";

export default function VocabularyPage() {
  const { lessons } = useLessons();
  const { notebooks } = useNotebooks();
  const { getVocabProgress, toggleLearned, toggleFavorite, progress } = useProgress();
  const [tab, setTab] = useState<FilterTab>("all");
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("all");
  const [selectedNotebook, setSelectedNotebook] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Get unique curriculums
  const curriculums = useMemo(() => {
    const unique = new Set(lessons.map((l) => l.curriculum).filter(Boolean));
    return Array.from(unique).sort();
  }, [lessons]);

  // Get all vocabulary with source info
  const allVocabWithSource = useMemo(() => {
    const lessonVocab = lessons.flatMap((l) =>
      l.vocabulary.map((v) => ({ ...v, source: "lesson" as const, curriculum: l.curriculum }))
    );
    const notebookVocab = notebooks.flatMap((nb) =>
      nb.vocabulary.map((v) => ({ ...v, source: "notebook" as const, notebookId: nb.id, notebookName: nb.name }))
    );
    return [...lessonVocab, ...notebookVocab];
  }, [lessons, notebooks]);

  // Filter by curriculum and notebook
  const filteredBySource = allVocabWithSource.filter((v) => {
    if (selectedCurriculum !== "all" && v.source === "lesson") {
      if (v.curriculum !== selectedCurriculum) return false;
    }
    if (selectedNotebook !== "all" && v.source === "notebook") {
      if (v.notebookId !== selectedNotebook) return false;
    }
    // If curriculum filter is active, only show lesson vocab
    if (selectedCurriculum !== "all" && v.source !== "lesson") return false;
    // If notebook filter is active, only show notebook vocab
    if (selectedNotebook !== "all" && v.source !== "notebook") return false;
    return true;
  });

  // Filter by search query
  const searchFiltered = filteredBySource.filter((v) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.kanji?.toLowerCase().includes(query) ||
      v.hiragana?.toLowerCase().includes(query) ||
      v.onyomi?.toLowerCase().includes(query) ||
      v.meaning?.toLowerCase().includes(query) ||
      v.phonetic?.toLowerCase().includes(query)
    );
  });

  const counts = {
    all: searchFiltered.length,
    learned: searchFiltered.filter((v) => progress[v.id]?.learned).length,
    unlearned: searchFiltered.filter((v) => !progress[v.id]?.learned).length,
    favorite: searchFiltered.filter((v) => progress[v.id]?.favorite).length,
  };

  const filtered = searchFiltered.filter((v) => {
    if (tab === "learned") return progress[v.id]?.learned;
    if (tab === "unlearned") return !progress[v.id]?.learned;
    if (tab === "favorite") return progress[v.id]?.favorite;
    return true;
  });

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Từ vựng</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
      </div>
      {allVocabWithSource.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-gray-400">Chưa có từ vựng nào</p>
          <Link href="/upload" className="text-indigo-600 underline text-sm">Upload từ vựng</Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                value={selectedCurriculum}
                onChange={(e) => {
                  setSelectedCurriculum(e.target.value);
                  if (e.target.value !== "all") setSelectedNotebook("all");
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Tất cả giáo trình</option>
                {curriculums.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <select
                value={selectedNotebook}
                onChange={(e) => {
                  setSelectedNotebook(e.target.value);
                  if (e.target.value !== "all") setSelectedCurriculum("all");
                }}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              >
                <option value="all">Tất cả sổ tay</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.name} ({nb.vocabulary.length} từ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm từ vựng..."
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-indigo-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            )}
          </div>

          <div className="mb-4">
            <FilterBar active={tab} onChange={setTab} counts={counts} />
          </div>
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Không có từ vựng nào</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((vocab) => (
                <VocabularyListItem
                  key={vocab.id}
                  vocab={vocab}
                  progress={getVocabProgress(vocab.id)}
                  onToggleLearned={toggleLearned}
                  onToggleFavorite={toggleFavorite}
                  variant="card"
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}