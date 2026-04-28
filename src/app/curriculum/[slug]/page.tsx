"use client";

import { useMemo } from "react";
import { use } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import LessonCard from "@/components/LessonCard";
import Link from "next/link";

export default function CurriculumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const curriculum = decodeURIComponent(slug);
  const { lessons } = useLessons();
  const { progress } = useProgress();

  const curriculumLessons = useMemo(
    () => lessons.filter((l) => (l.curriculum || "Chưa phân loại") === curriculum),
    [lessons, curriculum]
  );

  const totalVocab = curriculumLessons.reduce((sum, l) => sum + l.vocabulary.length, 0);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">{curriculum}</h1>
        <span className="text-sm text-gray-500">{curriculumLessons.length} bài · {totalVocab} từ</span>
      </div>

      {curriculumLessons.length > 0 && (
        <Link
          href={`/flashcard/curriculum/${slug}`}
          className="flex items-center justify-between w-full bg-indigo-600 text-white rounded-2xl p-4 mb-6 hover:bg-indigo-700 transition-colors"
        >
          <span className="font-bold">Flashcard toàn bộ giáo trình</span>
          <span className="text-indigo-200 text-sm">{totalVocab} từ →</span>
        </Link>
      )}

      <div className="space-y-4">
        {curriculumLessons.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Không có bài học nào</p>
        ) : (
          curriculumLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} progress={progress} />
          ))
        )}
      </div>
    </div>
  );
}
