"use client";

import { useMemo } from "react";
import { use } from "react";
import { useLessons } from "@/hooks/useLessons";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardCurriculumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const curriculum = decodeURIComponent(slug);
  const { lessons } = useLessons();

  const allVocab = useMemo(
    () =>
      lessons
        .filter((l) => (l.curriculum || "Chưa phân loại") === curriculum)
        .flatMap((l) => l.vocabulary),
    [lessons, curriculum]
  );

  if (allVocab.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Không có từ vựng nào.</p>
        <Link href="/" className="text-indigo-600 underline text-sm">← Trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link href={`/curriculum/${slug}`} className="text-sm text-indigo-600 hover:underline">
          ← {curriculum}
        </Link>
      </div>
      <FlashCardViewer vocabulary={allVocab} title={curriculum} />
    </div>
  );
}
