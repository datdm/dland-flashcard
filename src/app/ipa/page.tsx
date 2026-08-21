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
      <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-indigo-600 font-medium">Trang chủ</Link>
          <span>/</span>
          <span className="font-bold text-indigo-700">Luyện Phát Âm IPA & Cặp Âm (Minimal Pairs)</span>
        </div>

        {/* Interactive IPA Module */}
        <IpaPracticeModule onRecordHistory={handleRecordHistory} />
      </div>
    </AuthGuard>
  );
}
