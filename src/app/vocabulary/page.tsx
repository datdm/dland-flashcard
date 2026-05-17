"use client";

import { useState, useMemo, useEffect } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import FilterBar, { FilterTab } from "@/components/FilterBar";
import Link from "next/link";

export default function VocabularyPage() {
  const { curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const { getVocabProgress, toggleLearned, toggleFavorite, progress } = useProgress();
  const [tab, setTab] = useState<FilterTab>("all");
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("all");
  const [selectedNotebook, setSelectedNotebook] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  // Get curriculum list
  const curriculumList = useMemo(() => {
    return curriculums.map((c) => ({ id: c.id, name: c.name }));
  }, [curriculums]);

  // Get all vocabulary with source info
  const allVocabWithSource = useMemo(() => {
    const curriculumVocab = curriculums.flatMap((curr) => 
      curr.lessons.flatMap((lesson) =>
        lesson.vocabulary.map((v) => ({ 
          ...v, 
          source: "curriculum" as const, 
          curriculumId: curr.id,
          curriculumName: curr.name 
        }))
      )
    );
    const notebookVocab = notebooks.flatMap((nb) =>
      nb.vocabulary.map((v) => ({ ...v, source: "notebook" as const, notebookId: nb.id, notebookName: nb.name }))
    );
    return [...curriculumVocab, ...notebookVocab];
  }, [curriculums, notebooks]);

  // Filter by curriculum and notebook
  const filteredBySource = allVocabWithSource.filter((v) => {
    if (selectedCurriculum !== "all" && v.source === "curriculum") {
      if (v.curriculumId !== selectedCurriculum) return false;
    }
    if (selectedNotebook !== "all" && v.source === "notebook") {
      if (v.notebookId !== selectedNotebook) return false;
    }
    // If curriculum filter is active, only show curriculum vocab
    if (selectedCurriculum !== "all" && v.source !== "curriculum") return false;
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedVocab = filtered.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, searchQuery, selectedCurriculum, selectedNotebook]);

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
                {curriculumList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
        <div className="text-center py-8 text-gray-500">
          Không tìm thấy từ vựng nào
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {paginatedVocab.map((vocab) => (
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                ← Trang trước
              </button>

              <div className="flex items-center gap-2 overflow-x-auto py-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
              >
                Trang sau →
              </button>
            </div>
          )}

          <div className="text-sm text-gray-500 text-center mt-4">
            Trang {currentPage} / {totalPages} • Tổng cộng: {filtered.length} từ
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

