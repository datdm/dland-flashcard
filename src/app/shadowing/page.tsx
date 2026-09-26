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
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      {/* Breadcrumb Bar */}
      <BreadcrumbNav items={[{ label: "Luyện Shadowing", icon: "🎙️" }]} />

      {/* Hero Banner */}
      <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 bg-gradient-to-r ${
        activeLanguage.code === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : activeLanguage.code === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="max-w-2xl space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <span className="px-2.5 py-0.5 bg-white/30 backdrop-blur-md rounded-full text-xs font-bold">
              3 Chế độ luyện tập
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1">
            Luyện Shadowing & Viết Chính Tả Qua Video YouTube
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Luyện nói đuổi theo người bản xứ với phụ đề Furigana chuẩn, tự động ngắt câu, tra từ Mazii tức thì, kiểm tra chính tả và nhận diện giọng nói AI chấm điểm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="px-6 py-3.5 bg-white hover:bg-blue-50 text-blue-900 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>➕</span>
            <span>Tìm & Import Video</span>
          </button>
        </div>
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
