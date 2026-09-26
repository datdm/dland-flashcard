"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAllShadowingVideos } from "@/lib/shadowingStorage";
import { ShadowingVideo } from "@/types/shadowing";
import YouTubeVideoSearchModal from "@/components/shadowing/YouTubeVideoSearchModal";
import { useRouter } from "next/navigation";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import BreadcrumbNav from "@/components/BreadcrumbNav";

export default function ShadowingHubPage() {
  const router = useRouter();
  const { activeLanguage } = useLanguageSetting();
  const [videos, setVideos] = useState<ShadowingVideo[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    setVideos(getAllShadowingVideos());
  }, []);

  const filteredVideos = videos.filter((v) => {
    const matchLevel = selectedLevel === "All" || v.level === selectedLevel;
    const matchCat = selectedCategory === "All" || v.category === selectedCategory;
    const matchQuery =
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchCat && matchQuery;
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-8 md:pb-4">
      {/* Breadcrumb Bar */}
      <BreadcrumbNav items={[{ label: "Luyện Shadowing", icon: "🎙️" }]} />

      {/* Hero Banner (Compact Minimalist - Light Theme matching background) */}
      <div className={`rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-2xs border flex items-center justify-between gap-3 transition-all duration-300 bg-gradient-to-r ${
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
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-md text-[10px] font-bold shrink-0 hidden sm:inline">
            3 Chế độ
          </span>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight truncate">
              Luyện Shadowing & Viết Chính Tả Qua Video
            </h1>
            <p className="text-[11px] text-gray-500 truncate hidden md:block">
              Nói đuổi phụ đề Furigana, tự động ngắt câu, tra Mazii tức thì & AI chấm điểm
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg sm:rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <span>➕</span>
          <span>Tìm & Import Video</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm video Shadowing theo tiêu đề, chủ đề..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:border-blue-600"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              🔍
            </span>
          </div>

          {/* Level Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-gray-400 mr-1">Cấp độ:</span>
            {["All", "N3", "N2", "N1"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevel === lvl
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lvl === "All" ? "Tất cả" : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
        {filteredVideos.map((video) => (
          <Link
            key={video.id}
            href={`/shadowing/${video.id}`}
            className="group bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-2xs hover:shadow-xl hover:border-blue-200 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container with Play Overlay */}
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center text-xl shadow-lg group-hover:scale-110 transition-transform">
                    ▶
                  </div>
                </div>
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white rounded-lg text-[10px] font-black uppercase tracking-wide">
                  {video.level}
                </span>
                <span className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 text-white rounded text-[10px] font-mono">
                  {video.subtitles.length} câu
                </span>
              </div>

              {/* Video Info */}
              <div className="p-5 space-y-2">
                <h3 className="text-base font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {video.title}
                </h3>
                {video.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {video.description}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Channel */}
            <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
              <span className="line-clamp-1">{video.channelTitle}</span>
              <span className="text-blue-600 font-extrabold shrink-0 flex items-center gap-1">
                Luyện ngay →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* YouTube Import Modal */}
      <YouTubeVideoSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectVideo={(vidId) => router.push(`/shadowing/${vidId}`)}
      />
    </div>
  );
}
