"use client";

import { useEffect, useState } from "react";

interface FullScreenLoadingProps {
  show: boolean;
  delayMs?: number;
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}

export default function FullScreenLoading({
  show,
  delayMs = 5000,
  title = "Đang kết nối Server & tải dữ liệu...",
  subtitle = "Hệ thống đang chờ phản hồi từ API Server, quá trình này lâu hơn bình thường.",
  onRetry,
}: FullScreenLoadingProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!show) {
      setShouldRender(false);
      setElapsedSeconds(0);
      return;
    }

    const startTime = Date.now();

    // Delay showing full screen loading until delayMs (default 5s) elapses without API response
    const delayTimer = setTimeout(() => {
      setShouldRender(true);
    }, delayMs);

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedSeconds(Math.round(elapsed * 10) / 10);
    }, 100);

    return () => {
      clearTimeout(delayTimer);
      clearInterval(interval);
    };
  }, [show, delayMs]);

  if (!show || !shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white transition-opacity duration-300 animate-in fade-in">
      {/* Glow Effect Background */}
      <div className="absolute w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute w-72 h-72 bg-purple-600/20 rounded-full blur-2xl pointer-events-none animate-pulse delay-700" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md space-y-6">
        {/* Animated Rings & Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-cyan-400 border-l-transparent animate-spin" />
          <div className="absolute w-16 h-16 rounded-full border-4 border-dashed border-indigo-400/40 animate-spin-slow" />
          <span className="absolute text-3xl animate-bounce">⚡</span>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="text-lg font-black tracking-tight text-white">{title}</h3>
          <p className="text-xs text-gray-300 leading-relaxed font-medium">{subtitle}</p>
        </div>

        {/* Live Timer Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 border border-white/15 rounded-full text-[11px] font-mono font-bold text-amber-300 shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Thời gian chờ API: {elapsedSeconds.toFixed(1)}s</span>
        </div>

        {/* Delayed Notice & Retry Button */}
        <div className="pt-2 animate-in fade-in duration-300 space-y-3">
          <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 font-medium">
            ⚠️ API chưa phản hồi sau {elapsedSeconds.toFixed(1)}s. Vui lòng không đóng trang hoặc thử lại bên dưới.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer border border-indigo-400/30"
            >
              🔄 Thử tải lại API
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

