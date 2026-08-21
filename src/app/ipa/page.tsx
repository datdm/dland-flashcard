"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import IpaPracticeModule from "@/components/IpaPracticeModule";

export default function IpaPracticePage() {
  const handleRecordHistory = (entry: {
    type: "shadowing" | "translation" | "reading" | "presentation" | "ipa";
    typeName: string;
    topic: string;
    lang: string;
    score: number;
    userAnswer?: string;
    correctAnswer?: string;
    feedback?: string;
  }) => {
    if (typeof window === "undefined") return;
    const newEntry = {
      id: `ipa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "ipa",
      typeName: entry.typeName,
      topic: entry.topic,
      lang: "en",
      score: entry.score,
      userAnswer: entry.userAnswer,
      correctAnswer: entry.correctAnswer,
      feedback: entry.feedback,
      completedAt: new Date().toISOString(),
    };

    try {
      const stored = localStorage.getItem("flashcash-practice-history");
      const currentList = stored ? JSON.parse(stored) : [];
      const updated = [newEntry, ...currentList].slice(0, 100);
      localStorage.setItem("flashcash-practice-history", JSON.stringify(updated));
      window.dispatchEvent(new Event("practice-history-updated"));
    } catch (e) {
      console.error("Failed to save IPA practice history:", e);
    }
  };

  return (
    <AuthGuard featureName="Phòng Luyện Phát Âm IPA">
      <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-indigo-600 font-medium">Trang chủ</Link>
          <span>/</span>
          <Link href="/practice" className="hover:text-indigo-600 font-medium">Trung tâm Luyện tập</Link>
          <span>/</span>
          <span className="font-bold text-indigo-700">Luyện Phát Âm IPA & Cặp Âm</span>
        </div>

        {/* Header Banner */}
        <div className="rounded-3xl p-6 sm:p-8 text-white shadow-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
                🇬🇧 English Phonetics Hub
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
                Luyện Phát Âm IPA & Cặp Âm (Minimal Pairs)
              </h1>
              <p className="text-xs sm:text-sm text-indigo-100/90 mt-2 leading-relaxed max-w-3xl">
                Làm chủ trọn vẹn <strong>44 âm IPA</strong> (20 nguyên âm, 24 phụ âm), tinh chỉnh khẩu hình miệng chuẩn xác, rèn các cặp âm dễ nhầm lẫn (<strong>/s/ - /ʃ/</strong>, <strong>/θ/ - /ð/</strong>, <strong>/iː/ - /ɪ/</strong>, <strong>/p/ - /b/</strong>, <strong>/æ/ - /e/</strong>) và thu âm chấm điểm trực tiếp qua Micro AI.
              </p>
            </div>
            
            <div className="flex sm:flex-col gap-2 shrink-0 self-start sm:self-auto">
              <Link
                href="/practice"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm text-white"
              >
                <span>🏆</span>
                <span>Trung Tâm Luyện Tập</span>
              </Link>
              <Link
                href="/curriculum"
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm text-white"
              >
                <span>📚</span>
                <span>Lộ Trình IELTS 7.0</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Interactive IPA Module */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
          <IpaPracticeModule onRecordHistory={handleRecordHistory} />
        </div>
      </div>
    </AuthGuard>
  );
}
