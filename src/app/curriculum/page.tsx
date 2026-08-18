"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurriculumRepository } from "@/lib/repositories";
import { CurriculumLevelGroup, JLPTLevel } from "@/lib/repositories/types";
import { useProgress } from "@/hooks/useProgress";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useKanjiProgress } from "@/hooks/useKanjiProgress";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import IeltsRoadmapDashboard from "@/components/IeltsRoadmapDashboard";

export default function CurriculumPage() {
  const [groups, setGroups] = useState<CurriculumLevelGroup[]>([]);
  const [activeLevel, setActiveLevel] = useState<JLPTLevel>("N5");
  const [loading, setLoading] = useState(true);
  const [enData, setEnData] = useState<any>(null);
  const { activeLanguage } = useLanguageSetting();
  const { progress } = useProgress();
  const { progress: grammarProgress } = useGrammarProgress();
  const { progress: kanjiProgress } = useKanjiProgress();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (activeLanguage.code === "en") {
        try {
          const res = await fetch("/data/en-curriculum.json");
          if (res.ok) {
            const data = await res.json();
            setEnData(data);
          }
        } catch (e) {
          console.error("Failed to load English curriculum JSON", e);
        }
      }

      const repo = getCurriculumRepository();
      const data = await repo.getCurriculums();
      setGroups(data);
      if (activeLanguage.code === "de" || activeLanguage.code === "en") {
        setActiveLevel("N5");
      }
      setLoading(false);
    }
    loadData();
  }, [activeLanguage.code]);

  const activeGroup = groups.find((g) => g.level === activeLevel);

  const isMultilingual = activeLanguage.code === "de" || activeLanguage.code === "en";
  const headerTitle = activeLanguage.code === "de" 
    ? "Lộ trình Học Tiếng Đức (A1)" 
    : activeLanguage.code === "en" 
    ? "Lộ Trình IELTS 7.0 (12 Tháng / 52 Tuần)" 
    : "Lộ trình Học Tiếng Nhật (N5 ➔ N2)";
  const headerSubtitle = activeLanguage.code === "de"
    ? "Học bài bản theo giáo trình Netzwerk neu A1"
    : activeLanguage.code === "en"
    ? "Luyện thi IELTS 7.0 bài bản: Foundation ➔ Format ➔ Advanced ➔ Mock Test"
    : "Học bài bản theo giáo trình Minna no Nihongo, Soumatome & Shinkanzen Master";

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{headerTitle}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {headerSubtitle}
          </p>
        </div>
      </div>

      {/* Level Selector Tabs */}
      {/* Level Selector Tabs */}
      {!isMultilingual && (
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-3 mb-6">
          {(["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).map((level) => {
            const group = groups.find((g) => g.level === level);
            const count = group ? group.totalLessons : 0;
            const textbookNames: Record<JLPTLevel, string> = {
              N5: "Minna I (1-25)",
              N4: "Minna II (26-50)",
              N3: "Soumatome & Shinkanzen N3",
              N2: "Shinkanzen Master N2",
              N1: "Shinkanzen Master N1",
            };

            return (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all whitespace-nowrap flex flex-col items-start gap-1 ${
                  activeLevel === level
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm font-extrabold">{level}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                      activeLevel === level ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count} bài
                  </span>
                </div>
                <span className={`text-[10px] font-medium ${activeLevel === level ? "text-indigo-100" : "text-gray-400"}`}>
                  📖 {textbookNames[level]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Level Group Details */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-indigo-600 font-medium">
          Đang tải kho bài học...
        </div>
      ) : activeLanguage.code === "en" ? (
        <IeltsRoadmapDashboard
          lessons={enData?.lessons || activeGroup?.lessons || []}
          materials={enData?.materials || []}
          timetable={enData?.weeklyTimetable || []}
          mockTests={enData?.mockTests || []}
        />
      ) : !activeGroup || activeGroup.lessons.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center text-gray-400 border border-gray-100">
          Chưa có bài học nào cho trình độ {activeLevel}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Level Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 text-white shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
                    {isMultilingual ? "TRÌNH ĐỘ SƠ CẤP" : `CẤP ĐỘ ${activeGroup.level}`}
                  </span>
                  <span className="px-3 py-1 bg-amber-400/30 text-amber-200 border border-amber-300/30 backdrop-blur-md rounded-full text-xs font-bold">
                    📘 {activeGroup.level === "N5" ? "Giáo trình Minna no Nihongo I" : activeGroup.level === "N4" ? "Giáo trình Minna no Nihongo II" : activeGroup.level === "N3" ? "Giáo trình Soumatome & Shinkanzen N3" : activeGroup.level === "N2" ? "Giáo trình Shinkanzen Master & Try! N2" : "Giáo trình Shinkanzen Master & Try! N1"}
                  </span>
                </div>
                <h2 className="text-xl font-bold mt-1">{activeGroup.title}</h2>
                <p className="text-xs text-indigo-100 mt-1 max-w-xl leading-relaxed">
                  {activeGroup.description}
                </p>
              </div>
              <div className="hidden sm:flex gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl text-center shrink-0">
                <div>
                  <div className="text-lg font-extrabold">{activeGroup.totalVocab}</div>
                  <div className="text-[10px] text-indigo-200 uppercase font-semibold">Từ vựng</div>
                </div>
                <div className="border-r border-white/20" />
                <div>
                  <div className="text-lg font-extrabold">{activeGroup.totalGrammar}</div>
                  <div className="text-[10px] text-indigo-200 uppercase font-semibold">Ngữ pháp</div>
                </div>
                {!isMultilingual && (
                  <>
                    <div className="border-r border-white/20" />
                    <div>
                      <div className="text-lg font-extrabold">{activeGroup.totalKanji}</div>
                      <div className="text-[10px] text-indigo-200 uppercase font-semibold">Kanji</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lessons List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGroup.lessons.map((lesson) => {
              const vocabList = lesson.vocabulary || [];
              const grammarList = lesson.grammarPoints || [];
              const kanjiList = lesson.kanjiItems || [];

              const learnedVocab = vocabList.filter((v: any) => progress[v.id]?.learned).length;
              const learnedGrammar = grammarList.filter((g: any) => grammarProgress[g.id]?.learned).length;
              const learnedKanji = kanjiList.filter((k: any) => kanjiProgress[k.id]?.learned).length;

              const totalItems = vocabList.length + grammarList.length + kanjiList.length;
              const totalLearned = learnedVocab + learnedGrammar + learnedKanji;
              const percentage = totalItems > 0 ? Math.round((totalLearned / totalItems) * 100) : 0;

              return (
                <Link
                  key={lesson.id}
                  href={`/curriculum/${lesson.id}`}
                  className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        📖 {lesson.curriculum || (lesson.level === "N5" ? "Minna no Nihongo I" : lesson.level === "N4" ? "Minna no Nihongo II" : lesson.level === "N3" ? "Soumatome N3" : lesson.level === "N2" ? "Shinkanzen N2" : activeGroup.level)}
                      </span>
                      <span className="text-xs text-gray-400 group-hover:text-indigo-600 transition-colors">
                        Vào bài học →
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-base group-hover:text-indigo-600 transition-colors">
                      {lesson.name}
                    </h3>
                    {lesson.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 space-y-2">
                    <div className="flex items-center justify-between gap-4 text-xs text-gray-500">
                      <span>📝 {learnedVocab}/{vocabList.length} từ</span>
                      <span>📖 {learnedGrammar}/{grammarList.length} ngữ pháp</span>
                      {!isMultilingual && <span>🉐 {learnedKanji}/{kanjiList.length} kanji</span>}
                    </div>

                    {totalLearned > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-indigo-600">📊 Tiến độ: {percentage}%</span>
                          <span className="text-gray-400">{totalLearned}/{totalItems} mục</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
