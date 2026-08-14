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
  ja: `Bạn là một gia sư Tiếng Nhật bản xứ tên Sakura, nói chuyện vô cùng thân thiện, dễ thương, kiên nhẫn.
Nhiệm vụ của bạn:
1. Nói chuyện, giao tiếp bằng tiếng Nhật chậm rãi, dễ nghe, phù hợp với người học.
2. Trả lời cực kỳ ngắn gọn (chỉ 1-2 câu ngắn).
3. Nếu người dùng nói sai, hãy nhẹ nhàng sửa lỗi và gợi ý cách nói chuẩn.
4. Đôi khi dùng 1-2 câu tiếng Việt ngắn để giải thích nếu người dùng gặp khó khăn.`,

  en: `You are Sarah, a warm and friendly native English tutor.
Your tasks:
1. Converse in simple, clear, and natural English.
2. Keep your responses very brief (1-2 sentences max) to make it easy to follow.
3. Gently correct the user's grammar or pronunciation mistakes if you spot them.`,

  de: `Du bist Anna, eine freundliche und geduldige Deutschlehrerin.
Deine Aufgaben:
1. Unterhalte dich in einfachem, klarem Deutsch.
2. Halte deine Antworten sehr kurz (maximal 1-2 Sätze).
3. Korrigiere die Fehler des Nutzers auf eine sehr freundliche Weise.`
};

const LIVE_MODELS = [
  { id: "models/gemini-2.0-flash-exp", label: "Gemini 2.0 Flash Live" },
  { id: "models/gemini-2.5-flash-native-audio-dialog", label: "Gemini 2.5 Flash Native Audio" },
  { id: "models/gemini-3-flash-live", label: "Gemini 3 Flash Live" },
  { id: "models/gemini-3.5-live-translate-preview", label: "Gemini 3.5 Live Translate" }
];

export default function GeminiLivePage() {
  const { activeLanguage } = useLanguageSetting();
  const [connected, setConnected] = useState(false);
  const [statusText, setStatusText] = useState("Sẵn sàng đàm thoại");
  const [lastTranscript, setLastTranscript] = useState("");
  const [aiState, setAiState] = useState<"idle" | "listening" | "speaking">("idle");
  const [selectedModel, setSelectedModel] = useState<string>("models/gemini-2.0-flash-exp");
  const [mounted, setMounted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const micContextRef = useRef<AudioContext | null>(null);
  const playContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Playback scheduler
  const nextPlayTimeRef = useRef<number>(0);

  // Set mounted state on client mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto clean audio synthesis when exiting
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      setStatusText("Đang kết nối WebSocket...");
      setAiState("idle");

      // 1. Establish WebSocket connection to backend proxy (using process.env.NEXT_PUBLIC_API_URL)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const wsUrl = apiUrl.replace(/^http/, "ws") + "/api/live";

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setStatusText("Đã kết nối. Đang thiết lập cấu hình...");
        sendSetup();
      };

      ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle incoming text transcript (if any)
          if (message.serverContent?.modelTurn?.parts) {
            setAiState("speaking");
            const textPart = message.serverContent.modelTurn.parts.find((p: any) => p.text);
            if (textPart) {
              setLastTranscript((prev) => prev ? `${prev} ${textPart.text}` : textPart.text);
            }

            // Handle incoming Audio PCM data (24kHz)
            const audioPart = message.serverContent.modelTurn.parts.find(
              (p: any) => p.inlineData && p.inlineData.mimeType?.includes("audio")
            );

            if (audioPart && audioPart.inlineData.data) {
              await playAudioBase64(audioPart.inlineData.data);
            }
          }

          // Reset AI state when Gemini stops speaking
          if (message.serverContent?.turnComplete) {
            setTimeout(() => setAiState("idle"), 500);
          }
        } catch (e) {
          console.error("Error processing WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setStatusText("Lỗi kết nối máy chủ");
      };

      ws.onclose = (event: CloseEvent) => {
        setConnected(false);
        const reasonText = event.reason ? `: ${event.reason}` : "";
        setStatusText(`Kết nối đã ngắt${reasonText}`);
        cleanupAudio();
      };

    } catch (error) {
      console.error("Failed to connect:", error);
      setStatusText("Không thể bắt đầu ghi âm");
      disconnect();
    }
  };

  const sendSetup = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const currentInstruction = SYSTEM_INSTRUCTIONS[activeLanguage.code] || SYSTEM_INSTRUCTIONS.ja;

    const setupMsg = {
      setup: {
        model: selectedModel,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede" // Female high-quality voice
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: currentInstruction }]
        }
      }
    };

    ws.send(JSON.stringify(setupMsg));
    setStatusText("Kết nối Live thành công! Hãy bắt đầu nói.");
    startRecording();
  };

  const startRecording = async () => {
    try {
      // 1. Initialize Microphone AudioContext downsampled to 16kHz
      const micContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });
      micContextRef.current = micContext;

      // 2. Request mic input
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = micStream;

      const source = micContext.createMediaStreamSource(micStream);
      
      // 3. Script processor to collect PCM chunks (2048 buffers)
      const processor = micContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(micContext.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Update user radar wave depending on signal amplitude
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        if (rms > 0.05 && aiState !== "speaking") {
          setAiState("listening");
        } else if (rms <= 0.05 && aiState === "listening") {
          setAiState("idle");
        }

        // Convert and send PCM base64 chunks
        const pcmBuffer = floatTo16BitPCM(inputData);
        const base64Data = arrayBufferToBase64(pcmBuffer);

        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [
                {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Data
                }
              ]
            }
          }));
        }
      };

      // Initialize playback AudioContext (24kHz output)
      playContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000
      });
      nextPlayTimeRef.current = 0;

    } catch (e) {
      console.error("Microphone capture failed:", e);
      setStatusText("Lỗi truy cập Microphone!");
      disconnect();
    }
  };

  const playAudioBase64 = async (base64: string) => {
    const playContext = playContextRef.current;
    if (!playContext) return;

    try {
      // Decode base64
      const binary = window.atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Convert 16-bit PCM integer samples to Float32 floats
      const pcmData = new Int16Array(bytes.buffer);
      const floats = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        floats[i] = pcmData[i] / 0x8000;
      }

      if (playContext.state === "suspended") {
        await playContext.resume();
      }

      const audioBuffer = playContext.createBuffer(1, floats.length, 24000);
      audioBuffer.getChannelData(0).set(floats);

      const source = playContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(playContext.destination);

      // Gapless scheduler
      const now = playContext.currentTime;
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.05;
      }
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;

    } catch (error) {
      console.error("Error decoding and playing audio chunk:", error);
    }
  };

  const cleanupAudio = () => {
    setAiState("idle");

    // Stop mic stream
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    // Disconnect nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Close AudioContexts
    if (micContextRef.current) {
      micContextRef.current.close();
      micContextRef.current = null;
    }

    if (playContextRef.current) {
      playContextRef.current.close();
      playContextRef.current = null;
    }
  };

  const disconnect = () => {
    setConnected(false);

    // Close WS
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    cleanupAudio();
  };

  const handleToggle = () => {
    if (connected) {
      disconnect();
      setStatusText("Đã ngắt kết nối.");
    } else {
      connect();
    }
  };

  const flagEmoji = activeLanguage.code === "de" ? "🇩🇪" : activeLanguage.code === "en" ? "🇬🇧" : "🇯🇵";
  const langName = activeLanguage.code === "de" ? "Tiếng Đức" : activeLanguage.code === "en" ? "Tiếng Anh" : "Tiếng Nhật";

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-semibold">
        Đang khởi động chế độ Live Voice...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 md:p-6 pb-20">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-2">
        <Link href="/chat" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
          ← Quay lại Chat thường
        </Link>
        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={connected}
            className="bg-slate-900 border border-white/15 rounded-full px-3 py-1 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
            title="Chọn Gemini Live Model"
          >
            {LIVE_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <span>{flagEmoji}</span>
            <span>Tutor: {langName}</span>
          </div>
        </div>
      </div>

      {/* Central Visualizer Area */}
      <div className="flex-1 flex flex-col items-center justify-center py-10 relative">
        {/* Pulsing Visualizer Waves */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <div
            className={`absolute inset-0 rounded-full bg-indigo-500/20 border border-indigo-500/30 transition-transform duration-500 scale-110 ${
              aiState === "speaking" ? "animate-ping opacity-75" : ""
            }`}
          />
          <div
            className={`absolute inset-4 rounded-full bg-pink-500/20 border border-pink-500/30 transition-transform duration-500 scale-105 ${
              aiState === "listening" ? "animate-pulse" : ""
            }`}
          />
          <div
            className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl shadow-xl transition-all duration-500 ${
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
        <h2 className="text-xl font-bold tracking-wide">
          {aiState === "speaking"
            ? "AI đang nói..."
            : aiState === "listening"
            ? "AI đang lắng nghe bạn..."
            : connected
            ? "Đang kết nối - Hãy nói"
            : "Chưa kết nối"}
        </h2>
        
        {/* Status helper text */}
        <p className="text-xs text-slate-400 mt-2 text-center max-w-sm px-6">
          {statusText}
        </p>

        {/* Dynamic speech translation transcription */}
        {lastTranscript && (
          <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-4 max-w-md w-full mx-auto text-sm text-slate-200 leading-relaxed text-center shadow-lg backdrop-blur-md">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              Phản hồi văn bản (Gemini Live)
            </span>
            {lastTranscript}
          </div>
        )}
      </div>

      {/* Bottom Button Area */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleToggle}
          className={`w-full sm:max-w-xs py-4 rounded-2xl font-bold tracking-wide shadow-lg transition-all duration-300 transform active:scale-95 ${
            connected
              ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
          }`}
        >
          {connected ? "Ngắt kết nối Live Voice" : "Bật Chế Độ Live Voice (Gemini Live)"}
        </button>
        <p className="text-[10px] text-slate-500 max-w-xs text-center leading-relaxed">
          Chế độ Live Voice đàm thoại trực tiếp độ trễ cực thấp. Khuyên dùng tai nghe để có trải nghiệm âm thanh tốt nhất.
        </p>
      </div>
    </div>
  );
}
