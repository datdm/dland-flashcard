"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getCurriculumRepository } from "@/lib/repositories";
import { DetailedLesson } from "@/lib/repositories/types";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import GrammarCard from "@/components/GrammarCard";
import KanjiStrokeViewer from "@/components/KanjiStrokeViewer";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CurriculumLessonDetailPage({ params }: Props) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<DetailedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar" | "kanji">("vocab");
  const { getVocabProgress, toggleLearned, toggleFavorite } = useProgress();

  useEffect(() => {
    async function loadLesson() {
      setLoading(true);
      const repo = getCurriculumRepository();
      const data = await repo.getLessonById(id);
      setLesson(data);
      setLoading(false);
    }
    loadLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-indigo-600 font-medium">
        Đang tải bài học...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài học</h2>
        <p className="text-gray-500 text-sm mb-4">Bài học bạn yêu cầu không tồn tại hoặc đã bị xóa.</p>
        <Link href="/curriculum" className="text-indigo-600 font-medium hover:underline text-sm">
          ← Quay lại danh sách giáo trình
        </Link>
      </div>
    );
  }

  const vocabCount = lesson.vocabulary?.length || 0;
  const grammarCount = lesson.grammarPoints?.length || 0;
  const kanjiCount = lesson.kanjiItems?.length || 0;

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      {/* Back Link */}
      <div className="mb-4">
        <Link href="/curriculum" className="text-xs text-indigo-600 font-medium hover:underline">
          ← Danh sách Lộ trình Bài học
        </Link>
      </div>

      {/* Lesson Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700">
                {lesson.level || "Minna"}
              </span>
              {lesson.curriculum && (
                <span className="text-xs text-gray-400 font-medium">{lesson.curriculum}</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2">{lesson.name}</h1>
            {lesson.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{lesson.description}</p>
            )}
          </div>

          <Link
            href={`/flashcard/lesson/${lesson.id}`}
            className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 hover:opacity-95 transition-opacity text-center flex items-center justify-center gap-2"
          >
            <span>🎴 Flashcard Ôn tập</span>
          </Link>
        </div>

        {/* Content Tabs */}
        <div className="flex border-b border-gray-100 mt-6 gap-6">
          <button
            onClick={() => setActiveTab("vocab")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
              activeTab === "vocab"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            📝 Từ vựng ({vocabCount})
          </button>
          <button
            onClick={() => setActiveTab("grammar")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
              activeTab === "grammar"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            📖 Ngữ pháp ({grammarCount})
          </button>
          <button
            onClick={() => setActiveTab("kanji")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 ${
              activeTab === "kanji"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            🉐 Kanji ({kanjiCount})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "vocab" && (
        <div className="space-y-3">
          {vocabCount === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có từ vựng nào trong bài học này</div>
          ) : (
            lesson.vocabulary.map((v) => (
              <VocabularyListItem
                key={v.id}
                vocab={v}
                progress={getVocabProgress(v.id)}
                onToggleLearned={toggleLearned}
                onToggleFavorite={toggleFavorite}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "grammar" && (
        <div className="space-y-4">
          {grammarCount === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có mục ngữ pháp nào trong bài học này</div>
          ) : (
            lesson.grammarPoints?.map((grammar) => (
              <GrammarCard key={grammar.id} grammar={grammar} />
            ))
          )}
        </div>
      )}

      {activeTab === "kanji" && (
        <div className="space-y-4">
          {kanjiCount === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có chữ Hán nào trong bài học này</div>
          ) : (
            lesson.kanjiItems?.map((kanji) => (
              <KanjiStrokeViewer key={kanji.id} kanji={kanji} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
