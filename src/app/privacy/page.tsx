import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính Sách Quyền Riêng Tư (Privacy Policy) — Dland Language",
  description: "Chính sách quyền riêng tư và quy định bảo mật thông tin người dùng, cookie quảng cáo Google AdSense tại Dland Language.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-2xl">🔒</span>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Văn bản Pháp lý</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Chính Sách Quyền Riêng Tư
            </h1>
          </div>
        </div>
        <p className="text-xs text-gray-500 border-t border-gray-100 pt-4 mt-2 flex items-center justify-between flex-wrap gap-2">
          <span>Cập nhật lần cuối: 24/09/2026</span>
          <span>Áp dụng cho: Dland Language Platform</span>
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl space-y-8 text-sm leading-relaxed text-gray-700">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            1. Giới thiệu & Phạm vi áp dụng
          </h2>
          <p>
            Chào mừng bạn đến với <strong>Dland Language</strong>. Chúng tôi tôn trọng quyền riêng tư của bạn và cam kết bảo vệ thông tin cá nhân trong suốt quá trình bạn sử dụng ứng dụng web, dịch vụ Flashcard SRS, Luyện thi JLPT, Ngữ pháp, Kanji và Tiện ích mở rộng Chrome (Chrome Extension).
          </p>
          <p>
            Chính sách quyền riêng tư này giải thích cách thức chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ dữ liệu của bạn, đồng thời minh bạch về việc sử dụng Cookie quảng cáo theo quy định của <strong>Google AdSense</strong>.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            2. Dữ liệu chúng tôi thu thập
          </h2>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
            <p className="font-bold text-gray-900">Chúng tôi xử lý hai dạng dữ liệu chính:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dữ liệu lưu cục bộ (Local Storage):</strong> Sổ tay từ vựng, tiến độ bài học, điểm Streak, cấu hình giao diện. Dữ liệu này nằm hoàn toàn trên trình duyệt thiết bị của bạn.</li>
              <li><strong>Dữ liệu tài khoản (khi đăng nhập):</strong> Tên đăng nhập (Username), mật khẩu mã hóa (Bcrypt Hash) và lịch sử sao lưu tiến độ học tập trên Cloud Server.</li>
            </ul>
          </div>
        </section>

        {/* Section 3 - MANDATORY ADSENSE COOKIES CLAUSE */}
        <section className="space-y-3 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
          <h2 className="text-lg font-bold text-indigo-950 flex items-center gap-2">
            <span>📢</span> 3. Quảng cáo Google AdSense & Cookie của Bên Thứ Ba
          </h2>
          <p className="text-indigo-900 font-medium text-xs sm:text-sm">
            Dland Language sử dụng dịch vụ quảng cáo của <strong>Google AdSense</strong> để duy trì ứng dụng miễn phí cho cộng đồng. 
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-indigo-900">
            <li>
              Các nhà cung cấp là bên thứ ba, bao gồm Google, sử dụng cookie để phục vụ quảng cáo dựa trên các lượt truy cập trước đó của người dùng vào trang web này hoặc các trang web khác.
            </li>
            <li>
              Việc Google sử dụng <strong>Cookie DART</strong> cho phép Google và các đối tác của mình phục vụ quảng cáo cho người dùng dựa trên việc họ truy cập vào Dland Language và/hoặc các trang web khác trên Internet.
            </li>
            <li>
              Người dùng có thể bỏ chọn việc sử dụng cookie DART cho quảng cáo dựa trên lợi ích bằng cách truy cập vào trang <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold">Cài đặt quảng cáo của Google</a>.
            </li>
            <li>
              Ngoài ra, bạn cũng có thể hướng dẫn từ chối việc sử dụng cookie của bên thứ ba đối với quảng cáo cá nhân hóa bằng cách truy cập <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold">www.aboutads.info</a>.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            4. Tiện ích mở rộng Chrome Extension
          </h2>
          <p>
            Tiện ích mở rộng <em>Dland Language - Sổ Tay & Tra Mazii</em> chỉ sử dụng quyền truy cập `storage` và `activeTab` để phục vụ tính năng bôi đen tra từ điển Mazii và đồng bộ sổ tay từ vựng với Web App. Extension <strong>không bao giờ thu thập hay phát tán lịch sử duyệt web cá nhân</strong> của bạn.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            5. An toàn & Bảo mật Thông tin
          </h2>
          <p>
            Chúng tôi áp dụng các giải pháp mã hóa tiêu chuẩn (SSL/TLS HTTPS, Bcrypt password hashing) để bảo vệ thông tin tài khoản của bạn khỏi việc truy cập không hợp lệ. Chúng tôi cam kết <strong>không bao giờ bán, trao đổi hoặc thương mại hóa</strong> thông tin cá nhân của bạn cho bên thứ ba.
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-3 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            6. Liên hệ ban quản trị
          </h2>
          <p>
            Nếu bạn có bất kỳ câu hỏi hoặc đóng góp ý kiến nào liên quan đến Chính sách quyền riêng tư này, vui lòng liên hệ với chúng tôi qua:
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-xs space-y-1">
            <p><strong>Email hỗ trợ:</strong> <a href="mailto:dangminhdat.qnam@gmail.com" className="text-indigo-600 font-bold hover:underline">dangminhdat.qnam@gmail.com</a></p>
            <p><strong>Trang hỗ trợ:</strong> <Link href="/contact" className="text-indigo-600 font-bold hover:underline">Gửi tin nhắn tại trang Liên hệ</Link></p>
          </div>
        </section>

      </div>
    </div>
  );
}
