"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import AddToNotebookModal from "@/components/AddToNotebookModal";
import { Vocabulary } from "@/types";

interface WordBreakdownItem {
  word: string;
  reading?: string;
  romaji?: string;
  pos?: string;
  meaning: string;
  level?: string;
}

interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
}



const ALL_LANGUAGES = [
  { code: "auto", name: "⚡ Tự động nhận diện" },
  { code: "vi", name: "🇻🇳 Tiếng Việt (Vietnamese)" },
  { code: "en", name: "🇬🇧 Tiếng Anh (English)" },
  { code: "ja", name: "🇯🇵 Tiếng Nhật (Japanese)" },
  { code: "de", name: "🇩🇪 Tiếng Đức (German)" },
  { code: "ko", name: "🇰🇷 Tiếng Hàn (Korean)" },
  { code: "zh", name: "🇨🇳 Tiếng Trung (Chinese)" },
  { code: "fr", name: "🇫🇷 Tiếng Pháp (French)" },
  { code: "es", name: "🇪🇸 Tiếng Tây Ban Nha (Spanish)" },
  { code: "ru", name: "🇷🇺 Tiếng Nga (Russian)" },
  { code: "it", name: "🇮🇹 Tiếng Ý (Italian)" },
  { code: "th", name: "🇹🇭 Tiếng Thái (Thai)" },
];

const SAMPLE_TEXTS: Record<string, string[]> = {
  ja: [
    "私は毎朝日本語を一生懸命勉強しています。",
    "お忙しいところ恐れ入りますが、ご確認のほどよろしくお願いいたします。",
    "週末はどこか旅行へ行く予定がありますか。",
  ],
  en: [
    "Practice makes perfect when learning a new language.",
    "Could you please explain how to improve my listening comprehension?",
    "Consistency is the key to mastering vocabulary.",
  ],
  de: [
    "Übung macht den Meister beim Sprachenlernen.",
    "Guten Tag, können Sie mir bitte den Weg zum Bahnhof zeigen?",
  ],
};

const STORAGE_KEY = "dland_translate_history";

export default function TranslatePage() {
  const { activeLanguage } = useLanguageSetting();

  // Translation State - Default: Auto detect to Vietnamese
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [romanization, setRomanization] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("vi");
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("google-gtx");
  const [loading, setLoading] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [words, setWords] = useState<WordBreakdownItem[]>([]);

  // Toggles & Preferences
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [copied, setCopied] = useState(false);

  // Notebook Modal
  const [selectedWordForNotebook, setSelectedWordForNotebook] = useState<Partial<Vocabulary> | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Debounce ref
  const debounceTimerRef = useRef<any>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved).slice(0, 15));
      }
    } catch (e) {
      console.warn("Failed to load history:", e);
    }
  }, []);

  const saveToHistory = useCallback(
    (src: string, trans: string, sLang: string, tLang: string) => {
      if (!src.trim() || !trans.trim()) return;
      const newItem: HistoryItem = {
        id: `trans-${Date.now()}`,
        sourceText: src.trim(),
        translatedText: trans.trim(),
        sourceLang: sLang,
        targetLang: tLang,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.sourceText !== newItem.sourceText);
        const updated = [newItem, ...filtered].slice(0, 15);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.warn("Failed to save history:", e);
        }
        return updated;
      });
    },
    []
  );

  // Core Translate Function
  const executeTranslate = useCallback(
    async (textToTranslate: string, sLang: string, tLang: string, withBreakdown: boolean) => {
      if (!textToTranslate.trim()) {
        setTranslatedText("");
        setRomanization(null);
        setWords([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: textToTranslate.trim(),
            source: sLang,
            target: tLang,
            includeBreakdown: withBreakdown && textToTranslate.trim().length <= 400,
          }),
        });

        if (!res.ok) {
          throw new Error("Lỗi kết nối đến máy chủ dịch.");
        }

        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setTranslatedText(data.translatedText || "");
        setDetectedSource(data.detectedSource || null);
        setRomanization(data.romanization || null);
        setProvider(data.provider || "google-gtx");

        if (data.words && Array.isArray(data.words)) {
          setWords(data.words);
        } else {
          setWords([]);
        }

        // Save to history
        saveToHistory(textToTranslate, data.translatedText || "", data.detectedSource || sLang, tLang);
      } catch (err: any) {
        console.error("Translation error:", err);
        setError(err.message || "Đã xảy ra lỗi khi dịch văn bản.");
      } finally {
        setLoading(false);
      }
    },
    [saveToHistory]
  );

  // Manual Trigger for Breakdown
  const fetchWordBreakdown = async () => {
    if (!sourceText.trim()) return;
    setBreakdownLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: sourceText.trim(),
          source: sourceLang,
          target: targetLang,
          includeBreakdown: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.words && Array.isArray(data.words)) {
          setWords(data.words);
          setShowBreakdown(true);
        }
      }
    } catch (e) {
      console.warn("Breakdown fetch error:", e);
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Real-time Auto-Translate Effect (Debounce 450ms)
  useEffect(() => {
    if (!autoTranslate) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!sourceText.trim()) {
      setTranslatedText("");
      setRomanization(null);
      setWords([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTranslate(sourceText, sourceLang, targetLang, showBreakdown);
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sourceText, sourceLang, targetLang, autoTranslate, showBreakdown, executeTranslate]);

  // Swap Languages
  const swapLanguages = () => {
    const newSource = targetLang;
    const fallbackTarget = newSource === "vi" ? "en" : "vi";
    const newTarget = sourceLang === "auto" ? (detectedSource || fallbackTarget) : sourceLang;
    const newSourceText = translatedText;
    const newTranslatedText = sourceText;

    setSourceLang(newSource);
    setTargetLang(newTarget);
    setSourceText(newSourceText);
    setTranslatedText(newTranslatedText);
    setRomanization(null);
    setWords([]);

    if (newSourceText.trim()) {
      executeTranslate(newSourceText, newSource, newTarget, showBreakdown);
    }
  };

  // Text to Speech
  const playSpeech = (text: string, langCode: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Map langCode to locale
    const localeMap: Record<string, string> = {
      ja: "ja-JP",
      en: "en-US",
      vi: "vi-VN",
      de: "de-DE",
      ko: "ko-KR",
      zh: "zh-CN",
      fr: "fr-FR",
      es: "es-ES",
      ru: "ru-RU",
      it: "it-IT",
      th: "th-TH",
    };
    utterance.lang = localeMap[langCode] || "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Copy to Clipboard
  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Paste from Clipboard
  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setSourceText(clipText);
      }
    } catch (e) {
      console.warn("Cannot paste from clipboard:", e);
    }
  };

  // Clear Source Text
  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
    setRomanization(null);
    setWords([]);
    setError(null);
  };

  // Keyboard shortcut listener (Ctrl+Enter to translate)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeTranslate(sourceText, sourceLang, targetLang, showBreakdown);
    }
  };

  const getLanguageName = (code: string) => {
    const found = ALL_LANGUAGES.find((l) => l.code === code);
    return found ? found.name.replace(/^[^\s]+\s/, "") : code.toUpperCase();
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-12">
      {/* Breadcrumb Bar */}
      <BreadcrumbNav items={[{ label: "Dịch Văn Bản AI", icon: "🌐" }]} />

      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 flex items-center justify-center text-white shadow-md text-xl shrink-0">
            🌐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Dịch Văn Bản Tiện Ích (Extension Style)
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Tự động dịch tức thì khi gõ, hỗ trợ phát âm chuẩn bản xứ và bẻ khóa phân tích từ vựng chi tiết
            </p>
          </div>
        </div>

        {/* Feature Switches */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100/80 cursor-pointer transition-colors text-xs font-bold text-gray-700 select-none">
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>⚡ Tự động dịch khi gõ</span>
          </label>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100/80 cursor-pointer transition-colors text-xs font-bold text-gray-700 select-none">
            <input
              type="checkbox"
              checked={showBreakdown}
              onChange={(e) => setShowBreakdown(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>🔍 Phân tích từ vựng</span>
          </label>
        </div>
      </div>

      {/* Main Translation Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {/* Language Selector Header Bar */}
        <div className="bg-slate-50/80 p-2.5 sm:p-3.5 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2 sm:gap-4 max-w-4xl mx-auto">
            {/* Source Language Select Box */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] sm:text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">
                Ngôn ngữ nguồn
              </label>
              <div className="relative">
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-150 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-800 transition-all cursor-pointer shadow-3xs outline-none appearance-none pr-8 truncate"
                >
                  {ALL_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="shrink-0 pt-4">
              <button
                type="button"
                onClick={swapLanguages}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/70 text-gray-600 hover:text-indigo-600 flex items-center justify-center shadow-3xs transition-all cursor-pointer active:scale-95 text-base active:rotate-180 duration-200"
                title="Hoán đổi ngôn ngữ nguồn và đích"
              >
                ⇄
              </button>
            </div>

            {/* Target Language Select Box */}
            <div className="flex-1 min-w-0">
              <label className="text-[10px] sm:text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mb-1 block">
                Dịch sang
              </label>
              <div className="relative">
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-white border border-gray-200 hover:border-indigo-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-150 rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-800 transition-all cursor-pointer shadow-3xs outline-none appearance-none pr-8 truncate"
                >
                  {ALL_LANGUAGES.filter((l) => l.code !== "auto").map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Translation Split Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 min-h-[320px]">
          {/* Left Column: Source Input */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3 relative group">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase tracking-wider text-[11px] text-gray-500">
                  {sourceLang === "auto"
                    ? detectedSource
                      ? `Phát hiện: ${getLanguageName(detectedSource)}`
                      : "Tự động nhận diện"
                    : getLanguageName(sourceLang)}
                </span>
                {loading && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                    Đang dịch...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {sourceText && (
                  <span className="text-[11px] font-mono text-gray-400">
                    {sourceText.length.toLocaleString()} ký tự
                  </span>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2 py-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                  title="Dán từ Clipboard"
                >
                  📋 Dán
                </button>
                {sourceText && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-xs transition-colors cursor-pointer"
                    title="Xóa văn bản (Esc)"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Input Textarea */}
            <div className="flex-1 flex flex-col justify-start">
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập hoặc dán văn bản cần dịch tại đây... (Nhấn Ctrl + Enter để dịch ngay)"
                className="w-full min-h-[160px] sm:min-h-[200px] resize-none border-none bg-transparent text-gray-900 text-base sm:text-lg leading-relaxed focus:outline-none focus:ring-0 placeholder-gray-300 font-medium"
              />

              {/* Romanization / Furigana display */}
              {romanization && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono text-slate-600">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Phiên âm La-tinh (Romaji):
                  </span>
                  {romanization}
                </div>
              )}
            </div>

            {/* Bottom Toolbar: Audio & Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!sourceText.trim()}
                  onClick={() => playSpeech(sourceText, detectedSource || sourceLang)}
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 text-gray-600 text-sm transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-3xs"
                  title="Nghe phát âm bản gốc (TTS)"
                >
                  🔊
                </button>
                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                  Mẹo: Nhấn Ctrl + Enter để dịch tức thì
                </span>
              </div>

              {!autoTranslate && (
                <button
                  type="button"
                  onClick={() => executeTranslate(sourceText, sourceLang, targetLang, showBreakdown)}
                  disabled={!sourceText.trim() || loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {loading ? "Đang dịch..." : "Dịch ngay"}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Target Output */}
          <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3 bg-gray-50/30">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold uppercase tracking-wider text-[11px] text-gray-700">
                  {getLanguageName(targetLang)}
                </span>
                {provider && (
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-teal-50 text-teal-700 border border-teal-200/80">
                    {provider === "google-gtx" ? "⚡ Google Neural AI" : provider}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {translatedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWordForNotebook({
                        kanji: sourceText.slice(0, 100),
                        meaning: translatedText.slice(0, 200),
                        hiragana: romanization || "",
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                    title="Lưu bản dịch vào Sổ tay từ vựng"
                  >
                    ⭐ Lưu Sổ tay
                  </button>
                )}
              </div>
            </div>

            {/* Translation Output Area */}
            <div className="flex-1 flex flex-col justify-start">
              {loading && !translatedText ? (
                <div className="h-44 flex flex-col items-center justify-center space-y-3 text-gray-400">
                  <div className="w-7 h-7 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-xs font-semibold text-indigo-500">Đang tạo bản dịch AI...</p>
                </div>
              ) : error ? (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                  <p className="font-bold">⚠️ Không thể hoàn thành bản dịch</p>
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => executeTranslate(sourceText, sourceLang, targetLang, showBreakdown)}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={translatedText}
                  placeholder="Bản dịch sẽ xuất hiện tự động tại đây..."
                  className="w-full min-h-[160px] sm:min-h-[200px] resize-none border-none bg-transparent text-gray-900 text-base sm:text-lg leading-relaxed focus:outline-none focus:ring-0 placeholder-gray-300 font-semibold"
                />
              )}
            </div>

            {/* Bottom Toolbar: Audio, Copy, Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!translatedText}
                  onClick={() => playSpeech(translatedText, targetLang)}
                  className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 text-gray-600 text-sm transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-3xs"
                  title="Nghe phát âm bản dịch (TTS)"
                >
                  🔊
                </button>

                <button
                  type="button"
                  disabled={!translatedText}
                  onClick={handleCopy}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs ${
                    copied
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                  }`}
                  title="Sao chép bản dịch vào bộ nhớ tạm"
                >
                  <span>{copied ? "✓" : "📋"}</span>
                  <span>{copied ? "Đã sao chép!" : "Sao chép"}</span>
                </button>
              </div>

              {words.length === 0 && sourceText.trim() && (
                <button
                  type="button"
                  onClick={fetchWordBreakdown}
                  disabled={breakdownLoading}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-extrabold transition-all cursor-pointer"
                >
                  {breakdownLoading ? "Đang phân tích..." : "🔍 Phân tích từ trong câu"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Vocabulary Breakdown Section (Mazii / Chrome Extension Feature) */}
      {words.length > 0 && showBreakdown && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
                Phân Tích Từ Vựng & Hán Tự Trong Đoạn ({words.length} từ)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Extension Breakdown
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Nhấn nút ➕ để lưu ngay từ vựng bất kỳ vào Sổ tay ôn Flashcard
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {words.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-gray-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                        {item.word}
                      </div>
                      {item.reading && (
                        <div className="text-xs font-bold text-indigo-600 font-mono mt-0.5">
                          {item.reading}
                        </div>
                      )}
                      {item.romaji && item.romaji !== item.reading && (
                        <div className="text-[10px] font-medium text-gray-400 font-mono">
                          {item.romaji}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.level && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          {item.level}
                        </span>
                      )}
                      {item.pos && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.pos}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-gray-700 mt-2 leading-relaxed">
                    {item.meaning}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => playSpeech(item.word, detectedSource || sourceLang)}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 text-xs transition-colors cursor-pointer"
                    title="Nghe phát âm từ này"
                  >
                    🔊 Nghe
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWordForNotebook({
                        kanji: item.word,
                        hiragana: item.reading || item.romaji || "",
                        meaning: item.meaning,
                      });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                    title="Lưu từ này vào Sổ tay"
                  >
                    <span>➕</span>
                    <span>Lưu Sổ tay</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Sample Prompts */}
      <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 shrink-0">
          💡 Câu mẫu thử nghiệm nhanh:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
          {(SAMPLE_TEXTS[activeLanguage.code] || SAMPLE_TEXTS.ja).map((sample, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => {
                setSourceText(sample);
                setSourceLang("auto");
                executeTranslate(sample, "auto", targetLang, showBreakdown);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl text-xs font-medium text-slate-700 transition-all cursor-pointer shrink-0 truncate max-w-[280px]"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Translation History */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">🕒</span>
              <h3 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-wider">
                Lịch Sử Dịch Gần Đây ({history.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                localStorage.removeItem(STORAGE_KEY);
              }}
              className="text-xs font-bold text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSourceText(item.sourceText);
                  setTranslatedText(item.translatedText);
                  setSourceLang(item.sourceLang);
                  setTargetLang(item.targetLang);
                }}
                className="p-3 rounded-2xl bg-gray-50/80 hover:bg-indigo-50/50 border border-gray-200/70 hover:border-indigo-300 transition-all cursor-pointer text-left space-y-1 group"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                  <span className="uppercase tracking-wider">
                    {item.sourceLang} ➔ {item.targetLang}
                  </span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <div className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-600">
                  {item.sourceText}
                </div>
                <div className="text-xs text-gray-500 line-clamp-1">
                  {item.translatedText}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add To Notebook Modal */}
      {selectedWordForNotebook && (
        <AddToNotebookModal
          selectedWord={selectedWordForNotebook}
          onClose={() => setSelectedWordForNotebook(null)}
          onSuccess={() => setSelectedWordForNotebook(null)}
        />
      )}
    </div>
  );
}
