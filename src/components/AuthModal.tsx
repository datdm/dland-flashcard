"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthModal() {
  const router = useRouter();
  const { authModalConfig, closeAuthModal, login, register } = useAuth();
  const { isOpen, reason, onSuccess } = authModalConfig;

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Vui lòng nhập tên đăng nhập");
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const res = await login(username, password);
        if (res.success) {
          closeAuthModal();
          if (onSuccess) onSuccess();
          router.push("/");
        } else {
          setError(res.error || "Tên đăng nhập hoặc mật khẩu không chính xác");
        }
      } else {
        const res = await register(username, password);
        if (res.success) {
          // Auto login after register
          const loginRes = await login(username, password);
          closeAuthModal();
          if (loginRes.success && onSuccess) onSuccess();
          router.push("/");
        } else {
          setError(res.error || "Đăng ký thất bại. Tên đăng nhập có thể đã tồn tại");
        }
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Đóng"
        >
          ✕
        </button>

        {/* Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl text-indigo-600 shadow-sm">
            {mode === "login" ? "🔑" : "✨"}
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">
            {mode === "login" ? "Đăng Nhập Tài Khoản" : "Tạo Tài Khoản Mới"}
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
            {reason || "Đăng nhập để lưu từ vựng vào sổ tay, theo dõi tiến độ và học tập không giới hạn!"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              mode === "login"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all ${
              mode === "register"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-medium flex items-center gap-2 animate-shake">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              autoFocus
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs tracking-wide shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
          >
            {loading ? (
              <span>Đang xử lý...</span>
            ) : mode === "login" ? (
              <span>Đăng Nhập Ngay →</span>
            ) : (
              <span>Tạo Tài Khoản & Bắt Đầu →</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
