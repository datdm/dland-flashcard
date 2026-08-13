"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurriculumRepository } from "@/lib/repositories";
import { CurriculumLevelGroup, JLPTLevel } from "@/lib/repositories/types";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

export default function CurriculumPage() {
  const [groups, setGroups] = useState<CurriculumLevelGroup[]>([]);
  const [activeLevel, setActiveLevel] = useState<JLPTLevel>("N5");
  const [loading, setLoading] = useState(true);
  const { activeLanguage } = useLanguageSetting();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
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
    ? "Lộ trình Học Tiếng Anh (A1)" 
    : "Lộ trình Học Tiếng Nhật (N5 ➔ N2)";
  const headerSubtitle = activeLanguage.code === "de"
    ? "Học bài bản theo giáo trình Netzwerk neu A1"
    : activeLanguage.code === "en"
    ? "Học từ vựng Oxford 3000 & Ngữ pháp Tiếng Anh"
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
      {!isMultilingual && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-6">
          {(["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).map((level) => {
            const group = groups.find((g) => g.level === level);
            const count = group ? group.totalLessons : 0;

            return (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeLevel === level
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span>{level}</span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    activeLevel === level ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count} bài
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
                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide">
                  {isMultilingual ? "TRÌNH ĐỘ SƠ CẤP" : `CẤP ĐỘ ${activeGroup.level}`}
                </span>
                <h2 className="text-xl font-bold mt-2">{activeGroup.title}</h2>
                <p className="text-xs text-indigo-100 mt-1 max-w-xl leading-relaxed">
                  {activeGroup.description}
                </p>
              </div>
              <div className="hidden sm:flex gap-4 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl text-center">
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
            {activeGroup.lessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/curriculum/${lesson.id}`}
                className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {lesson.curriculum || (isMultilingual ? activeLanguage.name : activeGroup.level)}
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

                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-500">
                  <span>📝 {lesson.vocabulary?.length || 0} từ</span>
                  <span>📖 {lesson.grammarPoints?.length || 0} ngữ pháp</span>
                  {!isMultilingual && <span>🉐 {lesson.kanjiItems?.length || 0} kanji</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
