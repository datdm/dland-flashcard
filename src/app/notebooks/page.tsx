"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";

export default function NotebooksPage() {
  const { notebooks, createNotebook, deleteNotebook, exportNotebook, importNotebook } = useNotebooks();
  const [newName, setNewName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-800">📓 Sổ tay</h1>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-sm text-indigo-600 border border-indigo-300 rounded-xl px-3 py-1.5 hover:bg-indigo-50 transition-colors"
        >
          Import sổ tay
        </button>
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

      {/* Notebook list */}
      <div className="space-y-3">
        {notebooks.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">📓</p>
            <p>Chưa có sổ tay nào. Hãy tạo sổ tay đầu tiên!</p>
          </div>
        ) : (
          notebooks.map((nb) => (
            <div
              key={nb.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-800 truncate">{nb.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {nb.vocabulary.length} từ · {new Date(nb.createdAt).toLocaleDateString("vi-VN")}
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
          ))
        )}
      </div>
    </div>
  );
}
