"use client";

import { useState, useEffect } from "react";
import { getKanjiRepository } from "@/lib/repositories";
import { JLPTLevel, KanjiItem } from "@/lib/repositories/types";
import KanjiStrokeViewer from "@/components/KanjiStrokeViewer";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import KanjiDrawModal from "@/components/KanjiDrawModal";
import BreadcrumbNav from "@/components/BreadcrumbNav";

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
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-8 md:pb-4">
      {/* Breadcrumb Bar */}
      <BreadcrumbNav items={[{ label: "Kho Kanji", icon: "🉐" }]} />

      {/* Header Banner (Compact Minimalist - Light Theme matching background) */}
      <div className={`rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-2xs border transition-all duration-300 bg-gradient-to-r ${
        activeLanguage.code === "en"
          ? "from-white via-blue-50/40 to-indigo-50/30 border-blue-100/80"
          : activeLanguage.code === "de"
          ? "from-white via-amber-50/40 to-orange-50/30 border-amber-100/80"
          : activeLanguage.code === "ko"
          ? "from-white via-rose-50/40 to-pink-50/30 border-rose-100/80"
          : activeLanguage.code === "zh"
          ? "from-white via-red-50/40 to-amber-50/30 border-red-100/80"
          : "from-white via-teal-50/40 to-indigo-50/30 border-teal-100/80"
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase shrink-0 border ${
              activeLanguage.code === "en"
                ? "bg-blue-50 text-blue-700 border-blue-200/80"
                : activeLanguage.code === "de"
                ? "bg-amber-50 text-amber-800 border-amber-200/80"
                : activeLanguage.code === "ko"
                ? "bg-rose-50 text-rose-700 border-rose-200/80"
                : activeLanguage.code === "zh"
                ? "bg-red-50 text-red-700 border-red-200/80"
                : "bg-teal-50 text-teal-700 border-teal-200/80"
            }`}>
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight truncate">Thư viện Kanji & Nét Vẽ (N5 ➔ N2)</h1>
              <p className="text-[11px] text-gray-500 truncate hidden sm:block">
                Học âm Hán Việt, âm On/Kun, nét vẽ SVG động và từ ghép theo cấp độ JLPT
              </p>
            </div>
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
          onClick={() => setShowDrawModal((prev) => !prev)}
          className={`py-3 px-4 rounded-2xl ${
            showDrawModal
              ? "bg-indigo-900 text-white ring-4 ring-indigo-200"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          } font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-200 shrink-0 active:scale-98`}
          title={showDrawModal ? "Đóng bảng vẽ Kanji" : "Vẽ Kanji để tra từ"}
        >
          <span>{showDrawModal ? "✕" : "🖌️"}</span>
          <span>{showDrawModal ? "Đóng vẽ" : "Vẽ Kanji"}</span>
        </button>
      </div>

      {/* Inline Kanji Handwriting Pad */}
      {showDrawModal && (
        <KanjiDrawModal
          isOpen={showDrawModal}
          onClose={() => setShowDrawModal(false)}
          variant="inline"
          onSelectKanji={(kanji) => {
            setSearchQuery((prev) => (prev ? `${prev}${kanji}` : kanji));
          }}
        />
      )}

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
