"use client";

import { useState } from "react";
import { useLanguageSetting, SUPPORTED_LANGUAGES } from "@/hooks/useLanguageSetting";
import { useAuth } from "@/context/AuthContext";

const LANGUAGE_FEATURES: Record<string, { icon: string; highlights: string[]; badge?: string }> = {
  ja: {
    icon: "🇯🇵",
    highlights: ["JLPT N5 → N2", "Kanji SVG", "Kaiwa AI", "Đề thi chính thức"],
    badge: "Đầy đủ nhất",
  },
  en: {
    icon: "🇬🇧",
    highlights: ["IELTS 7.0 Target", "Oxford 3000", "AI Conversation", "4 Giai đoạn"],
    badge: "Phổ biến",
  },
  de: {
    icon: "🇩🇪",
    highlights: ["Goethe A1 → B2", "Netzwerk neu", "Quán từ Der/Die/Das", "Động từ chia"],
  },
  ko: {
    icon: "🇰🇷",
    highlights: ["TOPIK I & II", "Hangul", "Kính ngữ", "Ngữ pháp"],
    badge: "Sắp có",
  },
  zh: {
    icon: "🇨🇳",
    highlights: ["HSK 1 → 6", "Pinyin", "Hán tự nét vẽ", "Ngữ pháp"],
    badge: "Sắp có",
  },
};

const LANG_GRADIENTS: Record<string, string> = {
  ja: "from-rose-500 via-pink-500 to-red-500",
  en: "from-blue-500 via-indigo-500 to-violet-500",
  de: "from-amber-500 via-orange-400 to-yellow-500",
  ko: "from-pink-500 via-rose-400 to-fuchsia-500",
  zh: "from-red-500 via-rose-500 to-orange-500",
};

const LANG_CARD_BG: Record<string, string> = {
  ja: "hover:border-rose-300 hover:bg-rose-50/40",
  en: "hover:border-blue-300 hover:bg-blue-50/40",
  de: "hover:border-amber-300 hover:bg-amber-50/40",
  ko: "hover:border-pink-300 hover:bg-pink-50/40",
  zh: "hover:border-red-300 hover:bg-red-50/40",
};

const FEATURES = [
  { icon: "🎴", title: "Flashcard SRS", desc: "Spaced Repetition thông minh — ôn đúng từ, đúng lúc, tối ưu trí nhớ dài hạn." },
  { icon: "📖", title: "Ngữ pháp chuyên sâu", desc: "Thư viện cấu trúc câu có audio, ví dụ thực tế và phân tích chi tiết." },
  { icon: "🤖", title: "Gia Sư AI", desc: "Chat & luyện hội thoại 24/7, nhận phản hồi tức thì, cải thiện phản xạ ngôn ngữ." },
  { icon: "📝", title: "Luyện thi thực chiến", desc: "Đề thi JLPT chính thức, Mock test theo cấu trúc chuẩn với phân tích kết quả." },
  { icon: "📚", title: "Lộ trình bài bản", desc: "Giáo trình được sắp xếp theo trình độ, từ sơ cấp đến nâng cao có hệ thống." },
  { icon: "🔍", title: "Từ điển thông minh", desc: "Tra cứu nghĩa, ví dụ câu, phát âm và thêm ngay vào sổ tay cá nhân." },
];

export default function LanguageLandingPage() {
  const { selectDraftLanguage, saveLanguage } = useLanguageSetting();
  const { isAuthenticated, openAuthModal } = useAuth();
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelectLanguage = async (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    if (lang?.status === "coming_soon") return;

    setSelecting(code);
    selectDraftLanguage(code);
    await saveLanguage();
  };

  return (
    <div className="w-full min-h-screen">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          {/* Logo pill */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase mb-6 shadow-sm">
            <span className="text-lg">🌐</span>
            <span>Dland Language Platform</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-sm">
            Học ngôn ngữ theo<br />
            <span className="text-yellow-300">cách thông minh hơn</span>
          </h1>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            Nền tảng đa ngôn ngữ tích hợp Flashcard SRS, AI Gia Sư, Ngữ pháp chuyên sâu và Luyện thi
            bài bản — tất cả trong một ứng dụng duy nhất.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#choose-language"
              className="px-6 py-3 bg-white text-indigo-700 font-extrabold rounded-2xl shadow-lg hover:bg-yellow-50 transition-all text-sm sm:text-base"
            >
              🚀 Bắt đầu học ngay
            </a>
            {!isAuthenticated && (
              <button
                onClick={() => openAuthModal("Đăng nhập để lưu tiến độ và đồng bộ trên mọi thiết bị")}
                className="px-6 py-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/25 transition-all text-sm sm:text-base"
              >
                🔑 Đăng nhập / Đăng ký
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Choose Language ── */}
      <div id="choose-language" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-block bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Bước 1
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
            Chọn ngôn ngữ muốn học
          </h2>
          <p className="text-sm text-gray-500">
            Bạn có thể thay đổi bất cứ lúc nào trong Cài đặt
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const feat = LANGUAGE_FEATURES[lang.code];
            const isComingSoon = lang.status === "coming_soon";
            const isLoading = selecting === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                disabled={isComingSoon || selecting !== null}
                className={`group relative text-left rounded-2xl p-5 border-2 border-gray-100 bg-white shadow-xs transition-all duration-200 ${
                  isComingSoon
                    ? "opacity-60 cursor-not-allowed"
                    : `cursor-pointer ${LANG_CARD_BG[lang.code]} hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]`
                } ${isLoading ? "ring-2 ring-indigo-400 ring-offset-2" : ""}`}
              >
                {/* Badge */}
                {feat.badge && (
                  <span
                    className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      feat.badge === "Sắp có"
                        ? "bg-gray-100 text-gray-500"
                        : feat.badge === "Đầy đủ nhất"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {feat.badge}
                  </span>
                )}

                {/* Flag + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${LANG_GRADIENTS[lang.code]} flex items-center justify-center text-2xl shadow-sm`}
                  >
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">{lang.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{lang.nativeName}</p>
                  </div>
                </div>

                {/* Highlights */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {feat.highlights.map((h) => (
                    <span
                      key={h}
                      className="text-[11px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{lang.description}</p>

                {/* CTA */}
                {!isComingSoon && (
                  <div
                    className={`mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold ${
                      isLoading ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-600 transition-colors"
                    }`}
                  >
                    <span>{isLoading ? "Đang chuyển..." : "Bắt đầu học"}</span>
                    <span>{isLoading ? "⏳" : "→"}</span>
                  </div>
                )}
                {isComingSoon && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 font-medium">
                    Đang phát triển...
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Features Grid ── */}
      <div className="bg-gray-50/70 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-8 sm:mb-10">
            <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Tính năng
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Mọi thứ bạn cần để thành thạo
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-sm hover:border-indigo-100 transition-all"
              >
                <div className="text-2xl sm:text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      {!isAuthenticated && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl">
            <h2 className="text-xl sm:text-2xl font-extrabold mb-2">
              Lưu tiến độ học tập của bạn
            </h2>
            <p className="text-sm text-white/80 mb-6 max-w-md mx-auto">
              Đăng ký miễn phí để đồng bộ flashcard, sổ tay và lịch sử học tập trên mọi thiết bị.
            </p>
            <button
              onClick={() => openAuthModal("Đăng ký để lưu tiến độ và đồng bộ trên mọi thiết bị")}
              className="px-8 py-3 bg-white text-indigo-700 font-extrabold rounded-2xl shadow-lg hover:bg-yellow-50 transition-all text-sm"
            >
              🎉 Đăng ký miễn phí
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
