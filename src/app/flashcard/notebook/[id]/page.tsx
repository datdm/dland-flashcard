"use client";

import { useParams } from "next/navigation";
import { useNotebooks } from "@/hooks/useNotebooks";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardNotebookPage() {
  const { id } = useParams<{ id: string }>();
  const { notebooks } = useNotebooks();
  const notebook = notebooks.find((nb) => nb.id === id);

  if (!notebook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Không tìm thấy sổ tay.</p>
        <Link href="/notebooks" className="text-indigo-600 underline text-sm">← Sổ tay</Link>
      </div>
    );
  }

  if (notebook.vocabulary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Sổ tay này chưa có từ nào.</p>
        <Link href={`/notebooks/${id}`} className="text-indigo-600 underline text-sm">← Thêm từ</Link>
      </div>
    );
  }

  const currentIndex = notebooks.findIndex((nb) => nb.id === id);
  const prevNotebook = currentIndex > 0 ? notebooks[currentIndex - 1] : null;
  const nextNotebook = currentIndex >= 0 && currentIndex < notebooks.length - 1 ? notebooks[currentIndex + 1] : null;

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-5">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
        <Link href={`/notebooks/${id}`} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1.5">
          <span>←</span>
          <span>{notebook.name} (Quay lại danh sách từ)</span>
        </Link>

        {notebooks.length > 1 && (
          <div className="flex items-center gap-2">
            {prevNotebook && (
              <Link
                href={`/flashcard/notebook/${prevNotebook.id}`}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 hover:text-indigo-600 shadow-3xs flex items-center gap-1"
                title={`Flashcard sổ trước: ${prevNotebook.name}`}
              >
                <span>←</span>
                <span className="hidden sm:inline">Sổ trước:</span>
                <span className="max-w-[120px] truncate">{prevNotebook.name}</span>
              </Link>
            )}

            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {currentIndex >= 0 ? currentIndex + 1 : 1} / {notebooks.length}
            </span>

            {nextNotebook && (
              <Link
                href={`/flashcard/notebook/${nextNotebook.id}`}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 hover:text-indigo-600 shadow-3xs flex items-center gap-1"
                title={`Flashcard sổ sau: ${nextNotebook.name}`}
              >
                <span className="hidden sm:inline">Sổ sau:</span>
                <span className="max-w-[120px] truncate">{nextNotebook.name}</span>
                <span>→</span>
              </Link>
            )}
          </div>
        )}
      </div>
      <FlashCardViewer vocabulary={notebook.vocabulary} title={`📓 ${notebook.name}`} />
    </div>
  );
}
