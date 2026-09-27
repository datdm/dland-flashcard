"use client";

import { useState, useEffect } from "react";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useAuth } from "@/context/AuthContext";
import { Vocabulary, WordType, WORD_TYPES } from "@/types";

interface AddToNotebookModalProps {
  selectedWord: Partial<Vocabulary> & {
    kanji?: string;
    hiragana?: string;
    meaning?: string;
    phonetic?: string;
    onyomi?: string;
    wordType?: WordType;
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
  const { isAuthenticated, openAuthModal, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      onClose();
      openAuthModal("Vui lòng đăng nhập để lưu từ vựng vào sổ tay và đồng bộ dữ liệu học tập.");
    }
  }, [isAuthenticated, openAuthModal, onClose]);

  useEffect(() => {
    refreshNotebooks();
  }, [refreshNotebooks]);

  // Form input states (editable like extension dialog)
  const [wordKanji, setWordKanji] = useState<string>(
    selectedWord.kanji || selectedWord.hiragana || ""
  );
  const [wordHiragana, setWordHiragana] = useState<string>(
    selectedWord.hiragana || selectedWord.phonetic || ""
  );
  const [wordOnyomi, setWordOnyomi] = useState<string>(
    selectedWord.onyomi || ""
  );
  const [wordMeaning, setWordMeaning] = useState<string>(
    selectedWord.meaning || ""
  );
  const [selectedWordType, setSelectedWordType] = useState<WordType>(
    selectedWord.wordType || "Danh từ"
  );

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

  // Sync notebook dropdown when notebooks list changes
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

  const handlePlayAudio = () => {
    const textToSpeak = wordKanji || wordHiragana || selectedWord.kanji || selectedWord.hiragana;
    if (!textToSpeak) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = activeLanguage.code === "en" ? "en-US" : activeLanguage.code === "de" ? "de-DE" : "ja-JP";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

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

      const finalKanji = wordKanji.trim();
      const finalHiragana = wordHiragana.trim();

      if (finalKanji && finalHiragana) {
        const duplicates = checkDuplicate(finalNotebookId, finalKanji, finalHiragana);
        if (duplicates && duplicates.length > 0) {
          setError(`Từ "${finalKanji}" đã có trong sổ tay "${duplicates[0].notebookName}"`);
          setSubmitting(false);
          return;
        }
      }

      const vocab = await addVocab(finalNotebookId, {
        kanji: finalKanji,
        hiragana: finalHiragana,
        onyomi: wordOnyomi.trim(),
        meaning: wordMeaning.trim(),
        phonetic: selectedWord.phonetic || finalHiragana,
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

  const displayTitle = wordKanji || wordHiragana || "Từ mới";
  const displaySub = wordHiragana && wordKanji && wordKanji !== wordHiragana ? wordHiragana : wordOnyomi || "";

  return (
    <div onClick={onClose} className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-[480px] border border-slate-200 flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-slate-100/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 truncate">
              <span>📖</span> Thêm Từ Vào Sổ Tay
            </h3>
            {isAuthenticated ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shrink-0 shadow-2xs" title="Dữ liệu sẽ tự động đồng bộ lên Database">
                ☁️ {user?.username || "Đã kết nối DB"}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold shrink-0">
                💾 Lưu cục bộ
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-transparent hover:bg-slate-200/80 text-slate-500 hover:text-slate-900 flex items-center justify-center text-sm font-bold transition-all shrink-0 cursor-pointer"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-3.5 max-h-[75vh] overflow-y-auto">

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 flex items-start gap-1.5">
              <span>✕</span> <span>{error}</span>
            </div>
          )}

          {/* Preview & Audio Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-extrabold text-indigo-950 leading-tight truncate">
                {displayTitle}
              </div>
              {displaySub && (
                <div className="text-xs font-bold text-indigo-600 mt-0.5 truncate">
                  {displaySub}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handlePlayAudio}
              className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center text-base transition-all shrink-0 cursor-pointer shadow-3xs"
              title="Phát âm"
            >
              🔊
            </button>
          </div>

          {/* Form Field 1: Word / Kanji */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Từ vựng (Kanji / Từ gốc)
            </label>
            <input
              type="text"
              value={wordKanji}
              onChange={(e) => setWordKanji(e.target.value)}
              placeholder="Ví dụ: 日本語"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Form Field 2: 2 Columns for Hiragana & Onyomi */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Hiragana / Cách đọc
              </label>
              <input
                type="text"
                value={wordHiragana}
                onChange={(e) => setWordHiragana(e.target.value)}
                placeholder="Ví dụ: にほんご"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Âm Hán Việt (Onyomi)
              </label>
              <input
                type="text"
                value={wordOnyomi}
                onChange={(e) => setWordOnyomi(e.target.value)}
                placeholder="Ví dụ: NHẬT BẢN NGỮ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Form Field 3: Meaning */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Nghĩa tiếng Việt
            </label>
            <textarea
              value={wordMeaning}
              onChange={(e) => setWordMeaning(e.target.value)}
              placeholder="Nhập nghĩa tiếng Việt của từ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all min-h-[60px] resize-y"
            />
          </div>

          {/* Form Field 4: 2 Columns for Word Type & Target Notebook */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Loại từ
              </label>
              <select
                value={selectedWordType}
                onChange={(e) => setSelectedWordType(e.target.value as WordType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all"
              >
                {WORD_TYPES.map((wt) => (
                  <option key={wt} value={wt}>
                    {wt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Lưu vào Sổ tay
              </label>
              <select
                value={targetNotebookId}
                onChange={(e) => {
                  if (e.target.value === "NEW") {
                    setIsCreatingNew(true);
                  } else {
                    setTargetNotebookId(e.target.value);
                    setIsCreatingNew(false);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer transition-all truncate"
              >
                {notebooks.map((nb) => (
                  <option key={nb.id} value={nb.id}>
                    📓 {nb.name} ({nb.vocabulary?.length || 0} từ)
                  </option>
                ))}
                <option value="NEW">➕ Tạo sổ tay mới...</option>
              </select>
            </div>
          </div>

          {/* New Notebook Input (if NEW selected) */}
          {(isCreatingNew || targetNotebookId === "NEW") && (
            <div className="flex flex-col gap-1 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  Tên Sổ tay mới ({activeLanguage.name})
                </label>
                {notebooks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setTargetNotebookId(notebooks[0].id);
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-bold underline"
                  >
                    ← Chọn sổ tay sẵn có
                  </button>
                )}
              </div>
              <input
                type="text"
                value={newNotebookName}
                onChange={(e) => setNewNotebookName(e.target.value)}
                placeholder="Ví dụ: Từ vựng đọc báo, Sổ tay N3..."
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-300 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting ? "⏳ Đang lưu..." : "💾 Lưu vào Sổ tay"}
          </button>
        </div>

      </div>
    </div>
  );
}
