"use client";

import { useState } from "react";
import Link from "next/link";
import ExportImportPanel from "@/components/ExportImportPanel";
import BackupHistoryPanel from "@/components/BackupHistoryPanel";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import UploadPanel from "@/components/UploadPanel";
import * as syncService from "@/lib/syncService";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useFlashCardSettings } from "@/hooks/useFlashCardSettings";

function CurriculumDisplaySettings() {
  const { settings, saveSettings } = useFlashCardSettings();

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
      <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
        <span>🙈</span> Quản Lý Hiển Thị Giáo Trình Mẫu
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Tùy chỉnh ẩn/hiện các bộ dữ liệu mẫu mặc định để giao diện gọn gàng hơn.
      </p>

      <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between gap-4 border border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-gray-900">Ẩn bộ từ vựng "N5 Speed Master 語彙"</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Tạm thời ẩn bộ giáo trình N5 Speed Master khỏi trang Ôn tập Flashcard, Giáo trình và Tra cứu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => saveSettings({ ...settings, hideSuperMasterN5: !settings.hideSuperMasterN5 })}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            settings.hideSuperMasterN5 ? "bg-indigo-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              settings.hideSuperMasterN5 ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const isAuthenticated = syncService.checkAuthStatus();
  const user = syncService.getUser();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const {
    activeLangCode,
    draftLangCode,
    activeLanguage,
    hasUnsavedChanges,
    supportedLanguages,
    selectDraftLanguage,
    saveLanguage,
  } = useLanguageSetting();

  return (
    <div className="p-4 max-w-4xl mx-auto min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 rounded-3xl p-6 text-white shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
              Dland Language Settings
            </span>
            <h1 className="text-2xl font-bold mt-2">Cài Đặt Ngôn Ngữ & Dữ Liệu</h1>
            <p className="text-xs text-indigo-100 mt-1">
              Chọn ngôn ngữ mục tiêu học tập (Tiếng Nhật, Tiếng Anh, Tiếng Đức...) và nhấn nút Lưu để áp dụng toàn website
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Multilingual Language Mode Selection Section */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>🌐</span> Chọn Ngôn Ngữ Học Tập (Target Language)
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Đang kích hoạt: <span className="font-bold text-indigo-600">{activeLanguage.flag} {activeLanguage.name}</span>
              </p>
            </div>
          </div>

          {/* Language Cards Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {supportedLanguages.map((lang) => {
              const isDraftSelected = draftLangCode === lang.code;
              const isCurrentlyActive = activeLangCode === lang.code;

              return (
                <div
                  key={lang.code}
                  onClick={() => selectDraftLanguage(lang.code)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isDraftSelected
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-300 shadow-sm"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <h3 className="font-bold text-gray-900 text-sm">{lang.name}</h3>
                          <span className="text-[10px] text-gray-400 font-mono">({lang.nativeName})</span>
                        </div>
                      </div>

                      {isCurrentlyActive ? (
                        <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-[10px] font-bold">
                          ✓ Đang học
                        </span>
                      ) : isDraftSelected ? (
                        <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-bold">
                          Đã chọn
                        </span>
                      ) : lang.status === "coming_soon" ? (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-xl text-[10px] font-bold">
                          Sắp ra mắt
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-xl text-[10px] font-semibold">
                          Sẵn sàng
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed mt-1">{lang.description}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold">Trình độ:</span>
                    {lang.levels.map((lvl) => (
                      <span
                        key={lvl}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isDraftSelected ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {lvl}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SAVE LANGUAGE BUTTON */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {hasUnsavedChanges ? (
                <span className="text-amber-600 font-bold">⚠️ Có thay đổi chưa lưu! Hãy bấm "Lưu Ngôn Ngữ".</span>
              ) : (
                <span>Đã áp dụng ngôn ngữ: <strong>{activeLanguage.name}</strong></span>
              )}
            </div>

            <button
              onClick={saveLanguage}
              disabled={!hasUnsavedChanges}
              className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                hasUnsavedChanges
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 hover:opacity-95 animate-pulse"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span>💾</span>
              <span>Lưu Ngôn Ngữ Học Tập</span>
            </button>
          </div>
        </div>

        {/* Sample Curriculum Display Settings Section */}
        <CurriculumDisplaySettings />

        {/* Account Info Section */}
        {isAuthenticated && user && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>👤</span> Thông tin tài khoản Dland
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
            {user.isAdmin && (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-indigo-900">🛡️ Quyền Quản trị viên (Admin)</h3>
                  <p className="text-[10px] text-indigo-700 mt-0.5">
                    Bạn có quyền truy cập vào bảng điều khiển quản trị viên để theo dõi tiến trình học tập của người dùng.
                  </p>
                </div>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-xs shadow-3xs shrink-0"
                >
                  Vào Dashboard →
                </Link>
              </div>
            )}
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
  "curriculum": "Oxford 3000 / Minna",
  "lessons": [
    {
      "name": "Unit 1 - Communication",
      "vocabulary": [
        {
          "kanji": "Communication",
          "hiragana": "/kəˌmjuːnɪˈkeɪʃn/",
          "meaning": "Sự giao tiếp, liên lạc"
        }
      ]
    }
  ]
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
