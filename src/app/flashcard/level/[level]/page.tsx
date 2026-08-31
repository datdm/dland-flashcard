"use client";

import { useParams } from "next/navigation";
import { useLessons } from "@/hooks/useLessons";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardLevelPage() {
  const { level } = useParams<{ level: string }>();
  const { lessons } = useLessons();

  const levelVocab = lessons
    .filter((l) => l.level?.toUpperCase() === level.toUpperCase())
    .flatMap((l) => l.vocabulary);

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Chưa có dữ liệu. Hãy upload từ vựng trước.</p>
        <Link href="/upload" className="text-indigo-600 underline text-sm">
          Đến trang Upload
        </Link>
      </div>
    );
  }

  if (levelVocab.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Không có từ vựng nào cho cấp độ {level.toUpperCase()}.</p>
        <Link href="/" className="text-indigo-600 underline text-sm">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-5">
      <div className="mb-4">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Trang chủ
        </Link>
      </div>
      <FlashCardViewer vocabulary={levelVocab} title={`Ôn tập ${level.toUpperCase()}`} />
    </div>
  );
}
