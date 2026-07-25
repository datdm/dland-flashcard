"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SyncDialog from "./SyncDialog";
import * as syncService from "@/lib/syncService";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/search", label: "Tra cứu", icon: "🔍" },
  { href: "/curriculum", label: "Giáo trình (N5-N2)", icon: "📚" },
  { href: "/grammar", label: "Ngữ pháp", icon: "📖" },
  { href: "/kanji", label: "Kanji SVG", icon: "🉐" },
  { href: "/vocabulary", label: "Từ vựng", icon: "📝" },
  { href: "/flashcard/all", label: "Ôn tập Flashcard", icon: "🎴" },
  { href: "/settings", label: "Cài đặt", icon: "⚙️" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [showSyncDialog, setShowSyncDialog] = useState(false);

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
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 flex-col justify-between p-5 z-40 shadow-2xs">
        <div>
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 px-3 py-2 mb-6 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              🌸
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-base tracking-tight group-hover:text-indigo-600 transition-colors">
                FlashCash
              </h1>
              <p className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">JLPT N5 ➔ N2</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 mb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Danh mục học
            </div>
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Sidebar Footer */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <button
            onClick={handleSyncClick}
            className="w-full px-3 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-100 transition text-xs font-semibold flex items-center justify-center gap-2"
            title="Đồng bộ dữ liệu"
          >
            <span className="text-base">🔄</span>
            <span>Đồng bộ dữ liệu</span>
          </button>

          {isAuthenticated && user ? (
            <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between">
              <div className="truncate">
                <p className="text-xs font-bold text-gray-800 truncate">👤 {user.username}</p>
                <p className="text-[10px] text-gray-400">Đã đăng nhập</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 hover:text-red-700 font-semibold underline ml-2 shrink-0"
              >
                Thoát
              </button>
            </div>
          ) : (
            <div className="text-[11px] text-gray-400 text-center">
              Lưu dữ liệu local & hỗ trợ Postgres
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-12 shadow-2xs">
        <Link href="/" className="font-bold text-indigo-700 text-sm flex items-center gap-2">
          <span>🌸</span> FlashCash N5-N2
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
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex h-14">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={`flex flex-1 flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? "text-indigo-700 font-bold"
                  : "text-gray-400 hover:text-indigo-600"
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] mt-0.5">{label.split(" ")[0]}</span>
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
