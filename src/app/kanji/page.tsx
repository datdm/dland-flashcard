"use client";

import { useState, useEffect } from "react";
import { getKanjiRepository } from "@/lib/repositories";
import { JLPTLevel, KanjiItem } from "@/lib/repositories/types";
import KanjiStrokeViewer from "@/components/KanjiStrokeViewer";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import KanjiDrawModal from "@/components/KanjiDrawModal";

export default function KanjiHubPage() {
  const { activeLanguage } = useLanguageSetting();
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [activeLevel, setActiveLevel] = useState<JLPTLevel | "ALL">("N5");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDrawModal, setShowDrawModal] = useState(false);

  useEffect(() => {
    async function loadKanji() {
      setLoading(true);
      const repo = getKanjiRepository();
      const levelFilter = activeLevel === "ALL" ? undefined : activeLevel;
      const data = await repo.getAllKanji(levelFilter);
      setKanjiList(data);
      setLoading(false);
    }
    loadKanji();
  }, [activeLevel]);

  const filteredKanji = kanjiList.filter((k) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      k.kanji.includes(q) ||
      k.hanViet.toLowerCase().includes(q) ||
      k.meaning.toLowerCase().includes(q) ||
      k.onyomi.some((o) => o.toLowerCase().includes(q)) ||
      k.kunyomi.some((ku) => ku.toLowerCase().includes(q))
    );
  });

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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">Thư viện Kanji & Nét Vẽ (N5 ➔ N2)</h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed">
              Học âm Hán Việt, âm On/Kun, nét vẽ SVG động và từ ghép theo cấp độ JLPT
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {(["ALL", "N5", "N4", "N3", "N2", "N1"] as const).map((lvl) => (
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

      {/* Search Bar */}
      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm Kanji (vd: 日, NHẬT, Mặt trời, にほん...)..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowDrawModal(true)}
          className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-200 shrink-0 active:scale-98"
          title="Vẽ Kanji để tra từ"
        >
          <span>🖌️</span>
          <span>Vẽ Kanji</span>
        </button>
      </div>

      {/* Kanji Cards Grid */}
      {loading ? (
        <div className="text-center py-20 text-indigo-600 font-medium">Đang tải kho Kanji...</div>
      ) : filteredKanji.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100">
          Không tìm thấy chữ Kanji nào phù hợp
        </div>
      ) : (
        <div className="space-y-4">
          {filteredKanji.map((kanji) => (
            <KanjiStrokeViewer key={kanji.id} kanji={kanji} />
          ))}
        </div>
      )}

      {/* Kanji Handwriting Modal */}
      <KanjiDrawModal
        isOpen={showDrawModal}
        onClose={() => setShowDrawModal(false)}
        onSelectKanji={(kanji) => {
          setSearchQuery(kanji);
        }}
      />
    </div>
  );
}
