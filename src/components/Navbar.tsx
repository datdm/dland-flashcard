"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import SyncDialog from "./SyncDialog";
import * as syncService from "@/lib/syncService";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

function getNavItemsForLanguage(langCode: string): NavItem[] {
  switch (langCode) {
    case "en":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/chat", label: "Gia Sư AI", icon: "🤖" },
        { href: "/curriculum", label: "Giáo trình (Oxford/IELTS)", icon: "📚" },
        { href: "/grammar", label: "Ngữ pháp Tiếng Anh", icon: "📖" },
        { href: "/vocabulary", label: "Từ vựng Oxford 3000", icon: "📝" },
        { href: "/notebooks", label: "Sổ tay cá nhân", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/settings", label: "Cài đặt & Ngôn ngữ", icon: "⚙️" },
      ];

    case "de":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/chat", label: "Gia Sư AI", icon: "🤖" },
        { href: "/curriculum", label: "Giáo trình (Goethe A1-B2)", icon: "📚" },
        { href: "/grammar", label: "Ngữ pháp Der/Die/Das", icon: "📖" },
        { href: "/vocabulary", label: "Từ vựng Tiếng Đức", icon: "📝" },
        { href: "/notebooks", label: "Sổ tay cá nhân", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/settings", label: "Cài đặt & Ngôn ngữ", icon: "⚙️" },
      ];

    case "ko":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/chat", label: "Gia Sư AI", icon: "🤖" },
        { href: "/curriculum", label: "Giáo trình (TOPIK)", icon: "📚" },
        { href: "/grammar", label: "Ngữ pháp Hangul", icon: "📖" },
        { href: "/vocabulary", label: "Từ vựng Tiếng Hàn", icon: "📝" },
        { href: "/notebooks", label: "Sổ tay cá nhân", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/settings", label: "Cài đặt & Ngôn ngữ", icon: "⚙️" },
      ];

    case "zh":
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/chat", label: "Gia Sư AI", icon: "🤖" },
        { href: "/curriculum", label: "Giáo trình (HSK 1-6)", icon: "📚" },
        { href: "/grammar", label: "Ngữ pháp Pinyin", icon: "📖" },
        { href: "/vocabulary", label: "Từ vựng Tiếng Trung", icon: "📝" },
        { href: "/notebooks", label: "Sổ tay cá nhân", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/settings", label: "Cài đặt & Ngôn ngữ", icon: "⚙️" },
      ];

    case "ja":
    default:
      return [
        { href: "/", label: "Trang chủ", icon: "🏠" },
        { href: "/search", label: "Tra cứu từ điển", icon: "🔍" },
        { href: "/translate", label: "Dịch văn bản", icon: "🌐" },
        { href: "/chat", label: "Gia Sư AI", icon: "🤖" },
        { href: "/kaiwa", label: "Lộ trình Kaiwa", icon: "🗣️" },
        { href: "/curriculum", label: "Giáo trình (N5-N2)", icon: "📚" },
        { href: "/grammar", label: "Ngữ pháp JLPT", icon: "📖" },
        { href: "/vocabulary", label: "Từ vựng tiếng Nhật", icon: "📝" },
        { href: "/notebooks", label: "Sổ tay cá nhân", icon: "📓" },
        { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/settings", label: "Cài đặt & Ngôn ngữ", icon: "⚙️" },
      ];
  }
}

export default function Navbar() {
  const pathname = usePathname();
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activeLanguage } = useLanguageSetting();
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mobileNavRef.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const onMouseDown = (e: MouseEvent) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
    };

    const onMouseUp = () => {
      isDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    };

    // Touch drag scroll support
    let isTouchDown = false;
    let startTouchX: number;
    let touchScrollLeft: number;

    const onTouchStart = (e: TouchEvent) => {
      isTouchDown = true;
      startTouchX = e.touches[0].pageX - el.offsetLeft;
      touchScrollLeft = el.scrollLeft;
    };

    const onTouchEnd = () => {
      isTouchDown = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchDown) return;
      const x = e.touches[0].pageX - el.offsetLeft;
      const walk = (x - startTouchX) * 1.2;
      el.scrollLeft = touchScrollLeft - walk;
    };

    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseup", onMouseUp);
    el.addEventListener("mousemove", onMouseMove);

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("mousemove", onMouseMove);

      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

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

  const navItems = getNavItemsForLanguage(activeLanguage.code);

  const handleSyncClick = () => {
    setShowSyncDialog(true);
  };

  const handleLogout = () => {
    if (confirm("Bạn có chắc muốn đăng xuất?")) {
      syncService.logout();
      window.location.reload();
    }
  };

  const isAuthenticated = syncService.checkAuthStatus();
  const user = syncService.getUser();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className={`hidden md:flex fixed top-0 left-0 bottom-0 ${isCollapsed ? 'w-20 p-3' : 'w-64 p-5'} bg-white border-r border-gray-200 flex-col justify-between z-40 shadow-2xs transition-all duration-300`}>
        
        {/* Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 shadow-sm z-50 text-[10px]"
        >
          {isCollapsed ? "▶" : "◀"}
        </button>

        <div>
          {/* Brand Logo */}
          <Link href="/" className={`flex items-center gap-3 mb-6 group ${isCollapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'}`}>
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
                    {activeLanguage.name}
                  </span>
                </div>
              </div>
            )}
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Danh mục {activeLanguage.name}
              </div>
            )}
            {navItems.map(({ href, label, icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href + label}
                  href={href}
                  title={isCollapsed ? label : undefined}
                  className={`flex items-center gap-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    isCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base shrink-0">{icon}</span>
                  {!isCollapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <Link
            href="/settings"
            title={isCollapsed ? "Cài đặt & Ngôn ngữ" : undefined}
            className={`w-full py-2 bg-indigo-50 text-indigo-700 rounded-2xl hover:bg-indigo-100 transition text-xs font-semibold flex items-center ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'}`}
          >
            {isCollapsed ? (
              <span className="text-base">{activeLanguage.flag}</span>
            ) : (
              <>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className="shrink-0">{activeLanguage.flag}</span>
                  <span className="truncate">{activeLanguage.name}</span>
                </div>
                <span className="text-[10px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded-md font-bold shrink-0">Đổi</span>
              </>
            )}
          </Link>

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
            !isCollapsed && (
              <div className="text-[11px] text-gray-400 text-center px-1">
                Lưu dữ liệu local & hỗ trợ Postgres
              </div>
            )
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-12 shadow-2xs">
        <Link href="/" className="font-bold text-indigo-700 text-sm flex items-center gap-1.5">
          <span>🌐</span> Dland Language
          <span className="text-xs px-1.5 py-0.5 bg-indigo-50 rounded-md text-indigo-600 font-normal">
            {activeLanguage.flag} {activeLanguage.name}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncClick}
            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1"
            title="Đồng bộ"
          >
            <span>🔄</span>
          </button>
          {isAuthenticated && user && (
            <button
              onClick={handleLogout}
              className="px-2 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs"
              title="Đăng xuất"
            >
              👤 Đăng xuất
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        ref={mobileNavRef}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex flex-nowrap h-14 overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2 touch-pan-x [webkit-overflow-scrolling:touch] cursor-grab active:cursor-grabbing select-none"
      >
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href + label}
              href={href}
              aria-label={label}
              title={label}
              className={`flex flex-col items-center justify-center py-1 px-3 shrink-0 min-w-[68px] transition-colors ${
                isActive
                  ? "text-indigo-700 font-bold"
                  : "text-gray-400 hover:text-indigo-600"
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sync Dialog */}
      <SyncDialog 
        isOpen={showSyncDialog}
        onClose={() => setShowSyncDialog(false)}
        onSyncComplete={() => window.location.reload()}
      />
    </>
  );
}
