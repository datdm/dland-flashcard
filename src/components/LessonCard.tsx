"use client";

import Link from "next/link";
import { Lesson, ProgressMap } from "@/types";

interface LessonCardProps {
  lesson: Lesson;
  progress: ProgressMap;
}

export default function LessonCard({ lesson, progress }: LessonCardProps) {
  const total = lesson.vocabulary.length;
  const learned = lesson.vocabulary.filter((v) => progress[v.id]?.learned).length;
  const pct = total === 0 ? 0 : Math.round((learned / total) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 truncate">{lesson.name}</h2>
          {lesson.description && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{lesson.description}</p>
          )}
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2.5 py-1 whitespace-nowrap font-medium">
          {total} từ
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>
            {learned}/{total} đã học
          </span>
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
          href={`/lessons/${lesson.id}`}
          className="flex-1 text-center py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Danh sách
        </Link>
        <Link
          href={`/flashcard/lesson/${lesson.id}`}
          className="flex-1 text-center py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Flashcard
        </Link>
      </div>
    </div>
  );
}
