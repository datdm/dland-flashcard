"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";

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
    const date = new Date().toISOString().split('T')[0];
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

      return nb.vocabulary.some((v) =>
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

  const updateNotebookInsertIndex = useCallback((clientY: number) => {
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
  }, [draggingNotebookId]);

  const handleNotebookMouseDown = (event: React.MouseEvent<HTMLButtonElement>, notebookId: string) => {
    if (event.button !== 0) return;
    const card = event.currentTarget.closest("[data-notebook-card='true']") as HTMLElement | null;
    if (!card) return;

    event.preventDefault();
    const rect = card.getBoundingClientRect();
    setDraggingNotebookId(notebookId);
    setNotebookPreviewState(filteredNotebooks.map((nb) => nb.id), filteredNotebooks.findIndex((nb) => nb.id === notebookId));
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

  const cancelNotebookDrag = useCallback(() => {
    setDraggingNotebookId(null);
    setDragNotebookRect(null);
    setNotebookPreviewState(null, null);
  }, []);

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
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">📓 Sổ tay</h1>
        <div className="flex gap-2">
          {hasVocabulary && (
            <Link
              href="/flashcard/all-notebooks"
              className="text-sm bg-indigo-600 text-white rounded-xl px-3 py-1.5 font-semibold hover:bg-indigo-700 transition-colors"
            >
              Flashcard tất cả
            </Link>
          )}
          {notebooks.length > 0 && (
            <button
              onClick={handleExportAll}
              className="text-sm text-emerald-600 border border-emerald-300 rounded-xl px-3 py-1.5 hover:bg-emerald-50 transition-colors"
            >
              Export tất cả
            </button>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="text-sm text-indigo-600 border border-indigo-300 rounded-xl px-3 py-1.5 hover:bg-indigo-50 transition-colors"
          >
            Import sổ tay
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".json" className="sr-only" onChange={handleImportFile} />
      </div>

      {importError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          ✗ {importError}
        </div>
      )}
      {importSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✓ {importSuccess}
        </div>
      )}

      {/* Create new notebook */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Tên sổ tay mới..."
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={handleCreate}
          disabled={!newName.trim()}
          className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors"
        >
          + Tạo
        </button>
      </div>

      {/* Search input */}
      <div className="mb-4 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm kiếm sổ tay hoặc từ vựng..."
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

      {searchQuery && (
        <div className="mb-3 text-xs text-gray-500">
          Tìm thấy {filteredNotebooks.length} / {notebooks.length} sổ tay. Có thể kéo thả để đổi vị trí ngay trong danh sách đang hiển thị.
        </div>
      )}

      {!searchQuery && filteredNotebooks.length > 1 && (
        <div className="mb-3 text-xs text-gray-500">
          Kéo biểu tượng ⋮⋮ để đổi thứ tự sổ tay.
        </div>
      )}

      {/* Notebook list */}
      <div ref={listRef} className="space-y-3">
        {filteredNotebooks.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            {searchQuery ? (
              <>
                <p className="text-4xl mb-3">🔍</p>
                <p>Không tìm thấy sổ tay nào</p>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">📓</p>
                <p>Chưa có sổ tay nào. Hãy tạo sổ tay đầu tiên!</p>
              </>
            )}
          </div>
        ) : (
          renderedNotebookIds.map((notebookId, renderIndex) => {
            const nb = notebookMap.get(notebookId);
            if (!nb) return null;
            const learnedCount = nb.vocabulary.filter((v) => progress[v.id]?.learned).length;
            const unlearnedCount = nb.vocabulary.length - learnedCount;

            return (
              <div key={nb.id} className="space-y-3">
                {draggingNotebookId && dropNotebookIndex === renderIndex && (
                  <div className="h-[110px] rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/80 transition-all" />
                )}
                <div
                  data-notebook-card="true"
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onMouseDown={(event) => handleNotebookMouseDown(event, nb.id)}
                      className="shrink-0 cursor-grab select-none text-gray-300 active:cursor-grabbing"
                    >
                      ⋮⋮
                    </button>
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-gray-800 truncate">{nb.name}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {nb.vocabulary.length} từ • {learnedCount} Đã học • {unlearnedCount} Chưa học
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(nb.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                  <Link
                    href={`/notebooks/${nb.id}`}
                    className="flex-1 min-w-[80px] text-center py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    Mở
                  </Link>
                  <Link
                    href={`/flashcard/notebook/${nb.id}`}
                    className={`flex-1 min-w-[80px] text-center py-2 rounded-xl text-sm font-medium transition-colors ${
                      nb.vocabulary.length === 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                    aria-disabled={nb.vocabulary.length === 0}
                    onClick={(e) => nb.vocabulary.length === 0 && e.preventDefault()}
                  >
                    Flashcard
                  </Link>
                  <button
                    onClick={() => handleExport(nb.id, nb.name)}
                    className="px-3 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    Export
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa sổ tay "${nb.name}"?`)) deleteNotebook(nb.id);
                    }}
                    className="px-3 py-2 rounded-xl border border-gray-300 text-sm text-red-400 hover:border-red-400 hover:text-red-600 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
              </div>
            );
          })
        )}

        {draggingNotebookId && dropNotebookIndex === renderedNotebookIds.length && (
          <div className="h-[110px] rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50/80 transition-all" />
        )}
      </div>

      {draggingNotebookId && dragNotebookRect && (() => {
        const draggingNotebook = notebookMap.get(draggingNotebookId) ?? notebooks.find((nb) => nb.id === draggingNotebookId);
        if (!draggingNotebook) return null;
        const learnedCount = draggingNotebook.vocabulary.filter((v) => progress[v.id]?.learned).length;
        const unlearnedCount = draggingNotebook.vocabulary.length - learnedCount;

        return (
          <div
            className="pointer-events-none fixed z-50"
            style={{
              left: dragNotebookRect.left,
              top: dragNotebookRect.top,
              width: dragNotebookRect.width,
            }}
          >
            <div className="bg-white/95 border border-indigo-300 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="shrink-0 select-none text-indigo-300">⋮⋮</div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-800 truncate">{draggingNotebook.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {draggingNotebook.vocabulary.length} từ • {learnedCount} Đã học • {unlearnedCount} Chưa học
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(draggingNotebook.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
