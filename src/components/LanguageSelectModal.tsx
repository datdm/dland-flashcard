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
  const { activeLangCode, isLanguageChosen, saveLanguage } = useLanguageSetting();

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    }
    setInternalIsOpen(false);
  };

  const handleBackToHome = () => {
    handleClose();
    router.push("/");
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
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-2xl shadow-md shadow-indigo-200">
              🌐
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 tracking-tight">Chọn Ngôn Ngữ Học Tập</h2>
              <p className="text-xs text-gray-500 mt-0.5">Thay đổi ngôn ngữ mục tiêu của bạn</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Description Banner */}
        <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-800 leading-relaxed font-medium">
          💡 Hệ thống sẽ tự động cập nhật lại toàn bộ lộ trình giáo trình, bài học, từ vựng, ngữ pháp và trợ lý AI phù hợp với ngôn ngữ bạn chọn.
        </div>

        {/* Language Options Grid */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = lang.code === activeLangCode;
            const isComingSoon = lang.status === "coming_soon";

            return (
              <button
                key={lang.code}
                disabled={isComingSoon || isSaving}
                onClick={() => handleSelectLanguage(lang)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isComingSoon
                    ? "bg-gray-50/60 border-gray-150 opacity-60 cursor-not-allowed"
                    : isActive
                    ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs cursor-pointer"
                    : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="text-3xl shrink-0">{lang.flag}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-gray-900">{lang.name}</span>
                      <span className="text-xs text-gray-400 font-mono">({lang.nativeName})</span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5 font-medium">{lang.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {lang.levels.map((lvl) => (
                        <span key={lvl} className="px-1.5 py-0.2 bg-gray-100 border border-gray-200 text-gray-600 text-[9px] font-extrabold rounded-md">
                          {lvl}
                        </span>
                      ))}
                    </div>
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
          <div className="pt-2 border-t border-gray-100">
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
