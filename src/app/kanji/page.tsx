"use client";

import { useState, useEffect } from "react";
import { getKanjiRepository } from "@/lib/repositories";
import { JLPTLevel, KanjiItem } from "@/lib/repositories/types";
import KanjiStrokeViewer from "@/components/KanjiStrokeViewer";

export default function KanjiHubPage() {
  const [kanjiList, setKanjiList] = useState<KanjiItem[]>([]);
  const [activeLevel, setActiveLevel] = useState<JLPTLevel | "ALL">("N5");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

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
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thư viện Kanji & Nét Vẽ (N5 ➔ N2)</h1>
        <p className="text-xs text-gray-500 mt-1">
          Học âm Hán Việt, âm On/Kun, nét vẽ SVG động và từ ghép theo cấp độ JLPT
        </p>
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
      <div className="mb-6 relative">
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base"
          >
            ✕
          </button>
        )}
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
    </div>
  );
}
