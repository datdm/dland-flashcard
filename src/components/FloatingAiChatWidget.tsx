"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

type Message = {
  role: "user" | "model";
  parts: { text: string }[];
  images?: string[];
};

type ImageItem = {
  id: string;
  url: string;
  base64: string;
  mimeType: string;
};

export default function FloatingAiChatWidget() {
  const { activeLanguage } = useLanguageSetting();
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSpeakRef = useRef(false);

  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

  const ttsLang =
    activeLanguage.code === "de"
      ? "de-DE"
      : activeLanguage.code === "en"
      ? "en-US"
      : activeLanguage.code === "ko"
      ? "ko-KR"
      : activeLanguage.code === "zh"
      ? "zh-CN"
      : "ja-JP";

  const getGreeting = useCallback(() => {
    return activeLanguage.code === "de"
      ? "Hallo! Mình là Gia sư AI Tiếng Đức của Dland. Bạn có thể hỏi mình từ vựng, ngữ pháp, hoặc dán/chụp ảnh bài tập (Ctrl+V) để mình phân tích và giải thích nhé!"
      : activeLanguage.code === "en"
      ? "Hello! Mình là Gia sư AI Tiếng Anh của Dland. Bạn có thể hỏi từ vựng, ngữ pháp, bài đọc IELTS, hoặc dán/chụp ảnh tài liệu để mình giải đáp chi tiết!"
      : activeLanguage.code === "ko"
      ? "안녕하세요! Mình là Gia sư AI Tiếng Hàn của Dland. Hãy đặt câu hỏi về từ vựng, ngữ pháp TOPIK hoặc chia sẻ bài tập để mình hỗ trợ nhé!"
      : activeLanguage.code === "zh"
      ? "你好! Mình là Gia sư AI Tiếng Trung của Dland. Bạn có thể hỏi về chữ Hán, phát âm Pinyin, ngữ pháp HSK hoặc bài tập bất kỳ!"
      : "Chào bạn! Mình là Gia sư AI Tiếng Nhật của Dland. Bạn có thể hỏi tra cứu Hán tự, ngữ pháp JLPT, dịch thuật hoặc dán ảnh (Ctrl+V) bài tập để mình giải thích chi tiết nhé!";
  }, [activeLanguage.code]);

  // Initialize Greeting
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: "model",
          parts: [{ text: getGreeting() }],
        },
      ]);
    }
  }, [getGreeting, messages.length]);

  // Listen to Global Custom Event: 'open-ai-chat'
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string; fullscreen?: boolean }>;
      setIsOpen(true);
      if (customEvent.detail?.fullscreen) {
        setIsFullscreen(true);
      }
      if (customEvent.detail?.prompt) {
        const promptText = customEvent.detail.prompt;
        setTimeout(() => {
          handleSend(promptText);
        }, 150);
      }
    };

    window.addEventListener("open-ai-chat", handleOpenChat);
    return () => {
      window.removeEventListener("open-ai-chat", handleOpenChat);
    };
  }, []);

  // Web Speech Recognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = ttsLang;

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };
        setRecognition(rec);
      }
    }
  }, [ttsLang]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Trình duyệt chưa hỗ trợ nhận diện giọng nói (Khuyến nghị dùng Google Chrome / Safari / Edge).");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`~>\[\]()-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = ttsLang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // Image Upload & Paste
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn tệp hình ảnh (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Dung lượng hình ảnh tối đa là 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const mimeType = file.type || result.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";
        setSelectedImages((prev) => [
          ...prev,
          {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            url: result,
            base64: result,
            mimeType,
          },
        ]);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(processFile);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        hasImage = true;
        const file = items[i].getAsFile();
        if (file) processFile(file);
      }
    }
    if (hasImage) {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith("image/")) {
          processFile(file);
        }
      });
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Bắt đầu cuộc trò chuyện mới với Gia sư AI?")) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSelectedImages([]);
      setMessages([
        {
          role: "model",
          parts: [{ text: getGreeting() }],
        },
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

  const handleSend = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : input;
    const currentImages = selectedImages;

    if ((!text.trim() && currentImages.length === 0) || isLoading) return;

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const promptText = text.trim() || "Phân tích và giải thích chi tiết nội dung trong hình ảnh này giúp tôi.";
    const imageUrls = currentImages.map((img) => img.url);

    const userMsg: Message = {
      role: "user",
      parts: [{ text: promptText }],
      images: imageUrls.length > 0 ? imageUrls : undefined,
    };
    const modelMsg: Message = { role: "model", parts: [{ text: "" }] };

    setMessages((prev) => [...prev, userMsg, modelMsg]);
    setInput("");
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const historyToSend = messages.slice(1).map((msg) => ({
        role: msg.role,
        parts: msg.parts,
      }));

      const payloadImages = currentImages.map((img) => ({
        data: img.base64,
        mimeType: img.mimeType,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyToSend,
          message: promptText,
          images: payloadImages.length > 0 ? payloadImages : undefined,
          lang: activeLanguage.code,
        }),
      });

      if (!res.ok) throw new Error("Lỗi kết nối máy chủ");
      if (!res.body) throw new Error("Không nhận được dữ liệu phản hồi");

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
      console.error("Chat error:", err);
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          role: "model",
          parts: [{ text: "⚠️ Xin lỗi, đã xảy ra sự cố khi kết nối với máy chủ AI. Vui lòng thử lại sau giây lát." }],
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Launcher Button (Bottom Right) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[80] group flex items-center gap-2.5 p-3 sm:px-4 sm:py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer border border-white/30 backdrop-blur-md"
          title="Hỏi đáp Gia sư AI (Mở khung chat)"
        >
          <div className="relative">
            <span className="text-2xl sm:text-2xl animate-bounce duration-1000">🤖</span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping"></span>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></span>
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-black tracking-tight leading-none">Hỏi Gia sư AI</span>
            <span className="text-[10px] text-indigo-100 font-medium leading-tight mt-0.5">
              Hỗ trợ 24/7 • {activeLanguage.flag}
            </span>
          </div>
        </button>
      )}

      {/* Floating Chat Modal / Panel */}
      {isOpen && (
        <div
          className={`fixed z-[90] flex flex-col bg-white overflow-hidden transition-all duration-300 ${
            isFullscreen
              ? "inset-0 w-full h-full rounded-none m-0 shadow-none border-none"
              : "bottom-20 right-3 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[500px] h-[640px] max-h-[85vh] rounded-3xl shadow-2xl border border-gray-200"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-2xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center text-lg shadow-sm">
                  🤖
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black truncate">Gia Sư AI Đàm Thoại</h3>
                  <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                    {activeLanguage.flag} {activeLanguage.code.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-gray-300 truncate">
                  Sẵn sàng giải đáp từ vựng, ngữ pháp & đọc ảnh bài tập
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Reset Chat */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs"
                title="Bắt đầu cuộc trò chuyện mới"
              >
                🔄
              </button>

              {/* Auto Speak Toggle */}
              <button
                type="button"
                onClick={() => setAutoSpeak(!autoSpeak)}
                className={`p-1.5 rounded-xl transition-colors cursor-pointer text-xs ${
                  autoSpeak
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-white/10 text-gray-400 hover:text-white"
                }`}
                title={autoSpeak ? "Đang bật tự động đọc câu trả lời" : "Bật tự động đọc giọng nói (Auto-Speak)"}
              >
                {autoSpeak ? "🔊" : "🔇"}
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs"
                title={isFullscreen ? "Thu nhỏ về dạng popup" : "Phóng to toàn màn hình"}
              >
                {isFullscreen ? "🗗" : "🗖"}
              </button>

              {/* Minimize / Close */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-rose-500/20 hover:text-rose-300 text-gray-300 transition-colors cursor-pointer text-sm font-bold ml-0.5"
                title="Đóng khung chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Drag Overlay Warning */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-indigo-900/80 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-indigo-400 m-2 rounded-2xl animate-in fade-in duration-150">
              <span className="text-4xl mb-2">📸</span>
              <p className="font-extrabold text-sm">Thả hình ảnh vào đây để tải lên</p>
              <p className="text-xs text-indigo-200 mt-1">Hỗ trợ PNG, JPG, WEBP lên đến 10MB</p>
            </div>
          )}

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 sm:gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "model" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs mt-1">
                    🤖
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-3xs ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs"
                      : "bg-white text-gray-900 border border-gray-200/80 rounded-tl-xs"
                  }`}
                >
                  {/* Uploaded Images */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="mb-2.5 flex flex-wrap gap-2">
                      {msg.images.map((imgUrl, iIdx) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={iIdx}
                          src={imgUrl}
                          alt="Đính kèm"
                          className="max-h-48 rounded-xl object-contain border border-white/20 shadow-xs"
                        />
                      ))}
                    </div>
                  )}

                  {/* Message Markdown Content */}
                  <div className={`prose prose-xs sm:prose-sm max-w-none ${msg.role === "user" ? "text-white prose-invert" : "text-gray-800"}`}>
                    <ReactMarkdown>{msg.parts[0]?.text || ""}</ReactMarkdown>
                  </div>

                  {/* AI Message Action Bar */}
                  {msg.role === "model" && msg.parts[0]?.text && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-end gap-2 text-gray-400">
                      <button
                        type="button"
                        onClick={() => speak(msg.parts[0].text)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer text-xs flex items-center gap-1"
                        title="Nghe phát âm"
                      >
                        <span>🔊</span>
                        <span className="text-[10px] font-bold">Nghe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.parts[0].text, idx)}
                        className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer text-xs flex items-center gap-1"
                        title="Sao chép câu trả lời"
                      >
                        <span>{copiedIdx === idx ? "✓" : "📋"}</span>
                        <span className="text-[10px] font-bold">
                          {copiedIdx === idx ? "Đã chép" : "Chép"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-gray-400 text-xs">
                <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 text-xs shrink-0">
                  🤖
                </div>
                <div className="px-4 py-2.5 bg-white border border-gray-200 rounded-2xl rounded-tl-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  <span className="font-semibold text-gray-600">Gia sư AI đang soạn phản hồi...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips (when only 1 greeting message) */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-slate-50 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[11px] font-bold text-gray-400 shrink-0">Gợi ý:</span>
              {[
                "Giải thích ngữ pháp câu này",
                "Phân tích từ vựng & Hán tự",
                "Cách diễn đạt này có tự nhiên không?",
                "Tạo đoạn hội thoại mẫu",
              ].map((chip, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-xl text-[11px] font-bold transition-all cursor-pointer shrink-0 shadow-3xs"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Attached Image Preview Row */}
          {selectedImages.length > 0 && (
            <div className="px-4 py-2 bg-indigo-50/60 border-t border-indigo-100 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider shrink-0">
                Ảnh đính kèm ({selectedImages.length}):
              </span>
              {selectedImages.map((img) => (
                <div key={img.id} className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImages((prev) => prev.filter((i) => i.id !== img.id))}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center hover:bg-rose-700 shadow-xs cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input & Control Box */}
          <div className="p-3 sm:p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200/90 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              {/* Attach Image Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl hover:bg-gray-200/70 text-gray-500 hover:text-indigo-600 transition-colors cursor-pointer shrink-0 text-base"
                title="Tải lên hoặc dán (Ctrl+V) ảnh bài tập"
              >
                📷
              </button>

              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 text-base ${
                  isListening
                    ? "bg-rose-500 text-white animate-pulse"
                    : "hover:bg-gray-200/70 text-gray-500 hover:text-indigo-600"
                }`}
                title={isListening ? "Đang thu âm giọng nói..." : "Thu âm bằng giọng nói"}
              >
                🎙️
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Hỏi gia sư, dán văn bản / ảnh bài tập (Ctrl+V)..."
                className="flex-1 max-h-32 min-h-[38px] p-2 bg-transparent text-gray-800 text-xs sm:text-sm placeholder-gray-400 resize-none focus:outline-none leading-relaxed"
              />

              {/* Send Button */}
              <button
                type="button"
                disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
                onClick={() => handleSend()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                title="Gửi câu hỏi (Enter)"
              >
                🚀
              </button>
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1.5 px-1">
              <span>Enter để gửi, Shift+Enter xuống dòng</span>
              <span>Dán (Ctrl+V) ảnh bài tập trực tiếp</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
