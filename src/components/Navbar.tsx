"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SyncDialog from "./SyncDialog";
import * as syncService from "@/lib/syncService";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/notebooks", label: "Sổ tay", icon: "📓" },
  { href: "/curriculums", label: "Giáo trình", icon: "📚" },
  { href: "/grammar", label: "Ngữ pháp", icon: "📖" },
  { href: "/vocabulary", label: "Từ vựng", icon: "📝" },
  { href: "/flashcard/all", label: "Ôn tập", icon: "🎴" },
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
      {/* Desktop top bar */}
      <header className="hidden sm:flex sticky top-0 z-40 items-center justify-between bg-white border-b border-gray-200 px-6 h-14 shadow-sm">
        <Link href="/" className="font-bold text-indigo-700 text-lg tracking-tight">
          FlashCash
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncClick}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-medium flex items-center gap-1"
            title="Đồng bộ dữ liệu"
          >
            <span>🔄</span>
            <span className="hidden md:inline">Đồng bộ dữ liệu</span>
          </button>
          {isAuthenticated && user && (
            <>
            <span className="text-sm text-gray-600 px-2">👤 {user.username}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm"
                title="Đăng xuất"
              >
                Đăng xuất
              </button>
            </>
          )}
        </div>
      </header>

      {/* Mobile top title */}
      <header className="sm:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 h-12 shadow-sm">
        <Link href="/" className="font-bold text-indigo-700">
          FlashCash
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncClick}
            className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm"
            title="Đồng bộ"
          >
            🔄
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

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 flex h-14">
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            aria-label={label}
            title={label}
            className={`flex flex-1 items-center justify-center py-2 transition-colors ${
              pathname === href
                ? "text-indigo-700"
                : "text-gray-500 hover:text-indigo-600"
            }`}
          >
            <span className="text-xl leading-none">{icon}</span>
          </Link>
        ))}
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

