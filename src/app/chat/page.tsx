"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AuthGuard from "@/components/AuthGuard";

type Message = {
  role: "user" | "model";
  parts: { text: string }[];
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { activeLanguage } = useLanguageSetting();

  // Audio Voice Chat parameters
  const [autoSpeak, setAutoSpeak] = useState(false);
  const autoSpeakRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const promptLoaded = useRef(false);

  const ttsLang = activeLanguage.code === "de" ? "de-DE" : activeLanguage.code === "en" ? "en-US" : "ja-JP";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = activeLanguage.code === "de" ? "de-DE" : activeLanguage.code === "en" ? "en-US" : "ja-JP";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        setRecognition(rec);
      }
    }
  }, [activeLanguage.code]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Khuyến nghị dùng Google Chrome / Safari / Edge).");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const getGreeting = () => {
    return activeLanguage.code === "de"
      ? "Hallo! Mình là Gia sư AI Tiếng Đức của Dland Language. Mình có thể giúp bạn giải thích từ vựng, ngữ pháp, chia động từ hoặc cùng bạn luyện nói giao tiếp. Bạn cần mình giúp gì hôm nay?"
      : activeLanguage.code === "en"
      ? "Hello! Mình là Gia sư AI Tiếng Anh của Dland Language. Mình có thể giúp bạn giải thích từ vựng, các điểm ngữ pháp, hội thoại hoặc giao tiếp tiếng Anh. Bạn cần mình giúp gì hôm nay?"
      : "Chào bạn! Mình là Gia sư AI Tiếng Nhật của Dland Language. Mình có thể giúp bạn giải thích từ vựng, phân tích Hán tự, luyện ngữ pháp hoặc giao tiếp phản xạ. Bạn cần mình giúp gì hôm nay?";
  };

  const handleClearChat = () => {
    if (window.confirm("Bạn có muốn bắt đầu cuộc trò chuyện mới không?")) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setMessages([
        {
          role: "model",
          parts: [{ text: getGreeting() }]
        }
      ]);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const speak = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = text.replace(/[*_#`~>\[\]()-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = ttsLang;
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Stop speaking when user sends a new message
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }

    const userMsg: Message = { role: "user", parts: [{ text }] };
    const modelMsg: Message = { role: "model", parts: [{ text: "" }] };
    
    setMessages((prev) => [...prev, userMsg, modelMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const historyToSend = messages.slice(1).map(msg => ({
        role: msg.role,
        parts: msg.parts,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyToSend,
          message: text,
          lang: activeLanguage.code,
        }),
      });

      if (!res.ok) {
        throw new Error("Lỗi kết nối");
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponseText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullResponseText += chunk;
        
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          const lastMsg = { ...newMessages[lastIndex] };
          lastMsg.parts = [{ text: lastMsg.parts[0].text + chunk }];
          newMessages[lastIndex] = lastMsg;
          return newMessages;
        });
      }

      if (autoSpeakRef.current) {
        speak(fullResponseText);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex].parts[0].text = "Xin lỗi, đã xảy ra lỗi trong quá trình kết nối. Vui lòng kiểm tra lại GEMINI_API_KEY hoặc thử lại sau.";
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !promptLoaded.current) {
      const params = new URLSearchParams(window.location.search);
      const promptParam = params.get("prompt");
      if (promptParam) {
        promptLoaded.current = true;
        handleSend(promptParam);
        // Clear query parameter to prevent resending on page refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [messages]);

  const SUGGESTIONS_BY_LANG: Record<string, string[]> = {
    ja: [
      "📝 Phân tích Kanji: 勉強",
      "📖 Giải thích ngữ pháp ～てあげる",
      "🎧 Luyện nghe hội thoại cơ bản",
      "🗣️ Luyện giao tiếp chủ đề mua sắm"
    ],
    en: [
      "📝 Phân biệt cách dùng: Although vs Despite",
      "📖 Giải thích ngữ pháp Câu điều kiện loại 3",
      "🎯 Luyện phát âm & IPA từ vựng IELTS",
      "🗣️ Luyện nói tiếng Anh chủ đề Job Interview"
    ],
    de: [
      "📝 Phân biệt quán từ giống: Der, Die, Das",
      "📖 Giải thích cấu trúc ngữ pháp Weil & Dass",
      "🎯 Luyện chia đuôi tính từ (Adjektivdeklination)",
      "🗣️ Luyện giao tiếp tiếng Đức chủ đề Im Restaurant"
    ]
  };

  const SUGGESTIONS = SUGGESTIONS_BY_LANG[activeLanguage.code] || SUGGESTIONS_BY_LANG.ja;

  const headerTitle = activeLanguage.code === "de"
    ? "Gia Sư AI Tiếng Đức"
    : activeLanguage.code === "en"
    ? "Gia Sư AI Tiếng Anh"
    : "Gia Sư AI Tiếng Nhật";

  return (
    <AuthGuard featureName="Gia Sư AI 24/7" description="Đăng nhập để luyện giao tiếp, giải thích ngữ pháp, phân tích từ vựng và lưu hội thoại cùng Gia sư AI.">
      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-3 sm:py-4 pb-16 md:pb-6 space-y-3">
        {/* Sleek Modern AI Tutor Topbar */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-xl shadow-md shadow-indigo-200">
                🤖
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-gray-900">{headerTitle}</h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold">
                  ● Trực tuyến 24/7
                </span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold hidden sm:inline">
                  {activeLanguage.code.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-1">
                Gia sư thông minh hỗ trợ giải thích ngữ pháp, tra Hán tự, đàm thoại Kaiwa phản xạ
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/chat/live"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
              title="Đàm thoại hai chiều bằng giọng nói Live"
            >
              <span>🎙️</span>
              <span className="hidden sm:inline">Gemini Live</span>
            </Link>

            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1 cursor-pointer ${
                autoSpeak
                  ? "bg-amber-50 border-amber-300 text-amber-900 font-extrabold"
                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
              title="Tự động phát âm thanh phản hồi từ AI"
            >
              <span>{autoSpeak ? "🔊 Tự phát âm: Bật" : "🔇 Tự phát âm"}</span>
            </button>

            <button
              type="button"
              onClick={handleClearChat}
              className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-rose-50 text-gray-600 hover:text-rose-600 border border-gray-200 hover:border-rose-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
              title="Xóa lịch sử và bắt đầu hội thoại mới"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Cuộc trò chuyện mới</span>
            </button>
          </div>
        </div>

        {/* Chat Container Box */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 overflow-hidden flex flex-col h-[calc(100dvh-11.5rem)] min-h-[480px]">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-5 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "model" && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0 shadow-3xs mt-1">
                    🤖
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-3.5 sm:p-4 shadow-3xs ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-tr-xs"
                      : "bg-white text-gray-800 border border-gray-200/80 rounded-tl-xs"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.parts[0].text}</div>
                  ) : (
                    <div>
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-a:text-indigo-600 prose-headings:mb-1.5 prose-headings:mt-3 first:prose-headings:mt-0 marker:text-indigo-500">
                        <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                      </div>

                      {msg.parts[0].text && (
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-400 font-semibold">Gia sư AI</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.parts[0].text, idx)}
                              className="text-[11px] text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              <span>{copiedIdx === idx ? "✓ Đã sao chép" : "📋 Sao chép"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => speak(msg.parts[0].text)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-all cursor-pointer"
                              title="Nghe phát âm phản hồi này"
                            >
                              <span>🔊 Nghe đọc</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center text-gray-700 text-sm shrink-0 shadow-3xs mt-1">
                    👤
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.parts[0].text === "" && (
              <div className="flex items-center gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm shrink-0 shadow-3xs">
                  🤖
                </div>
                <div className="bg-white text-indigo-600 border border-gray-200/80 rounded-2xl rounded-tl-xs p-3.5 shadow-3xs flex items-center gap-1.5 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>Gia sư AI đang soạn phản hồi...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Horizontal Scroll Bar */}
          <div className="bg-slate-50 border-t border-gray-100 px-3 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0 mr-1">
                Gợi ý:
              </span>
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-3 py-1 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200/80 hover:border-indigo-300 text-xs font-semibold rounded-full whitespace-nowrap transition-all shadow-3xs cursor-pointer shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white p-3 sm:p-4 border-t border-gray-100">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2 items-center"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                }`}
                title={isListening ? "Đang lắng nghe... Nhấn để dừng" : "Nói để nhập văn bản (STT)"}
              >
                {isListening ? "🛑" : "🎙️"}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder={isListening ? "Đang lắng nghe giọng nói của bạn..." : "Hỏi gia sư về ngữ pháp, từ vựng hoặc yêu cầu đối thoại..."}
                className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-4 h-11 shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <span>Gửi</span>
                <span>➤</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
