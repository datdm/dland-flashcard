"use client";

import Link from "next/link";
import { Curriculum, ProgressMap } from "@/types";

interface CurriculumCardProps {
  curriculum: Curriculum;
  progress: ProgressMap;
}

export default function CurriculumCard({ curriculum, progress }: CurriculumCardProps) {
  const totalVocab = curriculum.lessons.reduce((sum, l) => sum + l.vocabulary.length, 0);
  const totalLearned = curriculum.lessons.reduce(
    (sum, l) => sum + l.vocabulary.filter((v) => progress[v.id]?.learned).length,
    0
  );
  const pct = totalVocab === 0 ? 0 : Math.round((totalLearned / totalVocab) * 100);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-800 truncate">{curriculum.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {curriculum.lessons.length} bài · {totalVocab} từ
          </p>
        </div>
        <span className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2.5 py-1 whitespace-nowrap font-medium">
          {totalVocab} từ
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>
            {totalLearned}/{totalVocab} đã học
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
          href={`/curriculums/${curriculum.id}`}
          className="flex-1 text-center py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Danh sách
        </Link>
        <Link
          href={`/flashcard/curriculum/${curriculum.id}`}
          className="flex-1 text-center py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Flashcard
        </Link>
      </div>
    </div>
  );
}
