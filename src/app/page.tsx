"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import { useStreak } from "@/hooks/useStreak";
import { initializeSampleData } from "@/lib/storage";

export default function HomePage() {
  const { notebooks } = useNotebooks();
  const { progress } = useProgress();
  const streak = useStreak();

  useEffect(() => {
    initializeSampleData();
  }, []);

  const LEVEL_CARDS = [
    { level: "N5", title: "Sơ cấp 1", desc: "Minna no Nihongo I (Bài 1-25) & 100 Kanji sơ cấp", color: "from-emerald-500 to-teal-600" },
    { level: "N4", title: "Sơ cấp 2", desc: "Minna no Nihongo II (Bài 26-50) & 300 Kanji sơ cấp", color: "from-blue-500 to-indigo-600" },
    { level: "N3", title: "Trung cấp 1", desc: "Soumatome / Shinkanzen N3 & 650 Kanji trung cấp", color: "from-amber-500 to-orange-600" },
    { level: "N2", title: "Trung cấp 2", desc: "Shinkanzen Master N2, Kính ngữ & 1,000+ Kanji", color: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="max-w-xl">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
            HỆ THỐNG HỌC TIẾNG NHẬT N5 ➔ N2
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold mt-3 tracking-tight leading-tight">
            Chinh Phục JLPT Từ Sơ Cấp Đến Trung Nâng Cấp
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed">
            Học đầy đủ 3 thành tố: <span className="font-bold text-white">Từ vựng Flashcard</span>,{" "}
            <span className="font-bold text-white">Cấu trúc Ngữ pháp</span> và{" "}
            <span className="font-bold text-white">Kanji Nét vẽ SVG</span>.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/curriculum"
              className="px-5 py-2.5 bg-white text-indigo-700 font-bold rounded-2xl shadow-md hover:bg-indigo-50 transition-colors text-xs sm:text-sm"
            >
              📚 Xem Lộ trình Bài học
            </Link>
            <Link
              href="/flashcard/all"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 transition-colors text-xs sm:text-sm"
            >
              🎴 Ôn tập Flashcard SRS
            </Link>
          </div>
        </div>
      </div>

      {/* Streak section */}
      {streak.currentStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-5 text-white shadow-md mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs opacity-90">Chuỗi học tập hàng ngày</p>
            <p className="text-2xl sm:text-3xl font-extrabold mt-0.5">🔥 {streak.currentStreak} ngày liên tiếp</p>
          </div>
          {streak.longestStreak > 0 && (
            <div className="text-right">
              <p className="text-xs opacity-90">Kỷ lục</p>
              <p className="text-xl font-bold">🏆 {streak.longestStreak} ngày</p>
            </div>
          )}
        </div>
      )}

      {/* JLPT Level Quick Cards Grid */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Lựa chọn Cấp độ JLPT</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {LEVEL_CARDS.map((card) => (
            <Link
              key={card.level}
              href="/curriculum"
              className="group relative overflow-hidden bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white font-extrabold text-xl shadow-md mb-3`}>
                  {card.level}
                </div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 text-xs font-semibold text-indigo-600 flex items-center justify-between">
                <span>Vào lộ trình</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Core Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <Link
          href="/curriculum"
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">📚</div>
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
            Giáo trình N5 ➔ N2
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Học theo từng bài từ Minna no Nihongo I & II cho đến Soumatome và Shinkanzen Master.
          </p>
        </Link>

        <Link
          href="/grammar"
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">📖</div>
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-purple-600 transition-colors">
            Thư viện Ngữ pháp
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Tra cứu cấu trúc, công thức chia thể, giải thích chi tiết & ví dụ kèm phát âm audio.
          </p>
        </Link>

        <Link
          href="/kanji"
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="text-3xl mb-3">🉐</div>
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">
            Thư viện Kanji SVG
          </h3>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Học 1,000+ chữ Hán từ N5 đến N2, xem nét vẽ SVG thứ tự từng bước & âm Hán Việt.
          </p>
        </Link>
      </div>

      {/* Notebooks section if any */}
      {notebooks.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-base">📓 Sổ tay cá nhân ({notebooks.length})</h3>
            <Link href="/notebooks" className="text-xs text-indigo-600 font-semibold hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notebooks.map((n) => (
              <Link
                key={n.id}
                href={`/notebooks/${n.id}`}
                className="p-4 rounded-2xl bg-gray-50 hover:bg-indigo-50/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-gray-800">{n.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{n.vocabulary.length} từ vựng</p>
                </div>
                <span className="text-xs text-indigo-600 font-medium">Chi tiết →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
