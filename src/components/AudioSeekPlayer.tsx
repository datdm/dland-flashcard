"use client";

import React, { useState, useRef, useEffect } from "react";

interface AudioSeekPlayerProps {
  textToSpeak: string;
  lang?: string;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
}

export default function AudioSeekPlayer({
  textToSpeak,
  lang = "ja",
  title = "Bài nghe",
  className = "",
  autoPlay = false,
  onEnded,
}: AudioSeekPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Clean audio URL when unmounting or changing text
  useEffect(() => {
    let active = true;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (!textToSpeak.trim()) {
      setAudioSrc(null);
      return;
    }

    const loadAudio = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textToSpeak, lang }),
        });

        if (!res.ok) throw new Error("Không thể tải âm thanh");
        const blob = await res.blob();
        if (!active) return;
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);
      } catch (err: any) {
        if (!active) return;
        console.warn("API TTS failed, fallback available:", err.message);
        setError("Không tải được audio stream, chuyển sang SpeechSynthesis.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadAudio();

    return () => {
      active = false;
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [textToSpeak, lang]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (audioSrc && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
          console.error("Play error:", e);
          setIsPlaying(false);
        });
      }
    } else if (error && typeof window !== "undefined" && "speechSynthesis" in window) {
      // Fallback: SpeechSynthesis if stream fails
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textToSpeak);
        utter.lang = lang === "ja" ? "ja-JP" : lang === "en" ? "en-US" : "de-DE";
        utter.rate = playbackRate;
        utter.onend = () => setIsPlaying(false);
        utter.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utter);
        setIsPlaying(true);
      }
    }
  };

  // Seek by seconds
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSeconds = parseFloat(e.target.value);
    setCurrentTime(targetSeconds);
    if (audioRef.current) {
      audioRef.current.currentTime = targetSeconds;
    }
  };

  // Jump by relative seconds (+/- 5s)
  const jumpSeconds = (delta: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Change playback speed
  const changeRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/80 shadow-xs space-y-3.5 ${className}`}>
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              audioRef.current.playbackRate = playbackRate;
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            if (onEnded) onEnded();
          }}
          onError={() => {
            setIsPlaying(false);
            setError("Lỗi khi phát audio");
          }}
        />
      )}

      {/* Header Info */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg">🎧</span>
          <div>
            <span className="text-xs font-black text-amber-950 block">{title}</span>
            <span className="text-[10px] text-amber-700 font-medium">
              {isLoading ? "Đang chuẩn bị âm thanh..." : isPlaying ? "Đang phát..." : "Sẵn sàng nghe bài"}
            </span>
          </div>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-amber-900 font-bold mr-1">Tốc độ:</span>
          {[0.8, 1.0, 1.2, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => changeRate(rate)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                playbackRate === rate
                  ? "bg-amber-600 text-white shadow-3xs"
                  : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-50"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Seek Bar & Time Display */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-bold text-amber-950 w-10 text-right">
            {formatTime(currentTime)}
          </span>

          {/* Interactive Seek Bar */}
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              disabled={isLoading || duration === 0}
              aria-label="Tua thời gian bài nghe"
              className="w-full h-2 bg-amber-200/80 rounded-lg appearance-none cursor-pointer accent-amber-600 focus:outline-none"
            />
          </div>

          <span className="text-[11px] font-mono font-bold text-amber-800/80 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Player Control Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Rewind 5s */}
          <button
            type="button"
            onClick={() => jumpSeconds(-5)}
            disabled={isLoading || duration === 0}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-40"
            title="Tua lùi 5 giây"
          >
            <span>⏪</span>
            <span>-5s</span>
          </button>

          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={isLoading}
            className={`px-5 py-2 rounded-xl text-xs font-black text-white transition-all shadow-sm cursor-pointer flex items-center gap-2 active:scale-95 ${
              isPlaying
                ? "bg-rose-500 hover:bg-rose-600 animate-pulse shadow-rose-200"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isPlaying ? "⏸ Tạm dừng" : "▶️ Phát bài nghe"}</span>
            )}
          </button>

          {/* Forward 5s */}
          <button
            type="button"
            onClick={() => jumpSeconds(5)}
            disabled={isLoading || duration === 0}
            className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-40"
            title="Tua tới 5 giây"
          >
            <span>+5s</span>
            <span>⏩</span>
          </button>
        </div>

        <span className="text-[10px] text-amber-800/80 italic hidden sm:inline">
          💡 Kéo thanh trượt để di chuyển số giây tùy thích
        </span>
      </div>
    </div>
  );
}
