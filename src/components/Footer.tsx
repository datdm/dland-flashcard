"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white text-gray-600 border-t border-gray-200/80 pt-12 pb-16 md:pb-12 text-xs leading-relaxed transition-all">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                D
              </div>
              <span className="font-extrabold text-base text-gray-900 tracking-wide">
                Dland Language
              </span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed">
              Nền tảng học tập ngoại ngữ đa năng kết hợp thuật toán lặp lại ngắt quãng (SRS Flashcard), kho ngữ pháp, luyện thi JLPT và trợ lý AI thông minh.
            </p>
            <div className="flex items-center gap-2 pt-1 text-gray-500 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Hệ thống hoạt động ổn định</span>
            </div>
          </div>

          {/* Column 2: Learning Hub */}
          <div>
            <h3 className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-indigo-600 pl-2">
              Học Tập & Luyện Thi
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/curriculums" className="hover:text-indigo-600 transition-colors">
                  📚 Giáo trình & Bài học
                </Link>
              </li>
              <li>
                <Link href="/flashcard/all" className="hover:text-indigo-600 transition-colors">
                  🗂️ Flashcard SRS Thuật toán
                </Link>
              </li>
              <li>
                <Link href="/exam" className="hover:text-indigo-600 transition-colors">
                  📝 Luyện thi JLPT N5 - N1
                </Link>
              </li>
              <li>
                <Link href="/grammar" className="hover:text-indigo-600 transition-colors">
                  📖 Kho Ngữ pháp tiếng Nhật
                </Link>
              </li>
              <li>
                <Link href="/kanji" className="hover:text-indigo-600 transition-colors">
                  ⛩️ Từ điển Kanji & Hán tự
                </Link>
              </li>
              <li>
                <Link href="/shadowing" className="hover:text-indigo-600 transition-colors">
                  🎧 Luyện nghe Shadowing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Policy & Legal */}
          <div>
            <h3 className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-indigo-600 pl-2">
              Chính Sách & Pháp Lý
            </h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link href="/privacy" className="hover:text-indigo-600 transition-colors font-semibold text-indigo-700">
                  🔒 Chính sách Quyền riêng tư (Privacy)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-indigo-600 transition-colors font-medium">
                  📜 Điều khoản sử dụng (Terms)
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-indigo-600 transition-colors">
                  💡 Giới thiệu dự án Dland
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-indigo-600 transition-colors">
                  📬 Liên hệ & Hỗ trợ kỹ thuật
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Knowledge Hub & Community */}
          <div>
            <h3 className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-4 border-l-2 border-indigo-600 pl-2">
              Cẩm Nang & Cộng Đồng
            </h3>
            <ul className="space-y-2 text-gray-600 mb-4">
              <li>
                <Link href="/blog" className="hover:text-emerald-700 transition-colors font-semibold text-emerald-700">
                  ✍️ Blog Cẩm nang học ngoại ngữ
                </Link>
              </li>
              <li>
                <Link href="/chat" className="hover:text-indigo-600 transition-colors">
                  🤖 Trợ lý AI Chat thông minh
                </Link>
              </li>
              <li>
                <Link href="/notebooks" className="hover:text-indigo-600 transition-colors">
                  📓 Quản lý Sổ tay cá nhân
                </Link>
              </li>
            </ul>
            <div className="pt-2 border-t border-gray-200/80 text-[11px] text-gray-500 space-y-1">
              <p>Email: <a href="mailto:dangminhdat.qnam@gmail.com" className="text-indigo-600 font-semibold hover:underline">dangminhdat.qnam@gmail.com</a></p>
              <p>Hỗ trợ 24/7 trực tuyến</p>
            </div>
          </div>

        </div>

        {/* Divider & Copyright */}
        <div className="pt-8 border-t border-gray-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} <strong className="text-gray-900 font-bold">Dland Language</strong>. Tất cả các quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-indigo-600 transition-colors">Chính sách bảo mật</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-indigo-600 transition-colors">Điều khoản dịch vụ</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Liên hệ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
