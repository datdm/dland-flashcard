"use client";

import { useParams } from "next/navigation";
import { useLessons } from "@/hooks/useLessons";
import { getCurriculumRepository } from "@/lib/repositories";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function FlashCardLessonPage() {
  const { id } = useParams<{ id: string }>();
  const { getLessonById: getCustomLessonById } = useLessons();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLesson() {
      if (!id) return;
      setLoading(true);

      // 1. Try finding in custom user-uploaded lessons
      const customLesson = getCustomLessonById(id);
      if (customLesson) {
        setLesson(customLesson);
        setLoading(false);
        return;
      }

      // 2. Try finding in default system curriculums
      try {
        const repo = getCurriculumRepository();
        const systemLesson = await repo.getLessonById(id);
        if (systemLesson) {
          setLesson(systemLesson);
        }
      } catch (err) {
        console.error("Error loading system lesson in flashcard viewer:", err);
      }
      setLoading(false);
    }
    loadLesson();
  }, [id, getCustomLessonById]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-indigo-600 font-medium">
        Đang tải bài học...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Không tìm thấy bài học hoặc chưa có dữ liệu.</p>
        <div className="flex gap-4">
          <Link href="/upload" className="text-indigo-600 underline text-sm">
            Đến trang Upload
          </Link>
          <Link href="/curriculum" className="text-indigo-600 underline text-sm">
            Xem Lộ trình
          </Link>
        </div>
      </div>
    );
  }

  const isSystemCurriculum = id.includes("minna") || id.startsWith("de-") || id.startsWith("en-");
  const backLink = isSystemCurriculum ? `/curriculum/${id}` : `/lessons/${id}`;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-5">
      <div className="mb-4">
        <Link href={backLink} className="text-sm text-indigo-600 hover:underline">
          ← Quay lại bài học: {lesson.name}
        </Link>
      </div>
      <FlashCardViewer vocabulary={lesson.vocabulary} title={lesson.name} />
    </div>
  );
}
