"use client";

import { useState, useEffect } from "react";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useAuth } from "@/context/AuthContext";
import { Vocabulary, WordType, WORD_TYPES, WORD_TYPE_STYLES } from "@/types";

interface AddToNotebookModalProps {
  selectedWord: Partial<Vocabulary> & {
    kanji?: string;
    hiragana?: string;
    meaning?: string;
    phonetic?: string;
    onyomi?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddToNotebookModal({
  selectedWord,
  onClose,
  onSuccess,
}: AddToNotebookModalProps) {
  const { notebooks, refreshNotebooks, createNotebook, addVocab, checkDuplicate } = useNotebooks();
  const { activeLanguage } = useLanguageSetting();
  const { isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      onClose();
      openAuthModal("Vui lòng đăng nhập để lưu từ vựng vào sổ tay và đồng bộ dữ liệu học tập.");
    }
  }, [isAuthenticated, openAuthModal, onClose]);

  useEffect(() => {
    refreshNotebooks();
  }, [refreshNotebooks]);

  const [targetNotebookId, setTargetNotebookId] = useState<string>(() =>
    notebooks.length > 0 ? notebooks[0].id : "NEW"
  );
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(() =>
    notebooks.length === 0 || targetNotebookId === "NEW"
  );
  const [newNotebookName, setNewNotebookName] = useState(
    activeLanguage.code === "en"
      ? "Sổ tay Từ vựng Tiếng Anh"
      : activeLanguage.code === "de"
      ? "Sổ tay Tiếng Đức"
      : "Sổ tay Tiếng Nhật"
  );

  // Sync state whenever notebooks list is reloaded or refreshed from server/localStorage
  useEffect(() => {
    if (notebooks.length > 0) {
      if (!targetNotebookId || targetNotebookId === "" || (!isCreatingNew && !notebooks.some((nb) => nb.id === targetNotebookId))) {
        setTargetNotebookId(notebooks[0].id);
        setIsCreatingNew(false);
      }
    } else {
      setTargetNotebookId("NEW");
      setIsCreatingNew(true);
    }
  }, [notebooks]);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWordType, setSelectedWordType] = useState<WordType>("Danh từ");

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      let finalNotebookId = targetNotebookId;

      if (isCreatingNew || targetNotebookId === "NEW" || notebooks.length === 0) {
        if (!newNotebookName.trim()) {
          setError("Vui lòng nhập tên sổ tay mới");
          setSubmitting(false);
          return;
        }
        const newNb = createNotebook(newNotebookName.trim());
        finalNotebookId = newNb.id;
      }

      if (!finalNotebookId) {
        setError("Vui lòng chọn hoặc tạo sổ tay");
        setSubmitting(false);
        return;
      }

      const wordTitle = selectedWord.kanji || selectedWord.hiragana || "";
      const wordPhonetic = selectedWord.hiragana || selectedWord.phonetic || "";

      if (wordTitle && wordPhonetic) {
        const duplicates = checkDuplicate(finalNotebookId, wordTitle, wordPhonetic);
        if (duplicates && duplicates.length > 0) {
          setError(`Từ "${wordTitle}" đã có trong sổ tay "${duplicates[0].notebookName}"`);
          setSubmitting(false);
          return;
        }
      }

      const vocab = await addVocab(finalNotebookId, {
        kanji: wordTitle,
        hiragana: wordPhonetic,
        onyomi: selectedWord.onyomi || "",
        meaning: selectedWord.meaning || "",
        phonetic: selectedWord.phonetic || "",
        wordType: selectedWordType,
      });

      if (vocab) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError("Không thể lưu từ vựng vào sổ tay");
      }
    } catch (err: any) {
      console.error("Failed to add to notebook:", err);
      setError(err.message || "Đã xảy ra lỗi khi thêm vào sổ tay");
    } finally {
      setSubmitting(false);
    }
  };

  const mainWordText = selectedWord.kanji || selectedWord.hiragana || "";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-1.5">
            <span>📓</span> Thêm từ vào Sổ tay
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2.5 rounded-2xl border border-gray-100 leading-snug">
          Từ: <span className="font-bold text-indigo-600">{mainWordText}</span>
          {selectedWord.meaning ? ` — ${selectedWord.meaning}` : ""}
        </p>

        {/* Word Type Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Loại từ:</label>
          <div className="flex flex-wrap gap-1.5">
            {WORD_TYPES.map((wt) => {
              const s = WORD_TYPE_STYLES[wt];
              const selected = selectedWordType === wt;
              return (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setSelectedWordType(wt)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    selected ? `${s.bg} ${s.text} ${s.border} ring-2 ring-offset-1 ring-current/30` : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {wt}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 flex items-start gap-1.5">
            <span>✕</span> <span>{error}</span>
          </div>
        )}

        {/* Option 1: Choose existing notebook */}
        {notebooks.length > 0 && !isCreatingNew ? (
          <div className="space-y-3 mb-6">
            <label className="block text-xs font-semibold text-gray-700">Chọn Sổ tay ({activeLanguage.name}):</label>
            <div className="relative">
              <select
                value={targetNotebookId}
                onChange={(e) => {
                  if (e.target.value === "NEW") {
                    setIsCreatingNew(true);
                  } else {
                    setTargetNotebookId(e.target.value);
                  }
                }}
                className="w-full rounded-2xl border border-gray-300 px-4 py-2.5 text-xs font-semibold text-gray-800 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 appearance-none pr-8 cursor-pointer"
              >
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    📓 {nb.name} ({nb.vocabulary?.length || 0} từ)
                  </option>
                ))}
                <option value="NEW">➕ + Tạo sổ tay mới...</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400 text-[10px]">
                ▼
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="text-xs text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
            >
              + Tạo sổ tay mới cho {activeLanguage.name}
            </button>
          </div>
        ) : (
          /* Option 2: Inline create notebook */
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-gray-700">Tạo Sổ tay mới ({activeLanguage.name}):</label>
              {notebooks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
                >
                  ← Chọn sổ tay sẵn có
                </button>
              )}
            </div>
            <input
              type="text"
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              placeholder="Nhập tên sổ tay..."
              autoFocus
              className="w-full rounded-2xl border border-indigo-300 px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-semibold transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            {submitting ? "Đang lưu..." : "Lưu vào Sổ tay"}
          </button>
        </div>
      </div>
    </div>
  );
}
