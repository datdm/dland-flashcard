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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const promptLoaded = useRef(false);
  const { activeLanguage } = useLanguageSetting();

  // Audio Voice Chat parameters (Gemini Live Mode)
  const [autoSpeak, setAutoSpeak] = useState(false);
  const autoSpeakRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const ttsLang = activeLanguage.code === "de" ? "de-DE" : activeLanguage.code === "en" ? "en-US" : "ja-JP";

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  useEffect(() => {
    const greetingText = activeLanguage.code === "de"
      ? "Hallo! Mình là Gia sư AI Tiếng Đức của Dland Language. Mình có thể giúp bạn giải thích từ vựng, ngữ pháp, chia động từ hoặc cùng bạn luyện nói giao tiếp. Bạn cần mình giúp gì hôm nay?"
      : activeLanguage.code === "en"
      ? "Hello! Mình là Gia sư AI Tiếng Anh của Dland Language. Mình có thể giúp bạn giải thích từ vựng, các điểm ngữ pháp, hội thoại hoặc giao tiếp tiếng Anh. Bạn cần mình giúp gì hôm nay?"
      : "Chào bạn! Mình là Gia sư AI Tiếng Nhật của Dland Language. Mình có thể giúp bạn giải thích từ vựng, phân tích Hán tự, luyện ngữ pháp hoặc giao tiếp. Bạn cần mình giúp gì hôm nay?";
      
    setMessages([
      {
        role: "model",
        parts: [{ text: greetingText }]
      }
    ]);
  }, [activeLanguage.code]);

  // STT initialization
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
          setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
        };

        setRecognition(rec);
      }
    }
  }, [activeLanguage.code]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Vui lòng sử dụng Chrome/Safari/Edge).");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
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
      <div className="max-w-5xl mx-auto h-[calc(100vh-2.5rem)] md:h-[calc(100vh-2.5rem)] -mt-2 -mb-20 md:-mb-6 flex flex-col px-2 md:px-4">
        {/* Header */}
      <div className="bg-white rounded-t-3xl border-b border-gray-100 p-4 shadow-xs z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-xl shadow-md">
            🤖
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{headerTitle}</h1>
            <p className="text-xs text-gray-500">Được cung cấp bởi Google Gemini</p>
          </div>
        </div>

        {/* Gemini Live Voice Toggle & Live Page Link */}
        <div className="flex items-center gap-2">
          <Link
            href="/chat/live"
            className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1"
            title="Đàm thoại hai chiều thời gian thực bằng giọng nói"
          >
            🎙️ Gemini Live
          </Link>
          <button
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`text-xs font-bold transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${
              autoSpeak
                ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-extrabold"
                : "bg-gray-50 border-gray-200 text-gray-400"
            }`}
            title="Tự động phát âm thanh phản hồi từ AI"
          >
            <span>{autoSpeak ? "🔊 Auto: Bật" : "🔇 Auto: Tắt"}</span>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
              }`}
            >
              {msg.role === "user" ? (
                <div className="whitespace-pre-wrap">{msg.parts[0].text}</div>
              ) : (
                <div>
                  <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-a:text-indigo-600 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 marker:text-indigo-500">
                    <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                  </div>
                  {msg.parts[0].text && (
                    <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                      <button
                        onClick={() => speak(msg.parts[0].text)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50/50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-all"
                        title="Nghe phát âm phản hồi này"
                      >
                        🔊 Nghe đàm thoại
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.parts[0].text === "" && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-500 border border-gray-100 rounded-3xl rounded-tl-sm p-4 shadow-sm flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
              <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="bg-gray-50/50 px-4 pb-2">
          <div className="flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSend(sug)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-xs"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white p-4 rounded-b-3xl border-t border-gray-100 shadow-sm">
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
            className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
              isListening
                ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-200"
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
            placeholder={isListening ? "Đang lắng nghe giọng nói của bạn..." : "Hỏi gia sư AI hoặc yêu cầu nhập vai..."}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 shrink-0 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  </AuthGuard>
  );
}
