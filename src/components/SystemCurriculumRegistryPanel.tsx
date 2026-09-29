"use client";

import { useEffect, useState } from "react";
import {
  fetchCurriculumRegistry,
  CurriculumRegistryData,
  RegistryBook,
  getAllBooksFromRegistry
} from "@/lib/curriculumRegistry";

export default function SystemCurriculumRegistryPanel() {
  const [registry, setRegistry] = useState<CurriculumRegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLang, setActiveLang] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchCurriculumRegistry();
      setRegistry(data);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-500 font-bold animate-pulse">Đang tải danh mục giáo trình hệ thống...</p>
      </div>
    );
  }

  if (!registry) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-red-100 text-center text-red-600 text-xs font-bold">
        ⚠️ Không thể tải tập tin `public/data/curriculum-registry.json`. Vui lòng kiểm tra lại hệ thống file.
      </div>
    );
  }

  const allBooks = getAllBooksFromRegistry(registry);
  const totalLessons = allBooks.reduce((sum, b) => sum + b.totalLessons, 0);
  const totalVocab = allBooks.reduce((sum, b) => sum + b.totalVocab, 0);
  const totalGrammar = allBooks.reduce((sum, b) => sum + b.totalGrammar, 0);

  const languagesList = Object.values(registry.languages);

  const filteredLanguages = activeLang === "all"
    ? languagesList
    : languagesList.filter((l) => l.code === activeLang);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-bold tracking-wide uppercase text-indigo-200">
              📚 Master Curriculum Registry
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
              Danh Mục Giáo Trình Tập Trung Hệ Thống
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Tất cả các bộ giáo trình được lưu trữ tập trung tại thư mục <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono">public/data/</code> và được chỉ mục bởi master registry.
            </p>
          </div>
          <div className="text-right shrink-0 bg-white/5 border border-white/10 p-3 rounded-2xl">
            <span className="text-[10px] text-gray-400 font-bold block">Master Index Version</span>
            <span className="text-sm font-black text-amber-400 font-mono">v{registry.version}</span>
          </div>
        </div>

        {/* Global System Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">Ngôn ngữ</span>
            <span className="text-xl font-black text-white mt-1 block">{languagesList.length} Ngôn ngữ</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">Giáo trình / Sách</span>
            <span className="text-xl font-black text-indigo-300 mt-1 block">{allBooks.length} Bộ sách</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">Tổng bài học</span>
            <span className="text-xl font-black text-purple-300 mt-1 block">{totalLessons} Bài</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block">Tổng từ vựng</span>
            <span className="text-xl font-black text-emerald-300 mt-1 block">{totalVocab.toLocaleString()} Từ</span>
          </div>
        </div>
      </div>

      {/* Language Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveLang("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeLang === "all"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          🌐 Tất cả Ngôn ngữ ({allBooks.length})
        </button>
        {languagesList.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setActiveLang(lang.code)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeLang === lang.code
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
              activeLang === lang.code ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {lang.books.length}
            </span>
          </button>
        ))}
      </div>

      {/* Languages and Books List */}
      <div className="space-y-8">
        {filteredLanguages.map((lang) => (
          <div key={lang.code} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{lang.flag}</span>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">{lang.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{lang.description}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-xl">
                {lang.books.length} Giáo trình
              </span>
            </div>

            {/* Book Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lang.books.map((book: RegistryBook) => (
                <div
                  key={book.id}
                  className="bg-gray-50/60 rounded-2xl p-4 border border-gray-150 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{book.icon}</span>
                        <div>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-black rounded-md uppercase">
                            {book.level}
                          </span>
                          <span className="ml-1.5 text-[9px] text-gray-400 font-semibold">{book.publisher}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-extrabold rounded-full">
                        {book.tag}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-gray-900 leading-snug">{book.name}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{book.description}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-200/60 space-y-2">
                    <div className="grid grid-cols-3 gap-1 text-center bg-white p-2 rounded-xl border border-gray-100">
                      <div>
                        <span className="text-xs font-black text-gray-800 block">{book.totalLessons}</span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase block">Bài học</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-indigo-600 block">{book.totalVocab}</span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase block">Từ vựng</span>
                      </div>
                      <div>
                        <span className="text-xs font-black text-purple-600 block">{book.totalGrammar}</span>
                        <span className="text-[8px] text-gray-400 font-bold uppercase block">Ngữ pháp</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-gray-400 font-mono">
                      <span>File:</span>
                      <span className="text-indigo-600 font-bold truncate max-w-[180px]">{book.file}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
