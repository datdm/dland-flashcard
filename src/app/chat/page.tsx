"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          const lastMsg = { ...newMessages[lastIndex] };
          lastMsg.parts = [{ text: lastMsg.parts[0].text + chunk }];
          newMessages[lastIndex] = lastMsg;
          return newMessages;
        });
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

  const SUGGESTIONS = [
    "📝 Phân tích Kanji: 勉強",
    "📖 Giải thích ngữ pháp ～てあげる",
    "🎧 Luyện nghe hội thoại cơ bản",
    "🗣️ Luyện giao tiếp chủ đề mua sắm"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-110px)] md:h-[calc(100vh-40px)] flex flex-col px-4 pt-4">
      {/* Header */}
      <div className="bg-white rounded-t-3xl border-b border-gray-100 p-4 shadow-xs z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-xl shadow-md">
          🤖
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">Gia Sư AI Tiếng Nhật</h1>
          <p className="text-xs text-gray-500">Được cung cấp bởi Google Gemini</p>
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
                <div className="prose prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-a:text-indigo-600 prose-li:my-0.5 prose-ul:my-2 prose-ol:my-2 prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0 marker:text-indigo-500">
                  <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
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
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Hỏi gia sư AI về từ vựng, ngữ pháp..."
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
  );
}
