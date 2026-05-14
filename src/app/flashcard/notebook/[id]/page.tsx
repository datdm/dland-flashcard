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

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link href={`/notebooks/${id}`} className="text-sm text-indigo-600 hover:underline">
          ← {notebook.name}
        </Link>
      </div>
      <FlashCardViewer vocabulary={notebook.vocabulary} title={`📓 ${notebook.name}`} />
    </div>
  );
}
