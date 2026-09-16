"use client";

import { useState } from "react";
import { useLanguageSetting, SUPPORTED_LANGUAGES } from "@/hooks/useLanguageSetting";
import { useNavMenuSettings } from "@/hooks/useNavMenuSettings";
import { getNavItemsForLanguage } from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

// Items that MUST always stay visible (cannot be hidden)
const ALWAYS_VISIBLE = new Set(["/", "/settings"]);

export default function NavMenuSettingsPanel() {
  const { user } = useAuth();
  const isAdmin = !!user?.isAdmin;

  const { activeLanguage } = useLanguageSetting();
  const {
    isVisible,
    toggleItem,
    resetLang,
    devFeaturesEnabled,
    setDevFeaturesEnabled,
    isItemDevOnly,
    toggleItemDevOnly,
  } = useNavMenuSettings();

  const [previewLang, setPreviewLang] = useState<string>(activeLanguage.code);

  const allLangItems = getNavItemsForLanguage(previewLang);

  // Hiển thị toàn bộ các mục menu trong cấu hình
  const displayedItems = allLangItems;

  const hiddenCount = displayedItems.filter(
    (item) =>
      !ALWAYS_VISIBLE.has(item.href) &&
      (!isItemDevOnly(previewLang, item.href, !!item.isDevOnly) || isAdmin) &&
      !isVisible(previewLang, item.href, isAdmin, !!item.isDevOnly)
  ).length;

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === previewLang) || activeLanguage;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>📋</span> Tùy Chỉnh Hiển Thị Menu
            </h2>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                🛡️ Quản trị viên
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Bật/tắt các mục menu trên thanh điều hướng cho {currentLangObj.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher Tabs for Multi-Language Configuration */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setPreviewLang(lang.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  previewLang === lang.code
                    ? "bg-white text-indigo-700 shadow-3xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{lang.flag}</span>
                <span className="hidden sm:inline">{lang.name}</span>
              </button>
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              onClick={() => resetLang(previewLang)}
              className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer shrink-0"
            >
              Hiện lại tất cả
            </button>
          )}
        </div>
      </div>

      {/* Admin Management Section for Dev Features */}
      {isAdmin && (
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-900">
                🚀 Cài Đặt Tính Năng Đang Phát Triển (Toàn Hệ Thống)
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  devFeaturesEnabled
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-gray-100 text-gray-500 border border-gray-200"
                }`}
              >
                {devFeaturesEnabled ? "Đang Bật" : "Đang Tắt"}
              </span>
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-1 leading-relaxed">
              Khi bật, học viên sẽ thấy các menu đang phát triển trên thanh điều hướng và có thể tùy chỉnh hiển thị trong Cài Đặt.
              Bạn cũng có thể gán setting <strong>"Đang phát triển"</strong> trực tiếp cho từng tính năng bên dưới.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDevFeaturesEnabled(!devFeaturesEnabled)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              devFeaturesEnabled ? "bg-indigo-600" : "bg-gray-200"
            }`}
            title={devFeaturesEnabled ? "Tắt tính năng đang phát triển" : "Bật tính năng đang phát triển"}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                devFeaturesEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      )}

      {/* Regular User Notification Banner when Dev Features are Present */}
      {!isAdmin && displayedItems.some((item) => isItemDevOnly(previewLang, item.href, !!item.isDevOnly || !!item.isComingSoon)) && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
          <span className="text-base shrink-0">🛠️</span>
          <span>
            Các menu có nhãn <strong>"🛠️ Đang phát triển"</strong> đang trong quá trình xây dựng và sẽ không hiển thị trên thanh điều hướng đối với học viên.
          </span>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {displayedItems.map((item) => {
          const isAlways = ALWAYS_VISIBLE.has(item.href);
          const defaultDev = !!item.isDevOnly || !!item.isComingSoon;
          const isDev = isItemDevOnly(previewLang, item.href, defaultDev);
          const visible = isAlways ? true : isVisible(previewLang, item.href, isAdmin, defaultDev);

          return (
            <div
              key={item.href}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                isDev
                  ? "bg-amber-50/40 border-amber-200/80"
                  : "bg-gray-50/70 border-gray-100 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-800 truncate">
                      {item.label}
                    </span>
                    {isDev && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold shrink-0">
                        🛠️ Đang phát triển
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono truncate block mt-0.5">
                    {item.href}
                  </span>
                </div>
              </div>

              {/* Action Control: Admin Toggle or Regular User Visibility Switch */}
              <div className="flex items-center gap-2 shrink-0">
                {isAlways ? (
                  <span className="text-[10px] font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">
                    Cố định
                  </span>
                ) : isAdmin ? (
                  <button
                    type="button"
                    onClick={() => toggleItemDevOnly(previewLang, item.href, defaultDev)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                      isDev
                        ? "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200"
                        : visible
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                        : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"
                    }`}
                    title="Nhấp để bật/tắt trạng thái Đang phát triển cho tính năng này"
                  >
                    {isDev ? "Bỏ Đang phát triển" : "Gán Đang phát triển"}
                  </button>
                ) : isDev ? (
                  <span className="text-[10px] font-semibold text-gray-400 italic">
                    (Không hiển thị)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleItem(previewLang, item.href, isAdmin, defaultDev)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      visible ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                    title={visible ? "Ẩn mục menu này" : "Hiện mục menu này"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        visible ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && (
        <p className="mt-2 text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          ⚠️ Đang ẩn {hiddenCount} mục trong menu {currentLangObj.name}. Menu thanh điều hướng sẽ hiển thị theo cài đặt của bạn.
        </p>
      )}
    </div>
  );
}
