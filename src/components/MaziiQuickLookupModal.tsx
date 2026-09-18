"use client";

import { useEffect, useState } from "react";

export interface MaziiWordResult {
  kanji?: string;
  hiragana?: string;
  onyomi?: string; // Hán việt
  meaning?: string;
  level?: string;
  source?: string;
  examples?: { japanese: string; vietnamese: string }[];
}

interface MaziiQuickLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryWord: string;
  initialFurigana?: string;
  initialMeaning?: string;
  onAddToNotebook?: (word: { kanji: string; hiragana: string; meaning: string; wordType?: string }) => void;
}

export default function MaziiQuickLookupModal({
  isOpen,
  onClose,
  queryWord,
  initialFurigana,
  initialMeaning,
  onAddToNotebook,
}: MaziiQuickLookupModalProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MaziiWordResult[]>([]);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !queryWord) return;

    let isMounted = true;
    setLoading(true);
    setActiveTab(0);

    async function fetchMazii() {
      try {
        const cleanWord = queryWord.trim();
        const res = await fetch(`/api/dictionary?keyword=${encodeURIComponent(cleanWord)}&lang=ja`);
        if (!res.ok) throw new Error("Failed to search dictionary");
        const json = await res.json();
        
        if (isMounted) {
          const list = json.data || [];
          if (list.length === 0 && (initialMeaning || initialFurigana)) {
            // Use fallback from reading data
            setResults([
              {
                kanji: cleanWord,
                hiragana: initialFurigana || cleanWord,
                meaning: initialMeaning || "Đang cập nhật giải nghĩa...",
                source: "Giáo trình JLPT",
              },
            ]);
          } else {
            setResults(list);
          }
          setLoading(false);

          // Save to shared Mazii lookup history for sync between Web App and Chrome Extension
          try {
            const rawHist = localStorage.getItem("dland_mazii_history");
            const hist = rawHist ? JSON.parse(rawHist) : [];
            const topItem = list[0] || {};
            const newEntry = {
              query: cleanWord,
              kanji: topItem.kanji || cleanWord,
              hiragana: topItem.hiragana || initialFurigana || "",
              meaning: topItem.meaning || initialMeaning || "",
              timestamp: new Date().toISOString(),
            };
            const updatedHist = [newEntry, ...hist.filter((h: any) => h.query !== cleanWord)].slice(0, 50);
            localStorage.setItem("dland_mazii_history", JSON.stringify(updatedHist));
            window.dispatchEvent(new CustomEvent("mazii-history-updated"));
          } catch (e) {
            console.warn("Error saving Mazii history:", e);
          }
        }
      } catch (err) {
        console.error("Mazii lookup error:", err);
        if (isMounted) {
          setResults([
            {
              kanji: queryWord,
              hiragana: initialFurigana || queryWord,
              meaning: initialMeaning || "Không tìm thấy dữ liệu từ điển. Vui lòng mở Mazii trực tiếp.",
              source: "Mazii Search",
            },
          ]);
          setLoading(false);
        }
      }
    }

    fetchMazii();

    return () => {
      isMounted = false;
    };
  }, [isOpen, queryWord, initialFurigana, initialMeaning]);

  if (!isOpen) return null;

  const playSpeech = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    window.speechSynthesis.speak(utterance);
  };

  const currentItem = results[activeTab] || {
    kanji: queryWord,
    hiragana: initialFurigana || queryWord,
    meaning: initialMeaning || "Đang tra cứu...",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <div>
              <h3 className="font-extrabold text-sm">Tra Cứu Từ Điển Mazii</h3>
              <p className="text-[10px] text-amber-100 font-medium">Nhật - Việt • Hán Tự • Furigana chuẩn Mazii.net</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-gray-500">Đang tra cứu từ điển Mazii cho "{queryWord}"...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <span className="text-3xl">📖</span>
              <p className="text-xs text-gray-600 font-bold">Chưa tìm thấy giải nghĩa cho từ "{queryWord}"</p>
              <a
                href={`https://mazii.net/search/word?dict=javi&query=${encodeURIComponent(queryWord)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-amber-600 transition-colors"
              >
                🌐 Mở tìm kiếm trên Mazii.net →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Word Header Card */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/60 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-black text-gray-900">
                      {currentItem.kanji || currentItem.hiragana || queryWord}
                    </span>
                    {currentItem.hiragana && currentItem.kanji !== currentItem.hiragana && (
                      <span className="text-base font-bold text-amber-700 font-mono">
                        【{currentItem.hiragana}】
                      </span>
                    )}
                    {currentItem.onyomi && (
                      <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 text-[11px] font-extrabold rounded-md uppercase">
                        Hán Việt: {currentItem.onyomi}
                      </span>
                    )}
                    {currentItem.level && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-full">
                        {currentItem.level}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                    Nguồn: {currentItem.source || "Mazii Dictionary"}
                  </span>
                </div>

                {/* Pronounce button */}
                <button
                  onClick={() => playSpeech(currentItem.kanji || currentItem.hiragana || queryWord)}
                  className="p-2.5 bg-white hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 shadow-3xs transition-colors shrink-0 cursor-pointer"
                  title="Phát âm từ này"
                >
                  🔊
                </button>
              </div>

              {/* Multiple definitions selector (if multiple matches) */}
              {results.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mr-1">Các kết quả:</span>
                  {results.slice(0, 5).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                        activeTab === idx
                          ? "bg-amber-500 text-white border-amber-500 shadow-3xs"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {item.kanji || item.hiragana} (#{idx + 1})
                    </button>
                  ))}
                </div>
              )}

              {/* Meanings & Explanations */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-3xs space-y-2">
                <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  📖 Ý nghĩa tiếng Việt:
                </h4>
                <div className="text-sm font-semibold text-gray-800 leading-relaxed whitespace-pre-line">
                  {currentItem.meaning?.split("; ").map((mean, mIdx) => (
                    <div key={mIdx} className="flex items-start gap-2 py-0.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{mean}</span>
                    </div>
                  )) || currentItem.meaning}
                </div>
              </div>

              {/* Real Mazii Examples Section */}
              {currentItem.examples && currentItem.examples.length > 0 && (
                <div className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200/50 space-y-2.5">
                  <h4 className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>💬</span> Câu ví dụ thực tế (Mazii):
                  </h4>
                  <div className="space-y-2">
                    {currentItem.examples.map((ex, exIdx) => (
                      <div key={exIdx} className="bg-white p-3 rounded-xl border border-amber-100 shadow-3xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900 leading-relaxed">{ex.japanese}</span>
                          <button
                            onClick={() => playSpeech(ex.japanese)}
                            className="p-1 text-gray-400 hover:text-amber-600 transition-colors shrink-0 cursor-pointer"
                            title="Nghe câu ví dụ"
                          >
                            🔊
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-600 italic leading-relaxed">
                          {ex.vietnamese}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <a
            href={`https://mazii.net/search/word?dict=javi&query=${encodeURIComponent(queryWord)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-extrabold text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            <span>🌐 Xem trên Mazii.net</span>
            <span>↗</span>
          </a>

          <div className="flex items-center gap-2">
            {onAddToNotebook && (
              <button
                onClick={() => {
                  onAddToNotebook({
                    kanji: currentItem.kanji || queryWord,
                    hiragana: currentItem.hiragana || queryWord,
                    meaning: currentItem.meaning || initialMeaning || "",
                    wordType: "Danh từ",
                  });
                  onClose();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>🔖</span>
                <span>Thêm vào Sổ tay</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
