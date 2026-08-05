"use client";

import { useState } from "react";
import Link from "next/link";

interface ShadowingItem {
  id: string;
  japanese: string;
  japanese_ruby: string;
  romaji: string;
  meaning: string;
}

interface TranslationItem {
  id: string;
  direction: "ja-vi" | "vi-ja";
  source: string;
  source_ruby?: string;
  target: string;
  target_ruby?: string;
  pronunciation?: string;
  hint?: string;
}

interface ReadingOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface ReadingItem {
  passage: string;
  passage_ruby: string;
  question: string;
  options: ReadingOption[];
  explanation: string;
}

const POPULAR_TOPICS = [
  { id: "daily", name: "Sinh hoạt & Đời sống", icon: "🏡" },
  { id: "business", name: "Kinh doanh & Công sở", icon: "💼" },
  { id: "it", name: "Công nghệ & IT", icon: "💻" },
  { id: "travel", name: "Du lịch & Ẩm thực", icon: "🍣" },
  { id: "news", name: "Tin tức & Xã hội", icon: "📰" },
];

export default function PracticeHubPage() {
  // Config states
  const [selectedType, setSelectedType] = useState<"shadowing" | "translation" | "reading">("shadowing");
  const [selectedTopic, setSelectedTopic] = useState("Sinh hoạt & Đời sống");
  const [customTopic, setCustomTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [shadowingData, setShadowingData] = useState<ShadowingItem[]>([]);
  const [translationData, setTranslationData] = useState<TranslationItem[]>([]);
  const [readingData, setReadingData] = useState<ReadingItem | null>(null);

  // Interaction states
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [recognizingIndex, setRecognizingIndex] = useState<number | null>(null);
  const [recognitionTranscript, setRecognitionTranscript] = useState<string>("");
  const [showAnswerIdx, setShowAnswerIdx] = useState<Record<number, boolean>>({});
  const [translationInputs, setTranslationInputs] = useState<Record<number, string>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  const activeTopic = customTopic.trim() || selectedTopic;

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setSelectedOptionId(null);
    setShowAnswerIdx({});
    setTranslationInputs({});

    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType,
          topic: activeTopic,
          level: selectedType === "reading" ? "N2" : "N3", // N2 level reading by default, others N3
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối với máy chủ AI. Vui lòng thử lại!");
      }

      const resData = await res.json();
      if (resData.success && resData.data) {
        if (selectedType === "shadowing") {
          setShadowingData(resData.data.shadowing || []);
        } else if (selectedType === "translation") {
          setTranslationData(resData.data.translation || []);
        } else {
          setReadingData(resData.data.reading || null);
        }
      } else {
        throw new Error(resData.error || "Không thể tạo bài tập. Thử lại sau!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi tạo bài học.");
    } finally {
      setGenerating(false);
    }
  };

  // Play audio TTS
  const playSentence = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = playbackRate;
    window.speechSynthesis.speak(utterance);
  };

  // Speech recognition for shadowing
  const startShadowingMic = (targetText: string, index: number) => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ micro nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.");
      return;
    }

    if (recognizingIndex === index) {
      setRecognizingIndex(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;

    setRecognizingIndex(index);
    setRecognitionTranscript("Đang lắng nghe...");

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setRecognitionTranscript(text);
    };

    recognition.onerror = () => {
      setRecognitionTranscript("Không nhận diện được. Thử lại!");
      setRecognizingIndex(null);
    };

    recognition.onend = () => {
      setRecognizingIndex(null);
    };

    recognition.start();
  };

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-indigo-900 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
            JP Practice Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Trung Tâm Luyện Kỹ Năng Chuyên Sâu
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-2 leading-relaxed">
            Luyện Shadowing phát âm chuẩn, dịch thuật 2 chiều phản xạ nhanh, và luyện đọc hiểu N2 học thuật với Furigana trực quan trên chữ Hán tự.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>🛠️</span> Cấu hình bài luyện tập
            </h2>

            {/* Select Skill */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kỹ năng học:</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "shadowing", name: "🗣️ Shadowing JP", desc: "Luyện nghe nói đuổi" },
                  { id: "translation", name: "✍️ Luyện dịch 2 chiều", desc: "Dịch Việt - Nhật phản xạ" },
                  { id: "reading", name: "📚 Đọc hiểu JLPT N2", desc: "Đoạn văn dài có Furigana" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedType === item.id
                        ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-300"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-800">{item.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Topic */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chọn chủ đề có sẵn:</label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTopic(t.name);
                      setCustomTopic("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedTopic === t.name && !customTopic
                        ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Topic Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hoặc nhập chủ đề tự chọn:</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Ví dụ: Phỏng vấn xin việc, đi bác sĩ..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-teal-500 shadow-3xs"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md ${
                generating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-teal-200"
              }`}
            >
              {generating ? "🤖 Đang biên soạn nội dung..." : "🚀 Tạo bài luyện tập bằng AI"}
            </button>
          </div>
        </div>

        {/* Right Exercises Area */}
        <div className="lg:col-span-2 space-y-4">
          {generating ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 font-bold animate-pulse">
                Gia sư AI đang viết đoạn văn, tạo câu hỏi & đánh Furigana...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-3xl border border-red-100 text-center">
              <p className="font-bold text-sm">Đã xảy ra lỗi</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : (
            <>
              {/* SHADOWING DISPLAY */}
              {selectedType === "shadowing" && shadowingData.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-teal-50/50 rounded-2xl p-4 flex items-center justify-between border border-teal-100 text-xs">
                    <span className="font-bold text-teal-800">Tốc độ phát âm:</span>
                    <div className="flex gap-2">
                      {([0.6, 0.8, 1.0, 1.2] as const).map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setPlaybackRate(rate)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            playbackRate === rate
                              ? "bg-teal-600 text-white shadow-xs"
                              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {rate === 1.0 ? "Chuẩn" : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {shadowingData.map((item, idx) => (
                      <div key={item.id || idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-3 flex-1">
                            {/* Furigana Ruby Text rendering */}
                            <div 
                              className="text-xl font-bold text-gray-900 leading-loose tracking-wide ruby-box"
                              dangerouslySetInnerHTML={{ __html: item.japanese_ruby }}
                            />
                            <div className="text-[11px] text-gray-400 font-mono">
                              {item.romaji}
                            </div>
                            <div className="text-xs font-semibold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                              💡 Nghĩa: {item.meaning}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => playSentence(item.japanese)}
                              className="w-10 h-10 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center text-lg text-teal-600 transition-colors"
                              title="Phát âm câu mẫu"
                            >
                              🔊
                            </button>
                            <button
                              onClick={() => startShadowingMic(item.japanese, idx)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                                recognizingIndex === idx
                                  ? "bg-red-500 text-white animate-pulse"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                              }`}
                              title="Thu âm đọc lại"
                            >
                              🎙️
                            </button>
                          </div>
                        </div>

                        {/* Mic recognition output */}
                        {recognizingIndex === idx && (
                          <div className="mt-2 pt-3 border-t border-gray-100 text-xs bg-red-50/50 rounded-xl p-3 text-red-900 flex items-center justify-between">
                            <div>
                              <span className="font-bold">Nhận dạng giọng bạn:</span> {recognitionTranscript}
                            </div>
                            <button
                              onClick={() => setRecognizingIndex(null)}
                              className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-lg"
                            >
                              Dừng
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSLATION 2-WAY DISPLAY */}
              {selectedType === "translation" && translationData.length > 0 && (
                <div className="space-y-4">
                  {translationData.map((item, idx) => {
                    const isShown = showAnswerIdx[idx];
                    const isJaToVi = item.direction === "ja-vi";

                    return (
                      <div key={item.id || idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            {isJaToVi ? "Nhật ➔ Việt" : "Việt ➔ Nhật"}
                          </span>
                          {isJaToVi && (
                            <button
                              onClick={() => playSentence(item.source)}
                              className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1"
                            >
                              🔊 Nghe mẫu
                            </button>
                          )}
                        </div>

                        {/* Source box */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-base font-extrabold text-gray-800 leading-relaxed">
                          {isJaToVi && item.source_ruby ? (
                            <div dangerouslySetInnerHTML={{ __html: item.source_ruby }} />
                          ) : (
                            item.source
                          )}
                        </div>

                        {/* Translation draft textarea */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Bản dịch của bạn:</label>
                          <textarea
                            rows={2}
                            value={translationInputs[idx] || ""}
                            onChange={(e) =>
                              setTranslationInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                            }
                            placeholder="Nhập câu dịch tiếng Nhật hoặc tiếng Việt tương ứng..."
                            className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-teal-500 shadow-3xs"
                          />
                        </div>

                        {item.hint && (
                          <div className="text-[11px] text-indigo-600 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/50">
                            💡 Gợi ý: {item.hint}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setShowAnswerIdx((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 shadow-2xs transition-colors"
                          >
                            {isShown ? "Ẩn đáp án" : "Xem đáp án"}
                          </button>
                        </div>

                        {isShown && (
                          <div className="mt-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs space-y-2">
                            <div>
                              <span className="font-bold text-emerald-800">Đáp án chuẩn:</span>{" "}
                              {!isJaToVi && item.target_ruby ? (
                                <span 
                                  className="text-gray-900 font-bold leading-loose tracking-wide ruby-box ml-1 inline-block" 
                                  dangerouslySetInnerHTML={{ __html: item.target_ruby }} 
                                />
                              ) : (
                                <span className="text-gray-900 font-semibold">{item.target}</span>
                              )}
                            </div>
                            {item.pronunciation && (
                              <div className="text-gray-500 text-[10px] font-mono">
                                Phát âm: {item.pronunciation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* N2 READING DISPLAY */}
              {selectedType === "reading" && readingData && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      Bài đọc hiểu N2
                    </span>
                    <button
                      onClick={() => playSentence(readingData.passage)}
                      className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1"
                    >
                      🔊 Nghe bài đọc
                    </button>
                  </div>

                  {/* Reading Passage with soft paper style and Ruby text */}
                  <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 leading-loose text-base text-gray-800 font-semibold tracking-wide">
                    <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-2">Bài đọc (Passage):</div>
                    <div 
                      className="whitespace-pre-line text-gray-900 leading-loose ruby-box"
                      dangerouslySetInnerHTML={{ __html: readingData.passage_ruby }}
                    />
                  </div>

                  {/* Question */}
                  <div className="text-xs font-extrabold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    ❓ Câu hỏi: {readingData.question}
                  </div>

                  {/* Multiple choice options */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {readingData.options.map((opt) => {
                      const isAnswered = selectedOptionId !== null;
                      const isThisSelected = selectedOptionId === opt.id;
                      let btnStyle = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700";

                      if (isAnswered) {
                        if (opt.isCorrect) {
                          btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-300";
                        } else if (isThisSelected) {
                          btnStyle = "border-red-500 bg-red-50 text-red-800 font-bold ring-2 ring-red-300";
                        } else {
                          btnStyle = "border-gray-100 bg-gray-50/50 text-gray-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          disabled={isAnswered}
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.text}</span>
                          {isAnswered && opt.isCorrect && <span className="text-emerald-600 font-extrabold text-sm">✓</span>}
                          {isAnswered && isThisSelected && !opt.isCorrect && <span className="text-red-600 font-extrabold text-sm">✕</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation reveal */}
                  {selectedOptionId && (
                    <div className="mt-4 p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50 text-xs leading-relaxed space-y-2">
                      <div className="font-extrabold text-teal-800 flex items-center gap-1">
                        <span>💡</span> Hướng dẫn giải nghĩa & Ngữ pháp N2:
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{readingData.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* EMPTY VIEW STATE */}
              {!shadowingData.length && !translationData.length && !readingData && (
                <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <div className="text-4xl">🏆</div>
                  <h3 className="font-bold text-gray-900 text-sm mt-2">Chưa chọn nội dung học</h3>
                  <p className="text-[11px] text-gray-500 max-w-sm">
                    Vui lòng chọn kỹ năng và chủ đề bạn muốn luyện ở bảng điều khiển bên trái, sau đó nhấn nút "Tạo bài học AI" để tạo nội dung luyện tập chuyên sâu!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ruby text style tweaks */}
      <style jsx global>{`
        .ruby-box ruby {
          ruby-position: over;
          margin: 0 0.05em;
        }
        .ruby-box rt {
          font-size: 0.55em;
          color: #4f46e5; /* indigo-600 */
          letter-spacing: 0.05em;
          padding-bottom: 0.1em;
          font-weight: normal;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
