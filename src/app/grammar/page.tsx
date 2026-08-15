"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getGrammarRepository } from "@/lib/repositories";
import { JLPTLevel } from "@/lib/repositories/types";
import { GrammarPoint } from "@/types";
import GrammarCard from "@/components/GrammarCard";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

export default function GrammarHubPage() {
  const { activeLanguage } = useLanguageSetting();
  const langCode = activeLanguage.code;

  const [grammarList, setGrammarList] = useState<GrammarPoint[]>([]);
  const [activeLevel, setActiveLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveLevel("ALL");
  }, [langCode]);

  useEffect(() => {
    async function loadGrammar() {
      setLoading(true);
      const repo = getGrammarRepository();
      const levelFilter = activeLevel === "ALL" ? undefined : (activeLevel as JLPTLevel);
      const data = await repo.getAllGrammar(levelFilter);
      setGrammarList(data);
      setLoading(false);
    }
    loadGrammar();
  }, [activeLevel, langCode]);

  const filteredGrammar = grammarList.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.structure.toLowerCase().includes(q) ||
      g.meaning.toLowerCase().includes(q) ||
      g.explanation?.toLowerCase().includes(q)
    );
  });

  const levelOptions = langCode === "en"
    ? ["ALL", "Band 4.0-4.5", "Band 5.0-5.5", "Band 6.0-6.5", "Band 7.0+"]
    : langCode === "de"
    ? ["ALL", "A1", "A2", "B1", "B2"]
    : ["ALL", "N5", "N4", "N3", "N2", "N1"];

  const headerTitle = langCode === "en"
    ? "Thư Viện Ngữ Pháp Tiếng Anh (IELTS 7.0) 🇬🇧"
    : langCode === "de"
    ? "Thư Viện Ngữ Pháp Tiếng Đức (A1) 🇩🇪"
    : "Thư viện Ngữ Pháp Tiếng Nhật (N5 ➔ N2) 🇯🇵";

  const headerSubtitle = langCode === "en"
    ? "Tổng hợp ngữ pháp IELTS 52 Tuần: Thì Tiếng Anh, Thể bị động, Mệnh đề quan hệ & Cohesion C1"
    : langCode === "de"
    ? "Tổng hợp ngữ pháp Tiếng Đức Netzwerk neu A1 & Cấu trúc Goethe"
    : "Tổng hợp cấu trúc, giải thích chi tiết & ví dụ mẫu từ N5 đến N2";

  const searchPlaceholder = langCode === "en"
    ? "Tìm kiếm ngữ pháp (vd: Thể bị động, Mệnh đề quan hệ, Present Perfect...)..."
    : langCode === "de"
    ? "Tìm kiếm ngữ pháp (vd: Verb, Akkusativ, Dativ...)..."
    : "Tìm kiếm ngữ pháp (vd: ている, わけだ, nguyên nhân...)...";

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{headerTitle}</h1>
          <p className="text-xs text-gray-500 mt-1">{headerSubtitle}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
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

      {/* Search Bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
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

      {/* Grammar Cards List */}
      {loading ? (
        <div className="text-center py-20 text-indigo-600 font-medium">Đang tải kho ngữ pháp...</div>
      ) : filteredGrammar.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100">
          Không tìm thấy cấu trúc ngữ pháp nào phù hợp
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGrammar.map((grammar) => (
            <GrammarCard key={grammar.id} grammar={grammar} />
          ))}
        </div>
      )}
    </div>
  );
}
