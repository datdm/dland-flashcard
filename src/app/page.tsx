"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import { useStreak } from "@/hooks/useStreak";
import { initializeSampleData } from "@/lib/storage";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

export default function HomePage() {
  const { notebooks } = useNotebooks();
  const { progress } = useProgress();
  const streak = useStreak();
  const { activeLanguage } = useLanguageSetting();

  useEffect(() => {
    initializeSampleData();
  }, []);

  const LEVEL_CARDS = activeLanguage.code === "de" ? [
    { level: "A1", title: "Goethe A1", desc: "Từ vựng Sơ cấp A1, Quán từ Der/Die/Das, Chia động từ hiện tại", color: "from-emerald-500 to-teal-600" },
    { level: "A2", title: "Goethe A2", desc: "Từ vựng A2, Mệnh đề phụ weil/dass, Động từ tình thái quá khứ", color: "from-blue-500 to-indigo-600" },
    { level: "B1", title: "Goethe B1", desc: "Từ vựng B1, Động từ giả định Konjunktiv II, Thụ động Passiv", color: "from-amber-500 to-orange-600" },
    { level: "B2", title: "Goethe B2", desc: "Từ vựng B2 nâng cao, Cấu trúc câu kép phức hợp", color: "from-rose-500 to-red-600" },
  ] : activeLanguage.code === "en" ? [
    { level: "A1", title: "Beginner A1", desc: "Từ vựng & Cấu trúc cơ bản nhất của Oxford 3000", color: "from-emerald-500 to-teal-600" },
    { level: "A2", title: "Elementary A2", desc: "Giao tiếp hàng ngày cơ bản, thì Quá khứ đơn & Tương lai", color: "from-blue-500 to-indigo-600" },
    { level: "B1", title: "Intermediate B1", desc: "Từ vựng học thuật trung cấp, thì Hiện tại hoàn thành", color: "from-amber-500 to-orange-600" },
    { level: "B2", title: "Upper-Int B2", desc: "Từ vựng IELTS/TOEIC phổ thông, câu điều kiện phức tạp", color: "from-rose-500 to-red-600" },
  ] : [
    { level: "N5", title: "Sơ cấp 1", desc: "Minna no Nihongo I (Bài 1-25) & 100 Kanji sơ cấp", color: "from-emerald-500 to-teal-600" },
    { level: "N4", title: "Sơ cấp 2", desc: "Minna no Nihongo II (Bài 26-50) & 300 Kanji sơ cấp", color: "from-blue-500 to-indigo-600" },
    { level: "N3", title: "Trung cấp 1", desc: "Soumatome / Shinkanzen N3 & 650 Kanji trung cấp", color: "from-amber-500 to-orange-600" },
    { level: "N2", title: "Trung cấp 2", desc: "Shinkanzen Master N2, Kính ngữ & 1,000+ Kanji", color: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-8 md:pb-4">
      {/* Hero Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 text-white shadow-lg bg-gradient-to-r transition-all duration-300 ${
        activeLanguage.code === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : activeLanguage.code === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold mt-1.5 tracking-tight leading-tight">
            Nền Tảng Học Ngôn Ngữ Đa Năng Thông Minh
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1.5 leading-relaxed">
            Học ngôn ngữ với 3 trụ cột vững chắc: <span className="font-bold text-white">Từ vựng Flashcard SRS</span>,{" "}
            <span className="font-bold text-white">Cấu trúc Ngữ pháp</span> và{" "}
            <span className="font-bold text-white">Tra cứu Từ điển Nhật-Việt</span>.
          </p>

          <div className="flex flex-wrap gap-2.5 mt-4 sm:mt-5">
            <Link
              href="/exam"
              className="px-4 py-2 bg-white text-indigo-700 font-extrabold rounded-xl shadow-sm hover:bg-indigo-50 transition-all text-xs sm:text-sm flex items-center gap-1.5 active:scale-98"
            >
              <span>📝</span> Luyện Thi JLPT
            </Link>
            <Link
              href="/curriculum"
              className="px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold rounded-xl border border-white/20 transition-colors text-xs sm:text-sm"
            >
              📚 Xem Lộ trình Bài học
            </Link>
            <Link
              href="/search"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-xl border border-white/20 transition-colors text-xs sm:text-sm"
            >
              🔍 Tra cứu Từ điển
            </Link>
          </div>
        </div>
      </div>

      {/* Daily Actions Grid */}
      <div className={`grid grid-cols-1 ${streak.currentStreak > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-3`}>
        {/* Streak section */}
        {streak.currentStreak > 0 && (
          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-3.5 sm:p-4 text-white shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">Chuỗi học tập hàng ngày</p>
              <p className="text-xl sm:text-2xl font-extrabold mt-0.5">🔥 {streak.currentStreak} ngày</p>
            </div>
            {streak.longestStreak > 0 && (
              <div className="text-right">
                <p className="text-xs opacity-90">Kỷ lục</p>
                <p className="text-lg font-bold">🏆 {streak.longestStreak}</p>
              </div>
            )}
          </div>
        )}

        {/* Daily 50 Card */}
        <Link 
          href="/flashcard/all?daily50=true"
          className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-3.5 sm:p-4 text-white shadow-xs flex items-center justify-between hover:scale-[1.01] transition-transform"
        >
          <div>
            <p className="text-xs opacity-90 text-emerald-50 tracking-wide uppercase font-bold">Nhiệm vụ hàng ngày</p>
            <p className="text-lg sm:text-xl font-extrabold mt-0.5">🎲 50 Từ vựng ngẫu nhiên</p>
          </div>
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-teal-600 text-base font-bold shrink-0 shadow-xs">
            →
          </div>
        </Link>
      </div>

      {/* JLPT Level Quick Cards Grid */}
      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
          <span>{activeLanguage.flag}</span> Cấp độ Trình độ {activeLanguage.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {LEVEL_CARDS.map((card) => (
            <Link
              key={card.level}
              href={`/curriculum?level=${card.level}`}
              className="group relative overflow-hidden bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-xs hover:shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white font-extrabold text-lg shadow-xs mb-2.5`}
                >
                  {card.level}
                </div>
                <h3 className="font-bold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-gray-50 text-xs font-semibold text-indigo-600 flex items-center justify-between">
                <span>Vào lộ trình</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Core Modules */}
      <div className={`grid grid-cols-1 ${activeLanguage.code === "ja" ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"} gap-3.5 sm:gap-4`}>
        <Link
          href="/curriculum"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-2.5">📚</div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-indigo-600 transition-colors">
              Giáo trình Bài học
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {activeLanguage.code === "de"
                ? "Lộ trình học Tiếng Đức trình độ A1 bám sát giáo trình Netzwerk neu."
                : activeLanguage.code === "en"
                ? "Lộ trình từ vựng Oxford 3000 và các điểm ngữ pháp Tiếng Anh cốt lõi."
                : "Học theo từng bài từ Minna no Nihongo I & II cho đến Soumatome và Shinkanzen Master."}
            </p>
          </div>
        </Link>

        <Link
          href="/grammar"
          className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-sm transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="text-2xl sm:text-3xl mb-2 sm:mb-2.5">📖</div>
            <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-purple-600 transition-colors">
              Thư viện Ngữ pháp
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {activeLanguage.code === "de"
                ? "Tra cứu các cấu trúc ngữ pháp Tiếng Đức, chia động từ và cách dùng mạo từ."
                : activeLanguage.code === "en"
                ? "Tổng hợp công thức cấu trúc câu, các thì và ngữ pháp Tiếng Anh thông dụng."
                : "Tra cứu cấu trúc, công thức chia thể, giải thích chi tiết & ví dụ kèm phát âm audio."}
            </p>
          </div>
        </Link>

        {activeLanguage.code === "ja" ? (
          <>
            <Link
              href="/kanji"
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-2.5">🉐</div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-emerald-600 transition-colors">
                  Thư viện Kanji SVG
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Học 1,000+ chữ Hán từ N5 đến N2, xem nét vẽ SVG thứ tự từng bước & âm Hán Việt.
                </p>
              </div>
            </Link>

            <Link
              href="/kaiwa"
              className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-2.5">🗣️</div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-rose-600 transition-colors">
                  Hội thoại Kaiwa
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Lộ trình 3 tháng luyện phản xạ giao tiếp tự nhiên và nhập vai đối thoại cùng Gia sư AI.
                </p>
              </div>
            </Link>
          </>
        ) : (
          <Link
            href="/chat"
            className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs hover:shadow-sm transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="text-2xl sm:text-3xl mb-2 sm:mb-2.5">🤖</div>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-rose-600 transition-colors">
                Gia sư AI Đàm thoại
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {activeLanguage.code === "de"
                  ? "Thực hành đàm thoại, luyện nói tự do và sửa lỗi giao tiếp Tiếng Đức cùng AI."
                  : "Thực hành phản xạ đàm thoại tiếng Anh giao tiếp tự do 24/7 cùng Gia sư AI."}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Notebooks section if any */}
      {notebooks.length > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">📓 Sổ tay cá nhân ({notebooks.length})</h3>
            <Link href="/notebooks" className="text-xs text-indigo-600 font-semibold hover:underline">
              Xem tất cả →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {notebooks.map((n) => (
              <Link
                key={n.id}
                href={`/notebooks/${n.id}`}
                className="p-3 sm:p-3.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-gray-800">{n.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{n.vocabulary.length} từ vựng</p>
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
