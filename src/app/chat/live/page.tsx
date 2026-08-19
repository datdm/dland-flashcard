"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AuthGuard from "@/components/AuthGuard";

// System Instructions based on languages
const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  ja: `Bạn là Sakura, một gia sư Tiếng Nhật bản xứ vô cùng thân thiện, kiên nhẫn.
Nhiệm vụ của bạn:
1. Giao tiếp bằng tiếng Nhật tự nhiên, ngắn gọn (1-2 câu ngắn).
2. Nếu người dùng nói sai, hãy nhẹ nhàng sửa lỗi và gợi ý cách diễn đạt chuẩn.
3. Luôn giữ cuộc trò chuyện vui vẻ, hào hứng.`,

  en: `You are Sarah, a warm and friendly native English tutor.
Your tasks:
1. Converse in simple, clear, and natural English.
2. Keep your responses very brief (1-2 sentences max) so it feels like real-time voice chat.
3. Gently correct any grammar or word choice mistakes made by the learner.`,

  de: `Du bist Anna, eine freundliche und geduldige Deutschlehrerin.
Deine Aufgaben:
1. Unterhalte dich in einfachem, natürlichem Deutsch.
2. Halte deine Antworten rất ngắn gọn (tối đa 1-2 câu).
3. Korrigiere die Fehler des Nutzers auf eine sehr freundliche Weise.`
};

const SUGGESTED_TOPICS = [
  "Giao tiếp Tự do hàng ngày",
  "Giới thiệu bản thân & Sở thích",
  "Hỏi đường & Du lịch",
  "Mua sắm & Gọi món tại nhà hàng",
  "Phỏng vấn & Công việc"
];

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

export default function GeminiLivePage() {
  const { activeLanguage } = useLanguageSetting();
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState("Sẵn sàng đàm thoại");
  const [aiState, setAiState] = useState<"idle" | "listening" | "speaking">("idle");
  const [mounted, setMounted] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>("Giao tiếp Tự do hàng ngày");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [interimText, setInterimText] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentInterimRef = useRef<string>("");

  const ttsLang = activeLanguage.code === "de" ? "de-DE" : activeLanguage.code === "en" ? "en-US" : "ja-JP";
  const flagEmoji = activeLanguage.code === "de" ? "🇩🇪" : activeLanguage.code === "en" ? "🇬🇧" : "🇯🇵";
  const tutorName = activeLanguage.code === "de" ? "Anna (Deutsch)" : activeLanguage.code === "en" ? "Sarah (English)" : "Sakura (日本語)";

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, interimText, aiState]);

  // Set mounted state & initial greeting
  useEffect(() => {
    setMounted(true);

    const greeting = activeLanguage.code === "de"
      ? "Hallo! Ich bin Anna. Lass uns auf Deutsch sprechen! Worüber möchtest du heute reden?"
      : activeLanguage.code === "en"
      ? "Hi there! I'm Sarah, your English tutor. Let's practice speaking together! How are you doing today?"
      : "こんにちは！さくらです。日本語で楽しくお話ししましょう！今日はどんなお話をしますか？";

    setChatMessages([
      {
        id: "msg-welcome",
        role: "model",
        text: greeting,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  }, [activeLanguage.code]);

  // Clean audio and STT when exiting
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Web Speech API with Real-time Streaming Interim Transcription & Silence Auto-Send
  const startSTT = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (Khuyên dùng Chrome/Edge/Safari).");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true; // Stream words in realtime
      rec.lang = ttsLang;

      rec.onstart = () => {
        setAiState("listening");
        setStatusText("Đang lắng nghe giọng nói của bạn 🎙️");
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentSpoken = (finalChunk || interim).trim();

        if (currentSpoken) {
          currentInterimRef.current = currentSpoken;
          setInterimText(currentSpoken);
          setAiState("listening");

          // Reset silence timer on every new speech chunk
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // If final chunk is reached, or after 1.2s silence, commit and send to AI immediately
          if (finalChunk.trim()) {
            const textToSend = finalChunk.trim();
            currentInterimRef.current = "";
            setInterimText("");
            handleUserMessage(textToSend);
          } else {
            silenceTimerRef.current = setTimeout(() => {
              const textToSend = currentInterimRef.current.trim();
              if (textToSend && textToSend.length > 1) {
                console.log("⏱️ Auto-sending speech after silence:", textToSend);
                currentInterimRef.current = "";
                setInterimText("");
                handleUserMessage(textToSend);
              }
            }, 1200);
          }
        }
      };

      rec.onerror = (e: any) => {
        if (e.error !== "no-speech") {
          console.log("STT notice:", e.error);
        }
      };

      rec.onend = () => {
        // Auto restart STT if still connected and AI is not speaking
        if (connected && aiState !== "speaking") {
          try {
            rec.start();
          } catch {}
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.warn("STT initialization failed:", e);
    }
  };

  const stopSTT = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    currentInterimRef.current = "";
    setInterimText("");
  };

  // Handle user speech or text message
  const handleUserMessage = async (userText: string) => {
    if (!userText.trim() || isSending) return;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText.trim(),
      timestamp: timeStr
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInterimText("");
    currentInterimRef.current = "";
    setIsSending(true);
    setAiState("speaking");
    setStatusText("Gia sư AI đang suy nghĩ phản hồi...");

    // Stop STT temporarily while AI generates & speaks
    stopSTT();

    try {
      const systemInstruction = SYSTEM_INSTRUCTIONS[activeLanguage.code] || SYSTEM_INSTRUCTIONS.ja;
      const historyContext = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyContext,
          lang: activeLanguage.code,
          systemInstruction: `${systemInstruction}\nChủ đề luyện nói hiện tại: ${activeTopic}. Hãy trả lời cực kỳ ngắn gọn 1-2 câu để đàm thoại trực tiếp.`
        })
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối đến máy chủ AI");
      }

      let aiReply = "";
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        aiReply = data.reply || data.text || data.message || "";
      } else {
        aiReply = await res.text();
      }

      if (!aiReply.trim()) {
        const defaultFallbacks: Record<string, string> = {
          ja: "なるほど、分かりました！続けてお話ししましょう。",
          en: "I see! That's interesting, let's keep talking.",
          de: "Verstehe! Lass uns gerne weiter sprechen."
        };
        aiReply = defaultFallbacks[activeLanguage.code] || defaultFallbacks.ja;
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: aiReply.trim(),
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      setStatusText("Gia sư AI đang nói 🔊");
      speakText(aiReply.trim());

    } catch (err: any) {
      console.error("AI response error:", err);
      // Fallback friendly reply so the user always receives response
      const fallbackMsgs: Record<string, string> = {
        ja: "はい、聞こえていますよ！続けてどうぞ。",
        en: "Yes, I hear you loud and clear! Please continue.",
        de: "Ja, ich höre dich! Bitte sprich weiter."
      };
      const safeReply = fallbackMsgs[activeLanguage.code] || fallbackMsgs.ja;
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: safeReply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      setStatusText("Gia sư AI đang nói 🔊");
      speakText(safeReply);
    } finally {
      setIsSending(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();

    // Clean text before speaking
    const cleanText = text.replace(/[*_#`~>\[\]()-]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = ttsLang;
    utterance.rate = 0.95;

    utterance.onend = () => {
      setAiState("listening");
      setStatusText("Đang lắng nghe bạn nói 🎙️");
      if (connected) {
        startSTT();
      }
    };

    utterance.onerror = () => {
      setAiState("idle");
      setStatusText("Sẵn sàng đàm thoại");
      if (connected) {
        startSTT();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  const connect = async () => {
    try {
      setStatusText("Đang kích hoạt Micro...");
      setConnected(true);
      setAiState("listening");
      startSTT();
      setStatusText("Đã kết nối! Hãy bắt đầu nói vào Micro 🎙️");

      // Play introductory prompt
      const introMsg = chatMessages[0]?.text || "Hello! Let's talk!";
      speakText(introMsg);

    } catch (error) {
      console.error("Failed to connect Live mode:", error);
      setStatusText("Không thể bắt đầu Live Voice");
      disconnect();
    }
  };

  const disconnect = () => {
    setConnected(false);
    setAiState("idle");
    setStatusText("Đã ngắt kết nối.");

    stopSTT();

    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
  };

  const handleToggle = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput;
    setTextInput("");
    handleUserMessage(msg);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20 text-indigo-600 font-bold">
        Đang tải chế độ Live Voice...
      </div>
    );
  }

  return (
    <AuthGuard featureName="Gemini Live Voice Đàm Thoại" description="Đăng nhập để trải nghiệm đàm thoại 2 chiều trực tiếp bằng giọng nói cùng Gia sư bản xứ.">
      <div className="max-w-6xl mx-auto h-[calc(100vh-2.5rem)] md:h-[calc(100vh-2.5rem)] -mt-2 -mb-20 md:-mb-6 flex flex-col gap-3.5 px-2 md:px-4">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-4 md:p-5 border border-gray-100 shadow-2xs flex flex-col gap-3 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/chat"
                className="p-2 rounded-2xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors border border-gray-100 shrink-0"
                title="Quay lại chat văn bản"
              >
                ←
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full text-[11px] font-bold">
                    🎙️ Live Voice Đàm Thoại
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-full text-[11px] font-bold flex items-center gap-1">
                    <span>{flagEmoji}</span>
                    <span>Gia sư: {tutorName}</span>
                  </span>
                </div>
                <h1 className="text-lg md:text-xl font-extrabold text-gray-900 mt-0.5">
                  Luyện Nói Giao Tiếp Trực Tiếp với AI
                </h1>
              </div>
            </div>

            {/* Editable Custom Topic Input */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-3xs">
              <span className="text-xs">🎯</span>
              <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Chủ đề:</span>
              <input
                type="text"
                value={activeTopic}
                onChange={(e) => setActiveTopic(e.target.value)}
                placeholder="Nhập chủ đề bất kỳ bạn muốn luyện..."
                className="bg-transparent text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none w-full sm:w-60"
              />
            </div>
          </div>

          {/* Quick Suggestion Topic Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mr-1">Gợi ý nhanh:</span>
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setActiveTopic(topic)}
                className={`px-2.5 py-0.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                  activeTopic === topic
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Main Dual Grid: Left Visualizer & Right Live Transcript Timeline */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Left Column: Visualizer & Live Controls (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between h-full min-h-0 overflow-y-auto">
            
            <div className="w-full flex items-center justify-between pb-2.5 border-b border-gray-100 shrink-0">
              <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-emerald-500 animate-ping" : "bg-gray-300"}`} />
                {connected ? "Live Voice Đang Bật" : "Chưa kết nối"}
              </span>
              <span className="text-[11px] font-semibold text-gray-400">
                Độ trễ thấp • Nhận diện tức thì
              </span>
            </div>

            {/* Central Radar Waves & Avatar */}
            <div className="my-auto py-4 flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Outer Ripple */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-500 ${
                    aiState === "speaking"
                      ? "bg-indigo-500/20 border-2 border-indigo-500/40 animate-ping scale-110"
                      : aiState === "listening"
                      ? "bg-pink-500/20 border-2 border-pink-500/40 animate-pulse scale-105"
                      : "bg-gray-100/50 border border-gray-200"
                  }`}
                />

                {/* Middle Layer */}
                <div
                  className={`absolute inset-2.5 rounded-full transition-all duration-500 ${
                    aiState === "speaking"
                      ? "bg-indigo-100 border border-indigo-300"
                      : aiState === "listening"
                      ? "bg-pink-100 border border-pink-300"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                />

                {/* Center Core Button */}
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-md transition-all duration-500 ${
                    aiState === "speaking"
                      ? "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white scale-105 shadow-indigo-200"
                      : aiState === "listening"
                      ? "bg-gradient-to-tr from-pink-500 to-rose-500 text-white scale-105 shadow-pink-200"
                      : "bg-white text-gray-400 border border-gray-200"
                  }`}
                >
                  {aiState === "speaking" ? "🗣️" : aiState === "listening" ? "🎙️" : "💤"}
                </div>
              </div>

              {/* AI State Title */}
              <h3 className="text-sm font-extrabold text-gray-800 mt-3 tracking-tight">
                {aiState === "speaking"
                  ? "Gia sư AI đang nói..."
                  : aiState === "listening"
                  ? "Gia sư đang lắng nghe bạn..."
                  : connected
                  ? "Đã kết nối - Hãy nói"
                  : "Sẵn sàng đàm thoại"}
              </h3>
              
              {/* Status Helper */}
              <p className="text-xs text-gray-500 mt-0.5 text-center font-medium">
                {statusText}
              </p>
            </div>

            {/* Real-time Streaming Speech Indicator */}
            {interimText && (
              <div className="w-full mb-3 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-950 animate-pulse shrink-0">
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block mb-0.5">
                  🎙️ Đang nhận diện giọng nói trực tiếp:
                </span>
                <p className="font-semibold italic">"{interimText}..."</p>
              </div>
            )}

            {/* Toggle Live Voice Button */}
            <div className="w-full space-y-1.5 shrink-0 pt-2">
              <button
                onClick={handleToggle}
                className={`w-full py-3 rounded-2xl font-extrabold text-xs tracking-wide shadow-md transition-all duration-300 transform active:scale-98 flex items-center justify-center gap-2 ${
                  connected
                    ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 hover:shadow-lg"
                }`}
              >
                <span>{connected ? "🛑 Tắt Chế Độ Live Voice" : "🎙️ Bật Live Voice (Đàm thoại trực tiếp)"}</span>
              </button>
              <p className="text-[10px] text-gray-400 text-center leading-tight">
                Khuyên dùng tai nghe để nhận diện giọng nói chính xác và rõ ràng nhất.
              </p>
            </div>
          </div>

          {/* Right Column: Live Chat Transcript Timeline (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-2xs flex flex-col h-full min-h-0 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <div>
                  <h3 className="font-bold text-xs text-gray-800">Đoạn Hội Thoại Trực Tiếp</h3>
                  <p className="text-[10px] text-gray-400">Tự động ghi nhận câu nói của bạn và phản hồi của AI</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-xl">
                {chatMessages.length} tin nhắn
              </span>
            </div>

            {/* Messages Timeline Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0">
              {chatMessages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-gray-400">
                      <span>{isUser ? "👤 Bạn" : `🤖 ${tutorName}`}</span>
                      <span className="text-[9px] text-gray-400 font-normal">{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl leading-relaxed text-xs ${
                        isUser
                          ? "bg-indigo-600 text-white rounded-tr-xs shadow-xs font-medium"
                          : "bg-gray-50 border border-gray-200/70 text-gray-800 rounded-tl-xs shadow-xs"
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                      {!isUser && (
                        <button
                          onClick={() => speakText(msg.text)}
                          className="mt-2 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg transition-colors border border-indigo-100"
                        >
                          🔊 Nghe lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Real-time Streaming Speech Draft Bubble */}
              {interimText && (
                <div className="flex flex-col items-end space-y-1 animate-pulse">
                  <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-indigo-600">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span>👤 Bạn đang nói...</span>
                  </div>
                  <div className="max-w-[85%] sm:max-w-[80%] p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-tr-xs shadow-xs text-xs">
                    <p className="font-semibold italic">"{interimText}..."</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Manual Input Footer */}
            <form
              onSubmit={handleManualSubmit}
              className="p-3 border-t border-gray-100 bg-gray-50/40 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Nói vào Micro hoặc gõ tin nhắn tại đây..."
                disabled={isSending}
                className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-3xs"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isSending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-2xl font-extrabold text-xs hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xs"
              >
                {isSending ? "..." : "Gửi"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
