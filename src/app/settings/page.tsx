"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ExportImportPanel from "@/components/ExportImportPanel";
import BackupHistoryPanel from "@/components/BackupHistoryPanel";
import PasswordChangeDialog from "@/components/PasswordChangeDialog";
import UploadPanel from "@/components/UploadPanel";
import * as syncService from "@/lib/syncService";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useFlashCardSettings } from "@/hooks/useFlashCardSettings";
import { useAuth } from "@/context/AuthContext";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import CurriculumDisplaySettings from "@/components/CurriculumDisplaySettings";
import NavMenuSettingsPanel from "@/components/NavMenuSettingsPanel";

function NotebookProgressSettingsPanel() {
  const { notebooks } = useNotebooks();
  const { progress } = useProgress();

  const notebookProgresses = useMemo(() => {
    return notebooks.map((nb) => {
      const total = nb.vocabulary.length;
      const learned = nb.vocabulary.filter((v) => progress[v.id]?.learned).length;
      const percentage = total > 0 ? Math.round((learned / total) * 100) : 0;
      return { ...nb, total, learned, percentage };
    });
  }, [notebooks, progress]);

  if (notebooks.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📓</span> Tiến Độ Sổ Tay & Từ Vựng Đã Học
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Nhấn vào từng sổ tay để mở trực tiếp danh sách các từ vựng đã học / đã thuộc
          </p>
        </div>
        <Link
          href="/notebooks"
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
        >
          <span>Quản lý tất cả sổ tay</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {notebookProgresses.map((nb) => (
          <Link
            key={nb.id}
            href={`/notebooks/${nb.id}?tab=learned`}
            className="p-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 hover:bg-purple-50/40 hover:border-purple-300 transition-all flex flex-col justify-between group shadow-3xs cursor-pointer"
            title={`Xem từ đã học trong ${nb.name}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-extrabold text-xs text-gray-900 group-hover:text-purple-700 truncate">
                  {nb.name}
                </span>
                <span className="text-[11px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100 shrink-0">
                  {nb.learned}/{nb.total} từ ({nb.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${nb.percentage}%` }}
                />
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-200/40 flex items-center justify-between text-[11px] text-gray-500 group-hover:text-purple-600 font-semibold">
              <span className="flex items-center gap-1">
                <span>{nb.learned > 0 ? "✨ Xem từ vựng đã học" : "Chưa có từ đã học (Xem sổ)"}</span>
              </span>
              <span className="group-hover:translate-x-0.5 transition-transform text-xs font-bold text-purple-600">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ResetHistorySettingsPanel() {
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetAllProgress = async () => {
    setIsResetting(true);
    await syncService.resetAllLearningProgress();
    setShowResetModal(false);
    setIsResetting(false);
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span>⚙️</span> Quản Lý & Khôi Phục Dữ Liệu
        </h2>
        <p className="text-xs text-gray-500">
          Thiết lập đặt lại tiến trình học tập hoặc làm mới dữ liệu của bạn.
        </p>
      </div>

      <div className="bg-rose-50/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-rose-100">
        <div>
          <h3 className="text-xs font-bold text-rose-900">Xóa dữ liệu tiến độ học tập (Reset)</h3>
          <p className="text-[11px] text-rose-700 mt-0.5">
            Dùng khi bạn muốn học lại từ đầu toàn bộ các bài học hoặc đặt lại chuỗi Streak học tập về 0%.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowResetModal(true)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-rose-200 transition-all cursor-pointer shrink-0"
        >
          🗑️ Reset Lịch Sử Học Tập
        </button>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl mb-4 shadow-inner">
              ⚠️
            </div>
            <h3 className="text-lg font-black text-gray-900">Xác nhận xóa lịch sử học tập?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Bạn có chắc chắn muốn xóa toàn bộ <strong className="text-rose-600">tiến độ bài học, thẻ từ vựng/ngữ pháp/kanji đã thuộc, bảng điểm luyện tập và chuỗi Streak</strong> không?
            </p>
            <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-700 font-semibold">
              🚨 Lưu ý: Toàn bộ tiến độ sẽ quay về 0% và không thể khôi phục sau khi xóa.
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleResetAllProgress}
                className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl transition-all shadow-md shadow-rose-200 cursor-pointer"
              >
                🗑️ Đồng ý xóa hết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, isAuthenticated, openAuthModal } = useAuth();
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
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-8 md:pb-4">
      {/* Header Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 text-white shadow-md transition-all duration-300 bg-gradient-to-r ${
        activeLangCode === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : activeLangCode === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase mb-1.5 inline-block">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">
              {isAuthenticated ? "Cài Đặt Ngôn Ngữ & Dữ Liệu" : "Cài Đặt Ngôn Ngữ Học Tập"}
            </h1>
            <p className="text-xs text-indigo-100 mt-1">
              Chọn ngôn ngữ mục tiêu học tập (Tiếng Nhật, Tiếng Anh, Tiếng Đức...) và nhấn nút Lưu để áp dụng toàn website
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {/* Multilingual Language Mode Selection Section */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
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
                  onClick={() => {
                    if (lang.status === "coming_soon") return;
                    selectDraftLanguage(lang.code);
                  }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    lang.status === "coming_soon"
                      ? "opacity-60 cursor-not-allowed bg-gray-50/80 border-gray-200"
                      : isDraftSelected
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-300 shadow-sm cursor-pointer"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50/50 cursor-pointer"
                  }`}>
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

        {/* Notebooks Progress & Learned Vocabulary */}
        <NotebookProgressSettingsPanel />

        {/* Display additional settings ONLY when authenticated */}
        {isAuthenticated ? (
          <>
            {/* Nav Menu Visibility Settings */}
            <NavMenuSettingsPanel />

            {/* Reset History & Progress Section */}
            <ResetHistorySettingsPanel />

            {/* Account Info Section */}
            {user && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <span>👤</span> Thông tin tài khoản Dland
                </h2>
                <div className="bg-gray-50 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Tên đăng nhập</p>
                    <p className="text-base font-bold text-gray-900">{user.username}</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordDialog(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold text-xs shadow-2xs cursor-pointer"
                  >
                    🔐 Đổi mật khẩu
                  </button>
                </div>
                {user.isAdmin && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-indigo-900">🛡️ Quyền Quản trị viên (Admin)</h3>
                      <p className="text-[10px] text-indigo-700 mt-0.5">
                        Bạn có quyền truy cập vào bảng điều khiển quản trị viên để theo dõi tiến trình học tập của người dùng.
                      </p>
                    </div>
                    <Link
                      href="/admin"
                      className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-xs shadow-3xs shrink-0"
                    >
                      Vào Dashboard →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Upload Data Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs">
              <UploadPanel />
            </div>

            {/* Format examples */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3.5">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>📄</span> Các định dạng JSON được hỗ trợ
              </h2>

              <div className="space-y-2.5">
                <details className="group border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                  <summary className="cursor-pointer font-bold text-xs text-gray-800 group-hover:text-indigo-600 flex items-center justify-between">
                    <span>📚 Giáo trình (Curriculum)</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <pre className="mt-3 text-[11px] bg-gray-900 text-emerald-400 p-3.5 rounded-xl overflow-x-auto font-mono leading-relaxed">{`{
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

            {/* Sample Curriculum Display Settings Section - Admin only */}
            {user?.isAdmin && <CurriculumDisplaySettings />}
          </>
        ) : (
          <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <h3 className="text-xs font-bold text-indigo-900">🔑 Đăng nhập để sử dụng thêm các tính năng khác</h3>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                Đồng bộ tiến độ học tập, quản lý tài khoản, tải lên file dữ liệu JSON và khôi phục lịch sử học tập.
              </p>
            </div>
            <button
              onClick={() => openAuthModal("Đăng nhập để quản lý tài khoản và đồng bộ dữ liệu học tập")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              Đăng nhập ngay
            </button>
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
