"use client";

import { useNotebooks } from "@/hooks/useNotebooks";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardAllNotebooksPage() {
  const { notebooks } = useNotebooks();
  const allVocab = notebooks.flatMap((nb) => nb.vocabulary);

  if (allVocab.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-gray-500">Chưa có từ vựng nào trong sổ tay. Hãy thêm từ vựng trước.</p>
        <Link href="/notebooks" className="text-indigo-600 underline text-sm">
          Đến trang Sổ tay
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-5">
      <div className="mb-4">
        <Link href="/notebooks" className="text-sm text-indigo-600 hover:underline">
          ← Sổ tay
        </Link>
      </div>
      <FlashCardViewer vocabulary={allVocab} title="Ôn tập tất cả sổ tay" />
    </div>
  );
}
