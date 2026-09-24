import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng (Terms of Service) — Dland Language",
  description: "Điều khoản sử dụng dịch vụ, quy định tài khoản và quyền sở hữu trí tuệ tại Dland Language.",
};

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-2xl">📜</span>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Văn bản Pháp lý</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Điều Khoản Sử Dụng
            </h1>
          </div>
        </div>
        <p className="text-xs text-gray-500 border-t border-gray-100 pt-4 mt-2 flex items-center justify-between flex-wrap gap-2">
          <span>Cập nhật lần cuối: 24/09/2026</span>
          <span>Áp dụng cho: Tất cả người dùng Dland Language</span>
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl space-y-8 text-sm leading-relaxed text-gray-700">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            1. Chấp nhận điều khoản
          </h2>
          <p>
            Bằng việc truy cập ứng dụng web <strong>Dland Language</strong> hoặc cài đặt Tiện ích mở rộng Chrome Extension, bạn đồng ý tuân thủ toàn bộ các điều khoản và điều kiện sử dụng được quy định dưới đây. Nếu bạn không đồng ý với bất kỳ phần nào của điều khoản, vui lòng ngừng sử dụng dịch vụ.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            2. Tài khoản & Bảo mật
          </h2>
          <p>
            Dland Language cho phép người dùng trải nghiệm các tính năng cơ bản mà không cần đăng nhập. Tuy nhiên, khi đăng ký tài khoản để đồng bộ Cloud Database:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Bạn có trách nhiệm tự bảo mật mật khẩu tài khoản của mình.</li>
            <li>Không được chia sẻ tài khoản cho mục đích phát tán mã độc hoặc tấn công hệ thống.</li>
            <li>Ban quản trị có quyền tạm khóa các tài khoản vi phạm tiêu chuẩn cộng đồng hoặc có dấu hiệu tấn công DDoS/API spam.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            3. Quyền sở hữu trí tuệ
          </h2>
          <p>
            Tất cả giao diện, mã nguồn, thuật toán Flashcard SRS, biểu tượng và nhãn hiệu thuộc quyền sở hữu của <strong>Dland Language</strong>. 
          </p>
          <p className="text-xs text-gray-600">
            Dữ liệu từ vựng, ngữ pháp và đề thi JLPT được tổng hợp dựa trên các giáo trình tiếng Nhật tiêu chuẩn (như Minna no Nihongo, Speed Master) phục vụ mục đích giáo dục phi thương mại và nâng cao kỹ năng cho cộng đồng người học ngoại ngữ.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            4. Tuyên bố miễn trừ trách nhiệm đối với AI & Dịch tự động
          </h2>
          <p>
            Ứng dụng tích hợp các tính năng trợ lý AI Chatbot, dịch tự động và tra từ điển Mazii. Mặc dù chúng tôi nỗ lực tối đa để đảm bảo độ chính xác, nội dung do AI tạo ra chỉ mang tính chất tham khảo và hỗ trợ học tập. Ban quản trị không chịu trách nhiệm pháp lý với bất kỳ sai sót ngẫu nhiên nào từ phản hồi tự động của AI.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            5. Thay đổi điều khoản
          </h2>
          <p>
            Chúng tôi có quyền cập nhật hoặc điều chỉnh Điều khoản sử dụng này vào bất kỳ lúc nào để phù hợp với sự phát triển của tính năng và chính sách pháp lý mới. Phiên bản cập nhật sẽ được ghi rõ ngày sửa đổi ở đầu trang.
          </p>
        </section>

      </div>
    </div>
  );
}
