"use client";

import { useState, useMemo, useEffect } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import FilterBar, { FilterTab } from "@/components/FilterBar";
import Link from "next/link";
import { Vocabulary } from "@/types";

export default function VocabularyPage() {
  const { curriculums } = useCurriculums();
  const { notebooks, addVocab } = useNotebooks();
  const { getVocabProgress, toggleLearned, toggleFavorite, progress } = useProgress();

  const [tab, setTab] = useState<FilterTab>("all");
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("all");
  const [selectedNotebook, setSelectedNotebook] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  // State for Add to Notebook modal
  const [selectedWordForNotebook, setSelectedWordForNotebook] = useState<Vocabulary | null>(null);
  const [targetNotebookId, setTargetNotebookId] = useState<string>("");

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
          curriculumName: curr.name,
        }))
      )
    );
    const notebookVocab = notebooks.flatMap((nb) =>
      nb.vocabulary.map((v) => ({
        ...v,
        source: "notebook" as const,
        notebookId: nb.id,
        notebookName: nb.name,
      }))
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
    if (selectedCurriculum !== "all" && v.source !== "curriculum") return false;
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

  const handleSaveToNotebook = async () => {
    if (!selectedWordForNotebook || !targetNotebookId) return;

    const vocab = await addVocab(targetNotebookId, {
      kanji: selectedWordForNotebook.kanji,
      hiragana: selectedWordForNotebook.hiragana,
      onyomi: selectedWordForNotebook.onyomi,
      meaning: selectedWordForNotebook.meaning,
      phonetic: selectedWordForNotebook.phonetic,
    });

    if (vocab) {
      setSelectedWordForNotebook(null);
      setTargetNotebookId("");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 rounded-3xl p-6 text-white shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
              KHO TỪ VỰNG TỔNG HỢP
            </span>
            <h1 className="text-2xl font-bold mt-2">Kho Từ Vựng & Sổ Tay</h1>
            <p className="text-xs text-indigo-100 mt-1">
              Quản lý từ vựng bài học Minna no Nihongo, Soumatome và các Sổ tay cá nhân
            </p>
          </div>

          {/* Quick Action Links to Notebooks & Search */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/notebooks"
              className="px-4 py-2.5 bg-white text-indigo-700 font-bold rounded-2xl text-xs hover:bg-indigo-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span>📓 Quản lý Sổ tay</span>
            </Link>
            <Link
              href="/search"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 text-xs transition-colors flex items-center gap-1.5"
            >
              <span>🔍 Tra từ mới</span>
            </Link>
          </div>
        </div>
      </div>

      {allVocabWithSource.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 shadow-2xs">
          <div className="text-4xl mb-2">📝</div>
          <p className="font-semibold text-gray-700">Chưa có từ vựng nào trong kho</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Bạn có thể tạo sổ tay hoặc upload bài học JSON</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/notebooks"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              + Tạo Sổ tay mới
            </Link>
            <Link
              href="/upload"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
            >
              Upload file JSON
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Source Dropdown Filters */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Theo Giáo trình:</label>
              <select
                value={selectedCurriculum}
                onChange={(e) => {
                  setSelectedCurriculum(e.target.value);
                  if (e.target.value !== "all") setSelectedNotebook("all");
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="all">Tất cả giáo trình (N5 ➔ N2)</option>
                {curriculumList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Theo Sổ tay cá nhân:</label>
              <select
                value={selectedNotebook}
                onChange={(e) => {
                  setSelectedNotebook(e.target.value);
                  if (e.target.value !== "all") setSelectedCurriculum("all");
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-500 shadow-2xs"
              >
                <option value="all">Tất cả sổ tay ({notebooks.length})</option>
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    {nb.name} ({nb.vocabulary.length} từ)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar & View Mode Toggle */}
          <div className="mb-4 flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm từ vựng (vd: 日本語, にほん, tieng nhat...)..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-xs focus:outline-none focus:border-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex bg-white p-1 border border-gray-200 rounded-2xl">
              <button
                onClick={() => setViewMode("card")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewMode === "card" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"
                }`}
                title="Dạng Thẻ (Grid Card)"
              >
                🎴 Thẻ
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  viewMode === "list" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"
                }`}
                title="Dạng Danh Sách (List)"
              >
                📄 Dòng
              </button>
            </div>
          </div>

          {/* Status Tabs */}
          <div className="mb-5">
            <FilterBar active={tab} onChange={setTab} counts={counts} />
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center text-gray-400 border border-gray-100">
              Không tìm thấy từ vựng nào phù hợp
            </div>
          ) : (
            <>
              {/* Vocab Items Grid / List */}
              {viewMode === "card" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginatedVocab.map((vocab) => {
                    const nbInfo = vocab.source === "notebook"
                      ? { id: vocab.notebookId, name: vocab.notebookName }
                      : undefined;

                    return (
                      <VocabularyListItem
                        key={vocab.id}
                        vocab={vocab}
                        progress={getVocabProgress(vocab.id)}
                        onToggleLearned={toggleLearned}
                        onToggleFavorite={toggleFavorite}
                        onAddToNotebook={(v) => setSelectedWordForNotebook(v)}
                        notebookInfo={nbInfo}
                        variant="card"
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedVocab.map((vocab) => {
                    const nbInfo = vocab.source === "notebook"
                      ? { id: vocab.notebookId, name: vocab.notebookName }
                      : undefined;

                    return (
                      <VocabularyListItem
                        key={vocab.id}
                        vocab={vocab}
                        progress={getVocabProgress(vocab.id)}
                        onToggleLearned={toggleLearned}
                        onToggleFavorite={toggleFavorite}
                        onAddToNotebook={(v) => setSelectedWordForNotebook(v)}
                        notebookInfo={nbInfo}
                        variant="list"
                      />
                    );
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 text-xs font-semibold shadow-2xs"
                  >
                    ← Trang trước
                  </button>

                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          currentPage === page
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold shadow-xs"
                  >
                    Trang sau →
                  </button>
                </div>
              )}

              <div className="text-xs text-gray-400 text-center mt-4 font-medium">
                Trang {currentPage} / {totalPages} • Hiển thị {paginatedVocab.length} trong tổng số {filtered.length} từ
              </div>
            </>
          )}
        </>
      )}

      {/* Add to Notebook Modal */}
      {selectedWordForNotebook && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-base text-gray-900 mb-2">Thêm từ vào Sổ tay</h3>
            <p className="text-xs text-gray-500 mb-4">
              Từ: <span className="font-bold text-indigo-600">{selectedWordForNotebook.kanji || selectedWordForNotebook.hiragana}</span> ({selectedWordForNotebook.meaning})
            </p>

            <label className="block text-xs font-semibold text-gray-700 mb-2">Chọn Sổ tay:</label>
            <select
              value={targetNotebookId}
              onChange={(e) => setTargetNotebookId(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 text-sm mb-6 focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Chọn sổ tay --</option>
              {notebooks.map((nb) => (
                <option key={nb.id} value={nb.id}>
                  {nb.name} ({nb.vocabulary.length} từ)
                </option>
              ))}
            </select>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedWordForNotebook(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveToNotebook}
                disabled={!targetNotebookId}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                Lưu vào Sổ tay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
