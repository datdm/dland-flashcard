"use client";

import { useMemo } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

export default function FlashCardLearnedPage() {
  const { curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const { progress } = useProgress();

  const learnedWords = useMemo(() => {
    // Collect all vocabulary words across curriculums and notebooks
    const curriculumVocab = curriculums.flatMap((c) => c.lessons.flatMap((l) => l.vocabulary || []));
    const notebookVocab = notebooks.flatMap((nb) => nb.vocabulary || []);
    
    // De-duplicate vocabulary words by ID to prevent duplicates if they appear in both systems
    const seen = new Set<string>();
    const allVocab = [...curriculumVocab, ...notebookVocab].filter((v) => {
      if (!v || !v.id) return false;
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    return allVocab.filter((v) => progress[v.id]?.learned);
  }, [curriculums, notebooks, progress]);

  if (learnedWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-4 max-w-md mx-auto text-center">
        <div className="text-4xl">🎴</div>
        <p className="text-gray-500 font-medium">Chưa có từ vựng nào được đánh dấu là "Đã học". Hãy vào các bài học trong Giáo trình và học từ vựng trước nhé!</p>
        <Link href="/curriculum" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm">
          Xem Giáo trình
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen">
      <div className="mb-4">
        <Link href="/history" className="text-sm text-indigo-600 hover:underline">← Lịch sử học tập</Link>
      </div>
      <FlashCardViewer vocabulary={learnedWords} title="Ôn tập Từ đã học ✓" />
    </div>
  );
}
