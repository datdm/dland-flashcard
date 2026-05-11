"use client";

import Link from "next/link";
import { LessonInCurriculum, ProgressMap } from "@/types";

interface LessonListItemProps {
  lesson: LessonInCurriculum;
  curriculumId: string;
  progress: ProgressMap;
  onEdit?: (lessonId: string, lessonName: string) => void;
  onDelete?: (lessonId: string, lessonName: string) => void;
}

export default function LessonListItem({
  lesson,
  curriculumId,
  progress,
  onEdit,
  onDelete,
}: LessonListItemProps) {
  // Calculate progress
  const totalVocab = lesson.vocabulary.length;
  const learnedVocab = lesson.vocabulary.filter((v) => progress[v.id]?.learned).length;
  const percentage = totalVocab === 0 ? 0 : Math.round((learnedVocab / totalVocab) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 truncate">{lesson.name}</h2>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2.5 py-1 whitespace-nowrap font-medium">
          {totalVocab} từ
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>
            {learnedVocab}/{totalVocab} đã học
          </span>
          <span>{percentage}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <Link
          href={`/curriculums/${curriculumId}/lesson/${lesson.id}`}
          className="flex-1 text-center py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Danh sách
        </Link>
        <Link
          href={`/flashcard/curriculum/${curriculumId}/lesson/${lesson.id}`}
          className="flex-1 text-center py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Flashcard
        </Link>
        {onEdit && (
          <button
            onClick={() => onEdit(lesson.id, lesson.name)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm text-gray-400 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            title="Sửa"
          >
            ✎
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(lesson.id, lesson.name)}
            className="px-3 py-2 rounded-xl border border-gray-300 text-sm text-gray-300 hover:border-red-400 hover:text-red-500 transition-colors"
            title="Xóa"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
