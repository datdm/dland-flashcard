"use client";

import { useState } from "react";
import ExportImportPanel from "@/components/ExportImportPanel";
import BackupHistoryPanel from "@/components/BackupHistoryPanel";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import UploadPanel from "@/components/UploadPanel";
import * as syncService from "@/lib/syncService";

export default function SettingsPage() {
  const isAuthenticated = syncService.checkAuthStatus();
  const user = syncService.getUser();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-indigo-950 rounded-3xl p-6 text-white shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
              CẤU HÌNH HỆ THỐNG
            </span>
            <h1 className="text-2xl font-bold mt-2">Cài Đặt & Quản Lý Dữ Liệu</h1>
            <p className="text-xs text-gray-300 mt-1">
              Đồng bộ tài khoản, Sao lưu/Khôi phục dữ liệu JSON và Quản lý dữ liệu học tập
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Info Section */}
        {isAuthenticated && user && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span>👤</span> Thông tin tài khoản
            </h2>
            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Tên đăng nhập</p>
                <p className="text-base font-bold text-gray-900">{user.username}</p>
              </div>
              <button
                onClick={() => setShowPasswordDialog(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-xs shadow-2xs"
              >
                🔐 Đổi mật khẩu
              </button>
            </div>
          </div>
        )}

        {/* Upload Data Section */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
          <UploadPanel />
        </div>

        {/* Format examples */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📄</span> Các định dạng JSON được hỗ trợ
          </h2>

          <div className="space-y-3">
            <details className="group border border-gray-100 rounded-2xl p-3 bg-gray-50/50">
              <summary className="cursor-pointer font-bold text-xs text-gray-800 group-hover:text-indigo-600 flex items-center justify-between">
                <span>📚 Giáo trình (Curriculum)</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <pre className="mt-3 text-[11px] bg-gray-900 text-emerald-400 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">{`{
  "curriculum": "Minna no Nihongo N5",
  "lessons": [
    {
      "name": "Bài 1 - Giới thiệu bản thân",
      "vocabulary": [
        {
          "kanji": "日本語",
          "hiragana": "にほんご",
          "onyomi": "ニホンゴ",
          "meaning": "Tiếng Nhật",
          "phonetic": "nihongo"
        }
      ]
    }
  ]
}`}</pre>
            </details>

            <details className="group border border-gray-100 rounded-2xl p-3 bg-gray-50/50">
              <summary className="cursor-pointer font-bold text-xs text-gray-800 group-hover:text-indigo-600 flex items-center justify-between">
                <span>📓 Sổ tay đơn (Single Notebook)</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <pre className="mt-3 text-[11px] bg-gray-900 text-purple-300 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">{`{
  "notebook": {
    "name": "Từ vựng dễ nhầm",
    "vocabulary": [
      {
        "kanji": "日本語",
        "hiragana": "にほんご",
        "meaning": "Tiếng Nhật"
      }
    ]
  }
}`}</pre>
            </details>

            <details className="group border border-gray-100 rounded-2xl p-3 bg-gray-50/50">
              <summary className="cursor-pointer font-bold text-xs text-gray-800 group-hover:text-indigo-600 flex items-center justify-between">
                <span>📖 Thư viện Ngữ pháp (Grammar Collection)</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <pre className="mt-3 text-[11px] bg-gray-900 text-sky-300 p-4 rounded-xl overflow-x-auto font-mono leading-relaxed">{`{
  "collection": {
    "name": "Ngữ pháp N5 cơ bản",
    "grammarPoints": [
      {
        "structure": "～ている",
        "meaning": "Đang làm gì",
        "level": "N5",
        "examples": [
          {
            "sentence": "私は今、本を読んでいます。",
            "meaning": "Tôi đang đọc sách."
          }
        ]
      }
    ]
  }
}`}</pre>
            </details>
          </div>
        </div>

        {/* Export/Import Section */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
          <ExportImportPanel />
        </div>

        {/* Backup History Section */}
        {isAuthenticated && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
            <BackupHistoryPanel />
          </div>
        )}
      </div>

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        isOpen={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
      />
    </div>
  );
}
