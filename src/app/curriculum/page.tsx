"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCurriculumRepository } from "@/lib/repositories";
import { CurriculumLevelGroup, JLPTLevel } from "@/lib/repositories/types";
import { useProgress } from "@/hooks/useProgress";
import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useKanjiProgress } from "@/hooks/useKanjiProgress";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import IeltsRoadmapDashboard from "@/components/IeltsRoadmapDashboard";

function CurriculumContent() {
  const searchParams = useSearchParams();
  const urlLevel = searchParams.get("level") as JLPTLevel | null;

  const [groups, setGroups] = useState<CurriculumLevelGroup[]>([]);
  const [activeLevel, setActiveLevel] = useState<JLPTLevel>(urlLevel || "N5");

  useEffect(() => {
    if (urlLevel && (["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).includes(urlLevel)) {
      setActiveLevel(urlLevel);
    }
  }, [urlLevel]);
  const [activeBookId, setActiveBookId] = useState<string>("");
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
      const data = await repo.getCurriculums(activeLanguage.code);
      setGroups(data);
      if (activeLanguage.code === "de" || activeLanguage.code === "en") {
        setActiveLevel("N5");
      }
      setLoading(false);
    }
    loadData();
  }, [activeLanguage.code]);

  const activeGroup = groups.find((g) => g.level === activeLevel);
  const availableBooks = activeGroup?.books || [];

  // Automatically select first book if activeBookId is not valid for activeGroup
  const currentBook = availableBooks.find((b) => b.id === activeBookId) || availableBooks[0] || null;

  const isMultilingual = activeLanguage.code === "de" || activeLanguage.code === "en";
  const headerTitle = activeLanguage.code === "de" 
    ? "Kho Giáo Trình Tiếng Đức" 
    : activeLanguage.code === "en" 
    ? "Lộ Trình IELTS 7.0 (12 Tháng / 52 Tuần)" 
    : "Kho Giáo Trình Tiếng Nhật Theo Cấp Độ";
  const headerSubtitle = activeLanguage.code === "de"
    ? "Chọn giáo trình chuẩn CEFR (Netzwerk Neu A1, Schritte International, Aspekte Neu)"
    : activeLanguage.code === "en"
    ? "Luyện thi IELTS 7.0 bài bản: Foundation ➔ Format ➔ Advanced ➔ Mock Test"
    : "Học bài bản theo Minna no Nihongo, Genki, Soumatome, Shinkanzen Master, Marugoto & Try!";

  const getLevelStats = (level: JLPTLevel) => {
    const group = groups.find((g) => g.level === level);
    if (!group) return { totalItems: 0, learnedItems: 0, percentage: 0, totalLessons: 0, completedLessons: 0, totalVocab: 0, learnedVocab: 0, totalGrammar: 0, learnedGrammar: 0, totalKanji: 0, learnedKanji: 0 };

    let totalVocab = 0, learnedVocab = 0;
    let totalGrammar = 0, learnedGrammar = 0;
    let totalKanji = 0, learnedKanji = 0;
    let completedLessonsCount = 0;

    group.lessons.forEach((l) => {
      const vList = l.vocabulary || [];
      const gList = l.grammarPoints || [];
      const kList = l.kanjiItems || [];

      totalVocab += vList.length;
      totalGrammar += gList.length;
      totalKanji += kList.length;

      const lV = vList.filter((v: any) => progress[v.id]?.learned).length;
      const lG = gList.filter((g: any) => grammarProgress[g.id]?.learned).length;
      const lK = kList.filter((k: any) => kanjiProgress[k.id]?.learned).length;

      learnedVocab += lV;
      learnedGrammar += lG;
      learnedKanji += lK;

      const totalLessonItems = vList.length + gList.length + kList.length;
      const learnedLessonItems = lV + lG + lK;
      if (totalLessonItems > 0 && learnedLessonItems === totalLessonItems) {
        completedLessonsCount++;
      }
    });

    const totalItems = totalVocab + totalGrammar + totalKanji;
    const learnedItems = learnedVocab + learnedGrammar + learnedKanji;
    const percentage = totalItems > 0 ? Math.round((learnedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      learnedItems,
      percentage,
      totalLessons: group.lessons.length,
      completedLessons: completedLessonsCount,
      totalVocab,
      learnedVocab,
      totalGrammar,
      learnedGrammar,
      totalKanji,
      learnedKanji
    };
  };

  const activeLevelStats = useMemo(() => {
    return getLevelStats(activeLevel);
  }, [groups, activeLevel, progress, grammarProgress, kanjiProgress]);

  const currentBookStats = useMemo(() => {
    if (!currentBook) return activeLevelStats;

    let totalVocab = 0, learnedVocab = 0;
    let totalGrammar = 0, learnedGrammar = 0;
    let totalKanji = 0, learnedKanji = 0;
    let completedLessonsCount = 0;

    currentBook.lessons.forEach((l) => {
      const vList = l.vocabulary || [];
      const gList = l.grammarPoints || [];
      const kList = l.kanjiItems || [];

      totalVocab += vList.length;
      totalGrammar += gList.length;
      totalKanji += kList.length;

      const lV = vList.filter((v: any) => progress[v.id]?.learned).length;
      const lG = gList.filter((g: any) => grammarProgress[g.id]?.learned).length;
      const lK = kList.filter((k: any) => kanjiProgress[k.id]?.learned).length;

      learnedVocab += lV;
      learnedGrammar += lG;
      learnedKanji += lK;

      const totalLessonItems = vList.length + gList.length + kList.length;
      const learnedLessonItems = lV + lG + lK;
      if (totalLessonItems > 0 && learnedLessonItems === totalLessonItems) {
        completedLessonsCount++;
      }
    });

    const totalItems = totalVocab + totalGrammar + totalKanji;
    const learnedItems = learnedVocab + learnedGrammar + learnedKanji;
    const percentage = totalItems > 0 ? Math.round((learnedItems / totalItems) * 100) : 0;

    return {
      totalItems,
      learnedItems,
      percentage,
      totalLessons: currentBook.lessons.length,
      completedLessons: completedLessonsCount,
      totalVocab,
      learnedVocab,
      totalGrammar,
      learnedGrammar,
      totalKanji,
      learnedKanji
    };
  }, [currentBook, activeLevelStats, progress, grammarProgress, kanjiProgress]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-8 md:pb-4">
      {/* Header Banner */}
      <div className={`rounded-2xl p-4 sm:p-5 text-white shadow-lg transition-all duration-300 bg-gradient-to-r ${
        activeLanguage.code === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : activeLanguage.code === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1.5">{headerTitle}</h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 leading-relaxed">
              {headerSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Level Selector Tabs */}
      {!isMultilingual && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {(["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).map((level) => {
            const group = groups.find((g) => g.level === level);
            const bookCount = group?.books?.length || 1;
            const totalLessonCount = group ? group.totalLessons : 0;
            const stats = getLevelStats(level);

            return (
              <button
                key={level}
                onClick={() => {
                  setActiveLevel(level);
                  const targetGroup = groups.find((g) => g.level === level);
                  if (targetGroup?.books && targetGroup.books.length > 0) {
                    setActiveBookId(targetGroup.books[0].id);
                  }
                }}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex flex-col items-start gap-1 cursor-pointer ${
                  activeLevel === level
                    ? "bg-indigo-600 text-white shadow-xs scale-102"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold">{level}</span>
                    <span
                      className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                        activeLevel === level ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {bookCount} giáo trình
                    </span>
                  </div>
                  {stats.percentage > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                      activeLevel === level ? "bg-amber-400 text-gray-900" : "bg-amber-100 text-amber-800"
                    }`}>
                      {stats.percentage}%
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${activeLevel === level ? "text-indigo-100" : "text-gray-400"}`}>
                  📚 {totalLessonCount} bài học tổng hợp
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
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
        <div className="space-y-4 sm:space-y-5">
          {/* Progress Overview Banner for Selected Textbook */}
          {!isMultilingual && activeGroup && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-indigo-900/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 backdrop-blur-md rounded-full text-xs font-extrabold tracking-wide uppercase">
                      🎯 Progress Tracker — {currentBook?.name || `Trình độ ${activeLevel}`}
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-300/30 rounded-full text-xs font-black">
                      Tiến độ: {currentBookStats.percentage}%
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                    Tổng Quan Tiến Độ Học Tập — {currentBook?.name || activeGroup.title}
                  </h2>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Theo dõi tiến độ từ vựng, ngữ pháp, kanji và các bài học đã thuộc của giáo trình {currentBook?.name || activeGroup.title}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-300">
                      <span>Hoàn thành: {currentBookStats.learnedItems} / {currentBookStats.totalItems} mục</span>
                      <span className="text-amber-300 font-extrabold">{currentBookStats.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${currentBookStats.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Grid Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0 bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <div className="text-sm sm:text-base font-black text-indigo-300">{currentBookStats.learnedVocab}/{currentBookStats.totalVocab}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">📝 Từ vựng</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <div className="text-sm sm:text-base font-black text-teal-300">{currentBookStats.learnedGrammar}/{currentBookStats.totalGrammar}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">📖 Ngữ pháp</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <div className="text-sm sm:text-base font-black text-pink-300">{currentBookStats.learnedKanji}/{currentBookStats.totalKanji}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">🉐 Kanji</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/5">
                    <div className="text-sm sm:text-base font-black text-amber-300">{currentBookStats.completedLessons}/{currentBookStats.totalLessons}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">✅ Bài học</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Textbook Shelf Sub-Selector (Danh sách các giáo trình của cấp độ hiện tại) */}
          {availableBooks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📚</span> Chọn giáo trình {activeLevel} ({availableBooks.length} đầu sách):
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  Nhấn vào giáo trình để chuyển đổi
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                {availableBooks.map((book) => {
                  const isSelected = currentBook?.id === book.id;
                  
                  // Calculate total learned items for this book
                  let bookTotalLearned = 0;
                  let bookTotalItems = 0;
                  book.lessons.forEach((l) => {
                    const vCount = l.vocabulary?.length || 0;
                    const gCount = l.grammarPoints?.length || 0;
                    const kCount = l.kanjiItems?.length || 0;
                    bookTotalItems += vCount + gCount + kCount;

                    const lV = l.vocabulary?.filter((v: any) => progress[v.id]?.learned).length || 0;
                    const lG = l.grammarPoints?.filter((g: any) => grammarProgress[g.id]?.learned).length || 0;
                    const lK = l.kanjiItems?.filter((k: any) => kanjiProgress[k.id]?.learned).length || 0;
                    bookTotalLearned += lV + lG + lK;
                  });

                  const bookPercent = bookTotalItems > 0 ? Math.round((bookTotalLearned / bookTotalItems) * 100) : 0;

                  return (
                    <button
                      key={book.id}
                      onClick={() => setActiveBookId(book.id)}
                      className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col justify-between relative group cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs scale-101"
                          : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-lg">{book.icon || "📖"}</span>
                          {book.tag && (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-100 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                            }`}>
                              {book.tag}
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-xs text-gray-900 line-clamp-2 leading-tight">
                          {book.name}
                        </h4>
                        {book.publisher && (
                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                            NXB: {book.publisher}
                          </p>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-gray-100 w-full">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold mb-1">
                          <span>{book.totalLessons} bài học</span>
                          <span className={bookPercent > 0 ? "text-indigo-600 font-bold" : "text-gray-400"}>
                            {bookPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isSelected ? "bg-indigo-600" : "bg-indigo-400"
                            }`}
                            style={{ width: `${bookPercent}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Textbook Details Banner */}
          {currentBook && (
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-4 sm:p-5 text-white shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[11px] font-semibold tracking-wide">
                      {isMultilingual ? "TRÌNH ĐỘ SƠ CẤP" : `CẤP ĐỘ ${activeGroup.level}`}
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-400/30 text-amber-200 border border-amber-300/30 backdrop-blur-md rounded-full text-[11px] font-bold">
                      {currentBook.icon || "📘"} {currentBook.name}
                    </span>
                    {currentBook.tag && (
                      <span className="px-2 py-0.5 bg-white/15 text-white rounded-full text-[10px] font-bold">
                        {currentBook.tag}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold mt-1">{currentBook.name}</h2>
                  <p className="text-xs text-indigo-100 mt-1 max-w-2xl leading-relaxed">
                    {currentBook.description}
                  </p>
                </div>
                
                <div className="flex gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl text-center shrink-0 self-start md:self-auto">
                  <div>
                    <div className="text-base sm:text-lg font-extrabold">{currentBook.totalLessons}</div>
                    <div className="text-[10px] text-indigo-200 uppercase font-semibold">Bài học</div>
                  </div>
                  <div className="border-r border-white/20" />
                  <div>
                    <div className="text-base sm:text-lg font-extrabold">{currentBook.totalVocab}</div>
                    <div className="text-[10px] text-indigo-200 uppercase font-semibold">Từ vựng</div>
                  </div>
                  <div className="border-r border-white/20" />
                  <div>
                    <div className="text-base sm:text-lg font-extrabold">{currentBook.totalGrammar}</div>
                    <div className="text-[10px] text-indigo-200 uppercase font-semibold">Ngữ pháp</div>
                  </div>
                  {!isMultilingual && currentBook.totalKanji > 0 && (
                    <>
                      <div className="border-r border-white/20" />
                      <div>
                        <div className="text-base sm:text-lg font-extrabold">{currentBook.totalKanji}</div>
                        <div className="text-[10px] text-indigo-200 uppercase font-semibold">Kanji</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lessons List of Selected Textbook */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-gray-800">
                Danh sách bài học — {currentBook?.name || activeGroup.title} ({currentBook?.lessons.length || activeGroup.lessons.length} bài)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
              {(currentBook?.lessons || activeGroup.lessons).map((lesson) => {
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
                    className="group bg-white rounded-xl p-3.5 sm:p-4 border border-gray-100 shadow-xs hover:shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          📖 {lesson.curriculum || currentBook?.name || activeGroup.level}
                        </span>
                        <span className="text-[11px] text-gray-400 group-hover:text-indigo-600 transition-colors font-medium">
                          Vào bài học →
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">
                        {lesson.name}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-50 space-y-1.5">
                      <div className="flex items-center justify-between gap-3 text-xs text-gray-500 font-medium">
                        <span>📝 {learnedVocab}/{vocabList.length} từ</span>
                        <span>📖 {learnedGrammar}/{grammarList.length} ngữ pháp</span>
                        {!isMultilingual && kanjiList.length > 0 && (
                          <span>🉐 {learnedKanji}/{kanjiList.length} kanji</span>
                        )}
                      </div>

                      {totalLearned > 0 && (
                        <div className="space-y-1 pt-0.5">
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
        </div>
      )}
    </div>
  );
}


export default function CurriculumPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-indigo-600 font-medium">Đang tải giáo trình...</div>}>
      <CurriculumContent />
    </Suspense>
  );
}
