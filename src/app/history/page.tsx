"use client";

import { useMemo } from "react";
import { useProgress } from "@/hooks/useProgress";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useGrammarCollections } from "@/hooks/useGrammarCollections";
import { useStreak } from "@/hooks/useStreak";
import Link from "next/link";

interface TimelineItem {
  id: string;
  type: "vocab" | "grammar";
  title: string;
  subTitle?: string;
  meaning: string;
  learnedAt: string;
  source: string;
}

export default function HistoryPage() {
  const { progress } = useProgress();
  const { progress: grammarProgress } = useGrammarProgress();
  const { curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const { collections: grammarCollections } = useGrammarCollections();
  const streak = useStreak();

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

    return map;
  }, [curriculums, notebooks]);

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

    return map;
  }, [grammarCollections]);

  // 2. Count Total Stats
  const totalVocabLearned = useMemo(() => {
    return Object.values(progress).filter((p) => p.learned).length;
  }, [progress]);

  const totalGrammarLearned = useMemo(() => {
    return Object.values(grammarProgress).filter((p) => p.learned).length;
  }, [grammarProgress]);

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

  // Group timeline by date (e.g. "Hôm nay", "Hôm qua", "DD/MM/YYYY")
  const groupedTimeline = useMemo(() => {
    const groups: { [key: string]: TimelineItem[] } = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    timelineItems.forEach((item) => {
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
  }, [timelineItems]);

  return (
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
          <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Từ vựng đã thuộc</div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-indigo-600">{totalVocabLearned}</span>
            <span className="text-gray-400 text-xs font-medium">từ vựng</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-2">Được lưu trên thiết bị của bạn</div>
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

      {/* Activity Timeline */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
        <h2 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
          <span>⏱️</span> Nhật ký hoạt động gần đây
        </h2>

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
  );
}
