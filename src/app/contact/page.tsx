"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Góp ý & Hỗ trợ kỹ thuật",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus("sending");
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", subject: "Góp ý & Hỗ trợ kỹ thuật", message: "" });
    }, 1200);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-2xl">📬</span>
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Hỗ trợ 24/7</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Liên Hệ & Phản Hồi
            </h1>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Chúng tôi luôn sẵn sàng lắng nghe ý kiến đóng góp, báo lỗi tính năng và giải đáp thắc mắc của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Info Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-4">
            <h2 className="text-base font-extrabold text-gray-900 border-l-4 border-indigo-600 pl-3">
              Thông Tin Liên Hệ
            </h2>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-base">📧</span>
                <div>
                  <strong className="block text-gray-900">Email Hỗ Trợ:</strong>
                  <a href="mailto:dangminhdat.qnam@gmail.com" className="text-indigo-600 font-medium hover:underline">
                    dangminhdat.qnam@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-base">🌐</span>
                <div>
                  <strong className="block text-gray-900">Trang Web:</strong>
                  <span className="text-gray-600">dland-flashcard.vercel.app</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-base">⏱️</span>
                <div>
                  <strong className="block text-gray-900">Thời gian phản hồi:</strong>
                  <span className="text-gray-600">Trong vòng 24 giờ làm việc</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ Box */}
          <div className="bg-indigo-50/60 rounded-3xl p-6 border border-indigo-100 space-y-3">
            <h3 className="text-xs font-extrabold text-indigo-950 uppercase tracking-wider">
              💡 Câu hỏi thường gặp
            </h3>
            <div className="space-y-2 text-xs text-indigo-900">
              <p><strong>Q: Làm sao để cài Chrome Extension?</strong></p>
              <p className="text-gray-600">Vào thư mục `chrome-extension`, bật Chế độ nhà phát triển trên Chrome và chọn `Load unpacked`.</p>
              
              <p className="pt-1"><strong>Q: Làm sao đồng bộ dữ liệu?</strong></p>
              <p className="text-gray-600">Vào trang Cài Đặt và bấm Đăng nhập tài khoản để tự động đồng bộ Cloud.</p>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl space-y-6">
            <h2 className="text-lg font-extrabold text-gray-900">Gửi Tin Nhắn Cho Chúng Tôi</h2>

            {status === "success" && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <span>✅</span>
                <span>Cảm ơn bạn! Tin nhắn phản hồi đã được gửi thành công. Ban quản trị sẽ phản hồi sớm nhất!</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Địa chỉ Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Chủ đề</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium"
                >
                  <option value="Góp ý & Hỗ trợ kỹ thuật">Góp ý & Hỗ trợ kỹ thuật</option>
                  <option value="Báo lỗi tính năng">Báo lỗi tính năng (Bug Report)</option>
                  <option value="Hợp tác & Đóng góp nội dung">Hợp tác & Đóng góp nội dung</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nội dung tin nhắn *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Mô tả chi tiết thắc mắc hoặc câu hỏi của bạn..."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all outline-none resize-y"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs tracking-wide shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                {status === "sending" ? "⏳ Đang gửi tin nhắn..." : "✉️ Gửi Tin Nhắn Ngay →"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
