"use client";

import Link from "next/link";
import { Lesson, ProgressMap } from "@/types";

interface CurriculumCardProps {
  curriculum: string;
  lessons: Lesson[];
  progress: ProgressMap;
}

export default function CurriculumCard({ curriculum, lessons, progress }: CurriculumCardProps) {
  const slug = encodeURIComponent(curriculum);
  const totalVocab = lessons.reduce((sum, l) => sum + l.vocabulary.length, 0);
  const totalLearned = lessons.reduce(
    (sum, l) => sum + l.vocabulary.filter((v) => progress[v.id]?.learned).length,
    0
  );
  const pct = totalVocab === 0 ? 0 : Math.round((totalLearned / totalVocab) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 text-lg truncate">{curriculum}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {lessons.length} bài · {totalVocab} từ
          </p>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2.5 py-1 whitespace-nowrap font-medium">
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{totalLearned}/{totalVocab} đã học</span>
          <span>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Link
          href={`/curriculum/${slug}`}
          className="flex-1 text-center py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Xem bài
        </Link>
        <Link
          href={`/flashcard/curriculum/${slug}`}
          className="flex-1 text-center py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Flashcard GT
        </Link>
      </div>
    </div>
  );
}
