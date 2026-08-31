"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AuthGuard from "@/components/AuthGuard";

function applySubsetOrder<T extends { id: string }>(source: T[], orderedSubsetIds: string[]) {
  const subsetIdSet = new Set(orderedSubsetIds);
  const byId = new Map(source.map((item) => [item.id, item]));
  const orderedSubset = orderedSubsetIds
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item));
  let subsetIndex = 0;

  return source.map((item) => {
    if (!subsetIdSet.has(item.id)) return item;
    const nextItem = orderedSubset[subsetIndex];
    subsetIndex += 1;
    return nextItem ?? item;
  });
}

function insertDraggedAtIndex(ids: string[], draggedId: string, insertIndex: number) {
  const baseIds = ids.filter((id) => id !== draggedId);
  const boundedIndex = Math.max(0, Math.min(insertIndex, baseIds.length));
  baseIds.splice(boundedIndex, 0, draggedId);
  return baseIds;
}

export default function NotebooksPage() {
  const { notebooks, save, createNotebook, deleteNotebook, exportNotebook, exportAllNotebooks, importNotebook } = useNotebooks();
  const { progress } = useProgress();
  const { activeLanguage } = useLanguageSetting();
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [draggingNotebookId, setDraggingNotebookId] = useState<string | null>(null);
  const [previewNotebookIds, setPreviewNotebookIds] = useState<string[] | null>(null);
  const [dropNotebookIndex, setDropNotebookIndex] = useState<number | null>(null);
  const [dragNotebookRect, setDragNotebookRect] = useState<{ left: number; top: number; width: number; height: number; offsetX: number; offsetY: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previewNotebookIdsRef = useRef<string[] | null>(null);
  const dropNotebookIndexRef = useRef<number | null>(null);

  const setNotebookPreviewState = (ids: string[] | null, insertIndex: number | null) => {
    previewNotebookIdsRef.current = ids;
    dropNotebookIndexRef.current = insertIndex;
    setPreviewNotebookIds(ids);
    setDropNotebookIndex(insertIndex);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createNotebook(name);
    setNewName("");
  };

  const handleExport = (id: string, name: string) => {
    const json = exportNotebook(id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notebook-${name.replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const json = exportAllNotebooks();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `all-notebooks-${date}.json`;
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
      setImportError(null);
      setImportSuccess(null);
      const result = importNotebook(text);
      if (result.error) {
        setImportError(result.error);
      } else {
        setImportSuccess(`Đã import sổ tay "${result.name}"`);
      }
    };
    reader.readAsText(file);
  };

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter((nb) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();

      if (nb.name.toLowerCase().includes(query)) return true;

      return nb.vocabulary.some(
        (v) =>
          v.kanji?.toLowerCase().includes(query) ||
          v.hiragana?.toLowerCase().includes(query) ||
          v.onyomi?.toLowerCase().includes(query) ||
          v.meaning?.toLowerCase().includes(query) ||
          v.phonetic?.toLowerCase().includes(query)
      );
    });
  }, [notebooks, searchQuery]);

  useEffect(() => {
    if (!previewNotebookIdsRef.current) return;
    const validIds = previewNotebookIdsRef.current.filter((id) => filteredNotebooks.some((nb) => nb.id === id));
    setNotebookPreviewState(validIds, dropNotebookIndexRef.current);
  }, [filteredNotebooks]);

  const renderedNotebookIds = useMemo(() => {
    if (!draggingNotebookId || !previewNotebookIds) {
      return filteredNotebooks.map((nb) => nb.id);
    }

    return previewNotebookIds.filter((id) => id !== draggingNotebookId);
  }, [draggingNotebookId, filteredNotebooks, previewNotebookIds]);

  const notebookMap = useMemo(
    () => new Map(filteredNotebooks.map((nb) => [nb.id, nb])),
    [filteredNotebooks]
  );

  const updateNotebookInsertIndex = useCallback(
    (clientY: number) => {
      if (!listRef.current || !draggingNotebookId || !previewNotebookIdsRef.current) return;

      const cards = Array.from(listRef.current.querySelectorAll<HTMLElement>("[data-notebook-card='true']"));
      if (cards.length === 0) {
        setNotebookPreviewState(previewNotebookIdsRef.current, 0);
        return;
      }

      let nextIndex = cards.length;
      for (let index = 0; index < cards.length; index += 1) {
        const rect = cards[index].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) {
          nextIndex = index;
          break;
        }
      }

      if (dropNotebookIndexRef.current !== nextIndex) {
        setNotebookPreviewState(previewNotebookIdsRef.current, nextIndex);
      }
    },
    [draggingNotebookId]
  );

  const handleNotebookMouseDown = (event: React.MouseEvent<HTMLButtonElement>, notebookId: string) => {
    if (event.button !== 0) return;
    const card = event.currentTarget.closest("[data-notebook-card='true']") as HTMLElement | null;
    if (!card) return;

    event.preventDefault();
    const rect = card.getBoundingClientRect();
    setDraggingNotebookId(notebookId);
    setNotebookPreviewState(
      filteredNotebooks.map((nb) => nb.id),
      filteredNotebooks.findIndex((nb) => nb.id === notebookId)
    );
    setDragNotebookRect({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    });
  };

  const commitNotebookDrop = useCallback(() => {
    const previewIds = previewNotebookIdsRef.current;
    const insertIndex = dropNotebookIndexRef.current;

    if (!draggingNotebookId || !previewIds || insertIndex === null) {
      setDraggingNotebookId(null);
      setDragNotebookRect(null);
      return;
    }

    save(applySubsetOrder(notebooks, insertDraggedAtIndex(previewIds, draggingNotebookId, insertIndex)));
    setDraggingNotebookId(null);
    setDragNotebookRect(null);
    setNotebookPreviewState(null, null);
  }, [draggingNotebookId, notebooks, save]);

  useEffect(() => {
    if (!draggingNotebookId || !dragNotebookRect) return;

    const handleMouseMove = (event: MouseEvent) => {
      setDragNotebookRect((current) =>
        current
          ? {
              ...current,
              left: event.clientX - current.offsetX,
              top: event.clientY - current.offsetY,
            }
          : current
      );
      updateNotebookInsertIndex(event.clientY);
    };

    const handleMouseUp = () => {
      commitNotebookDrop();
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [commitNotebookDrop, dragNotebookRect, draggingNotebookId, updateNotebookInsertIndex]);

  const hasVocabulary = notebooks.some((nb) => nb.vocabulary.length > 0);

  return (
    <AuthGuard featureName="Sổ Tay Từ Vựng Cá Nhân">
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      {/* Header Banner */}
      <div className={`rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-lg transition-all duration-300 bg-gradient-to-r ${
        activeLanguage.code === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : activeLanguage.code === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase mb-2 inline-block">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <h1 className="text-2xl font-bold">Sổ Tay & Bộ Sưu Tập Từ Vựng</h1>
            <p className="text-xs text-indigo-100 mt-1">
              Tạo và quản lý các nhóm từ vựng cá nhân, xuất/nhập file JSON dễ dàng
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasVocabulary && (
              <Link
                href="/flashcard/all-notebooks"
                className="px-4 py-2.5 bg-white text-indigo-700 font-bold rounded-2xl text-xs hover:bg-purple-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span>🎴 Flashcard tất cả</span>
              </Link>
            )}
            {notebooks.length > 0 && (
              <button
                onClick={handleExportAll}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 text-xs transition-colors flex items-center gap-1.5"
              >
                <span>💾 Export tất cả</span>
              </button>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 text-xs transition-colors flex items-center gap-1.5"
            >
              <span>📥 Import sổ tay</span>
            </button>
            <input ref={fileRef} type="file" accept=".json" className="sr-only" onChange={handleImportFile} />
          </div>
        </div>
      </div>

      {/* Messages */}
      {importError && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-600">
          ✕ {importError}
        </div>
      )}
      {importSuccess && (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700">
          ✓ {importSuccess}
        </div>
      )}

      {/* Create new notebook form */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Tạo Sổ tay mới</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="Ví dụ: Từ vựng giao tiếp hàng ngày, N3 Động từ..."
            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="bg-indigo-600 text-white rounded-2xl px-5 py-3 text-xs font-bold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-xs"
          >
            + Tạo Sổ Tay
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm sổ tay hoặc từ vựng trong sổ tay..."
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

      {/* Notebook list */}
      <div ref={listRef} className="space-y-4">
        {filteredNotebooks.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100">
            {searchQuery ? (
              <>
                <div className="text-4xl mb-2">🔍</div>
                <p className="font-semibold text-gray-700">Không tìm thấy sổ tay nào phù hợp</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">📓</div>
                <p className="font-semibold text-gray-700">Chưa có sổ tay nào. Hãy tạo sổ tay đầu tiên ở trên!</p>
              </>
            )}
          </div>
        ) : (
          renderedNotebookIds.map((notebookId, renderIndex) => {
            const nb = notebookMap.get(notebookId);
            if (!nb) return null;
            const totalVocab = nb.vocabulary.length;
            const learnedCount = nb.vocabulary.filter((v) => progress[v.id]?.learned).length;
            const pct = totalVocab === 0 ? 0 : Math.round((learnedCount / totalVocab) * 100);

            return (
              <div key={nb.id} className="space-y-3">
                {draggingNotebookId && dropNotebookIndex === renderIndex && (
                  <div className="h-[110px] rounded-3xl border-2 border-dashed border-indigo-300 bg-indigo-50/80 transition-all" />
                )}
                <div
                  data-notebook-card="true"
                  className="bg-white border border-gray-100 rounded-3xl p-5 shadow-2xs hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onMouseDown={(event) => handleNotebookMouseDown(event, nb.id)}
                        className="shrink-0 cursor-grab select-none text-gray-300 hover:text-gray-500 active:cursor-grabbing p-1 text-lg"
                        title="Kéo để đổi vị trí"
                      >
                        ⋮⋮
                      </button>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-bold text-gray-900 text-base truncate">{nb.name}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Tạo ngày {new Date(nb.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-xl shrink-0">
                      {totalVocab} từ
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                      <span>
                        {learnedCount}/{totalVocab} từ đã thuộc
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Link
                      href={`/notebooks/${nb.id}`}
                      className="flex-1 min-w-[90px] text-center py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                    >
                      📖 Chi tiết ({totalVocab})
                    </Link>
                    <Link
                      href={`/flashcard/notebook/${nb.id}`}
                      className={`flex-1 min-w-[90px] text-center py-2 rounded-xl text-xs font-bold transition-colors ${
                        totalVocab === 0
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs"
                      }`}
                      aria-disabled={totalVocab === 0}
                      onClick={(e) => totalVocab === 0 && e.preventDefault()}
                    >
                      🎴 Flashcard
                    </Link>
                    <button
                      onClick={() => handleExport(nb.id, nb.name)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                    >
                      💾 Export
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa sổ tay "${nb.name}"?`)) deleteNotebook(nb.id);
                      }}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {draggingNotebookId && dropNotebookIndex === renderedNotebookIds.length && (
          <div className="h-[110px] rounded-3xl border-2 border-dashed border-indigo-300 bg-indigo-50/80 transition-all" />
        )}
      </div>

      {draggingNotebookId && dragNotebookRect && (() => {
        const draggingNotebook =
          notebookMap.get(draggingNotebookId) ?? notebooks.find((nb) => nb.id === draggingNotebookId);
        if (!draggingNotebook) return null;
        const learnedCount = draggingNotebook.vocabulary.filter((v) => progress[v.id]?.learned).length;

        return (
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: dragNotebookRect.left,
              top: dragNotebookRect.top,
              width: dragNotebookRect.width,
            }}
          >
            <div className="bg-white/95 border border-indigo-300 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0 select-none text-indigo-300">⋮⋮</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 truncate">{draggingNotebook.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {draggingNotebook.vocabulary.length} từ • {learnedCount} Đã học
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      </div>
    </AuthGuard>
  );
}
