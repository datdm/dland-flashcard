import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog Cẩm Nang Học Ngoại Ngữ — Dland Language",
  description: "Tổng hợp các bài viết kinh nghiệm luyện thi JLPT, phương pháp học Flashcard SRS, Hán tự Kanji và kỹ năng Shadowing tiếng Nhật.",
};

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  date: string;
  icon: string;
  author: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "phuong-phap-srs-flashcard",
    title: "Phương Pháp Lặp Lại Ngắt Quãng (SRS) – Bí Quyết Ghi Nhớ 2.000 Từ Vựng Tiếng Nhật",
    description: "Khám phá nguyên lý khoa học đằng sau thuật toán Spaced Repetition System (SRS) giúp đánh bại đường cong quên và duy trì từ vựng vào trí nhớ dài hạn.",
    category: "Phương Pháp Học",
    readTime: "8 phút đọc",
    date: "20/09/2026",
    icon: "🧠",
    author: "Đội ngũ Dland Language",
  },
  {
    slug: "kinh-nghiem-luyen-thi-jlpt",
    title: "Lộ Trình Ôn Thi JLPT N5 Đến N1 Chi Tiết & Mẹo Làm Bài Thi Đạt Điểm Cao",
    description: "Tổng hợp cấu trúc đề thi JLPT, cách phân bổ thời gian từng phần thi Từ vựng - Ngữ pháp - Đọc hiểu - Nghe hiểu và lộ trình luyện đề tối ưu.",
    category: "Luyện Thi JLPT",
    readTime: "12 phút đọc",
    date: "18/09/2026",
    icon: "📝",
    author: "Ban Chuyên Môn JLPT",
  },
  {
    slug: "meo-hoc-bo-thu-kanji",
    title: "Mẹo Học 214 Bộ Thủ Kanji Cơ Bản Và Phương Pháp Ghép Hán Tự Tiếng Nhật",
    description: "Giải mã cấu trúc Hán tự tiếng Nhật qua các bộ thủ quen thuộc, cách nhận diện âm Onyomi - Kunyomi và quy tắc viết nét chuẩn xác.",
    category: "Hán Tự Kanji",
    readTime: "10 phút đọc",
    date: "15/09/2026",
    icon: "⛩️",
    author: "Chuyên gia Hán Việt",
  },
  {
    slug: "luyen-nghe-shadowing",
    title: "Bí Quyết Luyện Nghe Nói Tiếng Nhật Tự Nhiên Bằng Phương Pháp Shadowing",
    description: "Hướng dẫn thực hành kỹ thuật Shadowing từng bước giúp cải thiện ngữ điệu, phát âm chuẩn voice người bản xứ và phản xạ hội thoại Kaiwa nhanh chóng.",
    category: "Kỹ Năng Nghe Nói",
    readTime: "9 phút đọc",
    date: "12/09/2026",
    icon: "🎧",
    author: "Đội ngũ Kỹ năng Kaiwa",
  },
];

export default function BlogIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-950 text-white rounded-3xl p-8 sm:p-12 shadow-2xl mb-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="px-3.5 py-1 bg-indigo-500/30 backdrop-blur-md text-indigo-300 rounded-full text-xs font-bold tracking-wide border border-indigo-400/30">
            ✍️ Cẩm Nang & Kinh Nghiệm Học Ngoại Ngữ
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Góc Chia Sẻ Kiến Thức Dland Language
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Tổng hợp các bài viết hướng dẫn chuyên sâu về phương pháp học tiếng Nhật, mẹo ghi nhớ Flashcard SRS, kỹ năng nghe nói Kaiwa và lộ trình ôn thi JLPT.
          </p>
        </div>
      </div>

      {/* Grid Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BLOG_POSTS.map((post) => (
          <article
            key={post.slug}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group"
          >
            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-full border border-indigo-100">
                    {post.category}
                  </span>
                  <span className="text-gray-400 font-medium">{post.readTime}</span>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-3xl p-2 bg-gray-50 rounded-2xl border border-gray-100 shrink-0 group-hover:scale-110 transition-transform">
                    {post.icon}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    <Link href={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </h2>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">📅 {post.date}</span>
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                >
                  Đọc tiếp →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
