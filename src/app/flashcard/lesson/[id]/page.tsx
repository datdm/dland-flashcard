"use client";

import { useParams } from "next/navigation";
import { useLessons } from "@/hooks/useLessons";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardLessonPage() {
  const { id } = useParams<{ id: string }>();
  const { getLessonById, lessons } = useLessons();

  // Wait for lessons to be loaded
  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Chưa có dữ liệu. Hãy upload từ vựng trước.</p>
        <Link href="/upload" className="text-indigo-600 underline text-sm">
          Đến trang Upload
        </Link>
      </div>
    );
  }

  const lesson = getLessonById(id);

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Không tìm thấy bài học.</p>
        <Link href="/" className="text-indigo-600 underline text-sm">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link href={`/lessons/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← {lesson.name}
        </Link>
      </div>
      <FlashCardViewer vocabulary={lesson.vocabulary} title={lesson.name} />
    </div>
  );
}
