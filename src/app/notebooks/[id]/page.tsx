"use client";

import { useState, useRef } from "react";
import { use } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
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
  const { notebooks, addVocab, updateVocab, deleteVocab, exportNotebook, importVocabFromJson } = useNotebooks();
  const notebook = notebooks.find((nb) => nb.id === id);

  const [form, setForm] = useState<VocabFields>(EMPTY_FIELDS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<VocabFields>(EMPTY_FIELDS);
  const [importResult, setImportResult] = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    addVocab(id, form);
    setForm(EMPTY_FIELDS);
    setShowAddModal(false);
  };

  const startEdit = (v: Vocabulary) => {
    setEditId(v.id);
    setEditFields({
      kanji: v.kanji ?? "",
      hiragana: v.hiragana ?? "",
      onyomi: v.onyomi ?? "",
      meaning: v.meaning ?? "",
      phonetic: v.phonetic ?? "",
    });
  };

  const saveEdit = () => {
    if (!editId) return;
    updateVocab(id, editId, editFields);
    setEditId(null);
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

      {/* Vocabulary list */}
      {notebook.vocabulary.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Chưa có từ nào. Thêm từ đầu tiên ở trên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {notebook.vocabulary.map((v) =>
            editId === v.id ? (
              /* Edit inline within the card */
              <div key={v.id} className="flex flex-col rounded-2xl border border-indigo-200 bg-indigo-50 shadow-sm">
                <div className="px-3 pt-3 pb-2 flex-1">
                  <p className="text-xs font-semibold text-indigo-600 mb-2">Chỉnh sửa</p>
                  <div className="space-y-2">
                    {FIELD_LABELS.map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 mb-0.5">{label}</label>
                        <input
                          type="text"
                          value={(editFields[key] as string) ?? ""}
                          onChange={(e) => setEditFields((f) => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full rounded-xl border border-indigo-300 px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 bg-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 px-3 pb-3 mt-2">
                  <button onClick={saveEdit} className="flex-1 bg-indigo-600 text-white rounded-xl py-1.5 text-xs font-medium hover:bg-indigo-700 transition-colors">Lưu</button>
                  <button onClick={() => setEditId(null)} className="flex-1 border border-gray-300 rounded-xl py-1.5 text-xs text-gray-600 hover:border-gray-400 transition-colors">Hủy</button>
                </div>
              </div>
            ) : (
              /* Card display */
              <div key={v.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm h-full">
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
                <div className="mt-auto px-3 py-1.5 rounded-b-2xl border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
                  {v.onyomi || v.hiragana || "\u2013"}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Add vocab modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="font-semibold text-gray-800">Thêm từ mới</p>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ✕
              </button>
            </div>
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
    </div>
  );
}
