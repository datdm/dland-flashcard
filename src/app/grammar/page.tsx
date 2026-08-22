"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getGrammarRepository } from "@/lib/repositories";
import { GrammarPoint, GrammarCollection } from "@/types";
import GrammarCard from "@/components/GrammarCard";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useGrammarCollections } from "@/hooks/useGrammarCollections";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";

function normalizeSearchText(text: string = ""): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[～〜~]/g, "")
    .replace(/[\s\u3000\u00a0\t\r\n]+/g, " ")
    .replace(/[・、。，,;；:：\(\)\[\]「」『』\.\?\!？]/g, "")
    .trim();
}

export default function GrammarHubPage() {
  const { activeLanguage } = useLanguageSetting();
  const langCode = activeLanguage.code;

  // Hooks for custom collections & user progress
  const { collections, addCollection, deleteCollection, addGrammarPoint } = useGrammarCollections();
  const { progress, toggleLearned, toggleFavorite } = useGrammarProgress();

  // Tab state: "library" (Tra cứu toàn bộ) vs "collections" (Bộ sưu tập của tôi)
  const [activeTab, setActiveTab] = useState<"library" | "collections">("library");

  // Library & Search states
  const [allGrammarList, setAllGrammarList] = useState<GrammarPoint[]>([]);
  const [activeLevel, setActiveLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Add to collection modal states
  const [selectedGrammarForCollection, setSelectedGrammarForCollection] = useState<GrammarPoint | null>(null);
  const [targetCollectionId, setTargetCollectionId] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Create new collection form states
  const [showAddCollectionForm, setShowAddCollectionForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setActiveLevel("ALL");
  }, [langCode]);

  useEffect(() => {
    async function loadGrammar() {
      setLoading(true);
      const repo = getGrammarRepository();
      const data = await repo.getAllGrammar();
      setAllGrammarList(data);
      setLoading(false);
    }
    loadGrammar();
  }, [langCode]);

  const cleanQuery = searchQuery.trim();
  const normQuery = normalizeSearchText(cleanQuery);

  // Filter grammar points
  const { filteredGrammar, isCrossLevelResult } = (() => {
    if (!normQuery) {
      const list = activeLevel === "ALL" 
        ? allGrammarList 
        : allGrammarList.filter((g) => g.level === activeLevel);
      return { filteredGrammar: list, isCrossLevelResult: false };
    }

    const matchesSearch = (g: GrammarPoint) => {
      const structNorm = normalizeSearchText(g.structure);
      const meanNorm = normalizeSearchText(g.meaning);
      const expNorm = normalizeSearchText(g.explanation || "");
      const exMatch = g.examples?.some(
        (ex) =>
          normalizeSearchText(ex.sentence).includes(normQuery) ||
          normalizeSearchText(ex.meaning).includes(normQuery) ||
          normalizeSearchText(ex.romaji || "").includes(normQuery)
      );

      return (
        structNorm.includes(normQuery) ||
        meanNorm.includes(normQuery) ||
        expNorm.includes(normQuery) ||
        !!exMatch
      );
    };

    // If level filter is active, check level matches first
    if (activeLevel !== "ALL") {
      const levelMatches = allGrammarList.filter(
        (g) => g.level === activeLevel && matchesSearch(g)
      );
      if (levelMatches.length > 0) {
        return { filteredGrammar: levelMatches, isCrossLevelResult: false };
      }
      // Fallback to cross-level matches if none in current level
      const allMatches = allGrammarList.filter(matchesSearch);
      if (allMatches.length > 0) {
        return { filteredGrammar: allMatches, isCrossLevelResult: true };
      }
      return { filteredGrammar: [], isCrossLevelResult: false };
    }

    return { filteredGrammar: allGrammarList.filter(matchesSearch), isCrossLevelResult: false };
  })();

  const levelOptions = langCode === "en"
    ? ["ALL", "Band 4.0-4.5", "Band 5.0-5.5", "Band 6.0-6.5", "Band 7.0+"]
    : langCode === "de"
    ? ["ALL", "A1", "A2", "B1", "B2"]
    : ["ALL", "N5", "N4", "N3", "N2", "N1"];

  const headerTitle = langCode === "en"
    ? "Thư Viện Ngữ Pháp Tiếng Anh (IELTS 7.0) 🇬🇧"
    : langCode === "de"
    ? "Thư Viện Ngữ Pháp Tiếng Đức (A1) 🇩🇪"
    : "Thư Viện Ngữ Pháp Tiếng Nhật (N5 ➔ N2) 🇯🇵";

  const headerSubtitle = langCode === "en"
    ? "Tổng hợp ngữ pháp IELTS 52 Tuần: Thì Tiếng Anh, Thể bị động, Mệnh đề quan hệ & Cohesion C1"
    : langCode === "de"
    ? "Tổng hợp ngữ pháp Tiếng Đức Netzwerk neu A1 & Cấu trúc Goethe"
    : "Tổng hợp cấu trúc, giải thích chi tiết & ví dụ mẫu từ N5 đến N2";

  const searchPlaceholder = langCode === "en"
    ? "Nhập cấu trúc ngữ pháp cần tìm (vd: Passive, Relative Clause, Present Perfect, Thì hiện tại...)..."
    : langCode === "de"
    ? "Nhập cấu trúc ngữ pháp cần tìm (vd: Verb, Akkusativ, Dativ, Động từ...)..."
    : "Nhập cấu trúc cần tìm (vd: ている, わけだ, nguyên nhân, mục đích, cấm đoán...)...";

  // Handle add grammar to collection
  const handleSaveToCollection = () => {
    if (!selectedGrammarForCollection || !targetCollectionId) return;

    addGrammarPoint(targetCollectionId, {
      structure: selectedGrammarForCollection.structure,
      meaning: selectedGrammarForCollection.meaning,
      explanation: selectedGrammarForCollection.explanation,
      mnemonic: selectedGrammarForCollection.mnemonic,
      level: selectedGrammarForCollection.level,
      notes: selectedGrammarForCollection.notes,
      examples: selectedGrammarForCollection.examples,
    });

    setSaveSuccessMsg(`Đã thêm vào bộ sưu tập thành công!`);
    setTimeout(() => {
      setSelectedGrammarForCollection(null);
      setTargetCollectionId("");
      setSaveSuccessMsg(null);
    }, 1200);
  };

  // Handle create new collection
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    addCollection(newCollectionName.trim(), newCollectionDesc.trim() || undefined);
    setNewCollectionName("");
    setNewCollectionDesc("");
    setShowAddCollectionForm(false);
  };

  // Calculate learned progress percentage for collection
  const getCollectionProgress = (c: GrammarCollection) => {
    if (!c.grammarPoints || c.grammarPoints.length === 0) return 0;
    const learnedCount = c.grammarPoints.filter((p) => progress[p.id]?.learned).length;
    return Math.round((learnedCount / c.grammarPoints.length) * 100);
  };

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-extrabold tracking-widest uppercase">
                {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">{headerTitle}</h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1.5 max-w-2xl leading-relaxed">
              {headerSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("library")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                activeTab === "library"
                  ? "bg-white text-indigo-900 shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
              }`}
            >
              <span>🔍</span>
              <span>Tra Cứu Kho ({allGrammarList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("collections")}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                activeTab === "collections"
                  ? "bg-white text-indigo-900 shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
              }`}
            >
              <span>📁</span>
              <span>Bộ Sưu Tập ({collections.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: LIBRARY & SEARCH */}
      {activeTab === "library" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Search Input Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPaste={(e) => {
                const pasted = e.clipboardData?.getData("text");
                if (pasted) {
                  e.preventDefault();
                  const cleaned = pasted.trim().replace(/[\r\n\t]+/g, " ");
                  setSearchQuery(cleaned);
                }
              }}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full rounded-2xl border border-indigo-200 bg-white px-5 py-4 text-base focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 shadow-sm transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none p-1.5 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            ) : (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">🔍</span>
            )}
          </div>

          {/* Level Filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {levelOptions.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeLevel === lvl
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {lvl === "ALL" ? "Tất cả Cấp độ" : lvl}
              </button>
            ))}
          </div>

          {/* Cross-level Notification Banner */}
          {isCrossLevelResult && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>
                  Không có kết quả trong cấp độ <strong>{activeLevel}</strong>, đang hiển thị <strong>{filteredGrammar.length}</strong> kết quả phù hợp từ các cấp độ khác.
                </span>
              </div>
              <button
                onClick={() => setActiveLevel("ALL")}
                className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-lg transition-colors text-[11px] shrink-0 cursor-pointer"
              >
                Xem tất cả cấp độ
              </button>
            </div>
          )}

          {/* Result Count Header */}
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>Tìm thấy <strong>{filteredGrammar.length}</strong> điểm ngữ pháp:</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-indigo-600 hover:underline font-medium cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Grammar Cards List */}
          {loading ? (
            <div className="bg-white rounded-3xl p-16 border border-gray-100 text-center text-indigo-600 font-bold text-sm flex items-center justify-center gap-3 shadow-2xs">
              <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Đang tải kho ngữ pháp...</span>
            </div>
          ) : filteredGrammar.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 space-y-2 shadow-2xs">
              <div className="text-4xl">🔍</div>
              <p className="font-bold text-gray-700 text-sm">Không tìm thấy cấu trúc ngữ pháp nào</p>
              <p className="text-xs text-gray-400">Thử tìm bằng từ khóa khác hoặc chuyển sang &quot;Tất cả Cấp độ&quot;.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGrammar.map((grammar) => (
                <GrammarCard
                  key={grammar.id}
                  grammar={grammar}
                  progress={progress[grammar.id]}
                  onToggleLearned={toggleLearned}
                  onToggleFavorite={toggleFavorite}
                  onAddToCollection={(g) => setSelectedGrammarForCollection(g)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY COLLECTIONS */}
      {activeTab === "collections" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <span>📁</span> Bộ Sưu Tập Ngữ Pháp Cá Nhân
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Tự gom các mẫu ngữ pháp thành từng bộ riêng biệt để ôn tập Flashcard và theo dõi tiến độ học tập.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddCollectionForm(!showAddCollectionForm)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-200 cursor-pointer flex items-center gap-1.5"
            >
              <span>{showAddCollectionForm ? "✕" : "➕"}</span>
              <span>{showAddCollectionForm ? "Đóng form" : "Tạo Bộ Ngữ Pháp Mới"}</span>
            </button>
          </div>

          {/* Create Collection Form */}
          {showAddCollectionForm && (
            <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-sm space-y-4 animate-in zoom-in-95">
              <h3 className="text-sm font-extrabold text-gray-900">Tạo Bộ Sưu Tập Mới</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Tên bộ ngữ pháp *
                  </label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Ví dụ: Ngữ pháp N2 hay gặp, Mẫu câu xin lỗi công sở..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-600"
                    onKeyPress={(e) => e.key === "Enter" && handleCreateCollection()}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                    Mô tả (không bắt buộc)
                  </label>
                  <textarea
                    value={newCollectionDesc}
                    onChange={(e) => setNewCollectionDesc(e.target.value)}
                    placeholder="Ghi chú thêm về mục đích hoặc lộ trình học của bộ này..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-indigo-600 resize-none h-20"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Tạo Ngay
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCollectionForm(false);
                      setNewCollectionName("");
                      setNewCollectionDesc("");
                    }}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collections List */}
          {collections.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 shadow-2xs space-y-3">
              <div className="text-4xl">📚</div>
              <p className="font-bold text-gray-700 text-sm">Chưa có bộ sưu tập ngữ pháp nào</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Hãy nhấn &quot;Tạo Bộ Ngữ Pháp Mới&quot; hoặc tìm kiếm ngữ pháp trong thư viện và bấm &quot;➕ Bộ sưu tập&quot; để thêm vào.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collections.map((c) => {
                const progressPct = getCollectionProgress(c);
                const count = c.grammarPoints?.length || 0;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-extrabold text-gray-900 leading-snug">{c.name}</h3>
                          {c.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-indigo-600">{progressPct}%</span>
                          <span className="block text-[10px] text-gray-400">Đã học</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-gray-400 mt-2 font-medium">
                        📊 {count} điểm ngữ pháp
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/grammar/practice/${c.id}`}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-3xs"
                        >
                          <span>📖</span>
                          <span>Ôn Luyện</span>
                        </Link>
                        <Link
                          href={`/grammar/${c.id}`}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200"
                        >
                          ✏️ Sửa
                        </Link>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {deletingId === c.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                deleteCollection(c.id);
                                setDeletingId(null);
                              }}
                              className="px-2.5 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer"
                            >
                              Xác nhận xóa
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              Hủy
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(c.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            title="Xóa bộ sưu tập này"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add To Collection Modal */}
      {selectedGrammarForCollection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                <span>➕</span> Lưu Vào Bộ Sưu Tập Ngữ Pháp
              </h3>
              <button
                onClick={() => {
                  setSelectedGrammarForCollection(null);
                  setSaveSuccessMsg(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
              <div className="text-xs font-extrabold text-indigo-900 font-mono">
                {selectedGrammarForCollection.structure}
              </div>
              <div className="text-xs text-indigo-700">
                {selectedGrammarForCollection.meaning}
              </div>
            </div>

            {saveSuccessMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-2xl text-center">
                ✓ {saveSuccessMsg}
              </div>
            ) : collections.length === 0 ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-xs text-gray-500">Bạn chưa có bộ sưu tập nào. Hãy tạo một bộ mới:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Tên bộ sưu tập mới..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    onClick={() => {
                      if (!newCollectionName.trim()) return;
                      const newCol = addCollection(newCollectionName.trim());
                      setTargetCollectionId(newCol.id);
                      setNewCollectionName("");
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                  >
                    Tạo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Chọn bộ sưu tập đích:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {collections.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setTargetCollectionId(c.id)}
                      className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                        targetCollectionId === c.id
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-300"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span>📁 {c.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal">{c.grammarPoints?.length || 0} điểm</span>
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-gray-100 flex gap-2 justify-end">
                  <button
                    onClick={() => setSelectedGrammarForCollection(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveToCollection}
                    disabled={!targetCollectionId}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 shadow-md shadow-indigo-200 cursor-pointer"
                  >
                    Lưu Vào Bộ Này
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
