"use client";

import { useMemo } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardFavoritesPage() {
  const { lessons } = useLessons();
  const { progress } = useProgress();

  const favorites = useMemo(
    () => lessons.flatMap((l) => l.vocabulary).filter((v) => progress[v.id]?.favorite),
    [lessons, progress]
  );

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500 text-center">Chưa có từ yêu thích nào. Nhấn ❤️ khi ôn tập để lưu từ.</p>
        <Link href="/" className="text-indigo-600 underline text-sm">← Trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
      </div>
      <FlashCardViewer vocabulary={favorites} title="Từ yêu thích ❤️" />
    </div>
  );
}
