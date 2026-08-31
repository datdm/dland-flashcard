"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import FilterBar, { FilterTab } from "@/components/FilterBar";
import { Vocabulary } from "@/types";

type VocabFields = Omit<Vocabulary, "id">;

const EMPTY_FIELDS: VocabFields = {
  kanji: "",
  hiragana: "",
  onyomi: "",
  meaning: "",
  phonetic: "",
};

const FIELD_LABELS: { key: keyof VocabFields; label: string; placeholder: string }[] = [
  { key: "kanji", label: "Kanji / Từ", placeholder: "日本語" },
  { key: "hiragana", label: "Hiragana", placeholder: "にほんご" },
  { key: "onyomi", label: "Onyomi / Katakana", placeholder: "ニホンゴ" },
  { key: "meaning", label: "Nghĩa", placeholder: "Tiếng Nhật" },
  { key: "phonetic", label: "Phiên âm", placeholder: "nihongo" },
];

export default function LessonDetailPage() {
  const { id, lessonId } = useParams<{ id: string; lessonId: string }>();
  const { getCurriculumById, getLessonById, addVocab, updateVocab, deleteVocab, checkDuplicate, exportLesson, importVocabFromJson } = useCurriculums();
  const { toggleLearned, toggleFavorite, progress } = useProgress();
  const curriculum = getCurriculumById(id);
  const lesson = curriculum ? getLessonById(id, lessonId) : null;

  const [form, setForm] = useState<VocabFields>(EMPTY_FIELDS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [editFields, setEditFields] = useState<VocabFields>(EMPTY_FIELDS);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [importResult, setImportResult] = useState<{ msg: string; ok: boolean } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState<FilterTab>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!curriculum || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Không tìm thấy bài.</p>
        <Link href="/curriculums" className="text-indigo-600 underline text-sm">
          ← Giáo trình
        </Link>
      </div>
    );
  }

  const isFormValid = Object.values(form).some((v) => v?.trim());

  const handleAdd = () => {
    if (!isFormValid) return;

    const duplicate = checkDuplicate(id, lessonId, form.kanji, form.hiragana);
    if (duplicate) {
      setDuplicateError("Từ vựng này đã tồn tại trong bài này");
      return;
    }

    addVocab(id, lessonId, form);
    setForm(EMPTY_FIELDS);
    setDuplicateError(null);
    setShowAddModal(false);
  };

  const startEdit = (v: Vocabulary) => {
    setEditingVocab(v);
    setEditFields({
      kanji: v.kanji ?? "",
      hiragana: v.hiragana ?? "",
      onyomi: v.onyomi ?? "",
      meaning: v.meaning ?? "",
      phonetic: v.phonetic ?? "",
    });
    setDuplicateError(null);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingVocab) return;

    const duplicate = checkDuplicate(id, lessonId, editFields.kanji, editFields.hiragana, editingVocab.id);
    if (duplicate) {
      setDuplicateError("Từ vựng này đã tồn tại trong bài này");
      return;
    }

    updateVocab(id, lessonId, editingVocab.id, editFields);
    setDuplicateError(null);
    setShowEditModal(false);
    setEditingVocab(null);
  };

  const handleExport = () => {
    const json = exportLesson(id, lessonId);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lesson-${lesson.name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = importVocabFromJson(id, lessonId, text);
      if (result.error) {
        setImportResult({ msg: result.error, ok: false });
      } else {
        setImportResult({ msg: `Đã import ${result.imported} từ`, ok: true });
      }
    };
    reader.readAsText(file);
  };

  // Filter vocabulary by search query
  const filteredVocabulary = lesson.vocabulary.filter((v) => {
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

  // Calculate filter counts
  const counts = {
    all: filteredVocabulary.length,
    learned: filteredVocabulary.filter((v) => progress[v.id]?.learned).length,
    unlearned: filteredVocabulary.filter((v) => !progress[v.id]?.learned).length,
    favorite: filteredVocabulary.filter((v) => progress[v.id]?.favorite).length,
  };

  // Apply tab filter
  const tabFiltered = filteredVocabulary.filter((v) => {
    if (tab === "learned") return progress[v.id]?.learned;
    if (tab === "unlearned") return !progress[v.id]?.learned;
    if (tab === "favorite") return progress[v.id]?.favorite;
    return true;
  });

  // Pagination
  const ITEMS_PER_PAGE = 30;
  const totalPages = Math.ceil(tabFiltered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedVocabulary = tabFiltered.slice(startIdx, endIdx);

  // Reset to page 1 when search or tab changes
  if ((searchQuery || tab) && currentPage !== 1) {
    setCurrentPage(1);
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-5">
      {/* Header */}
      <div className="mb-4">
        <Link href={`/curriculums/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← {curriculum.name}
        </Link>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{lesson.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{lesson.vocabulary.length} từ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm bg-indigo-600 text-white rounded-xl px-3 py-1.5 font-semibold hover:bg-indigo-700 transition-colors"
          >
            + Thêm từ
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-sm border border-gray-300 rounded-xl px-3 py-1.5 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            Import
          </button>
          <input ref={fileRef} type="file" accept=".json" className="sr-only" onChange={handleImportFile} />
          <button
            onClick={handleExport}
            className="text-sm border border-gray-300 rounded-xl px-3 py-1.5 text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
          >
            Export
          </button>
          {lesson.vocabulary.length > 0 && (
            <Link
              href={`/flashcard/curriculum/${id}/lesson/${lessonId}`}
              className="text-sm border border-gray-300 rounded-xl px-3 py-1.5 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              Flashcard
            </Link>
          )}
        </div>
      </div>

      {importResult && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${importResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-600"}`}>
          {importResult.ok ? "✓" : "✗"} {importResult.msg}
        </div>
      )}

      {/* Search input */}
      {lesson.vocabulary.length > 0 && (
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
      )}

      {/* Filter tabs */}
      {lesson.vocabulary.length > 0 && (
        <div className="mb-4">
          <FilterBar active={tab} onChange={setTab} counts={counts} />
        </div>
      )}

      {searchQuery && lesson.vocabulary.length > 0 && (
        <div className="mb-3 text-xs text-gray-500">
          Hiển thị {filteredVocabulary.length} / {lesson.vocabulary.length} từ
        </div>
      )}

      {!searchQuery && lesson.vocabulary.length > 0 && totalPages > 1 && (
        <div className="mb-3 text-xs text-gray-500">
          Trang {currentPage} / {totalPages} • {tabFiltered.length} từ
        </div>
      )}

      {/* Vocabulary list */}
      {lesson.vocabulary.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Chưa có từ nào. Thêm từ đầu tiên ở trên!</p>
        </div>
      ) : filteredVocabulary.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-4xl mb-3">🔍</p>
          <p>Không tìm thấy từ vựng nào</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paginatedVocabulary.map((v) => (
              <VocabularyListItem
                key={v.id}
                vocab={v}
                progress={progress[v.id] || { learned: false, favorite: false }}
                onToggleLearned={toggleLearned}
                onToggleFavorite={toggleFavorite}
                onEdit={startEdit}
                onDelete={(vocabId) => deleteVocab(id, lessonId, vocabId)}
              />
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && !searchQuery && (
            <div className="flex items-center justify-center gap-2 mt-6 mb-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 transition-colors"
              >
                ← Trước
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;
                  const isNear = Math.abs(page - currentPage) <= 2;
                  const isEnd = page === totalPages;
                  const isStart = page === 1;

                  if (isNear || isStart || isEnd) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (i === currentPage - 3 || i === currentPage + 1) {
                    return (
                      <span key={`dots-${i}`} className="text-gray-400">
                        …
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 transition-colors"
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Add vocab modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 my-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thêm từ mới</h2>

            {duplicateError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {duplicateError}
              </div>
            )}

            {FIELD_LABELS.map(({ key, label, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setForm(EMPTY_FIELDS);
                  setShowAddModal(false);
                  setDuplicateError(null);
                }}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                + Thêm từ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit vocab modal */}
      {showEditModal && editingVocab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 my-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Chỉnh sửa từ</h2>

            {duplicateError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {duplicateError}
              </div>
            )}

            {FIELD_LABELS.map(({ key, label, placeholder }) => (
              <div key={key} className="mb-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  value={editFields[key]}
                  onChange={(e) => setEditFields((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            ))}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVocab(null);
                  setDuplicateError(null);
                }}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
