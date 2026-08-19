"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  featureName?: string;
  description?: string;
}

export default function AuthGuard({
  children,
  featureName = "Học tập & Luyện tập",
  description = "Vui lòng đăng nhập để bắt đầu phiên học, theo dõi SRS Flashcard, lưu từ vựng vào sổ tay và đồng bộ tiến độ của bạn."
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500">Đang kiểm tra tài khoản...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto my-12 px-4">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl mb-4 shadow-sm">
            🔒
          </div>
          
          <span className="px-3.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full text-xs font-extrabold mb-2">
            Yêu cầu Đăng Nhập
          </span>
          
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">
            Mở Khóa Tính Năng {featureName}
          </h2>
          
          <p className="text-xs text-gray-500 max-w-md leading-relaxed mb-6">
            {description}
          </p>

          {/* Key Benefits */}
          <div className="w-full bg-gray-50/80 rounded-2xl p-4 border border-gray-100 mb-6 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span>✨</span>
              <span>Lưu từ vựng, ngữ pháp không giới hạn vào sổ tay cá nhân</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span>📈</span>
              <span>Theo dõi thuật toán lặp lại ngắt quãng (SRS Flashcard)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <span>☁️</span>
              <span>Tự động đồng bộ tiến độ học giữa mọi thiết bị</span>
            </div>
          </div>

          <button
            onClick={() => openAuthModal(`Vui lòng đăng nhập để mở khóa ${featureName}`)}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wide shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>🔑 Đăng Nhập / Đăng Ký Ngay →</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
