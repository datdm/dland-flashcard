"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AuthGuard from "@/components/AuthGuard";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeLanguage } = useLanguageSetting();

  // Audio Voice Chat parameters
  const [autoSpeak, setAutoSpeak] = useState(false);
  const autoSpeakRef = useRef(false);
  useEffect(() => {
    autoSpeakRef.current = autoSpeak;
  }, [autoSpeak]);

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
      ? "Hallo! Mình là Gia sư AI Tiếng Đức của Dland Language. Bạn có thể hỏi mình từ vựng, ngữ pháp, hoặc dán/tải lên ảnh (Ctrl+V) bài tập, đoạn văn tiếng Đức để mình đọc & phân tích nhé!"
      : activeLanguage.code === "en"
      ? "Hello! Mình là Gia sư AI Tiếng Anh của Dland Language. Bạn có thể hỏi từ vựng, ngữ pháp, hoặc dán/tải lên ảnh (Ctrl+V) tài liệu, bài đọc tiếng Anh để mình phân tích & dịch chi tiết!"
      : "Chào bạn! Mình là Gia sư AI Tiếng Nhật của Dland Language. Bạn có thể tra Hán tự, giải thích ngữ pháp, dán (Ctrl+V) hoặc tải lên ảnh bài tập, trang sách để mình phân tích & dịch nhé!";
  };

  const handleClearChat = () => {
    if (window.confirm("Bạn có muốn bắt đầu cuộc trò chuyện mới không?")) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSelectedImages([]);
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

  // Image upload & paste helpers
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn hoặc dán tệp hình ảnh (PNG, JPG, WEBP, GIF).");
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

  const removeSelectedImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleSend = async (text: string, imagesToSend?: ImageItem[]) => {
    const currentImages = imagesToSend || selectedImages;
    if ((!text.trim() && currentImages.length === 0) || isLoading) return;

    // Stop speaking when user sends a new message
    if (typeof window !== "undefined") {
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
        newMessages[lastIndex].parts[0].text =
          "Xin lỗi, đã xảy ra lỗi trong quá trình kết nối. Vui lòng kiểm tra lại GEMINI_API_KEY hoặc thử lại sau.";
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
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [messages]);

  const SUGGESTIONS_BY_LANG: Record<string, string[]> = {
    ja: [
      "📸 Dán hoặc tải ảnh bài tập / Kanji để phân tích",
      "📝 Phân tích Kanji: 勉強",
      "📖 Giải thích ngữ pháp ～てあげる",
      "🎧 Luyện nghe hội thoại cơ bản",
      "🗣️ Luyện giao tiếp chủ đề mua sắm"
    ],
    en: [
      "📸 Dán hoặc tải ảnh đoạn văn / bài đọc tiếng Anh",
      "📝 Phân biệt cách dùng: Although vs Despite",
      "📖 Giải thích ngữ pháp Câu điều kiện loại 3",
      "🎯 Luyện phát âm & IPA từ vựng IELTS",
      "🗣️ Luyện nói tiếng Anh chủ đề Job Interview"
    ],
    de: [
      "📸 Dán hoặc tải ảnh bài tập / ngữ pháp tiếng Đức",
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
    <AuthGuard featureName="Gia Sư AI 24/7" description="Đăng nhập để luyện giao tiếp, giải thích ngữ pháp, dán ảnh phân tích và lưu hội thoại cùng Gia sư AI.">
      <div
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 py-3 sm:py-4 pb-16 md:pb-6 space-y-3 relative"
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="fixed inset-0 z-50 bg-indigo-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-8 border-4 border-dashed border-indigo-400 text-center max-w-md shadow-2xl space-y-3 animate-bounce">
              <div className="text-5xl">🖼️</div>
              <h3 className="text-lg font-black text-indigo-900">Thả hình ảnh vào đây</h3>
              <p className="text-xs text-indigo-600 font-bold">
                Gia sư AI sẽ lập tức nhận diện chữ, dịch và phân tích ngữ pháp trong ảnh cho bạn!
              </p>
            </div>
          </div>
        )}

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
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/60 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                  <span>📷</span>
                  <span>Đọc & Phân tích ảnh</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 line-clamp-1">
                Gia sư thông minh hỗ trợ giải thích ngữ pháp, tra Hán tự, đọc ảnh bài tập (Ctrl+V) & Kaiva phản xạ
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

        {/* Main Content Area: Messages & Input separated into distinct structural blocks */}
        <div className="flex flex-col h-[calc(100dvh-10rem)] min-h-[500px] space-y-3">
          {/* 1. Chat Messages Panel (Separated full-height scrolling view) */}
          <div className="flex-1 bg-white rounded-2xl sm:rounded-3xl shadow-xs border border-gray-100 overflow-y-auto p-4 sm:p-5 space-y-4">
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
                  {/* Display Attached Images in User Message Bubble */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2.5">
                      {msg.images.map((imgUrl, imgIdx) => (
                        <div
                          key={imgIdx}
                          onClick={() => setPreviewModalImg(imgUrl)}
                          className="relative group rounded-xl overflow-hidden border border-white/30 cursor-pointer shadow-xs max-w-[240px] max-h-[180px]"
                        >
                          <img
                            src={imgUrl}
                            alt="Ảnh đính kèm"
                            className="object-cover w-full h-full max-h-[180px] hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                            🔍 Xem ảnh lớn
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

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
                  <span>Gia sư AI đang đọc & phân tích hình ảnh...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 2. Separated Input Panel (Floating/Independent Card at Bottom) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md border border-gray-200/90 p-3 sm:p-4 shrink-0 space-y-2.5">
            {/* Selected Image Preview Bar Before Sending */}
            {selectedImages.length > 0 && (
              <div className="bg-indigo-50/60 rounded-xl border border-indigo-100 px-3.5 py-2 flex items-center gap-2.5 overflow-x-auto">
                <span className="text-[11px] font-extrabold text-indigo-900 shrink-0 flex items-center gap-1">
                  <span>🖼️</span>
                  <span>Ảnh đã chọn ({selectedImages.length}):</span>
                </span>
                {selectedImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-indigo-300 bg-white shadow-3xs"
                  >
                    <img src={img.url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(img.id)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity"
                      title="Xóa ảnh này"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <span className="text-[10px] text-gray-400 font-medium ml-auto shrink-0 hidden sm:inline">
                  💡 Có thể bấm Gửi ngay hoặc nhập thêm câu hỏi
                </span>
              </div>
            )}

            {/* Quick Suggestions Horizontal Scroll Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0 mr-1">
                Gợi ý:
              </span>
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-3 py-1 bg-slate-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200/80 hover:border-indigo-300 text-xs font-semibold rounded-full whitespace-nowrap transition-all shadow-3xs cursor-pointer shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Multi-line Auto-expanding Textarea Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex gap-2 items-end"
            >
              {/* Mic STT Button */}
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

              {/* Upload Image Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-11 h-11 shrink-0 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center transition-all cursor-pointer"
                title="Tải ảnh lên hoặc dán ảnh (Ctrl+V) để Gia sư AI phân tích"
              >
                🖼️
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if ((input.trim() || selectedImages.length > 0) && !isLoading) {
                      handleSend(input);
                    }
                  }
                }}
                disabled={isLoading}
                rows={1}
                placeholder={
                  isListening
                    ? "Đang lắng nghe giọng nói của bạn..."
                    : selectedImages.length > 0
                    ? "Nhập câu hỏi kèm ảnh (Enter để gửi, Shift+Enter xuống dòng)..."
                    : "Hỏi gia sư, dán văn bản/ảnh (Ctrl+V)... (Enter để gửi, Shift+Enter xuống dòng)"
                }
                className="flex-1 bg-slate-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none min-h-[44px] max-h-36 overflow-y-auto leading-relaxed"
              />

              <button
                type="submit"
                disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
                className="px-4 h-11 shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <span>Gửi</span>
                <span>➤</span>
              </button>
            </form>
          </div>
        </div>

        {/* Fullsize Image Modal */}
        {previewModalImg && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setPreviewModalImg(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-black p-2 border border-white/20">
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white font-bold flex items-center justify-center hover:bg-black transition-colors"
              >
                ✕
              </button>
              <img
                src={previewModalImg}
                alt="Full preview"
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
