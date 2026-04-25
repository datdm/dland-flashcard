"use client";

import { useState, useMemo } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import LessonCard from "@/components/LessonCard";
import LevelTabBar from "@/components/LevelTabBar";
import Link from "next/link";
import { JLPT_LEVELS } from "@/types";

export default function HomePage() {
  const { lessons } = useLessons();
  const { progress } = useProgress();
  const [activeLevel, setActiveLevel] = useState<string | null>(null);

  // Derive sorted unique levels that appear in data
  const availableLevels = useMemo(() => {
    const inData = new Set(lessons.map((l) => l.level).filter(Boolean) as string[]);
    // Show JLPT standard levels first in order, then any custom ones
    const ordered = JLPT_LEVELS.filter((l) => inData.has(l));
    const custom = [...inData].filter((l) => !(JLPT_LEVELS as readonly string[]).includes(l)).sort();
    return [...ordered, ...custom];
  }, [lessons]);

  const filteredLessons = useMemo(
    () => (activeLevel ? lessons.filter((l) => l.level === activeLevel) : lessons),
    [lessons, activeLevel]
  );

  const allVocab = filteredLessons.flatMap((l) => l.vocabulary);
  const totalLearned = allVocab.filter((v) => progress[v.id]?.learned).length;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Level tabs */}
      {availableLevels.length > 0 && (
        <div className="mb-4">
          <LevelTabBar
            levels={availableLevels}
            active={activeLevel}
            onChange={setActiveLevel}
          />
        </div>
      )}

      {/* Stats banner */}
      {filteredLessons.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-indigo-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-indigo-700">{filteredLessons.length}</p>
            <p className="text-xs text-indigo-500 mt-0.5">Bài học</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{totalLearned}</p>
            <p className="text-xs text-emerald-500 mt-0.5">Đã học</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{allVocab.length - totalLearned}</p>
            <p className="text-xs text-amber-500 mt-0.5">Chưa học</p>
          </div>
        </div>
      )}

      {/* Flashcard all / by level button */}
      {filteredLessons.length > 0 && (
        <Link
          href={activeLevel ? `/flashcard/level/${activeLevel}` : "/flashcard/all"}
          className="flex items-center justify-between w-full bg-indigo-600 text-white rounded-2xl p-4 mb-6 hover:bg-indigo-700 transition-colors"
        >
          <span className="font-bold text-lg">
            {activeLevel ? `Ôn tập ${activeLevel}` : "Ôn tập tổng hợp"}
          </span>
          <span className="text-indigo-200 text-sm">{allVocab.length} từ →</span>
        </Link>
      )}

      {/* Lesson list */}
      <div className="space-y-4">
        {lessons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 text-lg">Chưa có bài học nào</p>
            <Link
              href="/upload"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Upload từ vựng
            </Link>
          </div>
        ) : filteredLessons.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            Không có bài học nào cho cấp độ {activeLevel}
          </p>
        ) : (
          filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} progress={progress} />
          ))
        )}
      </div>
    </div>
  );
}