"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import SyncDialog from "./SyncDialog";
import LanguageSelectModal from "./LanguageSelectModal";
import * as syncService from "@/lib/syncService";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { useAuth } from "@/context/AuthContext";
import { useNavMenuSettings } from "@/hooks/useNavMenuSettings";

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  isComingSoon?: boolean;
  isDevOnly?: boolean;
  openInNewTab?: boolean;
}

export function getNavItemsForLanguage(langCode: string): NavItem[] {
  switch (langCode) {
    case "en":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/curriculum", label: "Lộ trình IELTS 7.0", icon: "📚" },
        { href: "/practice", label: "Luyện chuyên sâu", icon: "🏆" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/notebooks", label: "Sổ tay Tiếng Anh", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/shadowing", label: "Shadowing Video", icon: "🎬", isDevOnly: true },
        { href: "/ipa", label: "Luyện phát âm IPA", icon: "🎙️", isDevOnly: true },
        { href: "/grammar", label: "Ngữ pháp Tiếng Anh", icon: "📖", isDevOnly: true },
        { href: "/vocabulary", label: "Kho Từ Vựng Tiếng Anh", icon: "📝", isDevOnly: true },
        { href: "/admin", label: "Quản trị hệ thống", icon: "🛡️", isDevOnly: true },
        { href: "/practice/ai-voice-room", label: "Phòng Luyện Voice AI", icon: "🎙️", isComingSoon: true, isDevOnly: true },
        { href: "/practice/mock-interview", label: "Phỏng Vấn Xin Việc AI", icon: "💼", isComingSoon: true, isDevOnly: true },
        { href: "/settings", label: "Cài đặt hệ thống", icon: "⚙️" },
      ];

    case "de":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/curriculum", label: "Giáo trình Tiếng Đức", icon: "📚" },
        { href: "/practice", label: "Luyện chuyên sâu", icon: "🏆" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/notebooks", label: "Sổ tay Tiếng Đức", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/shadowing", label: "Shadowing Video", icon: "🎬", isDevOnly: true },
        { href: "/grammar", label: "Ngữ pháp Tiếng Đức", icon: "📖", isDevOnly: true },
        { href: "/vocabulary", label: "Kho Từ Vựng Tiếng Đức", icon: "📝", isDevOnly: true },
        { href: "/admin", label: "Quản trị hệ thống", icon: "🛡️", isDevOnly: true },
        { href: "/settings", label: "Cài đặt hệ thống", icon: "⚙️" },
      ];

    case "ko":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/curriculum", label: "Giáo trình TOPIK", icon: "📚" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/notebooks", label: "Sổ tay Tiếng Hàn", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/shadowing", label: "Shadowing Video", icon: "🎬", isDevOnly: true },
        { href: "/grammar", label: "Ngữ pháp Tiếng Hàn", icon: "📖", isDevOnly: true },
        { href: "/vocabulary", label: "Kho Từ Vựng Tiếng Hàn", icon: "📝", isDevOnly: true },
        { href: "/admin", label: "Quản trị hệ thống", icon: "🛡️", isDevOnly: true },
        { href: "/settings", label: "Cài đặt hệ thống", icon: "⚙️" },
      ];

    case "zh":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/curriculum", label: "Giáo trình HSK", icon: "📚" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/notebooks", label: "Sổ tay Tiếng Trung", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/shadowing", label: "Shadowing Video", icon: "🎬", isDevOnly: true },
        { href: "/grammar", label: "Ngữ pháp Tiếng Trung", icon: "📖", isDevOnly: true },
        { href: "/kanji", label: "Hán tự Hanzi", icon: "🉐", isDevOnly: true },
        { href: "/vocabulary", label: "Kho Từ Vựng Tiếng Trung", icon: "📝", isDevOnly: true },
        { href: "/admin", label: "Quản trị hệ thống", icon: "🛡️", isDevOnly: true },
        { href: "/settings", label: "Cài đặt hệ thống", icon: "⚙️" },
      ];

    case "ja":
    default:
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/curriculum", label: "Giáo trình (N5-N2)", icon: "📚" },
        { href: "/exam", label: "Luyện thi JLPT", icon: "📝" },
        { href: "/practice", label: "Luyện chuyên sâu", icon: "🏆" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/notebooks", label: "Sổ tay Tiếng Nhật", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/shadowing", label: "Shadowing Video", icon: "🎬", isDevOnly: true },
        { href: "/kaiwa", label: "Lộ trình Kaiwa", icon: "🗣️", isDevOnly: true },
        { href: "/grammar", label: "Ngữ pháp JLPT", icon: "📖", isDevOnly: true },
        { href: "/kanji", label: "Tập viết Kanji", icon: "🉐", isDevOnly: true },
        { href: "/vocabulary", label: "Kho Từ Vựng Tiếng Nhật", icon: "📝", isDevOnly: true },
        { href: "/admin", label: "Quản trị hệ thống", icon: "🛡️", isDevOnly: true },
        { href: "/practice/ai-voice-room", label: "Phòng Luyện Voice AI", icon: "🎙️", isComingSoon: true, isDevOnly: true },
        { href: "/practice/mock-interview", label: "Phỏng Vấn Xin Việc AI", icon: "💼", isComingSoon: true, isDevOnly: true },
        { href: "/settings", label: "Cài đặt hệ thống", icon: "⚙️" },
      ];
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { activeLanguage, isLanguageChosen } = useLanguageSetting();

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const isAdmin = !!user?.isAdmin;

  const navItems = getNavItemsForLanguage(activeLanguage.code);
  const { isVisible, isItemDevOnly } = useNavMenuSettings();
  const visibleNavItems = navItems.filter((item) => {
    const defaultDev = !!item.isDevOnly || !!item.isComingSoon;
    const isDev = isItemDevOnly(activeLanguage.code, item.href, defaultDev);
    // Items in development are never displayed in the navigation menu
    if (isDev) return false;
    return isVisible(activeLanguage.code, item.href, isAdmin, defaultDev);
  });

  // When no language is chosen, only show minimal items (home + settings)
  const rawDisplayNavItems = isLanguageChosen
    ? visibleNavItems
    : visibleNavItems.filter((item) => item.href === "/" || item.href === "/settings");

  // Ensure "Cài đặt Ngôn ngữ" (/settings) is always placed at the very end of navbar items
  const settingsItem = rawDisplayNavItems.find((item) => item.href === "/settings");
  const otherDisplayItems = rawDisplayNavItems.filter((item) => item.href !== "/settings");
  const displayNavItems = settingsItem
    ? [...otherDisplayItems, settingsItem]
    : rawDisplayNavItems;


  const activeNavItem = navItems.find((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
  );

  useEffect(() => {
    if (activeNavItem && typeof document !== "undefined") {
      document.title = `${activeNavItem.label} | Dland Language`;
    }
  }, [activeNavItem, pathname]);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  useEffect(() => {
    const mainEl = document.getElementById("main-content");
    if (mainEl) {
      if (isCollapsed) {
        mainEl.classList.remove("md:pl-64");
        mainEl.classList.add("md:pl-20");
      } else {
        mainEl.classList.remove("md:pl-20");
        mainEl.classList.add("md:pl-64");
      }
    }
  }, [isCollapsed]);

  const toggleSidebar = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem("sidebar_collapsed", String(newVal));
  };

  const handleSyncClick = () => {
    setShowSyncDialog(true);
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      logout();
    }
  };

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className={`hidden md:flex fixed top-0 left-0 bottom-0 ${isCollapsed ? 'w-20 p-3' : 'w-64 p-5'} bg-white border-r border-gray-200 flex-col justify-between z-30 shadow-2xs transition-all duration-300`}>
        
        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm z-10 text-[10px]"
        >
          {isCollapsed ? "▶" : "◀"}
        </button>

        <div className="flex flex-col flex-1 min-h-0 w-full mb-4">
          {/* Brand Logo */}
          <Link href="/" className={`flex items-center gap-3 mb-6 shrink-0 group ${isCollapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'}`}>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              🌐
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <h1 className="font-extrabold text-gray-900 text-base tracking-tight group-hover:text-indigo-600 transition-colors">
                  Dland Language
                </h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs">{activeLanguage.flag}</span>
                  <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
                    {isLanguageChosen ? activeLanguage.name : "Chọn ngôn ngữ"}
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto flex-1 pr-1 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                {isLanguageChosen ? `Danh mục ${activeLanguage.name}` : "Điều hướng"}
              </div>
            )}
            {/* No language chosen → show banner prompt */}
            {!isLanguageChosen && !isCollapsed && (
              <Link
                href="/"
                className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-700 text-xs font-semibold hover:shadow-sm transition-all mb-1"
              >
                <span className="text-lg">🌐</span>
                <div className="min-w-0">
                  <p className="font-bold text-xs">Chưa chọn ngôn ngữ</p>
                  <p className="text-[10px] text-indigo-400 truncate">Nhấn để xem tổng quan</p>
                </div>
              </Link>
            )}
            {displayNavItems.map((item) => {
              const { href, label, icon } = item;
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href + label}
                  href={href}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                  title={isCollapsed ? label : undefined}
                  className={`flex items-center gap-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base shrink-0">{icon}</span>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between gap-1.5 flex-1 min-w-0">
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="pt-4 border-t border-gray-100 space-y-3 shrink-0">
          {/* Language selector — opens quick language modal */}
          <button
            type="button"
            onClick={() => setShowLangModal(true)}
            title={isCollapsed ? "Cài đặt & Ngôn ngữ" : undefined}
            className={`w-full py-2 rounded-2xl transition text-xs font-semibold flex items-center cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : 'justify-between px-3'
            } ${
              isLanguageChosen
                ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-md shadow-indigo-200'
            }`}
          >
            {isCollapsed ? (
              <span className="text-base">{isLanguageChosen ? activeLanguage.flag : "🌐"}</span>
            ) : (
              <>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="shrink-0">{isLanguageChosen ? activeLanguage.flag : "🌐"}</span>
                  <span className="truncate">{isLanguageChosen ? activeLanguage.name : "Chọn ngôn ngữ"}</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                  isLanguageChosen ? 'bg-indigo-200 text-indigo-800' : 'bg-white/20 text-white'
                }`}>{isLanguageChosen ? "Đổi" : "→"}</span>
              </>
            )}
          </button>

          <button
            onClick={handleSyncClick}
            className={`w-full py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition text-xs font-semibold flex items-center gap-2 ${isCollapsed ? 'justify-center px-0' : 'justify-center px-3'}`}
            title="Đồng bộ dữ liệu"
          >
            <span className="text-base shrink-0">🔄</span>
            {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">Đồng bộ dữ liệu</span>}
          </button>

          {isAuthenticated && user ? (
            <div className={`bg-gray-50 rounded-2xl flex items-center ${isCollapsed ? 'p-2 justify-center' : 'p-3 justify-between'}`}>
              {isCollapsed ? (
                <button
                  onClick={handleLogout}
                  className="text-lg flex items-center justify-center"
                  title="Đăng xuất"
                >
                  👤
                </button>
              ) : (
                <>
                  <div className="truncate pr-2">
                    <p className="text-xs font-bold text-gray-800 truncate">👤 {user.username}</p>
                    <p className="text-[10px] text-gray-400">Đã đăng nhập</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold underline shrink-0"
                  >
                    Thoát
                  </button>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal("Đăng nhập để lưu từ vựng, quản lý sổ tay và đồng bộ tiến độ học tập")}
              className={`w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all text-xs font-extrabold shadow-md shadow-indigo-200 flex items-center justify-center gap-2 active:scale-98 ${isCollapsed ? 'px-0' : 'px-3'}`}
              title="Đăng nhập / Đăng ký tài khoản"
            >
              <span>🔑</span>
              {!isCollapsed && <span className="whitespace-nowrap">Đăng nhập / Đăng ký</span>}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-3.5 h-13 shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-indigo-50 active:bg-indigo-100 text-gray-700 hover:text-indigo-600 flex items-center justify-center text-lg font-bold border border-gray-200 transition-colors shrink-0 cursor-pointer"
            title="Mở menu danh mục"
          >
            ☰
          </button>
          <Link href="/" className="flex items-center gap-1.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs shrink-0">
              🌐
            </span>
            <span className="truncate text-xs font-black text-gray-900 tracking-tight">
              Dland
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* NÚT ĐỔI NGÔN NGỮ NỔI BẬT & DỄ BẤM TRÊN MOBILE */}
          <button
            type="button"
            onClick={() => setShowLangModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 active:scale-95 text-indigo-700 rounded-xl font-black text-xs border border-indigo-200/90 shadow-2xs transition-all cursor-pointer"
            title="Đổi ngôn ngữ học tập"
          >
            <span className="text-base leading-none">{activeLanguage.flag}</span>
            <span className="text-[11px] font-extrabold uppercase">{activeLanguage.code}</span>
            <span className="text-[9px] text-indigo-400 font-bold">▾</span>
          </button>

          <button
            onClick={handleSyncClick}
            className="w-8 h-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center justify-center border border-emerald-200/80 shrink-0 cursor-pointer transition-colors"
            title="Đồng bộ dữ liệu"
          >
            <span>🔄</span>
          </button>

          {isAuthenticated && user ? (
            <button
              onClick={handleLogout}
              className="h-8 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold border border-gray-200/80 flex items-center gap-1 shrink-0 cursor-pointer"
              title={`Đăng xuất (${user.username})`}
            >
              <span>👤</span>
              <span className="max-w-[55px] truncate text-[11px]">{user.username}</span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal("Đăng nhập để lưu từ vựng và đồng bộ tiến độ học tập")}
              className="h-8 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-2xs shrink-0 cursor-pointer transition-colors"
              title="Đăng nhập"
            >
              🔑
            </button>
          )}
        </div>
      </header>

      {/* Mobile Left Sidebar Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-[120] flex animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[82%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col justify-between z-10 transition-transform duration-300">
            <div className="p-4 flex flex-col flex-1 min-h-0">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <Link
                  href="/"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-lg font-bold shadow-md shadow-indigo-200">
                    🌐
                  </div>
                  <div>
                    <h2 className="font-extrabold text-gray-900 text-sm tracking-tight leading-tight">
                      Dland Language
                    </h2>
                    <p className="text-[10px] text-gray-400 font-medium">Học đa ngôn ngữ</p>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                  title="Đóng menu"
                >
                  ✕
                </button>
              </div>

              {/* Language Switcher Card Inside Drawer */}
              <button
                type="button"
                onClick={() => {
                  setShowLangModal(true);
                  setIsMobileDrawerOpen(false);
                }}
                className="w-full mb-3 p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-between text-left hover:shadow-xs transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0">{activeLanguage.flag}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Ngôn ngữ đang học</p>
                    <p className="text-xs font-extrabold text-indigo-950 truncate">
                      {activeLanguage.name} ({activeLanguage.nativeName})
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-1 bg-white text-indigo-600 rounded-lg shadow-3xs shrink-0 border border-indigo-100">
                  Đổi ▾
                </span>
              </button>

              {/* Navigation Items in Drawer */}
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
                {isLanguageChosen ? `Danh mục ${activeLanguage.name}` : "Điều hướng"}
              </div>

              <nav className="space-y-1 overflow-y-auto flex-1 pr-1">
                {displayNavItems.map((item) => {
                  const { href, label, icon } = item;
                  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href + label}
                      href={href}
                      target={item.openInNewTab ? "_blank" : undefined}
                      rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      <span className="text-base shrink-0">{icon}</span>
                      <span className="flex-1 truncate">{label}</span>
                      {isActive && <span className="text-xs font-black">●</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/70 space-y-2 shrink-0">
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  handleSyncClick();
                }}
                className="w-full py-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-xs font-bold flex items-center justify-center gap-2 shadow-3xs cursor-pointer"
              >
                <span>🔄</span>
                <span>Đồng bộ dữ liệu</span>
              </button>

              {isAuthenticated && user ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                      {user.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-gray-800 truncate">{user.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      handleLogout();
                    }}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    openAuthModal("Đăng nhập để lưu từ vựng và đồng bộ tiến độ học tập");
                  }}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition text-xs font-extrabold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🔑</span>
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar: 4 Core Tabs + 1 Drawer Trigger */}
      <nav 
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 flex items-center justify-around w-full h-14 px-1 select-none shadow-lg"
      >
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            pathname === "/" ? "text-indigo-600 font-extrabold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="text-lg leading-none">🏠</span>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Trang chủ</span>
        </Link>

        <Link
          href="/curriculum"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            pathname.startsWith("/curriculum") ? "text-indigo-600 font-extrabold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="text-lg leading-none">📚</span>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Giáo trình</span>
        </Link>

        <Link
          href="/flashcard/all"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            pathname.startsWith("/flashcard") ? "text-indigo-600 font-extrabold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="text-lg leading-none">🎴</span>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Flashcard</span>
        </Link>

        <Link
          href="/notebooks"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            pathname.startsWith("/notebooks") ? "text-indigo-600 font-extrabold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="text-lg leading-none">📓</span>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Sổ tay</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
            isMobileDrawerOpen ? "text-indigo-600 font-extrabold" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <span className="text-lg leading-none">☰</span>
          <span className="text-[10px] mt-0.5 tracking-tight font-semibold">Menu</span>
        </button>
      </nav>

      {/* Sync Dialog */}
      <SyncDialog 
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        onSyncComplete={() => window.location.reload()}
      />

      {/* Language Select Modal Dialog */}
      <LanguageSelectModal
        isOpen={showLangModal}
        onClose={() => setShowLangModal(false)}
      />
    </>
  );
}
