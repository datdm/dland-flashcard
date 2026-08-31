"use client";

import { useState } from "react";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

const LANGUAGES = [
  { code: "auto", name: "Phát hiện ngôn ngữ" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "en", name: "Tiếng Anh" },
  { code: "ja", name: "Tiếng Nhật" },
  { code: "ko", name: "Tiếng Hàn" },
  { code: "zh", name: "Tiếng Trung" },
  { code: "de", name: "Tiếng Đức" },
];

export default function TranslatePage() {
  const { activeLanguage } = useLanguageSetting();
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState(activeLanguage.code === "ja" ? "vi" : activeLanguage.code);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://translation-api-wapd.onrender.com/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: sourceText,
          source: sourceLang,
          target: targetLang,
          format: "text"
        })
      });

      if (!res.ok) {
        throw new Error("Lỗi kết nối đến máy chủ dịch.");
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setTranslatedText(data.translatedText || "");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi dịch văn bản.");
    } finally {
      setLoading(false);
    }
  };

  const swapLanguages = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      {/* Header Banner */}
      <div className={`rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl mb-6 transition-all duration-300 bg-gradient-to-r ${
        activeLanguage.code === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : activeLanguage.code === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">Dịch Văn Bản</h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-2 leading-relaxed">
              Dịch tự động đa ngôn ngữ sử dụng LibreTranslate AI
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xs border border-gray-100 overflow-hidden">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex-1 w-full">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swapLanguages}
            disabled={sourceLang === "auto"}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors shrink-0"
            title="Hoán đổi ngôn ngữ"
          >
            ⇄
          </button>

          <div className="flex-1 w-full">
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full bg-white border border-gray-200 text-gray-800 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
            >
              {LANGUAGES.filter(l => l.code !== "auto").map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Text Areas */}
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="flex-1 p-4 relative group">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Nhập văn bản cần dịch..."
              className="w-full h-64 resize-none border-none bg-transparent text-gray-800 text-lg focus:outline-none focus:ring-0 placeholder-gray-300"
            />
            {sourceText && (
              <button
                onClick={() => setSourceText("")}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-lg"
                title="Xóa văn bản"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex-1 p-4 bg-gray-50/30">
            {loading ? (
              <div className="w-full h-64 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-sm font-semibold text-indigo-500">Đang dịch...</p>
                </div>
              </div>
            ) : error ? (
              <div className="w-full h-64 text-red-500 font-medium p-4 bg-red-50 rounded-2xl border border-red-100">
                {error}
              </div>
            ) : (
              <textarea
                readOnly
                value={translatedText}
                placeholder="Bản dịch sẽ xuất hiện ở đây..."
                className="w-full h-64 resize-none border-none bg-transparent text-gray-800 text-lg focus:outline-none focus:ring-0 placeholder-gray-300"
              />
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || loading}
          className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-95"
        >
          {loading ? "Đang xử lý..." : "Dịch ngay"}
        </button>
      </div>
    </div>
  );
}
