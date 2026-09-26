"use client";

import React from "react";
import Link from "next/link";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  extraQuickLinks?: { label: string; href: string; icon: string }[];
}

export default function BreadcrumbNav({ items, extraQuickLinks }: BreadcrumbNavProps) {
  const { activeLanguage } = useLanguageSetting();
  const langCode = activeLanguage.code;

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
      {/* Breadcrumb Path */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 flex-wrap">
        <Link
          href="/"
          className="hover:text-indigo-600 transition-colors flex items-center gap-1 font-bold text-gray-600 hover:underline"
        >
          <span>🏠</span>
          <span>Trang chủ</span>
        </Link>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <span className="text-gray-300 font-normal">/</span>
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-indigo-600 transition-colors font-bold text-gray-600 hover:underline flex items-center gap-1"
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className="text-indigo-600 font-extrabold flex items-center gap-1">
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Quick Jump Links Bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Link
          href="/flashcard/all"
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200/90 hover:border-indigo-400 hover:text-indigo-600 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1 sm:gap-1.5 active:scale-98"
        >
          <span>🎴</span>
          <span className="hidden xs:inline">Ôn </span>Flashcard
        </Link>
        <Link
          href="/curriculum"
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200/90 hover:border-indigo-400 hover:text-indigo-600 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1 sm:gap-1.5 active:scale-98"
        >
          <span>📚</span>
          <span>Giáo trình</span>
        </Link>
        {langCode === "ja" && (
          <>
            <Link
              href="/exam"
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200/90 hover:border-indigo-400 hover:text-indigo-600 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1 sm:gap-1.5 active:scale-98"
            >
              <span>📝</span>
              <span>Luyện Thi JLPT</span>
            </Link>
            <Link
              href="/kanji"
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200/90 hover:border-indigo-400 hover:text-indigo-600 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1 sm:gap-1.5 active:scale-98"
            >
              <span>🉐</span>
              <span>Kho Kanji</span>
            </Link>
          </>
        )}
        <Link
          href="/notebooks"
          className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200/90 hover:border-indigo-400 hover:text-indigo-600 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1 sm:gap-1.5 active:scale-98"
        >
          <span>📓</span>
          <span>Sổ tay</span>
        </Link>
        {extraQuickLinks &&
          extraQuickLinks.map((link, idx) => (
            <Link
              key={idx}
              href={link.href}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white border border-gray-200/90 hover:border-indigo-400 hover:text-indigo-600 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-3xs flex items-center gap-1 sm:gap-1.5 active:scale-98"
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
      </div>
    </div>
  );
}
