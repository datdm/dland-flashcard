"use client";

import { useParams } from "next/navigation";
import { useCurriculums } from "@/hooks/useCurriculums";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function CurriculumFlashcardPage() {
  const { id } = useParams<{ id: string }>();
  const { getCurriculumById } = useCurriculums();
  const curriculum = getCurriculumById(id);

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Không tìm thấy giáo trình.</p>
        <Link href="/curriculums" className="text-indigo-600 underline text-sm">
          ← Giáo trình
        </Link>
      </div>
    );
  }

  // Flatten all vocabulary from all lessons in curriculum
  const allVocabulary = curriculum.lessons.flatMap((lesson) => lesson.vocabulary);

  if (allVocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Chưa có từ vựng nào trong giáo trình này.</p>
        <Link href={`/curriculums/${id}`} className="text-indigo-600 underline text-sm">
          ← {curriculum.name}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        <Link href={`/curriculums/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← {curriculum.name}
        </Link>
        <h1 className="text-lg font-bold text-gray-800 mt-2">Ôn tập {curriculum.name}</h1>
      </div>
      <div className="flex-1 overflow-auto">
        <FlashCardViewer vocabulary={allVocabulary} />
      </div>
    </div>
  );
}
