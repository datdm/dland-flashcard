"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

function insertDraggedAtIndex(ids: string[], draggedId: string, insertIndex: number) {
  const baseIds = ids.filter((id) => id !== draggedId);
  const boundedIndex = Math.max(0, Math.min(insertIndex, baseIds.length));
  baseIds.splice(boundedIndex, 0, draggedId);
  return baseIds;
}

export default function NotebookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { notebooks, save, addVocab, updateVocab, deleteVocab, moveVocab, moveMultipleVocab, exportNotebook, importVocabFromJson, checkDuplicate } = useNotebooks();
  const { toggleLearned, toggleFavorite, progress } = useProgress();

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
  const [draggingVocabId, setDraggingVocabId] = useState<string | null>(null);
  const [previewVocabIds, setPreviewVocabIds] = useState<string[] | null>(null);
  const [dropVocabIndex, setDropVocabIndex] = useState<number | null>(null);
  const [dragVocabRect, setDragVocabRect] = useState<{ left: number; top: number; width: number; height: number; offsetX: number; offsetY: number } | null>(null);
  const [selectedVocabIds, setSelectedVocabIds] = useState<string[]>([]);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const previewVocabIdsRef = useRef<string[] | null>(null);
  const dropVocabIndexRef = useRef<number | null>(null);

  const setVocabPreviewState = (ids: string[] | null, insertIndex: number | null) => {
    previewVocabIdsRef.current = ids;
    dropVocabIndexRef.current = insertIndex;
    setPreviewVocabIds(ids);
    setDropVocabIndex(insertIndex);
  };

  const notebook = notebooks.find((nb) => nb.id === id);
  const notebookName = notebook?.name ?? "";
  const notebookVocabulary = notebook?.vocabulary ?? [];

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, tab]);

  const isFormValid = Object.values(form).some((v) => v?.trim());

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAdd = () => {
    if (!isFormValid) return;

    const duplicates = checkDuplicate(id, form.kanji, form.hiragana);
    if (duplicates && duplicates.length > 0) {
      const otherDuplicates = duplicates.filter((d) => d.notebookId !== id);
      if (otherDuplicates.length > 0) {
        const notebookNames = otherDuplicates.map((d) => `"${d.notebookName}"`).join(", ");
        setDuplicateError(`Từ này đã tồn tại trong sổ tay: ${notebookNames}`);
      } else {
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

    const duplicates = checkDuplicate(id, editFields.kanji, editFields.hiragana, editingVocab.id);
    if (duplicates && duplicates.length > 0) {
      const otherDuplicates = duplicates.filter((d) => d.notebookId !== id);
      if (otherDuplicates.length > 0) {
        const notebookNames = otherDuplicates.map((d) => `"${d.notebookName}"`).join(", ");
        setDuplicateError(`Từ này đã tồn tại trong sổ tay: ${notebookNames}`);
      } else {
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
    a.download = `notebook-${notebookName.replace(/\s+/g, "-")}.json`;
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

  const filteredVocabulary = notebookVocabulary.filter((v) => {
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
    all: filteredVocabulary.length,
    learned: filteredVocabulary.filter((v) => progress[v.id]?.learned).length,
    unlearned: filteredVocabulary.filter((v) => !progress[v.id]?.learned).length,
    favorite: filteredVocabulary.filter((v) => progress[v.id]?.favorite).length,
  };

  const tabFiltered = filteredVocabulary.filter((v) => {
    if (tab === "learned") return progress[v.id]?.learned;
    if (tab === "unlearned") return !progress[v.id]?.learned;
    if (tab === "favorite") return progress[v.id]?.favorite;
    return true;
  });

  const toggleVocabSelection = (vocabId: string) => {
    setSelectedVocabIds((prev) =>
      prev.includes(vocabId) ? prev.filter((id) => id !== vocabId) : [...prev, vocabId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedVocabIds.length === filteredVocabulary.length) {
      setSelectedVocabIds([]);
    } else {
      setSelectedVocabIds(filteredVocabulary.map((v) => v.id));
    }
  };

  const handleBulkMove = () => {
    if (selectedVocabIds.length === 0 || !targetNotebookId) return;
    moveMultipleVocab(id, targetNotebookId, selectedVocabIds);
    setShowBulkMoveModal(false);
    setSelectedVocabIds([]);
    setTargetNotebookId("");
  };

  const ITEMS_PER_PAGE = 30;
  const totalPages = Math.ceil(tabFiltered.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const paginatedVocabulary = tabFiltered.slice(startIdx, endIdx);

  useEffect(() => {
    if (!previewVocabIdsRef.current) return;
    const validIds = previewVocabIdsRef.current.filter((id) => paginatedVocabulary.some((vocab) => vocab.id === id));
    setVocabPreviewState(validIds, dropVocabIndexRef.current);
  }, [paginatedVocabulary]);

  const renderedVocabIds = useMemo(() => {
    if (!draggingVocabId || !previewVocabIds) {
      return paginatedVocabulary.map((vocab) => vocab.id);
    }

    return previewVocabIds.filter((vocabId) => vocabId !== draggingVocabId);
  }, [draggingVocabId, paginatedVocabulary, previewVocabIds]);

  const vocabMap = useMemo(
    () => new Map(paginatedVocabulary.map((vocab) => [vocab.id, vocab])),
    [paginatedVocabulary]
  );

  const updateVocabInsertIndex = useCallback(
    (clientX: number, clientY: number) => {
      if (!gridRef.current || !draggingVocabId || !previewVocabIdsRef.current) return;

      const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>("[data-vocab-card='true']"));
      if (cards.length === 0) {
        setVocabPreviewState(previewVocabIdsRef.current, 0);
        return;
      }

      const cardMetrics = cards.map((card, index) => {
        const rect = card.getBoundingClientRect();
        return {
          index,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          centerX: rect.left + rect.width / 2,
          centerY: rect.top + rect.height / 2,
        };
      });

      const rows: (typeof cardMetrics)[] = [];
      const rowThreshold = 24;
      for (const metric of cardMetrics) {
        const lastRow = rows[rows.length - 1];
        if (!lastRow || Math.abs(lastRow[0].top - metric.top) > rowThreshold) {
          rows.push([metric]);
        } else {
          lastRow.push(metric);
        }
      }

      let nextIndex = cardMetrics.length;
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex];
        const rowBottom = Math.max(...row.map((item) => item.top + item.height));
        const isLastRow = rowIndex === rows.length - 1;

        if (clientY <= rowBottom || isLastRow) {
          nextIndex = row[row.length - 1].index + 1;

          for (const item of row) {
            if (clientX < item.centerX) {
              nextIndex = item.index;
              break;
            }
          }
          break;
        }
      }

      if (dropVocabIndexRef.current !== nextIndex) {
        setVocabPreviewState(previewVocabIdsRef.current, nextIndex);
      }
    },
    [draggingVocabId]
  );

  const handleVocabMouseDown = (event: React.MouseEvent<HTMLButtonElement>, vocabId: string) => {
    if (event.button !== 0) return;
    const card = event.currentTarget.closest("[data-vocab-card='true']") as HTMLElement | null;
    if (!card) return;

    event.preventDefault();
    const rect = card.getBoundingClientRect();
    setDraggingVocabId(vocabId);
    setVocabPreviewState(
      paginatedVocabulary.map((vocab) => vocab.id),
      paginatedVocabulary.findIndex((vocab) => vocab.id === vocabId)
    );
    setDragVocabRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  };

  const commitVocabDrop = useCallback(() => {
    const previewIds = previewVocabIdsRef.current;
    const insertIndex = dropVocabIndexRef.current;

    if (!draggingVocabId || !previewIds || insertIndex === null) {
      setDraggingVocabId(null);
      setDragVocabRect(null);
      return;
    }

    const nextPageOrder = insertDraggedAtIndex(previewIds, draggingVocabId, insertIndex);
    const nextNotebookVocabulary = (() => {
      const subsetIdSet = new Set(nextPageOrder);
      const byId = new Map(notebookVocabulary.map((vocab) => [vocab.id, vocab]));
      const orderedSubset = nextPageOrder
        .map((vocabId) => byId.get(vocabId))
        .filter((vocab): vocab is Vocabulary => Boolean(vocab));
      let subsetIndex = 0;

      return notebookVocabulary.map((vocab) => {
        if (!subsetIdSet.has(vocab.id)) return vocab;
        const nextVocab = orderedSubset[subsetIndex];
        subsetIndex += 1;
        return nextVocab ?? vocab;
      });
    })();

    save(
      notebooks.map((existingNotebook) =>
        existingNotebook.id === id
          ? { ...existingNotebook, vocabulary: nextNotebookVocabulary }
          : existingNotebook
      )
    );
    setDraggingVocabId(null);
    setDragVocabRect(null);
    setVocabPreviewState(null, null);
  }, [draggingVocabId, id, notebookVocabulary, notebooks, save]);

  useEffect(() => {
    if (!draggingVocabId || !dragVocabRect) return;

    const handleMouseMove = (event: MouseEvent) => {
      setDragVocabRect((current) =>
        current
          ? {
              ...current,
              left: event.clientX - current.offsetX,
              top: event.clientY - current.offsetY,
            }
          : current
      );
      updateVocabInsertIndex(event.clientX, event.clientY);
    };

    const handleMouseUp = () => {
      commitVocabDrop();
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [commitVocabDrop, dragVocabRect, draggingVocabId, updateVocabInsertIndex]);

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500 font-medium">Không tìm thấy sổ tay.</p>
        <Link href="/notebooks" className="text-indigo-600 font-semibold hover:underline text-sm">
          ← Quay lại danh sách Sổ tay
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Back Link */}
      <div className="mb-4">
        <Link href="/notebooks" className="text-xs text-indigo-600 font-semibold hover:underline">
          ← Danh sách Sổ tay
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
              📓 SỔ TAY CÁ NHÂN
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2">{notebook.name}</h1>
            <p className="text-xs text-gray-400 mt-1">Tổng số: {notebook.vocabulary.length} từ vựng</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 transition-colors shadow-2xs"
            >
              + Thêm từ mới
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              📥 Import
            </button>
            <input ref={fileRef} type="file" accept=".json" className="sr-only" onChange={handleImportFile} />
            <button
              onClick={handleExport}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-50 transition-colors"
            >
              💾 Export
            </button>
            {notebook.vocabulary.length > 0 && (
              <Link
                href={`/flashcard/notebook/${id}`}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-xs font-bold shadow-2xs hover:opacity-95 transition-opacity"
              >
                🎴 Flashcard
              </Link>
            )}
          </div>
        </div>
      </div>

      {importResult && (
        <div
          className={`mb-4 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            importResult.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {importResult.ok ? "✓" : "✕"} {importResult.msg}
        </div>
      )}

      {/* Search Bar */}
      {notebookVocabulary.length > 0 && (
        <div className="mb-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm từ vựng trong sổ tay này..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-xs focus:outline-none focus:border-indigo-500 shadow-2xs"
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
      )}

      {/* Filter Tabs */}
      {notebookVocabulary.length > 0 && (
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <FilterBar active={tab} onChange={setTab} counts={counts} />
          
          {filteredVocabulary.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shrink-0">
              <input
                type="checkbox"
                checked={selectedVocabIds.length === filteredVocabulary.length && filteredVocabulary.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-gray-600">Chọn tất cả</span>
            </label>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedVocabIds.length > 0 && (
        <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-indigo-800">
              Đã chọn {selectedVocabIds.length} từ vựng
            </span>
            <button
              onClick={() => setSelectedVocabIds([])}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Bỏ chọn tất cả
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkMoveModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
            >
              Chuyển sang sổ tay khác
            </button>
          </div>
        </div>
      )}

      {/* Vocabulary List */}
      {notebookVocabulary.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100">
          <p className="font-semibold text-gray-700">Chưa có từ vựng nào trong sổ tay này</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Bấm nút "+ Thêm từ mới" ở trên để bắt đầu thêm từ</p>
        </div>
      ) : filteredVocabulary.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100">
          Không tìm thấy từ vựng nào phù hợp
        </div>
      ) : (
        <>
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {renderedVocabIds.map((vocabId, renderIndex) => {
              const v = vocabMap.get(vocabId);
              if (!v) return null;
              const isLearned = progress[v.id]?.learned;
              const isFavorite = progress[v.id]?.favorite;

              return (
                <div key={v.id} className="contents">
                  {draggingVocabId && dropVocabIndex === renderIndex && (
                    <div
                      className="rounded-3xl border-2 border-dashed border-indigo-300 bg-indigo-50/80 transition-all"
                      style={{ height: dragVocabRect?.height ?? 140 }}
                    />
                  )}
                  <div
                    data-vocab-card="true"
                    className={`flex flex-col justify-between rounded-3xl border bg-white shadow-2xs hover:shadow-md transition-all p-4 h-full ${
                      isLearned ? "border-emerald-200 bg-emerald-50/20" : "border-gray-100"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedVocabIds.includes(v.id)}
                            onChange={() => toggleVocabSelection(v.id)}
                            className="mt-1.5 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xl font-extrabold text-gray-900 leading-snug">
                                {v.kanji || v.hiragana}
                              </span>
                              {v.kanji && v.hiragana && (
                                <span className="text-xs font-semibold text-indigo-600 font-mono">
                                  ({v.hiragana})
                                </span>
                              )}
                            </div>
                            {v.onyomi && (
                              <p className="text-[11px] text-purple-600 font-medium mt-0.5">
                                Âm Hán: {v.onyomi}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onMouseDown={(event) => handleVocabMouseDown(event, v.id)}
                            className="w-7 h-7 flex items-center justify-center text-xs text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing select-none"
                            title="Kéo để đổi vị trí"
                          >
                            ⋮⋮
                          </button>
                          {(v.kanji || v.hiragana) && (
                            <button
                              onClick={() => speakText(v.kanji || v.hiragana || "")}
                              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 flex items-center justify-center text-xs transition-colors"
                              title="Nghe đọc"
                            >
                              🔊
                            </button>
                          )}
                          <button
                            onClick={() => toggleFavorite(v.id)}
                            title="Yêu thích"
                            className={`w-7 h-7 flex items-center justify-center text-sm transition-colors ${
                              isFavorite ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
                            }`}
                          >
                            ★
                          </button>
                          <button
                            onClick={() => toggleLearned(v.id)}
                            title={isLearned ? "Đã học" : "Chưa học"}
                            className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-lg transition-colors ${
                              isLearned
                                ? "bg-emerald-600 text-white"
                                : "bg-gray-100 text-gray-400 hover:text-emerald-500"
                            }`}
                          >
                            {isLearned ? "✓" : "○"}
                          </button>
                        </div>
                      </div>

                      {v.meaning && (
                        <p className="text-xs font-semibold text-emerald-700 leading-snug break-words mt-1">
                          {v.meaning}
                        </p>
                      )}

                      {v.phonetic && (
                        <p className="text-[11px] text-gray-400 italic leading-snug mt-0.5">{v.phonetic}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-50 flex items-center justify-between">
                      <button
                        onClick={() => startEdit(v)}
                        className="text-[11px] font-semibold text-indigo-600 hover:underline"
                      >
                        ✎ Chỉnh sửa / Di chuyển
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Xóa từ này?")) deleteVocab(id, v.id);
                        }}
                        className="text-[11px] font-semibold text-red-400 hover:underline"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 text-xs font-semibold"
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
                        ? "bg-indigo-600 text-white"
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
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-xs font-bold"
              >
                Trang sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* Add vocab modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => {
            setShowAddModal(false);
            setDuplicateError(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Thêm từ mới vào Sổ tay</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setDuplicateError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            {duplicateError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                ✕ {duplicateError}
              </div>
            )}
            <div className="space-y-3 mb-6">
              {FIELD_LABELS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(form[key] as string) ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    placeholder={placeholder}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleAdd}
              disabled={!isFormValid}
              className="w-full bg-indigo-600 text-white rounded-2xl py-3 text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-2xs"
            >
              + Lưu Từ Vựng
            </button>
          </div>
        </div>
      )}

      {/* Edit vocab modal */}
      {showEditModal && editingVocab && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => {
            setShowEditModal(false);
            setEditingVocab(null);
            setDuplicateError(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Chỉnh sửa từ vựng</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVocab(null);
                  setDuplicateError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            {duplicateError && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                ✕ {duplicateError}
              </div>
            )}
            <div className="space-y-3 mb-6">
              {FIELD_LABELS.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(editFields[key] as string) ?? ""}
                    onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}

              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-semibold text-purple-700 mb-1">
                  Chuyển sang sổ tay khác:
                </label>
                <select
                  value={targetNotebookId}
                  onChange={(e) => setTargetNotebookId(e.target.value)}
                  className="w-full rounded-2xl border border-purple-200 bg-purple-50/50 px-4 py-2.5 text-xs font-semibold text-purple-900 focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Chọn sổ tay đích --</option>
                  {notebooks
                    .filter((nb) => nb.id !== id)
                    .map((nb) => (
                      <option key={nb.id} value={nb.id}>
                        {nb.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              {targetNotebookId ? (
                <button
                  onClick={handleMove}
                  className="w-full bg-purple-600 text-white rounded-2xl py-3 text-xs font-bold hover:bg-purple-700 transition-colors"
                >
                  Chuyển sang Sổ tay được chọn
                </button>
              ) : (
                <button
                  onClick={saveEdit}
                  className="w-full bg-indigo-600 text-white rounded-2xl py-3 text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Lưu thay đổi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Bulk Move Modal */}
      {showBulkMoveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => {
            setShowBulkMoveModal(false);
            setTargetNotebookId("");
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-base">Di chuyển {selectedVocabIds.length} từ vựng</h3>
              <button
                onClick={() => {
                  setShowBulkMoveModal(false);
                  setTargetNotebookId("");
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-purple-700 mb-2">
                  Chọn sổ tay đích để chuyển đến:
                </label>
                <select
                  value={targetNotebookId}
                  onChange={(e) => setTargetNotebookId(e.target.value)}
                  className="w-full rounded-2xl border border-purple-200 bg-purple-50/50 px-4 py-2.5 text-xs font-semibold text-purple-900 focus:outline-none focus:border-purple-500"
                >
                  <option value="">-- Chọn sổ tay --</option>
                  {notebooks
                    .filter((nb) => nb.id !== id)
                    .map((nb) => (
                      <option key={nb.id} value={nb.id}>
                        {nb.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleBulkMove}
                disabled={!targetNotebookId}
                className="w-full bg-purple-600 text-white rounded-2xl py-3 text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-2xs"
              >
                Chuyển từ vựng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
