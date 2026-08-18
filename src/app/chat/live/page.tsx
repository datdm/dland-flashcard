"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

// Native arrayBuffer to base64 helper
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert float audio samples to 16-bit PCM buffer
function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output.buffer;
}

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
2. Halte deine Antworten sehr kurz (maximal 1-2 Sätze).
3. Korrigiere die Fehler des Nutzers auf eine sehr freundliche Weise.`
};

const LIVE_MODELS = [
  { id: "models/gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Live (Default)" },
  { id: "models/gemini-2.0-flash-realtime-exp", label: "Gemini 2.0 Flash Realtime" },
  { id: "models/gemini-1.5-flash", label: "Gemini 1.5 Flash Live" }
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
  const [selectedModel, setSelectedModel] = useState<string>("models/gemini-2.0-flash-exp");
  const [mounted, setMounted] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string>("Giao tiếp Tự do hàng ngày");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const playContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordingStartedRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const ttsLang = activeLanguage.code === "de" ? "de-DE" : activeLanguage.code === "en" ? "en-US" : "ja-JP";
  const flagEmoji = activeLanguage.code === "de" ? "🇩🇪" : activeLanguage.code === "en" ? "🇬🇧" : "🇯🇵";
  const tutorName = activeLanguage.code === "de" ? "Anna (Deutsch)" : activeLanguage.code === "en" ? "Sarah (English)" : "Sakura (日本語)";

  // Auto scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, aiState]);

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

  // Auto clean audio synthesis when exiting
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Web Speech API for real-time speech-to-text
  const startSTT = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = ttsLang;

      rec.onresult = async (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          const userSpeech = lastResult[0].transcript.trim();
          if (userSpeech) {
            console.log("🎙️ Recognized user speech:", userSpeech);
            await handleUserMessage(userSpeech);
          }
        }
      };

      rec.onerror = (e: any) => {
        console.log("STT info:", e.error);
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
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  // Handle user speech or text message
  const handleUserMessage = async (userText: string) => {
    if (!userText.trim() || isSending) return;

    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText.trim(),
      timestamp: timeStr
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsSending(true);
    setAiState("speaking");
    setStatusText("AI đang suy nghĩ phản hồi...");

    try {
      // Send to AI chat endpoint
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
          systemInstruction: `${systemInstruction}\nChủ đề hiện tại: ${activeTopic}. Hãy trả lời ngắn gọn 1-2 câu để đàm thoại trực tiếp.`
        })
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối đến máy chủ AI");
      }

      const data = await res.json();
      const aiReply = data.reply || "Xin lỗi, mình chưa nghe rõ. Bạn có thể nói lại được không?";

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages((prev) => [...prev, aiMsg]);
      setStatusText("AI đang nói 🔊");
      speakText(aiReply);

    } catch (err: any) {
      console.error("AI response error:", err);
      setStatusText("Gặp sự cố phản hồi. Vui lòng nói lại!");
      setAiState("idle");
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
      startSTT();
    };

    utterance.onerror = () => {
      setAiState("idle");
      setStatusText("Sẵn sàng đàm thoại");
      startSTT();
    };

    window.speechSynthesis.speak(utterance);
  };

  const connect = async () => {
    try {
      setStatusText("Đang kích hoạt Microphone & Chế độ Live Voice...");
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

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-semibold">
        Đang khởi động chế độ Live Voice...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-3 md:p-6 pb-20 max-w-5xl mx-auto">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-3">
        <Link href="/chat" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          ← Quay lại Chat thường
        </Link>
        <div className="flex items-center gap-2">
          {/* Active Topic Tag */}
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-bold text-indigo-300">
            <span>🎯</span>
            <span>Chủ đề: {activeTopic}</span>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold">
            <span>{flagEmoji}</span>
            <span>{tutorName}</span>
          </div>
        </div>
      </div>

      {/* Main Container: Visualizer & Live Chat Messages Timeline */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 my-4 min-h-0">
        
        {/* Left Side: Visualizer & Status Area */}
        <div className="w-full md:w-80 flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-xl shrink-0">
          {/* Pulsing Visualizer Waves */}
          <div className="relative w-36 h-36 flex items-center justify-center mb-4">
            <div
              className={`absolute inset-0 rounded-full bg-indigo-500/20 border border-indigo-500/30 transition-transform duration-500 scale-110 ${
                aiState === "speaking" ? "animate-ping opacity-75" : ""
              }`}
            />
            <div
              className={`absolute inset-3 rounded-full bg-pink-500/20 border border-pink-500/30 transition-transform duration-500 scale-105 ${
                aiState === "listening" ? "animate-pulse" : ""
              }`}
            />
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl shadow-xl transition-all duration-500 ${
                aiState === "speaking"
                  ? "bg-gradient-to-tr from-indigo-600 to-purple-600 scale-110 border border-indigo-400/50"
                  : aiState === "listening"
                  ? "bg-gradient-to-tr from-pink-500 to-rose-500 scale-105 border border-pink-400/50"
                  : "bg-slate-900 border border-white/10"
              }`}
            >
              {aiState === "speaking" ? "🗣️" : aiState === "listening" ? "🎙️" : "💤"}
            </div>
          </div>

          {/* AI State Title */}
          <h2 className="text-lg font-bold tracking-wide text-center">
            {aiState === "speaking"
              ? "Gia sư AI đang nói..."
              : aiState === "listening"
              ? "Gia sư đang lắng nghe bạn..."
              : connected
              ? "Đã kết nối - Hãy nói"
              : "Chưa kết nối"}
          </h2>
          
          {/* Status helper text */}
          <p className="text-xs text-slate-400 mt-1.5 text-center leading-relaxed">
            {statusText}
          </p>

          {/* Connect / Disconnect Toggle Button */}
          <button
            onClick={handleToggle}
            className={`w-full mt-6 py-3 rounded-2xl font-bold text-xs tracking-wide shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
              connected
                ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 animate-pulse"
            }`}
          >
            <span>{connected ? "🛑 Ngắt đàm thoại Live" : "🎙️ Bật Live Voice (Đàm thoại trực tiếp)"}</span>
          </button>
        </div>

        {/* Right Side: Live Chat Conversation Timeline */}
        <div className="flex-1 flex flex-col bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-xl overflow-hidden min-h-[350px]">
          {/* Chat Header */}
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-2">
              <span className="text-base">💬</span>
              <h3 className="font-extrabold text-sm text-slate-200">Đoạn Hội Thoại Trực Tiếp (Live Chat)</h3>
            </div>
            <span className="text-[10px] text-slate-400">
              {chatMessages.length} câu trò chuyện
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs max-h-[380px]">
            {chatMessages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold text-slate-400">
                    <span>{isUser ? "👤 Bạn" : `🤖 ${tutorName}`}</span>
                    <span className="text-[9px] text-slate-500 font-normal">{msg.timestamp}</span>
                  </div>
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-xs shadow-md"
                        : "bg-slate-800 border border-white/10 text-slate-100 rounded-tl-xs shadow-md"
                    }`}
                  >
                    <p className="whitespace-pre-line text-xs font-medium">{msg.text}</p>

                    {!isUser && (
                      <button
                        onClick={() => speakText(msg.text)}
                        className="mt-2 text-[10px] text-indigo-300 hover:text-indigo-200 font-bold flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md transition-colors"
                      >
                        🔊 Nghe lại
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Manual Input Footer */}
          <form
            onSubmit={handleManualSubmit}
            className="p-3 border-t border-white/10 bg-slate-900/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Nhập tin nhắn hoặc nói trực tiếp qua Micro..."
              disabled={isSending}
              className="flex-1 bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || isSending}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSending ? "..." : "Gửi"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="pt-2 text-center">
        <p className="text-[11px] text-slate-400">
          💡 <span className="font-semibold text-slate-300">Mẹo:</span> Bạn chỉ cần bấm <span className="text-indigo-400 font-bold">Bật Live Voice</span> và nói tự nhiên vào Micro. Toàn bộ câu nói của bạn và câu trả lời của Gia sư AI sẽ hiển thị theo thời gian thực trên khung hội thoại bên phải.
        </p>
      </div>
    </div>
  );
}
