import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Giới Thiệu Dự Án (About Us) — Dland Language",
  description: "Dland Language là nền tảng học ngoại ngữ thông minh kết hợp thuật toán Flashcard SRS, kho Ngữ pháp, Luyện thi JLPT và Trợ lý AI.",
};

export default function AboutPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide border border-white/30">
            💡 Về Dự Án Dland Language
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Nền Tảng Học Ngoại Ngữ Đa Năng & Thông Minh
          </h1>
          <p className="text-sm text-indigo-100 leading-relaxed">
            Sứ mệnh của chúng tôi là mang đến cho người học một công cụ học tiếng Nhật và các ngôn ngữ hiệu quả nhất, kết hợp giữa khoa học ghi nhớ SRS và công nghệ AI hiện đại.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Value Proposition */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-4">
          <h2 className="text-xl font-extrabold text-gray-900 border-l-4 border-indigo-600 pl-3">
            🌟 Câu Chuyện & Tầm Nhìn
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Học ngoại ngữ đòi hỏi sự kiên trì và phương pháp đúng đắn. Nhiều người học gặp khó khăn khi quên từ vựng nhanh chóng hoặc không có môi trường luyện tập hội thoại thực tế. 
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Dland Language</strong> được xây dựng nhằm giải quyết bài toán đó bằng cách kết hợp thuật toán lặp lại ngắt quãng (Spaced Repetition System - SRS) với công nghệ trí tuệ nhân tạo (AI Chatbot & Voice Room). Chúng tôi giúp bạn rút ngắn 50% thời gian ghi nhớ từ vựng và tự tin chinh phục các kỳ thi JLPT N5 đến N1.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl">
              🗂️
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Flashcard Thuật Toán SRS</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tự động tính toán khoảng thời gian nhắc lại tối ưu dựa trên đường cong quên (Forgetting Curve) của Ebbinghaus.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl">
              📝
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Ngân Hàng Đề Thi JLPT</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Bộ đề thi mẫu N5 - N1 đa dạng với đồng hồ bấm giờ chuẩn, tự động chấm điểm và xem lại lịch sử thi chi tiết.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-2xl">
              📖
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Kho Ngữ Pháp & Kanji</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tra cứu nhanh Hán tự (Kanji), âm Hán Việt, cách vẽ nét động và hệ thống cấu trúc ngữ pháp có ví dụ minh họa sinh động.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-lg space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-2xl">
              🤖
            </div>
            <h3 className="font-extrabold text-base text-gray-900">Trợ Lý AI & Shadowing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Luyện nói hội thoại Kaiwa trực tiếp với AI, phát âm chuẩn voice tự nhiên và tích hợp phòng voice theo thời gian thực.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gray-900 text-white rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <h2 className="text-xl font-extrabold">Bắt đầu hành trình chinh phục ngoại ngữ ngay hôm nay</h2>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Khám phá kho giáo trình miễn phí, lưu từ vựng vào sổ tay cá nhân và đồng bộ dữ liệu trên mọi thiết bị.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/curriculums"
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
            >
              🚀 Khám phá Bài Học →
            </Link>
            <Link
              href="/blog"
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wide transition-all"
            >
              ✍️ Đọc Cẩm Nang Blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
