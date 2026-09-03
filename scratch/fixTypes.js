const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'practice', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix types for selectedReadingMondai and selectedListeningMondai
content = content.replace(
  `  // JLPT Reading & Listening by Mondai states (Japanese only) - single select only
  const [selectedReadingMondai, setSelectedReadingMondai] = useState<number>(() => {
    return 10;
  });
  const [selectedListeningMondai, setSelectedListeningMondai] = useState<number>(1);`,
  `  // JLPT Reading & Listening by Mondai states (Japanese only)
  const [selectedReadingMondai, setSelectedReadingMondai] = useState<number | "all">(10);
  const [selectedListeningMondai, setSelectedListeningMondai] = useState<number | "all">(1);`
);

// 2. Fix line 1163: readingData.options?.find
content = content.replace(
  `correctAnswer: readingData.options.find((o) => o.isCorrect)?.text || opt.text,`,
  `correctAnswer: readingData.options?.find((o) => o.isCorrect)?.text || opt.text,`
);

// 3. In handleGenerate, ensure numeric mondaiNumber is sent
content = content.replace(
  `mondaiNumber: selectedType === "reading" ? selectedReadingMondai : selectedType === "listening" ? selectedListeningMondai : undefined,`,
  `mondaiNumber: selectedType === "reading" ? (selectedReadingMondai === "all" ? 10 : selectedReadingMondai) : selectedType === "listening" ? (selectedListeningMondai === "all" ? 1 : selectedListeningMondai) : undefined,`
);

// 4. In sidebar: replace lines 1481 to 1640 with the clean, unified sidebar layout
const oldSidebarFullBlockRegex = /\{\/\* Step 3: Select Mondai for JLPT Reading \/ Listening OR Select Topic \*\/\}[\s\S]*?\{\/\* Step 4: Generate Button \*\/\}[\s\S]*?<\/button>/;

const newSidebarUnified = `{/* Step 3: Select Mondai for JLPT Reading / Listening (Single Select) */}
            {selectedLang === "ja" && (selectedType === "reading" || selectedType === "listening") && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    3. Chọn Mondai Chuyên Sâu ({selectedLevel}):
                  </label>
                  <span className="text-[10px] text-teal-600 font-bold">
                    {selectedType === "reading" ? "Đọc hiểu" : "Nghe hiểu"}
                  </span>
                </div>

                {/* Single-select Mondai List */}
                <div className="grid grid-cols-1 gap-1.5">
                  {(selectedType === "reading"
                    ? getReadingMondaiConfigs(selectedLevel)
                    : getListeningMondaiConfigs(selectedLevel)
                  ).map((m) => {
                    const isSelected =
                      selectedType === "reading"
                        ? selectedReadingMondai === m.mondaiNumber
                        : selectedListeningMondai === m.mondaiNumber;

                    return (
                      <button
                        key={m.mondaiNumber}
                        type="button"
                        onClick={() => {
                          if (selectedType === "reading") {
                            setSelectedReadingMondai(m.mondaiNumber);
                          } else {
                            setSelectedListeningMondai(m.mondaiNumber);
                          }
                        }}
                        className={\`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between \${
                          isSelected
                            ? selectedType === "reading"
                              ? "bg-teal-600 border-teal-600 text-white shadow-xs ring-2 ring-teal-200"
                              : "bg-amber-600 border-amber-600 text-white shadow-xs ring-2 ring-amber-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }\`}
                      >
                        <div className="pr-2">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span className={\`w-2 h-2 rounded-full inline-block \${isSelected ? "bg-white" : "bg-teal-500"}\`} />
                            {m.mondaiName}
                          </div>
                          <div className="text-[10px] font-normal opacity-85 mt-0.5">{m.description}</div>
                        </div>
                        <span className={\`text-[10px] px-2 py-0.5 rounded-md font-extrabold shrink-0 \${
                          isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
                        }\`}>
                          {m.questionsCount} câu
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Topic Selection (Available for all skills including Reading & Listening) */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {selectedLang === "ja" && (selectedType === "reading" || selectedType === "listening") ? "4" : "3"}. Chọn chủ đề luyện tập:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(POPULAR_TOPICS_BY_LANG[selectedLang] || POPULAR_TOPICS_BY_LANG.ja).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTopic(t.name);
                      setCustomTopic("");
                    }}
                    className={\`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer \${
                      selectedTopic === t.name && !customTopic
                        ? selectedLang === "en" 
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : selectedLang === "de"
                          ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                          : selectedType === "listening"
                          ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                          : "bg-teal-600 border-teal-600 text-white shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }\`}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hoặc nhập chủ đề tự chọn:</label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Ví dụ: Phỏng vấn xin việc, Thuê nhà tại Tokyo..."
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-teal-500 shadow-3xs"
              />
            </div>

            {/* Step 5: Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={\`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md cursor-pointer \${
                generating
                  ? "bg-gray-400 cursor-not-allowed"
                  : selectedLang === "en"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-indigo-200"
                  : selectedLang === "de"
                  ? "bg-gradient-to-r from-amber-600 to-red-600 hover:opacity-95 shadow-amber-200"
                  : selectedType === "listening"
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 shadow-amber-200"
                  : "bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-teal-200"
              }\`}
            >
              {generating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang biên soạn...</span>
                </div>
              ) : selectedLang === "ja" && selectedType === "reading" ? (
                <span>✨ Biên soạn Đọc hiểu Mondai {selectedReadingMondai} bằng AI</span>
              ) : selectedLang === "ja" && selectedType === "listening" ? (
                <span>🎧 Biên soạn Nghe hiểu Mondai {selectedListeningMondai} bằng AI</span>
              ) : (
                <span>🚀 Tạo bài luyện tập {selectedLevel} bằng AI</span>
              )}
            </button>`;

if (oldSidebarFullBlockRegex.test(content)) {
  content = content.replace(oldSidebarFullBlockRegex, newSidebarUnified);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully fixed types in practice/page.tsx!");
