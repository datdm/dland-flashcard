"use client";

import { useMemo } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import CurriculumCard from "@/components/CurriculumCard";
import Link from "next/link";

export default function HomePage() {
  const { lessons } = useLessons();
  const { progress } = useProgress();

  const curricula = useMemo(() => {
    const groups: Record<string, typeof lessons> = {};
    for (const lesson of lessons) {
      const key = lesson.curriculum || "Chưa phân loại";
      if (!groups[key]) groups[key] = [];
      groups[key].push(lesson);
    }
    return Object.entries(groups);
  }, [lessons]);

  const totalVocab = lessons.reduce((sum, l) => sum + l.vocabulary.length, 0);
  const totalLearned = lessons.flatMap((l) => l.vocabulary).filter((v) => progress[v.id]?.learned).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {lessons.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-700">{curricula.length}</p>
            <p className="text-xs text-indigo-500 mt-0.5">Giáo trình</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{totalLearned}</p>
            <p className="text-xs text-emerald-500 mt-0.5">Đã học</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{totalVocab - totalLearned}</p>
            <p className="text-xs text-amber-500 mt-0.5">Chưa học</p>
          </div>
        </div>
      )}
      {lessons.length > 0 && (
        <div className="flex gap-2 mb-6">
          <Link href="/flashcard/all" className="flex-1 text-center bg-indigo-600 text-white rounded-2xl py-3 font-bold hover:bg-indigo-700 transition-colors">
            Ôn tập tổng hợp
          </Link>
          <Link href="/flashcard/favorites" className="flex-none px-4 bg-rose-50 text-rose-500 rounded-2xl py-3 font-bold hover:bg-rose-100 transition-colors">
            ❤️ Yêu thích
          </Link>
        </div>
      )}
      <div className="space-y-4">
        {lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 text-lg">Chưa có bài học nào</p>
            <Link href="/upload" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Upload từ vựng
            </Link>
          </div>
        ) : (
          curricula.map(([curriculum, curriculumLessons]) => (
            <CurriculumCard key={curriculum} curriculum={curriculum} lessons={curriculumLessons} progress={progress} />
          ))
        )}
      </div>
    </div>
  );
}