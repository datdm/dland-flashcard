"use client";

import { useState, useEffect } from "react";
import { searchMultilingualDictionary, DictionaryItem } from "@/lib/services/dictionaryService";
import { useProgress } from "@/hooks/useProgress";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AddToNotebookModal from "@/components/AddToNotebookModal";

export default function DictionarySearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DictionaryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeLevel, setActiveLevel] = useState<string>("ALL");
  const [selectedWordForNotebook, setSelectedWordForNotebook] = useState<DictionaryItem | null>(null);
  const [targetNotebookId, setTargetNotebookId] = useState<string>("");
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const { activeLanguage } = useLanguageSetting();
  const langCode = activeLanguage.code;

  const { getVocabProgress, toggleLearned, toggleFavorite } = useProgress();
  const { notebooks, addVocab, checkDuplicate } = useNotebooks();

  useEffect(() => {
    setActiveLevel("ALL");
  }, [langCode]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const data = await searchMultilingualDictionary(query, langCode);
      setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, langCode]);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode === "de" ? "de-DE" : langCode === "en" ? "en-US" : "ja-JP";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddToNotebook = async () => {
    if (!selectedWordForNotebook || !targetNotebookId) return;

    if (selectedWordForNotebook.kanji && selectedWordForNotebook.hiragana) {
      const duplicates = checkDuplicate(targetNotebookId, selectedWordForNotebook.kanji, selectedWordForNotebook.hiragana);
      if (duplicates && duplicates.length > 0) {
        const otherDuplicates = duplicates.filter((d) => d.notebookId !== targetNotebookId);
        if (otherDuplicates.length > 0) {
          const notebookNames = Array.from(new Set(otherDuplicates.map((d) => `"${d.notebookName}"`))).join(", ");
          setDuplicateError(`Từ này đã có trong sổ tay: ${notebookNames}`);
        } else {
          setDuplicateError("Từ này đã có trong sổ tay này");
        }
        return;
      }
    }

    const vocab = await addVocab(targetNotebookId, {
      kanji: selectedWordForNotebook.kanji || "",
      hiragana: selectedWordForNotebook.hiragana || "",
      onyomi: selectedWordForNotebook.onyomi || "",
      meaning: selectedWordForNotebook.meaning || "",
      phonetic: selectedWordForNotebook.phonetic || ""
    });

    if (vocab) {
      setSelectedWordForNotebook(null);
      setTargetNotebookId("");
      setDuplicateError(null);
    }
  };

  const filteredResults = results.filter((item) => {
    if (activeLevel === "ALL") return true;
    return item.level === activeLevel;
  });

  const levelOptions = langCode === "en"
    ? ["ALL", "Band 4.0-4.5", "Band 5.0-5.5", "Band 6.0-6.5", "Band 7.0+"]
    : langCode === "de"
    ? ["ALL", "A1", "A2", "B1", "B2"]
    : ["ALL", "N5", "N4", "N3", "N2", "N1"];

  const headerTitle = langCode === "en"
    ? "Tra Cứu Từ Điển Anh - Việt 🇬🇧"
    : langCode === "de"
    ? "Tra Cứu Từ Điển Đức - Việt 🇩🇪"
    : "Tra Cứu Từ Điển Nhật - Việt 🇯🇵";

  const headerSubtitle = langCode === "en"
    ? "Tra cứu Từ vựng IELTS 7.0 (52 Tuần), Oxford 3000 & Ngữ pháp Tiếng Anh"
    : langCode === "de"
    ? "Tra cứu Từ vựng Goethe A1 & Giáo trình Netzwerk neu A1"
    : "Tra cứu nghĩa Tiếng Việt 100% (Kho N5-N2, Mazii & Jisho Auto-Translate)";

  const searchPlaceholder = langCode === "en"
    ? "Nhập từ tiếng Anh hoặc tiếng Việt (vd: Routine, Schedule, Thói quen)..."
    : langCode === "de"
    ? "Nhập từ tiếng Đức hoặc tiếng Việt (vd: Hallo, Danke, Xin chào)..."
    : "Nhập từ cần tìm (vd: 日本語, にほんご, nihongo, tiếng nhật)...";

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      {/* Header Banner */}
      <div className={`rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl mb-6 transition-all duration-300 bg-gradient-to-r ${
        activeLanguage.code === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : activeLanguage.code === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">{headerTitle}</h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed">
              {headerSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="mb-6 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          autoFocus
          className="w-full rounded-2xl border border-indigo-200 bg-white px-5 py-4 text-base focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 shadow-sm"
        />
        {query ? (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none p-1"
          >
            ✕
          </button>
        ) : (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">🔍</span>
        )}
      </div>

      {/* Level Filters */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
        {levelOptions.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setActiveLevel(lvl)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeLevel === lvl
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {lvl === "ALL" ? "Tất cả Cấp độ" : lvl}
          </button>
        ))}
      </div>

      {/* Search Results List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-indigo-600 font-medium">
          Đang tra cứu từ điển...
        </div>
      ) : !query.trim() ? (
        <div className="bg-white rounded-3xl p-10 text-center text-gray-400 border border-gray-100 shadow-2xs">
          <div className="text-4xl mb-2">🔍</div>
          <p className="font-semibold text-gray-700">Hãy nhập từ vựng để bắt đầu tra cứu</p>
          <p className="text-xs text-gray-400 mt-1">Tra cứu từ vựng học thuật & nghĩa Tiếng Việt chuẩn xác</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center text-gray-400 border border-gray-100">
          Không tìm thấy kết quả nào phù hợp với từ khóa "{query}"
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 px-1">
            Tìm thấy {filteredResults.length} kết quả:
          </div>
          {filteredResults.map((item) => {
            const prog = getVocabProgress(item.id);
            const textToSpeak = item.kanji || item.hiragana || "";

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-2xs hover:shadow-md ${
                  prog.learned ? "border-emerald-200 bg-emerald-50/30" : "border-gray-100"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-2xl font-extrabold text-gray-900">
                        {item.kanji || item.hiragana}
                      </span>
                      {item.kanji && item.hiragana && langCode === "ja" && (
                        <span className="text-sm font-semibold text-indigo-600 font-mono">
                          ({item.hiragana})
                        </span>
                      )}
                      {item.level && (
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md ${
                          item.level.includes("Band") || item.level.includes("IELTS")
                            ? "bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-3xs"
                            : "bg-indigo-100 text-indigo-700"
                        }`}>
                          {item.level}
                        </span>
                      )}
                      {item.source && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800">
                          {item.source}
                        </span>
                      )}
                    </div>

                    {/* Phiên âm IPA & Furigana Row */}
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      {langCode === "en" && (item.hiragana || (item.phonetic && item.phonetic.includes("/"))) && (
                        <span className="text-xs font-black text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg font-mono shadow-3xs flex items-center gap-1">
                          <span>🗣️ Phiên âm IPA:</span>
                          <span className="text-purple-950 font-extrabold">
                            {item.hiragana && item.hiragana.startsWith("/") 
                              ? item.hiragana 
                              : (item.phonetic && item.phonetic.includes("/") ? item.phonetic : `/${item.hiragana}/`)}
                          </span>
                        </span>
                      )}

                      {langCode === "de" && item.hiragana && item.hiragana !== item.kanji && (
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg font-mono">
                          🗣️ {item.hiragana}
                        </span>
                      )}

                      {item.onyomi && (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                          Âm Hán: {item.onyomi}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-emerald-700 mt-1.5 leading-snug">
                      {item.meaning}
                    </p>

                    {item.phonetic && !item.phonetic.startsWith("Phiên âm chuẩn IPA") && (
                      <p className="text-xs text-gray-400 italic mt-0.5">{item.phonetic}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {textToSpeak && (
                      <button
                        onClick={() => speakText(textToSpeak)}
                        className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 flex items-center justify-center transition-colors text-base"
                        title="Nghe đọc"
                      >
                        🔊
                      </button>
                    )}

                    <button
                      onClick={() => toggleFavorite(item.id)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors ${
                        prog.favorite ? "bg-yellow-50 text-yellow-400" : "bg-gray-50 text-gray-300 hover:text-yellow-400"
                      }`}
                      title="Yêu thích"
                    >
                      ★
                    </button>

                    <button
                      onClick={() => toggleLearned(item.id)}
                      className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs transition-colors ${
                        prog.learned ? "bg-emerald-600 text-white" : "bg-gray-50 text-gray-300 hover:text-emerald-500"
                      }`}
                      title="Đã học"
                    >
                      {prog.learned ? "✓" : "○"}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedWordForNotebook(item);
                        setDuplicateError(null);
                        if (notebooks.length > 0) {
                          setTargetNotebookId(notebooks[0].id);
                        } else {
                          setTargetNotebookId("NEW");
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors"
                      title="Thêm vào sổ tay"
                    >
                      + Sổ tay
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add to Notebook Modal */}
      {selectedWordForNotebook && (
        <AddToNotebookModal
          selectedWord={selectedWordForNotebook}
          onClose={() => setSelectedWordForNotebook(null)}
          onSuccess={() => setSelectedWordForNotebook(null)}
        />
      )}
    </div>
  );
}
