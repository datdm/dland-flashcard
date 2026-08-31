"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ShadowingVideo, SubtitleChunk, ShadowingMode } from "@/types/shadowing";
import ShadowingSubtitleCard from "./ShadowingSubtitleCard";
import DictationMode from "./DictationMode";
import PronunciationMode from "./PronunciationMode";
import SelectionLookupTooltip from "@/components/SelectionLookupTooltip";
import MaziiQuickLookupModal from "@/components/MaziiQuickLookupModal";
import Link from "next/link";

interface Props {
  video: ShadowingVideo;
  initialMode?: ShadowingMode;
}

export default function YouTubeShadowingPlayer({ video, initialMode = "shadowing" }: Props) {
  const [activeMode, setActiveMode] = useState<ShadowingMode>(initialMode);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [autoPause, setAutoPause] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showFurigana, setShowFurigana] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  const [isRecording, setIsRecording] = useState(false);
  const [speechScores, setSpeechScores] = useState<Record<number, { text: string; score: number }>>({});
  const recognitionRef = useRef<any>(null);

  const [maziiState, setMaziiState] = useState<{ isOpen: boolean; queryWord: string }>({
    isOpen: false,
    queryWord: "",
  });

  const playerRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const isAutoPausedRef = useRef<boolean>(false);

  const currentChunk: SubtitleChunk | undefined = video.subtitles[currentChunkIndex];

  useEffect(() => {
    const globalWindow = window as any;
    if (!globalWindow.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!globalWindow.YT || !globalWindow.YT.Player) return;

      playerRef.current = new globalWindow.YT.Player("youtube-player-embed", {
        videoId: video.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            event.target.setPlaybackRate(playbackRate);
          },
          onStateChange: (event: any) => {
            if (event.data === globalWindow.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              isAutoPausedRef.current = false;
            } else if (event.data === globalWindow.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (globalWindow.YT && globalWindow.YT.Player) {
      initPlayer();
    } else {
      globalWindow.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [video.youtubeId]);

  useEffect(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = setInterval(() => {
      if (!playerRef.current || !playerRef.current.getCurrentTime || !isPlaying) return;

      const currentTime = playerRef.current.getCurrentTime();
      const currentTargetChunk = video.subtitles[currentChunkIndex];

      if (!currentTargetChunk) return;

      if (currentTime >= currentTargetChunk.endTime) {
        if (isLooping) {
          playerRef.current.seekTo(currentTargetChunk.startTime, true);
        } else if (autoPause && !isAutoPausedRef.current) {
          isAutoPausedRef.current = true;
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          if (currentChunkIndex < video.subtitles.length - 1) {
            setCurrentChunkIndex((prev) => prev + 1);
          }
        }
      }
    }, 150);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying, currentChunkIndex, isLooping, autoPause, video.subtitles]);

  const seekToChunk = useCallback(
    (index: number, andPlay = true) => {
      if (index < 0 || index >= video.subtitles.length) return;
      setCurrentChunkIndex(index);
      const target = video.subtitles[index];
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(target.startTime, true);
        if (andPlay) {
          playerRef.current.playVideo();
          setIsPlaying(true);
          isAutoPausedRef.current = false;
        }
      }
    },
    [video.subtitles]
  );

  const handlePrev = () => seekToChunk(Math.max(0, currentChunkIndex - 1));
  const handleNext = () => seekToChunk(Math.min(video.subtitles.length - 1, currentChunkIndex + 1));
  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      if (currentChunk) {
        const cur = playerRef.current.getCurrentTime();
        if (cur < currentChunk.startTime || cur >= currentChunk.endTime) {
          playerRef.current.seekTo(currentChunk.startTime, true);
        }
      }
      playerRef.current.playVideo();
      setIsPlaying(true);
      isAutoPausedRef.current = false;
    }
  };

  const handleToggleSpeed = () => {
    const speeds = [0.75, 0.9, 1.0, 1.25];
    const curIdx = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(curIdx + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(nextSpeed);
    }
  };

  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Trình duyệt của bạn chưa hỗ trợ Web Speech API. Vui lòng dùng Google Chrome / Edge.");
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang = video.languageCode === "en" ? "en-US" : video.languageCode === "de" ? "de-DE" : "ja-JP";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (!currentChunk) return;

      const target = currentChunk.japanese.replace(/[^\p{L}\p{N}]/gu, "");
      const spoken = transcript.replace(/[^\p{L}\p{N}]/gu, "");

      let matches = 0;
      for (const char of spoken) {
        if (target.includes(char)) matches++;
      }
      const score = Math.min(100, Math.round((matches / Math.max(1, target.length)) * 100));

      setSpeechScores((prev) => ({
        ...prev,
        [currentChunk.id]: { text: transcript, score },
      }));
    };

    recognitionRef.current = rec;
    rec.start();
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Modes Navigation Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-gray-200">
        <div className="flex items-center gap-1 sm:gap-2 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/80">
          <button
            onClick={() => setActiveMode("shadowing")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeMode === "shadowing"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Bắt chước phát âm
          </button>
          <button
            onClick={() => setActiveMode("dictation")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeMode === "dictation"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Nghe - Viết chính tả
          </button>
          <button
            onClick={() => setActiveMode("pronunciation")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeMode === "pronunciation"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Chỉnh phát âm
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shadowing"
            className="text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <span>‹</span>
            <span>Quay lại</span>
          </Link>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-extrabold border border-indigo-100">
            {video.level}
          </span>
        </div>
      </div>

      {/* Video Title */}
      <div>
        <h1 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
          {video.title}
        </h1>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
          <span>📺 {video.channelTitle}</span>
          <span>•</span>
          <span>{video.subtitles.length} câu phụ đề</span>
        </p>
      </div>

      {/* YouTube Video Player Embed */}
      <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 relative aspect-video max-w-5xl mx-auto">
        <div id="youtube-player-embed" className="w-full h-full" />
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handlePrev}
            disabled={currentChunkIndex === 0}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            title="Câu trước (⏮)"
          >
            ⏮
          </button>
          <button
            onClick={() => setIsLooping((prev) => !prev)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer ${
              isLooping ? "bg-indigo-600 text-white shadow-xs" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
            title={isLooping ? "Đang bật lặp lại câu (🔁)" : "Bật lặp lại câu"}
          >
            🔁
          </button>
          <button
            onClick={handleTogglePlay}
            className="w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-200 transition-all cursor-pointer active:scale-95"
            title={isPlaying ? "Tạm dừng" : "Phát câu hiện tại"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={handleNext}
            disabled={currentChunkIndex === video.subtitles.length - 1}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            title="Câu tiếp theo (⏭)"
          >
            ⏭
          </button>

          <span className="text-xs font-black text-gray-500 pl-2">
            {currentChunkIndex + 1}/{video.subtitles.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => setAutoPause((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              autoPause
                ? "bg-indigo-50 border border-indigo-200 text-indigo-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {autoPause ? "✓ Tự ngắt câu" : "Tự ngắt câu"}
          </button>

          <button
            onClick={() => setShowTranslation((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              showTranslation
                ? "bg-indigo-50 border border-indigo-200 text-indigo-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>🌐</span>
            <span>Bản dịch</span>
          </button>

          <button
            onClick={() => setShowFurigana((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              showFurigana
                ? "bg-indigo-50 border border-indigo-200 text-indigo-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>🈳</span>
            <span>Furigana</span>
          </button>

          <button
            onClick={handleToggleSpeed}
            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black transition-colors cursor-pointer"
            title="Đổi tốc độ phát"
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* Mode Specific Body */}
      {currentChunk && (
        <>
          {activeMode === "shadowing" && (
            <div className="space-y-4">
              <ShadowingSubtitleCard
                chunk={currentChunk}
                showTranslation={showTranslation}
                showFurigana={showFurigana}
                onOpenMazii={(word) => setMaziiState({ isOpen: true, queryWord: word })}
                onRecordVoice={startSpeechRecognition}
                isRecording={isRecording}
                speechScore={speechScores[currentChunk.id]?.score ?? null}
                speechTranscript={speechScores[currentChunk.id]?.text ?? null}
              />

              <div className="flex items-center justify-center pt-2">
                <button
                  onClick={startSpeechRecognition}
                  disabled={isRecording}
                  className={`px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse shadow-rose-200"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200"
                  }`}
                >
                  <span className="text-lg">{isRecording ? "🔴" : "🎙️"}</span>
                  <span>{isRecording ? "Đang ghi âm (Hãy nói theo)..." : "Bấm Micro & Nói theo câu này"}</span>
                </button>
              </div>
            </div>
          )}

          {activeMode === "dictation" && (
            <DictationMode
              chunk={currentChunk}
              onNextSentence={handleNext}
              onPrevSentence={handlePrev}
              onPlayAudio={() => seekToChunk(currentChunkIndex, true)}
            />
          )}

          {activeMode === "pronunciation" && (
            <PronunciationMode
              chunk={currentChunk}
              onRecordVoice={startSpeechRecognition}
              isRecording={isRecording}
              speechScore={speechScores[currentChunk.id]?.score ?? null}
              speechTranscript={speechScores[currentChunk.id]?.text ?? null}
              onPlayNativeAudio={() => seekToChunk(currentChunkIndex, true)}
            />
          )}
        </>
      )}

      {/* All Subtitle Timeline Browser */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-3">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-wider">
          Toàn bộ danh sách câu trong video ({video.subtitles.length})
        </h3>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto custom-scrollbar">
          {video.subtitles.map((chunk: SubtitleChunk, idx: number) => (
            <div
              key={chunk.id}
              onClick={() => seekToChunk(idx, true)}
              className={`p-3 rounded-2xl transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                idx === currentChunkIndex
                  ? "bg-indigo-50/80 text-indigo-950 font-bold"
                  : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[11px] font-bold text-gray-400 mt-0.5 shrink-0">
                  #{idx + 1}
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-semibold">{chunk.japanese}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{chunk.vietnamese}</p>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-mono shrink-0">
                {Math.floor(chunk.startTime / 60)}:{Math.floor(chunk.startTime % 60).toString().padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SelectionLookupTooltip
        onLookup={(word) => setMaziiState({ isOpen: true, queryWord: word })}
      />
      <MaziiQuickLookupModal
        isOpen={maziiState.isOpen}
        onClose={() => setMaziiState({ isOpen: false, queryWord: "" })}
        queryWord={maziiState.queryWord}
      />
    </div>
  );
}
