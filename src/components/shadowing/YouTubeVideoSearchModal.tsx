"use client";

import React, { useState } from "react";
import { BUILTIN_SHADOWING_VIDEOS } from "@/data/shadowingVideos";
import { ShadowingVideo } from "@/types/shadowing";
import { saveCustomShadowingVideo } from "@/lib/shadowingStorage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (videoId: string) => void;
}

export default function YouTubeVideoSearchModal({ isOpen, onClose, onSelectVideo }: Props) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  if (!isOpen) return null;

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  const handleImportCustom = async () => {
    if (!youtubeUrl.trim()) return;
    const ytid = extractYoutubeId(youtubeUrl.trim());
    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch("/api/shadowing/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl,
          title: "Video YouTube Shadowing",
          level: "N2",
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || "Không thể tạo phụ đề cho video này");
      }

      const newVideo: ShadowingVideo = {
        id: `custom-${ytid}-${Date.now()}`,
        youtubeId: ytid,
        title: resData.data.title || "Video Shadowing mới",
        thumbnailUrl: `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`,
        channelTitle: "YouTube Creator",
        durationSeconds: 120,
        level: (resData.data.level as any) || "N2",
        languageCode: "ja",
        category: "technology",
        subtitles: resData.data.subtitles || [],
        isCustom: true,
        importedAt: new Date().toISOString(),
      };

      saveCustomShadowingVideo(newVideo);
      onSelectVideo(newVideo.id);
      onClose();
    } catch (err: any) {
      setGenError(err.message || "Lỗi khi import video");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPresetVideos = BUILTIN_SHADOWING_VIDEOS.filter((v: ShadowingVideo) => {
    const matchQuery =
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchLevel = levelFilter === "All" || v.level === levelFilter;
    return matchQuery && matchLevel;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2">
              <span>🔍</span>
              <span>Tìm Kiếm & Import Video YouTube</span>
            </h2>
            <p className="text-xs text-blue-100 mt-1">
              Dán link YouTube bất kỳ hoặc chọn bài học từ kho video chuẩn JLPT
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="space-y-2 bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
            <label className="text-xs font-extrabold text-blue-900 block">
              Dán đường dẫn Video YouTube (URL):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-xs sm:text-sm focus:outline-none focus:border-blue-600"
              />
              <button
                onClick={handleImportCustom}
                disabled={!youtubeUrl.trim() || isGenerating}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
              >
                {isGenerating ? "Đang tạo..." : "Import AI"}
              </button>
            </div>
            {genError && <p className="text-xs font-bold text-rose-600 mt-1">{genError}</p>}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs font-extrabold text-gray-700">
                Hoặc chọn video từ thư viện có sẵn:
              </span>
              <div className="flex items-center gap-1.5">
                {["All", "N3", "N2"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLevelFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      levelFilter === lvl
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredPresetVideos.map((video: ShadowingVideo) => (
                <div
                  key={video.id}
                  onClick={() => {
                    onSelectVideo(video.id);
                    onClose();
                  }}
                  className="p-3 rounded-2xl border border-gray-200/80 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex items-center gap-3 bg-white"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-24 h-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-extrabold">
                        {video.level}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {video.subtitles.length} câu phụ đề
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
                      {video.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                      {video.channelTitle}
                    </p>
                  </div>
                  <span className="text-indigo-600 font-extrabold text-sm shrink-0">→</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
