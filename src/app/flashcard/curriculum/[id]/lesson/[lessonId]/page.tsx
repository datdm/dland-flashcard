"use client";

import { use } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function LessonFlashcardPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = use(params);
  const { getCurriculumById, getLessonById } = useCurriculums();
  const curriculum = getCurriculumById(id);
  const lesson = curriculum ? getLessonById(id, lessonId) : null;

  if (!curriculum || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Không tìm thấy bài.</p>
        <Link href="/curriculums" className="text-indigo-600 underline text-sm">
          ← Giáo trình
        </Link>
      </div>
    );
  }

  if (lesson.vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Chưa có từ vựng nào trong bài này.</p>
        <Link href={`/curriculums/${id}/lesson/${lessonId}`} className="text-indigo-600 underline text-sm">
          ← {lesson.name}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <Link href={`/curriculums/${id}/lesson/${lessonId}`} className="text-sm text-indigo-600 hover:underline">
          ← {lesson.name}
        </Link>
        <h1 className="text-lg font-bold text-gray-800 mt-2">Ôn tập {lesson.name}</h1>
      </div>
      <div className="flex-1 overflow-auto">
        <FlashCardViewer vocabulary={lesson.vocabulary} />
      </div>
    </div>
  );
}
