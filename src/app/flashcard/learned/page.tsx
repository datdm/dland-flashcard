"use client";

import { useMemo, useState, useEffect } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useProgress } from "@/hooks/useProgress";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import { getCurriculumRepository } from "@/lib/repositories";
import { Vocabulary } from "@/types";

export default function FlashCardLearnedPage() {
  const { allCurriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const { progress } = useProgress();
  const { activeLanguage } = useLanguageSetting();
  const [repoBooks, setRepoBooks] = useState<any[]>([]);
  const [systemVocabList, setSystemVocabList] = useState<any[]>([]);

  // 1. Load repository books across languages
  useEffect(() => {
    async function loadRepoBooks() {
      try {
        const repo = getCurriculumRepository();
        const groups = await repo.getAllCurriculums();
        const allBooks = groups.flatMap((g) => g.books || []);
        setRepoBooks(allBooks);
      } catch (err) {
        console.error("Failed to load repo books in FlashCardLearnedPage:", err);
      }
    }
    loadRepoBooks();
  }, []);

  // 2. Load system curriculum JSON files as additional fallback
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
                  lang: url.includes("en-") ? "en" : url.includes("de-") ? "de" : "ja",
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
    const map = new Map<string, Vocabulary & { lang: string; sourceType?: string; sourceName?: string }>();

    // A. Build vocabulary map from repoBooks
    repoBooks.forEach((b) => {
      const bookLang = b.lang || (
        b.id.startsWith("en-") ? "en" :
        b.id.startsWith("de-") ? "de" :
        b.id.startsWith("ko-") ? "ko" :
        b.id.startsWith("zh-") ? "zh" : "ja"
      );
      b.lessons?.forEach((l: any) => {
        l.vocabulary?.forEach((v: any) => {
          if (v && v.id) {
            map.set(v.id, {
              ...v,
              lang: bookLang,
              sourceType: "curriculum",
              sourceName: `${b.name} • ${l.name}`,
            });
          }
        });
      });
    });

    // B. Build vocabulary map from user curriculums
    allCurriculums.forEach((c) => {
      const curriculumLang = c.lang || (
        c.id.startsWith("en-") ? "en" :
        c.id.startsWith("de-") ? "de" :
        c.id.startsWith("ko-") ? "ko" :
        c.id.startsWith("zh-") ? "zh" : "ja"
      );
      c.lessons?.forEach((l) => {
        l.vocabulary?.forEach((v) => {
          if (v && v.id && !map.has(v.id)) {
            map.set(v.id, {
              ...v,
              lang: curriculumLang,
              sourceType: "curriculum",
              sourceName: `${c.name} • ${l.name}`,
            });
          }
        });
      });
    });

    // C. Build vocabulary map from notebooks
    notebooks.forEach((nb) => {
      const nbLang = nb.lang || "ja";
      nb.vocabulary?.forEach((v) => {
        if (v && v.id && !map.has(v.id)) {
          map.set(v.id, {
            ...v,
            lang: nbLang,
            sourceType: "notebook",
            sourceName: `Sổ tay: ${nb.name}`,
          });
        }
      });
    });

    // D. Build vocabulary map from systemVocabList
    systemVocabList.forEach((v) => {
      if (v && v.id && !map.has(v.id)) {
        const itemLang = v.lang || (
          v.id.startsWith("en-") ? "en" :
          v.id.startsWith("de-") ? "de" :
          v.id.startsWith("ko-") ? "ko" :
          v.id.startsWith("zh-") ? "zh" : "ja"
        );
        map.set(v.id, {
          ...v,
          lang: itemLang,
          sourceType: "curriculum",
          sourceName: v.sourceName || "Giáo trình",
        });
      }
    });

    // E. Extract ALL learned items matching activeLanguage from progress
    const result: (Vocabulary & { lang: string; sourceType?: string; sourceName?: string })[] = [];
    const effectiveLang = activeLanguage.code;

    Object.entries(progress).forEach(([id, p]) => {
      if (!p || !p.learned) return;

      const known = map.get(id);
      if (!known) return; // Skip orphaned IDs that don't belong to any real vocabulary item

      if (effectiveLang === "all" || known.lang === effectiveLang) {
        result.push(known);
      }
    });

    return result;
  }, [repoBooks, allCurriculums, notebooks, systemVocabList, progress, activeLanguage.code]);

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
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-5">
      <div className="mb-4">
        <Link href="/history" className="text-sm text-indigo-600 hover:underline">← Lịch sử học tập</Link>
      </div>
      <FlashCardViewer vocabulary={learnedWords} title="Ôn tập Từ đã học ✓" />
    </div>
  );
}
