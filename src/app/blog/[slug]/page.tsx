import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "../page";

interface ArticleContent {
  title: string;
  category: string;
  date: string;
  readTime: string;
  icon: string;
  author: string;
  sections: {
    heading: string;
    paragraphs?: string[];
    bulletPoints?: string[];
  }[];
}

const ARTICLES_DATA: Record<string, ArticleContent> = {
  "phuong-phap-srs-flashcard": {
    title: "Phương Pháp Lặp Lại Ngắt Quãng (SRS) – Bí Quyết Ghi Nhớ 2.000 Từ Vựng Tiếng Nhật",
    category: "Phương Pháp Học",
    date: "20/09/2026",
    readTime: "8 phút đọc",
    icon: "🧠",
    author: "Đội ngũ Dland Language",
    sections: [
      {
        heading: "1. Nguyên Lý Khoa Học Của Thuật Toán SRS",
        paragraphs: [
          "Khi học từ vựng ngoại ngữ mới, não bộ con người chịu ảnh hưởng trực tiếp của Đường cong quên (Forgetting Curve) do nhà tâm lý học Hermann Ebbinghaus phát hiện. Sau 24 giờ, nếu không được ôn tập, bạn sẽ quên tới 70% lượng kiến thức vừa học.",
          "Phương pháp Lặp lại ngắt quãng (Spaced Repetition System - SRS) ra đời nhằm tối ưu hóa quá trình ôn tập bằng cách nhắc lại từ vựng đúng vào thời điểm bạn chuẩn bị quên. Điều này giúp chuyển từ vựng từ trí nhớ ngắn hạn sang trí nhớ dài hạn bền vững."
        ],
        bulletPoints: [
          "Lần ôn thứ 1: Ngay sau khi học 10 phút",
          "Lần ôn thứ 2: Sau 24 giờ",
          "Lần ôn thứ 3: Sau 3 ngày",
          "Lần ôn thứ 4: Sau 7 ngày",
          "Lần ôn thứ 5: Sau 30 ngày (Trí nhớ dài hạn)"
        ]
      },
      {
        heading: "2. Cách Dland Language Tích Hợp Thuật Toán SRS Vào Flashcard",
        paragraphs: [
          "Hệ thống Flashcard tại Dland Language tự động theo dõi từng thẻ từ vựng của bạn. Khi bạn đánh giá mức độ ghi nhớ (Dễ, Trung bình, Khó), hệ thống sẽ tính toán khoảng thời gian ôn tập tiếp theo tương ứng.",
          "Nếu bạn chọn 'Khó', từ vựng sẽ xuất hiện lại ngay trong phiên học. Nếu bạn chọn 'Dễ', từ vựng sẽ được kéo dài khoảng thời gian nhắc lại lên nhiều ngày hoặc tuần."
        ]
      },
      {
        heading: "3. 4 Mẹo Sử Dụng Flashcard SRS Đạt Hiệu Quả Gấp 3 Lần",
        paragraphs: [
          "Để đạt hiệu quả tối đa khi ôn luyện Flashcard tiếng Nhật, hãy áp dụng các nguyên tắc vàng sau:"
        ],
        bulletPoints: [
          "Duy trì thói quen học 15 phút mỗi ngày thay vì dồn 2 tiếng cuối tuần",
          "Kết hợp phát âm âm thanh (Audio TTS) và nhìn chữ Hán (Kanji) đồng thời",
          "Tự đặt câu ví dụ ngắn với từ vựng mới học",
          "Thường xuyên kiểm tra lại từ vựng đã thuộc để duy trì phản xạ"
        ]
      }
    ]
  },
  "kinh-nghiem-luyen-thi-jlpt": {
    title: "Lộ Trình Ôn Thi JLPT N5 Đến N1 Chi Tiết & Mẹo Làm Bài Thi Đạt Điểm Cao",
    category: "Luyện Thi JLPT",
    date: "18/09/2026",
    readTime: "12 phút đọc",
    icon: "📝",
    author: "Ban Chuyên Môn JLPT",
    sections: [
      {
        heading: "1. Cấu Trúc Đề Thi JLPT Mới Nhất",
        paragraphs: [
          "Kỳ thi Năng lực Tiếng Nhật (JLPT) được chia thành 5 cấp độ từ N5 (cơ bản nhất) đến N1 (cao cấp nhất). Đề thi gồm 3 phần chính: Từ vựng - Chữ Hán (Goi), Ngữ pháp - Đọc hiểu (Bunpou - Dokkai) và Nghe hiểu (Choukai).",
          "Để vượt qua kỳ thi, thí sinh cần đạt cả hai điều kiện: Tổng điểm đạt chuẩn đỗ và không có phần thi nào bị dưới điểm liệt (Dưới 19 điểm mỗi phần)."
        ]
      },
      {
        heading: "2. Lộ Trình Phân Bổ Thời Gian Theo Cấp Độ",
        paragraphs: [
          "Mỗi cấp độ đòi hỏi lượng vốn từ vựng và số lượng Kanji khác nhau:"
        ],
        bulletPoints: [
          "JLPT N5: ~800 từ vựng & 100 Kanji (Dành cho người mới bắt đầu)",
          "JLPT N4: ~1.500 từ vựng & 300 Kanji (Giao tiếp cơ bản)",
          "JLPT N3: ~3.000 từ vựng & 650 Kanji (Trung cấp)",
          "JLPT N2: ~6.000 từ vựng & 1.000 Kanji (Đủ điều kiện làm việc tại Nhật)",
          "JLPT N1: ~10.000 từ vựng & 2.000 Kanji (Thành thạo như người bản xứ)"
        ]
      },
      {
        heading: "3. Mẹo Làm Bài Thi JLPT Giúp Tối Ưu Điểm Số",
        paragraphs: [
          "Khi làm bài thi thực tế, phân bổ thời gian hợp lý là chìa khóa quyết định. Hãy ưu tiên làm nhanh phần Kiến thức ngôn ngữ (Từ vựng, Ngữ pháp) để dành ít nhất 50 phút cho phần Đọc hiểu."
        ]
      }
    ]
  },
  "meo-hoc-bo-thu-kanji": {
    title: "Mẹo Học 214 Bộ Thủ Kanji Cơ Bản Và Phương Pháp Ghép Hán Tự Tiếng Nhật",
    category: "Hán Tự Kanji",
    date: "15/09/2026",
    readTime: "10 phút đọc",
    icon: "⛩️",
    author: "Chuyên gia Hán Việt",
    sections: [
      {
        heading: "1. Tại Sao Nên Học Bộ Thủ Khi Học Kanji?",
        paragraphs: [
          "Hán tự (Kanji) trong tiếng Nhật không phải là những nét vẽ ngẫu nhiên. Mỗi chữ Kanji đều được cấu tạo từ các 'bộ thủ' cơ bản đại diện cho ý nghĩa hoặc âm đọc của chữ đó.",
          "Việc nắm vững bộ thủ giúp bạn dễ dàng suy đoán nghĩa của từ mới và ghi nhớ cách viết chính xác mà không bị nhầm lẫn nét."
        ]
      },
      {
        heading: "2. Phân Biệt Âm Onyomi Và Kunyomi",
        paragraphs: [
          "Mỗi chữ Kanji thường có hai loại âm đọc:",
          "Onyomi (Âm Hán): Được sử dụng khi chữ Kanji đó đứng ghép với các chữ Kanji khác thành từ ghép (Ví dụ: 富士山 - Fujisan).",
          "Kunyomi (Âm Nhật): Được sử dụng khi chữ Kanji đó đứng độc lập hoặc đi kèm Hiragana (Ví dụ: 山 - Yama)."
        ]
      }
    ]
  },
  "luyen-nghe-shadowing": {
    title: "Bí Quyết Luyện Nghe Nói Tiếng Nhật Tự Nhiên Bằng Phương Pháp Shadowing",
    category: "Kỹ Năng Nghe Nói",
    date: "12/09/2026",
    readTime: "9 phút đọc",
    icon: "🎧",
    author: "Đội ngũ Kỹ năng Kaiwa",
    sections: [
      {
        heading: "1. Khái Nhiệm Phương Pháp Shadowing",
        paragraphs: [
          "Shadowing (Bóng theo sau) là kỹ thuật luyện nghe nói bằng cách đọc nhại lại theo băng thu âm ngay lập tức khi bạn nghe thấy âm thanh phát ra, độ trễ chỉ khoảng 0.5 đến 1 giây.",
          "Phương pháp này giúp não bộ rèn luyện phản xạ ngữ điệu, nối âm và ngữ điệu câu một cách tự nhiên nhất."
        ]
      },
      {
        heading: "2. 4 Bước Thực Hành Shadowing Chuẩn Cho Người Học",
        bulletPoints: [
          "Bước 1: Nghe hiểu nội dung đoạn hội thoại mà không nhìn script",
          "Bước 2: Nghe và nhìn script đuổi theo âm thanh (Luyện âm)",
          "Bước 3: Tắt script và lặp lại đuổi theo âm thanh ngay lập tức",
          "Bước 4: Thu âm lại giọng nói của bản thân để so sánh và điều chỉnh"
        ]
      }
    ]
  }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES_DATA[slug];
  if (!article) {
    return { title: "Bài viết không tồn tại — Dland Language" };
  }

  return {
    title: `${article.title} — Dland Language Blog`,
    description: article.sections[0]?.paragraphs?.[0] || article.title,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES_DATA[slug];

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          ← Quay lại danh sách Cẩm nang Blog
        </Link>
      </div>

      {/* Article Container */}
      <article className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl space-y-8">
        
        {/* Article Header */}
        <header className="space-y-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-full border border-indigo-100">
              {article.category}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 font-medium">{article.readTime}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
            {article.title}
          </h1>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
            <span>✍️ Tác giả: <strong>{article.author}</strong></span>
            <span>📅 Ngày đăng: {article.date}</span>
          </div>
        </header>

        {/* Article Content */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-800">
          {article.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 border-l-4 border-indigo-600 pl-3">
                {section.heading}
              </h2>

              {section.paragraphs && section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="text-gray-700 leading-relaxed text-sm">
                  {p}
                </p>
              ))}

              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <ul className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2 text-xs sm:text-sm text-gray-800">
                  {section.bulletPoints.map((point, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Article Footer CTA */}
        <footer className="border-t border-gray-100 pt-8 mt-12 bg-gray-50 rounded-2xl p-6 text-center space-y-3">
          <h3 className="text-base font-extrabold text-gray-900">Sẵn sàng trải nghiệm phương pháp học này?</h3>
          <p className="text-xs text-gray-600">
            Truy cập hệ thống Flashcard SRS và Luyện thi JLPT hoàn toàn miễn phí tại Dland Language.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/flashcard/all"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
            >
              🗂️ Thử Flashcard SRS →
            </Link>
            <Link
              href="/exam"
              className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold text-xs transition-all"
            >
              📝 Thi thử JLPT
            </Link>
          </div>
        </footer>

      </article>
    </div>
  );
}
