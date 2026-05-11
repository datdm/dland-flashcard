"use client";

import { useState, useMemo } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

type SourceFilter = "all" | string; // "all" | curriculum-id | notebook-id

export default function FlashCardAllPage() {
  const { curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const [source, setSource] = useState<SourceFilter>("all");

  // Get all vocabulary based on filter
  const allVocab = useMemo(() => {
    if (source === "all") {
      const curriculumVocab = curriculums.flatMap((c) => c.lessons.flatMap((l) => l.vocabulary));
      const notebookVocab = notebooks.flatMap((nb) => nb.vocabulary);
      return [...curriculumVocab, ...notebookVocab];
    }
    
    // Check if it's a curriculum ID
    const curriculum = curriculums.find((c) => c.id === source);
    if (curriculum) {
      return curriculum.lessons.flatMap((l) => l.vocabulary);
    }
    
    // Otherwise it's a notebook ID
    const notebook = notebooks.find((nb) => nb.id === source);
    if (notebook) {
      return notebook.vocabulary;
    }
    
    return [];
  }, [source, curriculums, notebooks]);

  if (curriculums.length === 0 && notebooks.length === 0) {
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
      <div className="mb-4 flex items-center justify-between">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Trang chủ
        </Link>
      </div>

      {/* Filter buttons */}
      <div className="mb-4 space-y-3">
        {/* All button */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSource("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              source === "all"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:border-indigo-400"
            }`}
          >
            Tất cả
          </button>
        </div>
        
        {/* Curriculum buttons */}
        {curriculums.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">📚 Giáo trình</p>
            <div className="flex flex-wrap gap-2">
              {curriculums.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSource(c.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    source === c.id
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-emerald-400"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Notebook buttons */}
        {notebooks.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2 font-medium">📓 Sổ tay</p>
            <div className="flex flex-wrap gap-2">
              {notebooks.map((nb) => (
                <button
                  key={nb.id}
                  onClick={() => setSource(nb.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    source === nb.id
                      ? "bg-purple-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:border-purple-400"
                  }`}
                >
                  {nb.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {allVocab.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Không có từ vựng nào trong nguồn được chọn.
        </div>
      ) : (
        <FlashCardViewer vocabulary={allVocab} title="Ôn tập tổng hợp" />
      )}
    </div>
  );
}
