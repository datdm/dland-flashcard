"use client";

import { useState, useRef, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
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

export default function NotebookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { notebooks, addVocab, updateVocab, deleteVocab, moveVocab, exportNotebook, importVocabFromJson, checkDuplicate } = useNotebooks();
  const { getVocabProgress, toggleLearned, toggleFavorite, progress } = useProgress();
  
  const [form, setForm] = useState<VocabFields>(EMPTY_FIELDS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVocab, setEditingVocab] = useState<Vocabulary | null>(null);
  const [editFields, setEditFields] = useState<VocabFields>(EMPTY_FIELDS);
  const [targetNotebookId, setTargetNotebookId] = useState<string>("");
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [importResult, setImportResult] = useState<{ msg: string; ok: boolean } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState<FilterTab>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const notebook = notebooks.find((nb) => nb.id === id);

    // Reset to page 1 when search or tab changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, tab]);

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Không tìm thấy sổ tay.</p>
        <Link href="/notebooks" className="text-indigo-600 underline text-sm">← Sổ tay</Link>
      </div>
    );
  }

  const isFormValid = Object.values(form).some((v) => v?.trim());

  const handleAdd = () => {
    if (!isFormValid) return;
    
    // Check for duplicates
    const duplicates = checkDuplicate(id, form.kanji, form.hiragana);
    if (duplicates && duplicates.length > 0) {
      // Find duplicates in OTHER notebooks
      const otherDuplicates = duplicates.filter(d => d.notebookId !== id);
      if (otherDuplicates.length > 0) {
        const notebookNames = otherDuplicates.map(d => `"${d.notebookName}"`).join(", ");
        setDuplicateError(`Từ này đã tồn tại trong sổ tay: ${notebookNames}`);
      } else {
        // Duplicate in current notebook only
        setDuplicateError("Từ vựng này đã tồn tại trong sổ tay này");
      }
      return;
    }
    
    addVocab(id, form);
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
    setTargetNotebookId("");
    setDuplicateError(null);
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingVocab) return;
    
    // Check for duplicates, excluding the current vocab being edited
    const duplicates = checkDuplicate(id, editFields.kanji, editFields.hiragana, editingVocab.id);
    if (duplicates && duplicates.length > 0) {
      // Find duplicates in OTHER notebooks
      const otherDuplicates = duplicates.filter(d => d.notebookId !== id);
      if (otherDuplicates.length > 0) {
        const notebookNames = otherDuplicates.map(d => `"${d.notebookName}"`).join(", ");
        setDuplicateError(`Từ này đã tồn tại trong sổ tay: ${notebookNames}`);
      } else {
        // Duplicate in current notebook only
        setDuplicateError("Từ vựng này đã tồn tại trong sổ tay này");
      }
      return;
    }
    
    updateVocab(id, editingVocab.id, editFields);
    setDuplicateError(null);
    setShowEditModal(false);
    setEditingVocab(null);
  };

  const handleMove = () => {
    if (!editingVocab || !targetNotebookId) return;
    
    moveVocab(id, targetNotebookId, editingVocab.id);
    setShowEditModal(false);
    setEditingVocab(null);
    setTargetNotebookId("");
    setDuplicateError(null);
  };

  const handleExport = () => {
    const json = exportNotebook(id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notebook-${notebook.name.replace(/\s+/g, "-")}.json`;
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
      const result = importVocabFromJson(id, text);
      if (result.error) {
        setImportResult({ msg: result.error, ok: false });
      } else {
        setImportResult({ msg: `Đã import ${result.imported} từ`, ok: true });
      }
    };
    reader.readAsText(file);
  };

  // Filter vocabulary by search query
  const filteredVocabulary = notebook.vocabulary.filter((v) => {
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


  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-4">
        <Link href="/notebooks" className="text-sm text-indigo-600 hover:underline">← Sổ tay</Link>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{notebook.name}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{notebook.vocabulary.length} từ</p>
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
          {notebook.vocabulary.length > 0 && (
            <Link
              href={`/flashcard/notebook/${id}`}
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
      {notebook.vocabulary.length > 0 && (
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
      {notebook.vocabulary.length > 0 && (
        <div className="mb-4">
          <FilterBar active={tab} onChange={setTab} counts={counts} />
        </div>
      )}

      {searchQuery && notebook.vocabulary.length > 0 && (
        <div className="mb-3 text-xs text-gray-500">
          Hiển thị {filteredVocabulary.length} / {notebook.vocabulary.length} từ
        </div>
      )}

      {!searchQuery && notebook.vocabulary.length > 0 && totalPages > 1 && (
        <div className="mb-3 text-xs text-gray-500">
          Trang {currentPage} / {totalPages} • {filteredVocabulary.length} từ
        </div>
      )}

      {/* Vocabulary list */}
      {notebook.vocabulary.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {paginatedVocabulary.map((v) => (
            <div key={v.id} className={`flex flex-col rounded-2xl border bg-white shadow-sm h-full transition-colors ${
              progress[v.id]?.learned ? "border-emerald-200" : "border-gray-200"
            }`}>
                {/* Top: word + edit/delete */}
                <div className="flex items-start justify-between gap-1 px-3 pt-3 pb-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-indigo-600 leading-snug break-words">
                      {v.kanji || v.hiragana}
                      {v.kanji && (v.hiragana || v.onyomi) && (
                        <span className="font-normal text-gray-500 text-xs">
                          {"\u300c"}{[v.hiragana, v.onyomi].filter(Boolean).join(" ")}{"\u300d"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={() => toggleFavorite(v.id)}
                      title="Yêu thích"
                      className={`w-7 h-7 flex items-center justify-center text-base transition-colors ${
                        progress[v.id]?.favorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                      }`}
                    >
                      {"\u2605"}
                    </button>
                    <button
                      onClick={() => toggleLearned(v.id)}
                      title={progress[v.id]?.learned ? "Đã học" : "Chưa học"}
                      className={`w-7 h-7 flex items-center justify-center text-sm font-bold transition-colors ${
                        progress[v.id]?.learned
                          ? "text-emerald-500 hover:text-emerald-600"
                          : "text-gray-300 hover:text-emerald-400"
                      }`}
                    >
                      {progress[v.id]?.learned ? "\u2713" : "\u25cb"}
                    </button>
                    <button
                      onClick={() => startEdit(v)}
                      className="w-7 h-7 flex items-center justify-center text-sm text-indigo-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => { if (confirm("Xóa từ này?")) deleteVocab(id, v.id); }}
                      className="w-7 h-7 flex items-center justify-center text-sm text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Meaning */}
                {v.meaning && (
                  <p className="px-3 pb-1 text-xs text-gray-700 leading-snug break-words">{v.meaning}</p>
                )}

                {/* Phonetic */}
                {v.phonetic && (
                  <p className="px-3 pb-2 text-xs text-gray-400 italic leading-snug">{v.phonetic}</p>
                )}

                {/* Bottom strip */}
                <div className={`mt-auto px-3 py-1.5 rounded-b-2xl border-t text-xs transition-colors ${
                  progress[v.id]?.learned
                    ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                    : "bg-gray-50 border-gray-100 text-gray-400"
                }`}>
                  {v.onyomi || v.hiragana || "\u2013"}
                </div>
              </div>
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
          onClick={() => {
            setShowAddModal(false);
            setDuplicateError(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800">Thêm từ mới</p>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setDuplicateError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            {duplicateError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                ✗ {duplicateError}
              </div>
            )}
            <div className="space-y-3 mb-4">
              {FIELD_LABELS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleAdd}
              disabled={!isFormValid}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              + Thêm từ
            </button>
          </div>
        </div>
      )}

      {/* Edit vocab modal */}
      {showEditModal && editingVocab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto"
          onClick={() => {
            setShowEditModal(false);
            setEditingVocab(null);
            setDuplicateError(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800">Chỉnh sửa từ</p>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVocab(null);
                  setDuplicateError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            {duplicateError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                ✗ {duplicateError}
              </div>
            )}
            <div className="space-y-3 mb-4">
              {FIELD_LABELS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(editFields[key] as string) ?? ""}
                    onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={saveEdit}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Lưu thay đổi
            </button>
            
            {/* Move to another notebook */}
            {notebooks.length > 1 && (
              <>
                <div className="my-4 border-t border-gray-200"></div>
                <div className="space-y-3">
                  <label className="block text-xs text-gray-500">Di chuyển sang sổ tay khác</label>
                  <select
                    value={targetNotebookId}
                    onChange={(e) => setTargetNotebookId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  >
                    <option value="">-- Chọn sổ tay --</option>
                    {notebooks
                      .filter((nb) => nb.id !== id)
                      .map((nb) => (
                        <option key={nb.id} value={nb.id}>
                          {nb.name} ({nb.vocabulary.length} từ)
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleMove}
                    disabled={!targetNotebookId}
                    className="w-full bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Di chuyển →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
