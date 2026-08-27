"use client";

import { useMemo, useState, useEffect } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

import { useLanguageSetting } from "@/hooks/useLanguageSetting";

export default function FlashCardLearnedPage() {
  const { activeCurriculums: curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const { progress } = useProgress();
  const { activeLanguage } = useLanguageSetting();
  const [systemVocabList, setSystemVocabList] = useState<any[]>([]);

  useEffect(() => {
    async function loadAllSystemData() {
      try {
        const urls = [
          "/data/n5-curriculum.json",
          "/data/n4-curriculum.json",
          "/data/n3-curriculum.json",
          "/data/n2-curriculum.json",
          "/data/de-curriculum.json",
          "/data/en-curriculum.json"
        ];

        let allVocab: any[] = [];

        await Promise.all(
          urls.map(async (url) => {
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const lessons = data.lessons || [];
            
            lessons.forEach((lesson: any) => {
              if (lesson.vocabulary) {
                const taggedVocab = lesson.vocabulary.map((v: any) => ({
                  ...v,
                  sourceType: "curriculum" as const,
                  sourceName: `${data.title || "Giáo trình"} • ${lesson.name}`,
                }));
                allVocab = allVocab.concat(taggedVocab);
              }
            });
          })
        );

        setSystemVocabList(allVocab);
      } catch (err) {
        console.error("Error loading system curriculum data for learned flashcards:", err);
      }
    }
    loadAllSystemData();
  }, []);

  const learnedWords = useMemo(() => {
    // Collect all vocabulary words across curriculums, notebooks, and system curriculums
    const curriculumVocab = curriculums.flatMap((c) =>
      c.lessons.flatMap((l) =>
        (l.vocabulary || []).map((v) => ({
          ...v,
          sourceType: "curriculum" as const,
          sourceName: `${c.name} • ${l.name}`,
        }))
      )
    );
    const notebookVocab = notebooks.flatMap((nb) =>
      (nb.vocabulary || []).map((v) => ({
        ...v,
        sourceType: "notebook" as const,
        sourceName: `Sổ tay: ${nb.name}`,
      }))
    );

    const filteredSystemVocab = systemVocabList.filter((v) => {
      if (!v || !v.id) return false;
      if (activeLanguage.code === "en") return v.id.startsWith("en-") || v.level?.includes("Band");
      if (activeLanguage.code === "de") return v.id.startsWith("de-") || v.level?.includes("A1") || v.level?.includes("A2");
      return !v.id.startsWith("en-") && !v.id.startsWith("de-");
    });
    
    // De-duplicate vocabulary words by ID to prevent duplicates if they appear in both systems
    const seen = new Set<string>();
    const allVocab = [...curriculumVocab, ...notebookVocab, ...filteredSystemVocab].filter((v) => {
      if (!v || !v.id) return false;
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    });

    return allVocab.filter((v) => progress[v.id]?.learned);
  }, [curriculums, notebooks, systemVocabList, progress, activeLanguage.code]);

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
