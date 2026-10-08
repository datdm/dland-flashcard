"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES, useLanguageSetting, LanguageOption } from "@/hooks/useLanguageSetting";

interface LanguageSelectModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function LanguageSelectModal({
  isOpen: externalIsOpen,
  onClose: externalOnClose,
}: LanguageSelectModalProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { activeLangCode, isLanguageChosen, saveLanguage, resetLanguage } = useLanguageSetting();

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    }
    setInternalIsOpen(false);
  };

  const handleBackToHome = () => {
    handleClose();
    resetLanguage();
  };

  useEffect(() => {
    const handleOpenModal = () => {
      setInternalIsOpen(true);
    };

    window.addEventListener("open-language-modal", handleOpenModal);
    return () => {
      window.removeEventListener("open-language-modal", handleOpenModal);
    };
  }, []);

  // Lock background body scroll while modal is active
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectLanguage = async (lang: LanguageOption) => {
    if (lang.status === "coming_soon") return;
    if (lang.code === activeLangCode) {
      handleClose();
      return;
    }

    setIsSaving(true);
    await saveLanguage(lang.code);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-3 sm:space-y-3.5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-xl shadow-md shadow-indigo-200 shrink-0">
              🌐
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Chọn Ngôn Ngữ Học Tập</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Thay đổi ngôn ngữ mục tiêu của bạn</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Đóng bảng chọn ngôn ngữ"
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Description Banner */}
        <div className="px-3 py-2 bg-indigo-50/70 border border-indigo-100/80 rounded-xl text-[11px] text-indigo-900 leading-relaxed font-medium flex items-center gap-2">
          <span className="text-sm shrink-0">💡</span>
          <span>Hệ thống tự động đồng bộ giáo trình, từ vựng và trợ lý AI theo ngôn ngữ bạn chọn.</span>
        </div>

        {/* Language Options Grid - Fits completely on screen without scrolling */}
        <div className="space-y-2 no-scrollbar">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = lang.code === activeLangCode;
            const isComingSoon = lang.status === "coming_soon";

            return (
              <button
                key={lang.code}
                disabled={isComingSoon || isSaving}
                onClick={() => handleSelectLanguage(lang)}
                className={`w-full text-left p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isComingSoon
                    ? "bg-gray-50/60 border-gray-150 opacity-60 cursor-not-allowed"
                    : isActive
                    ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs cursor-pointer"
                    : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 text-base sm:text-lg font-black border ${
                    isActive 
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xs" 
                      : isComingSoon
                      ? "bg-gray-100 text-gray-400 border-gray-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}>
                    {lang.flag}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900">{lang.name}</span>
                      <span className="text-[11px] text-gray-400 font-medium">({lang.nativeName})</span>
                      {lang.levels.length > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-gray-100 text-gray-600 border border-gray-200/60 hidden sm:inline-block">
                          {lang.levels[0]} ➔ {lang.levels[lang.levels.length - 1]}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium leading-tight">{lang.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isComingSoon ? (
                    <span className="px-2.5 py-1 bg-gray-200 text-gray-600 text-[10px] font-extrabold rounded-xl uppercase">
                      Sắp có
                    </span>
                  ) : isActive ? (
                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1">
                      ✓ Đang học
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-700 text-xs font-extrabold rounded-xl transition-all">
                      Chọn →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {isSaving ? (
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 animate-pulse pt-1">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang lưu cài đặt ngôn ngữ...</span>
          </div>
        ) : (
          <div className="pt-1.5 border-t border-gray-100">
            <button
              type="button"
              onClick={handleBackToHome}
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-3xs"
            >
              <span>🏠</span>
              <span>Quay lại trang chủ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
