const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'practice', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update POPULAR_TOPICS_BY_LANG.ja with rich JLPT topics
const oldTopicsJa = `  ja: [
    { id: "daily", name: "Sinh hoạt & Đời sống", icon: "🏡" },
    { id: "business", name: "Kinh doanh & Công sở", icon: "💼" },
    { id: "it", name: "Công nghệ & IT", icon: "💻" },
    { id: "travel", name: "Du lịch & Ẩm thực", icon: "🍣" },
    { id: "news", name: "Tin tức & Xã hội", icon: "📰" },
  ],`;

const newTopicsJa = `  ja: [
    { id: "daily", name: "Sinh hoạt & Đời sống", icon: "🏡" },
    { id: "business", name: "Kinh doanh & Công sở", icon: "💼" },
    { id: "it", name: "Công nghệ & AI", icon: "💻" },
    { id: "society", name: "Môi trường & Xã hội", icon: "🌿" },
    { id: "travel", name: "Du lịch & Ẩm thực", icon: "🍣" },
    { id: "health", name: "Y tế & Sức khỏe", icon: "🩺" },
    { id: "education", name: "Giáo dục & Tâm lý", icon: "🎓" },
    { id: "news", name: "Tin tức & Thời sự", icon: "📰" },
  ],`;

if (content.includes(oldTopicsJa)) {
  content = content.replace(oldTopicsJa, newTopicsJa);
}

// Replace the entire Step 3+ area (lines 1480 to 1642)
const oldSidebarStep3AreaRegex = /\{\/\* Step 3: Select Mondai for JLPT Reading \/ Listening OR Select Topic \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*\{\/\* Right Exercises Area \*\/)/;

const newSidebarStep3Area = `{/* Step 3: Select Mondai for JLPT Reading / Listening */}
            {selectedLang === "ja" && selectedType === "reading" ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    3. Chọn Mondai Đọc hiểu ({selectedLevel}) - Chọn 1:
                  </label>
                  <span className="text-[10px] text-teal-600 font-bold">
                    Mondai {selectedReadingMondai}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {readingMondais.map((m) => {
                    const isSelected = selectedReadingMondai === m.mondaiNumber;
                    return (
                      <button
                        key={m.mondaiNumber}
                        type="button"
                        onClick={() => setSelectedReadingMondai(m.mondaiNumber)}
                        className={\`px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between \${
                          isSelected
                            ? "bg-teal-600 border-teal-600 text-white shadow-xs ring-2 ring-teal-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }\`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{isSelected ? "🔘" : "⚪"}</span>
                            <span>{m.mondaiName}</span>
                          </div>
                          <div className={\`text-[10px] font-normal mt-0.5 pl-5 \${isSelected ? "text-teal-100" : "text-gray-500"}\`}>
                            {m.mondaiSubtitle}
                          </div>
                        </div>
                        <span className={\`text-[10px] px-2 py-0.5 rounded-lg font-bold \${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}\`}>
                          {m.count} bài
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 4: Topic Selection for Reading */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      4. Chọn chủ đề bài đọc:
                    </label>
                    <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200/60">
                      {activeTopic}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(POPULAR_TOPICS_BY_LANG[selectedLang] || POPULAR_TOPICS_BY_LANG.ja).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTopic(t.name);
                          setCustomTopic("");
                        }}
                        className={\`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer \${
                          selectedTopic === t.name && !customTopic
                            ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }\`}
                      >
                        {t.icon} {t.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Hoặc tự nhập chủ đề theo ý muốn:
                    </label>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Ví dụ: Phỏng vấn xin việc, AI và việc làm, Lễ hội Nhật Bản..."
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-teal-500 shadow-3xs"
                    />
                  </div>
                </div>

                {/* Step 5: AI Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-md shadow-teal-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{generating ? "🤖 Đang biên soạn..." : "✨ Biên soạn Đọc hiểu bằng AI"}</span>
                  </div>
                  <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                    Mondai {selectedReadingMondai} • Chủ đề: {activeTopic}
                  </span>
                </button>
              </div>
            ) : selectedLang === "ja" && selectedType === "listening" ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    3. Chọn Mondai Nghe hiểu ({selectedLevel}) - Chọn 1:
                  </label>
                  <span className="text-[10px] text-amber-600 font-bold">
                    Mondai {selectedListeningMondai}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {listeningMondais.map((m) => {
                    const isSelected = selectedListeningMondai === m.mondaiNumber;
                    return (
                      <button
                        key={m.mondaiNumber}
                        type="button"
                        onClick={() => setSelectedListeningMondai(m.mondaiNumber)}
                        className={\`px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between \${
                          isSelected
                            ? "bg-amber-600 border-amber-600 text-white shadow-xs ring-2 ring-amber-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }\`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{isSelected ? "🔘" : "⚪"}</span>
                            <span>{m.mondaiName}</span>
                          </div>
                          <div className={\`text-[10px] font-normal mt-0.5 pl-5 \${isSelected ? "text-amber-100" : "text-gray-500"}\`}>
                            {m.mondaiSubtitle}
                          </div>
                        </div>
                        <span className={\`text-[10px] px-2 py-0.5 rounded-lg font-bold \${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}\`}>
                          {m.count} câu
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 4: Topic Selection for Listening */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      4. Chọn chủ đề bài nghe:
                    </label>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                      {activeTopic}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(POPULAR_TOPICS_BY_LANG[selectedLang] || POPULAR_TOPICS_BY_LANG.ja).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTopic(t.name);
                          setCustomTopic("");
                        }}
                        className={\`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer \${
                          selectedTopic === t.name && !customTopic
                            ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }\`}
                      >
                        {t.icon} {t.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Hoặc tự nhập chủ đề theo ý muốn:
                    </label>
                    <input
                      type="text"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="Ví dụ: Đặt bàn ăn, Chuyển nhà trọ, Họp công ty, Mất ví tiền..."
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-amber-500 shadow-3xs"
                    />
                  </div>
                </div>

                {/* Step 5: AI Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 shadow-md shadow-amber-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{generating ? "🤖 Đang biên soạn..." : "🎧 Biên soạn Nghe hiểu bằng AI"}</span>
                  </div>
                  <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                    Mondai {selectedListeningMondai} • Chủ đề: {activeTopic}
                  </span>
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 pt-2 border-t border-gray-100">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    3. Chọn chủ đề luyện tập:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(POPULAR_TOPICS_BY_LANG[selectedLang] || POPULAR_TOPICS_BY_LANG.ja).map((t) => (
                      <button
                        key={t.id}
                        type="button"
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
                    placeholder="Ví dụ: Phỏng vấn xin việc, đi bác sĩ..."
                    className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-teal-500 shadow-3xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className={\`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md cursor-pointer \${
                    generating
                      ? "bg-gray-400 cursor-not-allowed"
                      : selectedLang === "en"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-indigo-200"
                      : selectedLang === "de"
                      ? "bg-gradient-to-r from-amber-600 to-red-600 hover:opacity-95 shadow-amber-200"
                      : "bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-teal-200"
                  }\`}
                >
                  {generating ? "🤖 Đang biên soạn nội dung..." : \`🚀 Tạo bài luyện tập \${selectedLevel} bằng AI\`}
                </button>
              </>
            )}`;

content = content.replace(oldSidebarStep3AreaRegex, newSidebarStep3Area);
fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated practice/page.tsx with full Step 4 Topic & Custom Topic!");
