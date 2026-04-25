"use client";

import { use } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import Link from "next/link";

export default function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getLessonById, lessons } = useLessons();
  const { getVocabProgress, toggleLearned, toggleFavorite } = useProgress();

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Chưa có dữ liệu.</p>
        <Link href="/upload" className="text-indigo-600 underline text-sm">Đến trang Upload</Link>
      </div>
    );
  }

  const lesson = getLessonById(id);
  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Không tìm thấy bài học.</p>
        <Link href="/" className="text-indigo-600 underline text-sm">Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
        <Link
          href={`/flashcard/lesson/${id}`}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Flashcard →
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">{lesson.name}</h1>
      {lesson.description && <p className="text-sm text-gray-500 mb-4">{lesson.description}</p>}
      <p className="text-xs text-gray-400 mb-4">{lesson.vocabulary.length} từ vựng</p>
      <div className="space-y-3">
        {lesson.vocabulary.map((vocab) => (
          <VocabularyListItem
            key={vocab.id}
            vocab={vocab}
            progress={getVocabProgress(vocab.id)}
            onToggleLearned={toggleLearned}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </div>
  );
}