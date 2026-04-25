"use client";

import { useLessons } from "@/hooks/useLessons";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardAllPage() {
  const { lessons } = useLessons();
  const allVocab = lessons.flatMap((l) => l.vocabulary);

  if (allVocab.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Chưa có từ vựng nào. Hãy upload từ vựng trước.</p>
        <Link href="/upload" className="text-indigo-600 underline text-sm">
          Đến trang Upload
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Trang chủ
        </Link>
      </div>
      <FlashCardViewer vocabulary={allVocab} title="Ôn tập tổng hợp" />
    </div>
  );
}
