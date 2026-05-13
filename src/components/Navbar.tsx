"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ", icon: "🏠" },
  { href: "/notebooks", label: "Sổ tay", icon: "📓" },
  { href: "/curriculums", label: "Giáo trình", icon: "📚" },
  { href: "/grammar", label: "Ngữ pháp", icon: "📖" },
  { href: "/vocabulary", label: "Từ vựng", icon: "📕" },
  { href: "/flashcard/all", label: "Ôn tập", icon: "🃏" },
  { href: "/upload", label: "Upload", icon: "📤" },
];

export default function Navbar() {
  const pathname = usePathname();

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
      </header>

      {/* Mobile top title */}
      <header className="sm:hidden sticky top-0 z-40 flex items-center bg-white border-b border-gray-200 px-4 h-12 shadow-sm">
        <Link href="/" className="font-bold text-indigo-700">
          FlashCash
        </Link>
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
    </>
  );
}
