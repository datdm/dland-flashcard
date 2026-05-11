"use client";

import { useEffect } from "react";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useProgress } from "@/hooks/useProgress";
import { initializeSampleData } from "@/lib/storage";
import CurriculumCard from "@/components/CurriculumCard";
import Link from "next/link";

export default function HomePage() {
  const { notebooks } = useNotebooks();
  const { curriculums } = useCurriculums();
  const { progress } = useProgress();

  // Initialize sample data on first visit
  useEffect(() => {
    initializeSampleData();
  }, []);

  // === Curriculums (unified - includes uploaded + menu-created) ===
  const curriculumLearnedCount = curriculums
    .flatMap((c) => c.lessons)
    .flatMap((l) => l.vocabulary)
    .filter((v) => progress[v.id]?.learned).length;
  const curriculumUnlearnedCount = curriculums
    .flatMap((c) => c.lessons)
    .flatMap((l) => l.vocabulary)
    .filter((v) => !progress[v.id]?.learned).length;
  const curriculumTotalVocab = curriculums.reduce(
    (sum, c) => sum + c.lessons.reduce((s, l) => s + l.vocabulary.length, 0),
    0
  );

  // === Notebooks ===
  const notebookLearnedCount = notebooks
    .flatMap((n) => n.vocabulary)
    .filter((v) => progress[v.id]?.learned).length;
  const notebookUnlearnedCount = notebooks
    .flatMap((n) => n.vocabulary)
    .filter((v) => !progress[v.id]?.learned).length;
  const notebookTotalVocab = notebooks.reduce((sum, n) => sum + n.vocabulary.length, 0);

  const totalVocabCount = curriculumTotalVocab + notebookTotalVocab;
  const totalLearnedCount = curriculumLearnedCount + notebookLearnedCount;
  const totalUnlearnedCount = curriculumUnlearnedCount + notebookUnlearnedCount;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        {/* Overview stats - 4 boxes */}
        {totalVocabCount > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-indigo-200">
              <p className="text-xs text-indigo-600 font-medium">Sổ tay</p>
              <p className="text-3xl font-bold text-indigo-700 mt-1">{notebooks.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
              <p className="text-xs text-purple-600 font-medium">Giáo trình</p>
              <p className="text-3xl font-bold text-purple-700 mt-1">{curriculums.length}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200">
              <p className="text-xs text-emerald-600 font-medium">Đã học</p>
              <p className="text-3xl font-bold text-emerald-700 mt-1">{totalLearnedCount}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200">
              <p className="text-xs text-orange-600 font-medium">Chưa học</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">{totalUnlearnedCount}</p>
            </div>
          </div>
        )}

        {/* Notebooks section */}
        {notebooks.length > 0 && (
          <div>
            <div className="mb-3">
              <Link
                href="/notebooks"
                className="inline-block text-sm text-indigo-600 hover:underline font-semibold"
              >
                📓 Sổ tay ({notebooks.length})
              </Link>
            </div>
            <div className="space-y-3 mb-4">
              {notebooks.map((notebook) => {
                const totalVocab = notebook.vocabulary.length;
                const totalLearned = notebook.vocabulary.filter((v) => progress[v.id]?.learned).length;
                const pct = totalVocab === 0 ? 0 : Math.round((totalLearned / totalVocab) * 100);

                return (
                  <div key={notebook.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-800 truncate">{notebook.name}</h2>
                      </div>
                      <span className="text-xs bg-purple-50 text-purple-600 rounded-full px-2.5 py-1 whitespace-nowrap font-medium">
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
                        href={`/notebooks/${notebook.id}`}
                        className="flex-1 text-center py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
                      >
                        Danh sách
                      </Link>
                      <Link
                        href={`/flashcard/notebook/${notebook.id}`}
                        className="flex-1 text-center py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
                      >
                        Flashcard
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Curriculums section (unified) */}
        {curriculums.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Link
                href="/curriculums"
                className="text-sm text-indigo-600 hover:underline font-semibold"
              >
                📚 Giáo trình ({curriculums.length})
              </Link>
              <Link
                href="/flashcard/all"
                className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Ôn tập
              </Link>
            </div>

            <div className="space-y-3 mb-4">
              {curriculums.map((curriculum) => (
                <CurriculumCard key={curriculum.id} curriculum={curriculum} progress={progress} />
              ))}
            </div>
          </div>
        )}
      </div>

      {(curriculums.length > 0 || notebooks.length > 0) && (
        <div className="flex gap-2 mb-6">
          <Link
            href="/flashcard/all"
            className="flex-1 text-center bg-indigo-600 text-white rounded-2xl py-3 font-bold hover:bg-indigo-700 transition-colors"
          >
            Ôn tập tổng hợp
          </Link>
          <Link
            href="/flashcard/favorites"
            className="flex-none px-4 bg-rose-50 text-rose-500 rounded-2xl py-3 font-bold hover:bg-rose-100 transition-colors"
          >
            ❤️ Yêu thích
          </Link>
        </div>
      )}

      <div>
        {curriculums.length === 0 && notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-gray-400 text-lg">Chưa có bài học nào</p>
            <Link
              href="/upload"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Upload từ vựng
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}