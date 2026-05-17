"use client";

import { useEffect } from "react";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useProgress } from "@/hooks/useProgress";
import { useGrammarCollections } from "@/hooks/useGrammarCollections";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useStreak } from "@/hooks/useStreak";
import { initializeSampleData } from "@/lib/storage";
import CurriculumCard from "@/components/CurriculumCard";
import Link from "next/link";

export default function HomePage() {
  const { notebooks } = useNotebooks();
  const { curriculums } = useCurriculums();
  const { progress } = useProgress();
  const { collections } = useGrammarCollections();
  const { getGrammarProgress } = useGrammarProgress();
  const streak = useStreak();

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

  // === Grammar ===
  const grammarPoints = collections.flatMap((collection) => collection.grammarPoints);
  const grammarLearnedCount = grammarPoints.filter((point) => getGrammarProgress(point.id).learned).length;
  const grammarUnlearnedCount = grammarPoints.filter((point) => !getGrammarProgress(point.id).learned).length;
  const grammarFavoriteCount = grammarPoints.filter((point) => getGrammarProgress(point.id).favorite).length;

  const totalVocabCount = curriculumTotalVocab + notebookTotalVocab;
  const totalLearnedCount = curriculumLearnedCount + notebookLearnedCount;
  const totalUnlearnedCount = curriculumUnlearnedCount + notebookUnlearnedCount;

  return (
    <div className="p-4 max-w-2xl sm:max-w-7xl mx-auto sm:px-6 lg:px-8">
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

        {collections.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl p-4 border border-sky-200">
              <p className="text-xs text-sky-600 font-medium">Bộ ngữ pháp</p>
              <p className="text-3xl font-bold text-sky-700 mt-1">{collections.length}</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-4 border border-cyan-200">
              <p className="text-xs text-cyan-600 font-medium">Điểm ngữ pháp</p>
              <p className="text-3xl font-bold text-cyan-700 mt-1">{grammarPoints.length}</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-4 border border-teal-200">
              <p className="text-xs text-teal-600 font-medium">Ngữ pháp đã học</p>
              <p className="text-3xl font-bold text-teal-700 mt-1">{grammarLearnedCount}</p>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-4 border border-rose-200">
              <p className="text-xs text-rose-600 font-medium">Ngữ pháp yêu thích</p>
              <p className="text-3xl font-bold text-rose-700 mt-1">{grammarFavoriteCount}</p>
            </div>
          </div>
        )}

        {/* Streak section */}
        {streak.currentStreak > 0 && (
          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Chuỗi học tập</p>
                <p className="text-4xl font-bold">🔥 {streak.currentStreak} ngày liên tiếp</p>
                <p className="text-sm opacity-90 mt-1">Lần cuối: {new Date(streak.lastStreakDate).toLocaleDateString('vi-VN')}</p>
              </div>
              {streak.longestStreak > 0 && (
                <div className="text-right">
                  <p className="text-sm opacity-90">Kỷ lục</p>
                  <p className="text-2xl font-bold">🏆 {streak.longestStreak}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notebooks section */}
        {notebooks.length > 0 && (
          <section className="mb-8">
            <div className="mb-3">
              <Link
                href="/notebooks"
                className="inline-block text-sm text-indigo-600 hover:underline font-semibold"
              >
                📓 Sổ tay ({notebooks.length})
              </Link>
            </div>
            <div className="space-y-3 mb-4 sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 sm:space-y-0">
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
                          {totalLearned}/{totalVocab} Đã học
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
          </section>
        )}

        {/* Curriculums section (unified) */}
        {curriculums.length > 0 && (
          <section className="mb-8">
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
          </section>
        )}

        {/* Grammar section */}
        {collections.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <Link
                href="/grammar"
                className="text-sm text-indigo-600 hover:underline font-semibold"
              >
                🗂️ Ngữ pháp ({collections.length})
              </Link>
              <Link
                href={collections[0] ? `/grammar/practice/${collections[0].id}` : "/grammar"}
                className="text-xs bg-sky-600 text-white px-2 py-1 rounded-lg hover:bg-sky-700 transition-colors"
              >
                Luyện tập
              </Link>
            </div>

            <div className="space-y-3 mb-4 sm:grid sm:grid-cols-2 xl:grid-cols-3 sm:gap-4 sm:space-y-0">
              {collections.map((collection) => {
                const learnedCount = collection.grammarPoints.filter((point) => getGrammarProgress(point.id).learned).length;
                const totalCount = collection.grammarPoints.length;
                const unlearnedCount = totalCount - learnedCount;
                const progressPercentage = totalCount === 0 ? 0 : Math.round((learnedCount / totalCount) * 100);

                return (
                  <div key={collection.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-800 truncate">{collection.name}</h2>
                        {collection.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{collection.description}</p>
                        )}
                      </div>
                      <span className="text-xs bg-sky-50 text-sky-600 rounded-full px-2.5 py-1 whitespace-nowrap font-medium">
                        {totalCount} Điểm
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>
                          {learnedCount}/{totalCount} Đã học – {unlearnedCount} chưa học
                        </span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-sky-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Link
                        href={`/grammar/${collection.id}`}
                        className="flex-1 text-center py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-sky-400 hover:text-sky-600 transition-colors"
                      >
                        Danh sách
                      </Link>
                      <Link
                        href={`/grammar/practice/${collection.id}`}
                        className="flex-1 text-center py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-700 transition-colors"
                      >
                        Flashcard
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {(curriculums.length > 0 || notebooks.length > 0 || collections.length > 0) && (
        <div className="flex gap-2 mb-6">
          <Link
            href="/flashcard/all"
            className="flex-1 text-center bg-indigo-600 text-white rounded-2xl py-3 font-bold hover:bg-indigo-700 transition-colors"
          >
            Ôn tập tỏng hợp
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
        {curriculums.length === 0 && notebooks.length === 0 && collections.length === 0 ? (
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
