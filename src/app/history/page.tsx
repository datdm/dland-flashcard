"use client";

import { useMemo, useState, useEffect } from "react";
import { useProgress } from "@/hooks/useProgress";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useKanjiProgress } from "@/hooks/useKanjiProgress";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useGrammarCollections } from "@/hooks/useGrammarCollections";
import { useStreak } from "@/hooks/useStreak";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

interface TimelineItem {
  id: string;
  type: "vocab" | "grammar";
  title: string;
  subTitle?: string;
  meaning: string;
  learnedAt: string;
  source: string;
}

interface CompletedLesson {
  lessonId: string;
  lessonName: string;
  curriculumName: string;
  completedAt: string;
}

export default function HistoryPage() {
  const { progress } = useProgress();
  const { progress: grammarProgress } = useGrammarProgress();
  const { progress: kanjiProgress } = useKanjiProgress();
  const { curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const { collections: grammarCollections } = useGrammarCollections();
  const streak = useStreak();

  const [completedLessons, setCompletedLessons] = useState<CompletedLesson[]>([]);
  const [timeFilter, setTimeFilter] = useState<"all" | "1day" | "3days" | "1month" | "3months" | "1year" | "thisYear" | number>("all");
  const [curriculumTabFilter, setCurriculumTabFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [systemVocabList, setSystemVocabList] = useState<any[]>([]);
  const [systemGrammarList, setSystemGrammarList] = useState<any[]>([]);
  const [systemLessonsList, setSystemLessonsList] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("flashcash-curriculum-history");
      if (stored) {
        setCompletedLessons(JSON.parse(stored));
      }
    }
  }, []);

  // Fetch all system curriculums to populate lookup tables for all languages
  useEffect(() => {
    async function loadAllSystemData() {
      try {
        const urls = [
          { url: "/data/n5-curriculum.json", name: "N5" },
          { url: "/data/n4-curriculum.json", name: "N4" },
          { url: "/data/n3-curriculum.json", name: "N3" },
          { url: "/data/n2-curriculum.json", name: "N2" },
          { url: "/data/de-curriculum.json", name: "Tiếng Đức (A1)" },
          { url: "/data/en-curriculum.json", name: "Tiếng Anh (A1)" }
        ];

        const allVocab: any[] = [];
        const allGrammar: any[] = [];
        const allLessons: any[] = [];

        await Promise.all(
          urls.map(async ({ url, name }) => {
            const res = await fetch(url);
            if (!res.ok) return;
            const data = await res.json();
            const lessons = data.lessons || [];
            
            lessons.forEach((lesson: any) => {
              allLessons.push({
                ...lesson,
                curriculumTitle: data.title || name,
                curriculumName: lesson.curriculum || data.title || name
              });

              if (lesson.vocabulary) {
                lesson.vocabulary.forEach((v: any) => {
                  allVocab.push({
                    ...v,
                    sourceName: `${data.title || name} • ${lesson.name}`
                  });
                });
              }
              if (lesson.grammarPoints) {
                lesson.grammarPoints.forEach((g: any) => {
                  allGrammar.push({
                    ...g,
                    sourceName: `${data.title || name} • ${lesson.name}`
                  });
                });
              }
            });
          })
        );

        setSystemVocabList(allVocab);
        setSystemGrammarList(allGrammar);
        setSystemLessonsList(allLessons);
      } catch (err) {
        console.error("Error loading system curriculum data for history lookup:", err);
      }
    }
    loadAllSystemData();
  }, []);

  // 1. Build lookup tables for vocabulary and grammar
  const vocabLookup = useMemo(() => {
    const map = new Map<string, { kanji?: string; hiragana?: string; meaning?: string; source: string }>();
    
    curriculums.forEach((c) => {
      c.lessons.forEach((l) => {
        l.vocabulary?.forEach((v) => {
          map.set(v.id, {
            kanji: v.kanji,
            hiragana: v.hiragana,
            meaning: v.meaning,
            source: `${c.name} • ${l.name}`
          });
        });
      });
    });

    notebooks.forEach((nb) => {
      nb.vocabulary?.forEach((v) => {
        map.set(v.id, {
          kanji: v.kanji,
          hiragana: v.hiragana,
          meaning: v.meaning,
          source: `Sổ tay: ${nb.name}`
        });
      });
    });

    systemVocabList.forEach((v) => {
      map.set(v.id, {
        kanji: v.kanji || v.word,
        hiragana: v.hiragana || v.type || "",
        meaning: v.meaning,
        source: v.sourceName
      });
    });

    return map;
  }, [curriculums, notebooks, systemVocabList]);

  const grammarLookup = useMemo(() => {
    const map = new Map<string, { structure: string; meaning: string; source: string }>();
    
    grammarCollections.forEach((c) => {
      c.grammarPoints?.forEach((gp) => {
        map.set(gp.id, {
          structure: gp.structure,
          meaning: gp.meaning,
          source: `Ngữ pháp: ${c.name}`
        });
      });
    });

    systemGrammarList.forEach((g) => {
      map.set(g.id, {
        structure: g.structure,
        meaning: g.meaning,
        source: g.sourceName
      });
    });

    return map;
  }, [grammarCollections, systemGrammarList]);



  // 3. Compute Curriculum progress
  const curriculumProgresses = useMemo(() => {
    return curriculums.map((c) => {
      let totalVocab = 0;
      let learnedVocab = 0;

      c.lessons.forEach((l) => {
        l.vocabulary?.forEach((v) => {
          totalVocab++;
          if (progress[v.id]?.learned) {
            learnedVocab++;
          }
        });
      });

      return {
        id: c.id,
        name: c.name,
        total: totalVocab,
        learned: learnedVocab,
        percentage: totalVocab > 0 ? Math.round((learnedVocab / totalVocab) * 100) : 0,
      };
    });
  }, [curriculums, progress]);

  // 4. Compute Notebook progress
  const notebookProgresses = useMemo(() => {
    return notebooks.map((nb) => {
      let totalVocab = nb.vocabulary?.length || 0;
      let learnedVocab = 0;

      nb.vocabulary?.forEach((v) => {
        if (progress[v.id]?.learned) {
          learnedVocab++;
        }
      });

      return {
        id: nb.id,
        name: nb.name,
        total: totalVocab,
        learned: learnedVocab,
        percentage: totalVocab > 0 ? Math.round((learnedVocab / totalVocab) * 100) : 0,
      };
    });
  }, [notebooks, progress]);

  // 5. Build Activity Timeline
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Add learned vocabulary
    Object.entries(progress).forEach(([id, p]) => {
      if (p.learned && p.learnedAt) {
        const details = vocabLookup.get(id);
        if (details) {
          items.push({
            id,
            type: "vocab",
            title: details.kanji || details.hiragana || "Từ vựng",
            subTitle: details.kanji ? details.hiragana : undefined,
            meaning: details.meaning || "",
            learnedAt: p.learnedAt,
            source: details.source,
          });
        }
      }
    });

    // Add learned grammar
    Object.entries(grammarProgress).forEach(([id, p]) => {
      if (p.learned && p.learnedAt) {
        const details = grammarLookup.get(id);
        if (details) {
          items.push({
            id,
            type: "grammar",
            title: details.structure,
            meaning: details.meaning,
            learnedAt: p.learnedAt,
            source: details.source,
          });
        }
      }
    });

    // Sort by learnedAt descending
    return items.sort((a, b) => new Date(b.learnedAt).getTime() - new Date(a.learnedAt).getTime());
  }, [progress, grammarProgress, vocabLookup, grammarLookup]);

  // Compute real-time curriculum lesson progress breakdown
  const curriculumProgressDetails = useMemo(() => {
    const manualCompletedMap = new Map<string, string>();
    completedLessons.forEach((item) => {
      manualCompletedMap.set(item.lessonId, item.completedAt);
    });

    const lessonItems = systemLessonsList.map((lesson) => {
      const vocabList = lesson.vocabulary || [];
      const grammarList = lesson.grammarPoints || [];
      const kanjiList = lesson.kanjiItems || [];

      const learnedVocab = vocabList.filter((v: any) => progress[v.id]?.learned).length;
      const learnedGrammar = grammarList.filter((g: any) => grammarProgress[g.id]?.learned).length;
      const learnedKanji = kanjiList.filter((k: any) => kanjiProgress[k.id]?.learned).length;

      const totalItems = vocabList.length + grammarList.length + kanjiList.length;
      const totalLearned = learnedVocab + learnedGrammar + learnedKanji;
      let percentage = totalItems > 0 ? Math.round((totalLearned / totalItems) * 100) : 0;
      
      const isManuallyCompleted = manualCompletedMap.has(lesson.id);
      if (isManuallyCompleted) percentage = 100;
      const isFinished = percentage === 100;

      return {
        id: lesson.id,
        name: lesson.name,
        curriculumName: lesson.curriculumName || lesson.curriculum || lesson.level || "Giáo trình",
        level: lesson.level,
        learnedVocab,
        totalVocab: vocabList.length,
        learnedGrammar,
        totalGrammar: grammarList.length,
        learnedKanji,
        totalKanji: kanjiList.length,
        totalItems,
        totalLearned,
        percentage,
        isFinished,
        isManuallyCompleted,
        completedAt: manualCompletedMap.get(lesson.id)
      };
    }).filter((item) => item.totalLearned > 0 || item.isFinished);

    const inProgressList = lessonItems.filter((item) => !item.isFinished);
    const completedList = lessonItems.filter((item) => item.isFinished);

    return {
      allActiveLessons: lessonItems,
      inProgressList,
      completedList,
      totalActiveCount: lessonItems.length,
      inProgressCount: inProgressList.length,
      completedCount: completedList.length
    };
  }, [systemLessonsList, progress, grammarProgress, kanjiProgress, completedLessons]);

  // 2. Count Total Stats from matched timeline items to ensure counts are fully synchronized
  const totalVocabLearned = useMemo(() => {
    return timelineItems.filter((item) => item.type === "vocab").length;
  }, [timelineItems]);

  const totalGrammarLearned = useMemo(() => {
    return timelineItems.filter((item) => item.type === "grammar").length;
  }, [timelineItems]);

  // Extract all unique years present in the study history
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    timelineItems.forEach((item) => {
      const yr = new Date(item.learnedAt).getFullYear();
      if (!isNaN(yr)) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [timelineItems]);

  // Filter timeline items based on the active timeFilter
  const filteredTimelineItems = useMemo(() => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return timelineItems.filter((item) => {
      const learnedTime = new Date(item.learnedAt).getTime();
      const learnedDateObj = new Date(item.learnedAt);
      
      if (timeFilter === "all") return true;
      if (timeFilter === "1day") return (now - learnedTime) <= oneDayMs;
      if (timeFilter === "3days") return (now - learnedTime) <= 3 * oneDayMs;
      if (timeFilter === "1month") return (now - learnedTime) <= 30 * oneDayMs;
      if (timeFilter === "3months") return (now - learnedTime) <= 90 * oneDayMs;
      if (timeFilter === "1year") return (now - learnedTime) <= 365 * oneDayMs;
      if (timeFilter === "thisYear") {
        return learnedDateObj.getFullYear() === new Date().getFullYear();
      }
      if (typeof timeFilter === "number") {
        return learnedDateObj.getFullYear() === timeFilter;
      }
      return true;
    });
  }, [timelineItems, timeFilter]);

  // Group timeline by date (e.g. "Hôm nay", "Hôm qua", "DD/MM/YYYY")
  const groupedTimeline = useMemo(() => {
    const groups: { [key: string]: TimelineItem[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    filteredTimelineItems.forEach((item) => {
      const dateObj = new Date(item.learnedAt);
      const dateStr = dateObj.toDateString();
      let label = "";

      if (dateStr === today) {
        label = "Hôm nay";
      } else if (dateStr === yesterday) {
        label = "Hôm qua";
      } else {
        label = dateObj.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(item);
    });

    return Object.entries(groups);
  }, [filteredTimelineItems]);

  return (
    <AuthGuard featureName="Lịch Sử & Nhật Ký Học Tập" description="Đăng nhập để theo dõi bảng tiến độ từ vựng, ngữ pháp, kanji, chuỗi streak và lịch sử học tập cá nhân.">
      <div className="p-4 max-w-4xl mx-auto min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-800 via-purple-800 to-indigo-900 rounded-3xl p-6 text-white shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
              Dland History
            </span>
            <h1 className="text-2xl font-bold mt-2">Lịch Sử Học Tập</h1>
            <p className="text-xs text-indigo-100 mt-1">
              Theo dõi chặng đường học tập, tiến độ hoàn thành giáo trình và nhật ký học từ vựng/ngữ pháp hàng ngày
            </p>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Từ vựng đã thuộc</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-indigo-600">{totalVocabLearned}</span>
              <span className="text-gray-400 text-xs font-medium">từ vựng</span>
            </div>
          </div>
          {totalVocabLearned > 0 ? (
            <Link
              href="/flashcard/learned"
              className="mt-3.5 w-full text-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5 shadow-3xs"
            >
              🎴 Ôn tập Flashcard
            </Link>
          ) : (
            <div className="text-[10px] text-gray-400 mt-2">Được lưu trên thiết bị của bạn</div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Ngữ pháp đã nắm vững</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-purple-600">{totalGrammarLearned}</span>
            <span className="text-gray-400 text-xs font-medium">cấu trúc</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-2">Bao gồm các cấu trúc từ bài học</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs flex flex-col justify-between">
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Chuỗi streak hiện tại</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-orange-500">🔥 {streak.currentStreak}</span>
            <span className="text-gray-400 text-xs font-medium">ngày</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-2">Kỷ lục dài nhất: {streak.longestStreak} ngày</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Curriculums Progress */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📚</span> Tiến độ Giáo trình
          </h2>
          {curriculumProgresses.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Chưa có giáo trình nào.</p>
          ) : (
            <div className="space-y-4 flex-1">
              {curriculumProgresses.map((c) => (
                <div key={c.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700 truncate max-w-[200px]">{c.name}</span>
                    <span className="font-bold text-indigo-600 shrink-0">
                      {c.learned}/{c.total} từ ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${c.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notebooks Progress */}
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs flex flex-col">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📓</span> Tiến độ Sổ tay
          </h2>
          {notebookProgresses.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Chưa tạo sổ tay nào.</p>
          ) : (
            <div className="space-y-4 flex-1">
              {notebookProgresses.map((nb) => (
                <div key={nb.id} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700 truncate max-w-[200px]">{nb.name}</span>
                    <span className="font-bold text-purple-600 shrink-0">
                      {nb.learned}/{nb.total} từ ({nb.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${nb.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Curriculum Lessons Progress */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>🎓</span> Tiến độ Chi tiết Bài học Giáo trình
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Theo dõi chi tiết các bài học đang học một phần hoặc đã hoàn thành
            </p>
          </div>

          {/* Sub-tabs Filter */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl shrink-0">
            {[
              { id: "all", label: `Tất cả (${curriculumProgressDetails.totalActiveCount})` },
              { id: "in_progress", label: `⭕ Đang học (${curriculumProgressDetails.inProgressCount})` },
              { id: "completed", label: `✅ Hoàn thành (${curriculumProgressDetails.completedCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurriculumTabFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  curriculumTabFilter === tab.id
                    ? "bg-white text-indigo-700 shadow-3xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Items List */}
        {(() => {
          const displayList =
            curriculumTabFilter === "in_progress"
              ? curriculumProgressDetails.inProgressList
              : curriculumTabFilter === "completed"
              ? curriculumProgressDetails.completedList
              : curriculumProgressDetails.allActiveLessons;

          if (displayList.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                <span className="text-3xl mb-2">📖</span>
                <p className="text-xs font-semibold">Chưa có dữ liệu bài học nào ở mục này.</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Vào các bài học trong Lộ trình để bắt đầu tích lũy tiến độ từ vựng & ngữ pháp!
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayList.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    item.isFinished
                      ? "bg-emerald-50/40 border-emerald-200/80 shadow-3xs"
                      : "bg-indigo-50/30 border-indigo-100/80 shadow-3xs"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-white border border-gray-200 text-indigo-700 shadow-3xs">
                        📖 {item.curriculumName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.isFinished
                            ? "bg-emerald-600 text-white"
                            : "bg-indigo-600 text-white"
                        }`}
                      >
                        {item.isFinished ? "✅ Hoàn thành 100%" : `⭕ Đang học (${item.percentage}%)`}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-gray-800 leading-snug">{item.name}</h4>

                    {/* Real-time Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-500">
                        <span>Tiến độ tổng thể bài:</span>
                        <span className={item.isFinished ? "text-emerald-700 font-extrabold" : "text-indigo-700 font-extrabold"}>
                          {item.totalLearned}/{item.totalItems} mục ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-white rounded-full h-2 overflow-hidden border border-gray-100">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.isFinished ? "bg-emerald-500" : "bg-indigo-600"
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Breakdown Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 text-[10px] font-semibold text-gray-600">
                      {item.totalVocab > 0 && (
                        <span className="bg-white/80 px-2 py-0.5 rounded-md border border-gray-100">
                          📝 {item.learnedVocab}/{item.totalVocab} từ
                        </span>
                      )}
                      {item.totalGrammar > 0 && (
                        <span className="bg-white/80 px-2 py-0.5 rounded-md border border-gray-100">
                          📖 {item.learnedGrammar}/{item.totalGrammar} ngữ pháp
                        </span>
                      )}
                      {item.totalKanji > 0 && (
                        <span className="bg-white/80 px-2 py-0.5 rounded-md border border-gray-100">
                          🉐 {item.learnedKanji}/{item.totalKanji} kanji
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100/60 flex items-center justify-between">
                    <span className="text-[9px] text-gray-400">
                      {item.completedAt
                        ? `✓ Hoàn thành: ${new Date(item.completedAt).toLocaleDateString("vi-VN")}`
                        : "Đang lưu tiến độ liên tục"}
                    </span>
                    <Link
                      href={`/curriculum/${item.id}`}
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-3xs transition-colors"
                    >
                      {item.isFinished ? "Xem lại bài →" : "Học tiếp bài này →"}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>⏱️</span> Nhật ký hoạt động gần đây
          </h2>

          {/* Time Filter Controls */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {[
              { id: "all", label: "Tất cả" },
              { id: "1day", label: "1 ngày" },
              { id: "3days", label: "3 ngày" },
              { id: "1month", label: "1 tháng" },
              { id: "3months", label: "3 tháng" },
              { id: "1year", label: "1 năm" },
              { id: "thisYear", label: "Năm nay" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setTimeFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                  timeFilter === f.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {f.label}
              </button>
            ))}

            {/* Year Dropdown */}
            {availableYears.length > 0 && (
              <select
                value={typeof timeFilter === "number" ? timeFilter : ""}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setTimeFilter(parseInt(val));
                  } else {
                    setTimeFilter("all");
                  }
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border outline-none cursor-pointer ${
                  typeof timeFilter === "number"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-3xs"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <option value="" className="text-gray-700 bg-white">Theo năm</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="text-gray-700 bg-white">
                    Năm {yr}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {groupedTimeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-4xl mb-3">🌱</span>
            <h3 className="font-bold text-gray-700 text-sm">Chưa ghi nhận hoạt động</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Hãy bắt đầu đánh dấu các từ vựng hoặc cấu trúc ngữ pháp là "Đã học" để theo dõi lịch sử tại đây!
            </p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {groupedTimeline.map(([date, items]) => (
              <div key={date} className="relative pl-8">
                {/* Date bubble */}
                <div className="absolute left-[3px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-50 z-10" />
                <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-3">
                  {date}
                </h3>

                <div className="space-y-3">
                  {items.map((item) => {
                    const timeStr = new Date(item.learnedAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={item.id + item.type}
                        className="bg-gray-50/50 hover:bg-gray-50 rounded-2xl p-4 border border-gray-100/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase shrink-0 mt-0.5 ${
                              item.type === "vocab"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                : "bg-purple-50 text-purple-700 border border-purple-100"
                            }`}
                          >
                            {item.type === "vocab" ? "Từ vựng" : "Ngữ pháp"}
                          </span>

                          <div>
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-extrabold text-gray-900 text-sm">{item.title}</span>
                              {item.subTitle && (
                                <span className="text-xs text-gray-400 font-medium">({item.subTitle})</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.meaning}</p>
                            <span className="text-[10px] text-gray-400 mt-1 block font-medium">
                              📂 {item.source}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-gray-400 sm:text-right shrink-0 mt-1 sm:mt-0">
                          🕒 {timeStr}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </AuthGuard>
  );
}
