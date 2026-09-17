"use client";

import { useEffect, useState } from "react";

interface QuickTranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
}

export default function QuickTranslateModal({
  isOpen,
  onClose,
  text,
}: QuickTranslateModalProps) {
  const [loading, setLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("vi");
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState("");

  useEffect(() => {
    if (!isOpen || !text) return;
    setEditableText(text);
    translateText(text, sourceLang, targetLang);
  }, [isOpen, text]);

  const translateText = async (q: string, src: string, tgt: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setTranslatedText("");
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: q.trim(),
          source: src,
          target: tgt,
          format: "text",
        }),
      });

      if (!res.ok) throw new Error("Lỗi dịch văn bản");
      const data = await res.json();
      setTranslatedText(data.translatedText || "Không thể dịch văn bản");
    } catch (err) {
      console.error("Translate error:", err);
      setTranslatedText("Đã xảy ra lỗi khi dịch văn bản. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const playSpeech = (t: string, lang: string = "ja-JP") => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <div>
              <h3 className="font-extrabold text-sm">Dịch Văn Bản Sang Tiếng Việt</h3>
              <p className="text-[10px] text-teal-100 font-medium">Tự động nhận diện ngôn ngữ • Dịch AI chính xác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Language Selector Bar */}
          <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200">
            <select
              value={sourceLang}
              onChange={(e) => {
                setSourceLang(e.target.value);
                translateText(editableText, e.target.value, targetLang);
              }}
              className="flex-1 bg-white border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="auto">⚡ Tự động nhận diện</option>
              <option value="ja">🇯🇵 Tiếng Nhật</option>
              <option value="en">🇬🇧 Tiếng Anh</option>
              <option value="de">🇩🇪 Tiếng Đức</option>
              <option value="ko">🇰🇷 Tiếng Hàn</option>
              <option value="zh">🇨🇳 Tiếng Trung</option>
            </select>

            <span className="text-gray-400 font-bold">➔</span>

            <select
              value={targetLang}
              onChange={(e) => {
                setTargetLang(e.target.value);
                translateText(editableText, sourceLang, e.target.value);
              }}
              className="flex-1 bg-white border border-gray-200 text-gray-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="vi">🇻🇳 Tiếng Việt</option>
              <option value="en">🇬🇧 Tiếng Anh</option>
              <option value="ja">🇯🇵 Tiếng Nhật</option>
            </select>
          </div>

          {/* Source Text Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Văn bản gốc:
              </label>
              <button
                onClick={() => playSpeech(editableText, sourceLang === "en" ? "en-US" : "ja-JP")}
                className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                🔊 Nghe
              </button>
            </div>
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              onBlur={() => translateText(editableText, sourceLang, targetLang)}
              rows={3}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y"
              placeholder="Nhập hoặc chỉnh sửa văn bản gốc..."
            />
          </div>

          {/* Translation Result Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                Bản dịch Tiếng Việt:
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => playSpeech(translatedText, "vi-VN")}
                  disabled={!translatedText}
                  className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  🔊 Nghe
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!translatedText}
                  className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  {copied ? "✅ Đã chép!" : "📋 Sao chép"}
                </button>
              </div>
            </div>

            <div className="p-4 bg-teal-50/50 border border-teal-200/60 rounded-2xl min-h-[90px] text-sm font-bold text-gray-900 leading-relaxed whitespace-pre-line">
              {loading ? (
                <div className="flex items-center gap-2 text-teal-600 text-xs font-bold py-2">
                  <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                  <span>Đang dịch văn bản...</span>
                </div>
              ) : (
                translatedText || <span className="text-gray-400 font-normal">Kết quả dịch sẽ hiện ở đây...</span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
          <a
            href="/translate"
            target="_blank"
            className="text-xs font-extrabold text-teal-600 hover:text-teal-800 flex items-center gap-1 transition-colors"
          >
            <span>🌐 Mở trang Dịch văn bản đầy đủ</span>
            <span>↗</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => translateText(editableText, sourceLang, targetLang)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              ⚡ Dịch lại
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
