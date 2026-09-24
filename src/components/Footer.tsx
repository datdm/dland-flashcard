"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800 pt-12 pb-16 md:pb-12 text-xs leading-relaxed transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                D
              </div>
              <span className="font-extrabold text-base text-white tracking-wide">
                Dland Language
              </span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed">
              Nền tảng học tập ngoại ngữ đa năng kết hợp thuật toán lặp lại ngắt quãng (SRS Flashcard), kho ngữ pháp, luyện thi JLPT và trợ lý AI thông minh.
            </p>
            <div className="flex items-center gap-2 pt-1 text-gray-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Hệ thống hoạt động ổn định</span>
            </div>
          </div>

          {/* Column 2: Learning Hub */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-indigo-500 pl-2">
              Học Tập & Luyện Thi
            </h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/curriculums" className="hover:text-white transition-colors">
                  📚 Giáo trình & Bài học
                </Link>
              </li>
              <li>
                <Link href="/flashcard/all" className="hover:text-white transition-colors">
                  🗂️ Flashcard SRS Thuật toán
                </Link>
              </li>
              <li>
                <Link href="/exam" className="hover:text-white transition-colors">
                  📝 Luyện thi JLPT N5 - N1
                </Link>
              </li>
              <li>
                <Link href="/grammar" className="hover:text-white transition-colors">
                  📖 Kho Ngữ pháp tiếng Nhật
                </Link>
              </li>
              <li>
                <Link href="/kanji" className="hover:text-white transition-colors">
                  ⛩️ Từ điển Kanji & Hán tự
                </Link>
              </li>
              <li>
                <Link href="/shadowing" className="hover:text-white transition-colors">
                  🎧 Luyện nghe Shadowing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policy & Legal */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-indigo-500 pl-2">
              Chính Sách & Pháp Lý
            </h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors font-medium text-indigo-300">
                  🔒 Chính sách Quyền riêng tư (Privacy)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors font-medium">
                  📜 Điều khoản sử dụng (Terms)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  💡 Giới thiệu dự án Dland
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  📬 Liên hệ & Hỗ trợ kỹ thuật
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Knowledge Hub & Community */}
          <div>
            <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-indigo-500 pl-2">
              Cẩm Nang & Cộng Đồng
            </h3>
            <ul className="space-y-2 text-gray-400 mb-4">
              <li>
                <Link href="/blog" className="hover:text-white transition-colors font-semibold text-emerald-400">
                  ✍️ Blog Cẩm nang học ngoại ngữ
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-white transition-colors">
                  🤖 Trợ lý AI Chat thông minh
                </Link>
              </li>
              <li>
                <Link href="/notebooks" className="hover:text-white transition-colors">
                  📓 Quản lý Sổ tay cá nhân
                </Link>
              </li>
            </ul>
            <div className="pt-2 border-t border-gray-800 text-[11px] text-gray-400 space-y-1">
              <p>Email: <a href="mailto:support@dland.com" className="text-indigo-300 hover:underline">support@dland.com</a></p>
              <p>Hỗ trợ 24/7 trực tuyến</p>
            </div>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-400 text-[11px]">
          <div>
            © {new Date().getFullYear()} <strong className="text-gray-300">Dland Language</strong>. Tất cả các quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Chính sách bảo mật</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Điều khoản dịch vụ</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-gray-300 transition-colors">Liên hệ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
