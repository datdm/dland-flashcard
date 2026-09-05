const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'curriculum', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useSearchParams and Suspense
if (!content.includes('useSearchParams')) {
  content = content.replace(
    'import { useEffect, useState, useMemo } from "react";',
    'import { useEffect, useState, useMemo, Suspense } from "react";\nimport { useSearchParams } from "next/navigation";'
  );
}

// 2. Wrap content inside an inner component CurriculumContent that reads useSearchParams
const oldExport = `export default function CurriculumPage() {
  const [groups, setGroups] = useState<CurriculumLevelGroup[]>([]);
  const [activeLevel, setActiveLevel] = useState<JLPTLevel>("N5");`;

const newExport = `function CurriculumContent() {
  const searchParams = useSearchParams();
  const urlLevel = searchParams.get("level") as JLPTLevel | null;

  const [groups, setGroups] = useState<CurriculumLevelGroup[]>([]);
  const [activeLevel, setActiveLevel] = useState<JLPTLevel>(urlLevel || "N5");

  useEffect(() => {
    if (urlLevel && (["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).includes(urlLevel)) {
      setActiveLevel(urlLevel);
    }
  }, [urlLevel]);`;

content = content.replace(oldExport, newExport);

// 3. Compact the level tabs (around line 200)
const oldLevelTabsRegex = /<div className="flex items-center gap-2\.5 overflow-x-auto no-scrollbar pb-2 mb-6">[\s\S]*?<\/div>\s*\}\)/;

const newLevelTabs = `<div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 mb-4">
          {(["N5", "N4", "N3", "N2", "N1"] as JLPTLevel[]).map((level) => {
            const group = groups.find((g) => g.level === level);
            const bookCount = group?.books?.length || 1;
            const stats = getLevelStats(level);

            return (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setActiveLevel(level);
                  const targetGroup = groups.find((g) => g.level === level);
                  if (targetGroup?.books && targetGroup.books.length > 0) {
                    setActiveBookId(targetGroup.books[0].id);
                  }
                }}
                className={\`px-3 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer \${
                  activeLevel === level
                    ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }\`}
              >
                <span className="text-xs font-black">{level}</span>
                <span
                  className={\`px-1.5 py-0.2 rounded-md text-[10px] font-semibold \${
                    activeLevel === level ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }\`}
                >
                  {bookCount} sách
                </span>
                {stats.percentage > 0 && (
                  <span className={\`text-[10px] font-extrabold \${
                    activeLevel === level ? "text-amber-300" : "text-indigo-600"
                  }\`}>
                    {stats.percentage}%
                  </span>
                )}
              </button>
            );
          })}`;

content = content.replace(oldLevelTabsRegex, newLevelTabs);

// 4. Compact the Progress Overview & Textbook details into a single streamlined card (reducing height by 60%)
const oldProgressAndDetailsRegex = /\{\/\* Progress Overview Banner for Selected Textbook \*\/\}[\s\S]*?\{\/\* Active Textbook Details Banner \*\/\}[\s\S]*?(?=\{\/\* Lesson Grid Container \*\/)/;

const newUnifiedHeader = `{/* Unified Compact Textbook & Progress Header */}
          {!isMultilingual && activeGroup && currentBook && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-indigo-900/50">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-[10px] font-bold tracking-wide uppercase">
                      CẤP ĐỘ {activeGroup.level}
                    </span>
                    <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-300/30 rounded-full text-[10px] font-bold">
                      {currentBook.icon || "📘"} {currentBook.name}
                    </span>
                    {currentBook.tag && (
                      <span className="px-2 py-0.5 bg-white/10 text-white rounded-full text-[9px] font-bold">
                        {currentBook.tag}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                    {currentBook.name}
                  </h2>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    {currentBook.description}
                  </p>

                  {/* Compact Progress Bar */}
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-300">
                      <span>Đã thuộc: {currentBookStats.learnedItems} / {currentBookStats.totalItems} mục</span>
                      <span className="text-amber-300 font-extrabold">{currentBookStats.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: \`\${currentBookStats.percentage}%\` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Compact Stats Chips */}
                <div className="grid grid-cols-4 gap-2 shrink-0 bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <div className="text-center px-2 py-1.5 rounded-lg bg-white/5">
                    <div className="text-sm font-black text-indigo-300">{currentBookStats.learnedVocab}/{currentBookStats.totalVocab}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Từ vựng</div>
                  </div>
                  <div className="text-center px-2 py-1.5 rounded-lg bg-white/5">
                    <div className="text-sm font-black text-teal-300">{currentBookStats.learnedGrammar}/{currentBookStats.totalGrammar}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Ngữ pháp</div>
                  </div>
                  <div className="text-center px-2 py-1.5 rounded-lg bg-white/5">
                    <div className="text-sm font-black text-pink-300">{currentBookStats.learnedKanji}/{currentBookStats.totalKanji}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Kanji</div>
                  </div>
                  <div className="text-center px-2 py-1.5 rounded-lg bg-white/5">
                    <div className="text-sm font-black text-amber-300">{currentBookStats.completedLessons}/{currentBookStats.totalLessons}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Bài học</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Textbook Shelf Sub-Selector */}
          {availableBooks.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📚</span> Giáo trình {activeLevel} ({availableBooks.length} sách):
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableBooks.map((book) => {
                  const isSelected = currentBook?.id === book.id;
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
                      type="button"
                      onClick={() => setActiveBookId(book.id)}
                      className={\`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between \${
                        isSelected
                          ? "bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                          : "bg-white border-gray-200 hover:border-indigo-300"
                      }\`}
                    >
                      <div className="flex items-center justify-between gap-1 w-full">
                        <span className="text-base">{book.icon || "📖"}</span>
                        {book.tag && (
                          <span className={\`text-[9px] font-extrabold px-1.5 py-0.2 rounded \${
                            isSelected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
                          }\`}>
                            {book.tag}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-gray-900 truncate mt-1">
                        {book.name}
                      </h4>
                      <div className="mt-1.5 pt-1.5 border-t border-gray-100 w-full flex items-center justify-between text-[10px] text-gray-500">
                        <span>{book.totalLessons} bài</span>
                        <span className={bookPercent > 0 ? "text-indigo-600 font-bold" : "text-gray-400"}>
                          {bookPercent}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          `;

content = content.replace(oldProgressAndDetailsRegex, newUnifiedHeader);

// 5. Wrap export with Suspense
content += `

export default function CurriculumPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-indigo-600 font-medium">Đang tải giáo trình...</div>}>
      <CurriculumContent />
    </Suspense>
  );
}
`;

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated curriculum/page.tsx with compact UI and searchParams support!");
