const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'practice', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update memos for filteredReadingPassages and filteredListeningQuestions
content = content.replace(
  `  const filteredReadingPassages = useMemo(() => {
    if (selectedReadingMondai === "all") return allReadingPassages;
    return allReadingPassages.filter((p) => p.mondaiNumber === selectedReadingMondai);
  }, [allReadingPassages, selectedReadingMondai]);`,
  `  const filteredReadingPassages = useMemo(() => {
    const list = allReadingPassages.filter((p) => p.mondaiNumber === selectedReadingMondai);
    return list.length > 0 ? list : allReadingPassages;
  }, [allReadingPassages, selectedReadingMondai]);`
);

content = content.replace(
  `  const filteredListeningQuestions = useMemo(() => {
    if (selectedListeningMondai === "all") return allListeningQuestions;
    return allListeningQuestions.filter((q) => q.mondaiNumber === selectedListeningMondai);
  }, [allListeningQuestions, selectedListeningMondai]);`,
  `  const filteredListeningQuestions = useMemo(() => {
    const list = allListeningQuestions.filter((q) => q.mondaiNumber === selectedListeningMondai);
    return list.length > 0 ? list : allListeningQuestions;
  }, [allListeningQuestions, selectedListeningMondai]);`
);

// 2. Build the upgraded Reading Display section
// We want to replace `{/* N2 READING DISPLAY */}...`
const oldReadingDisplayRegex = /\{\/\* N2 READING DISPLAY \*\/\}[\s\S]*?\{\/\* PRESENTATION TRAINING DISPLAY \*\/\}/;

const newReadingDisplay = `{/* N2 & JLPT READING DISPLAY */}
              {selectedType === "reading" && (
                <div className="space-y-6">
                  {/* Mode Switcher when Japanese */}
                  {selectedLang === "ja" && (
                    <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl w-fit flex-wrap">
                      <button
                        type="button"
                        onClick={() => setReadingViewMode("ai")}
                        className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 \${
                          readingViewMode === "ai"
                            ? "bg-white text-teal-800 shadow-xs ring-1 ring-black/5"
                            : "text-gray-600 hover:text-gray-900"
                        }\`}
                      >
                        <span>🤖 Bài AI biên soạn Mondai {selectedReadingMondai}</span>
                        {readingData && <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingViewMode("extracted")}
                        className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 \${
                          readingViewMode === "extracted"
                            ? "bg-white text-teal-800 shadow-xs ring-1 ring-black/5"
                            : "text-gray-600 hover:text-gray-900"
                        }\`}
                      >
                        <span>📑 Đề thi thật trích xuất ({filteredReadingPassages.length} bài)</span>
                      </button>
                    </div>
                  )}

                  {/* AI Generated Reading View */}
                  {readingViewMode === "ai" && (
                    <>
                      {readingData ? (
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-5">
                          {/* Header Bar */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 text-xs font-black rounded-lg">
                                {readingData.mondaiName || \`問題 \${selectedReadingMondai}\`}
                              </span>
                              {readingData.mondaiSubtitle && (
                                <span className="text-xs font-bold text-gray-700">
                                  {readingData.mondaiSubtitle}
                                </span>
                              )}
                              {readingData.title && (
                                <span className="text-xs text-gray-500">
                                  • {readingData.title}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {readingData.passage && (
                                <button
                                  type="button"
                                  onClick={() => playSentence(readingData.passage || "")}
                                  className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 shadow-3xs"
                                >
                                  🔊 Nghe bài đọc (TTS)
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowPassageTranslation((prev) => !prev)}
                                className={\`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border \${
                                  showPassageTranslation
                                    ? "bg-teal-100 border-teal-300 text-teal-900"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }\`}
                              >
                                🌐 {showPassageTranslation ? "Ẩn dịch" : "Dịch nghĩa"}
                              </button>
                            </div>
                          </div>

                          {/* Passage Body: Comparison vs Notice vs Standard */}
                          {readingData.passageA && readingData.passageB ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Passage A */}
                              <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-black rounded-lg">
                                    {readingData.passageA.title || "【文章 A】"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => playSentence(readingData.passageA!.text)}
                                    className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-3xs"
                                  >
                                    🔊 Nghe A
                                  </button>
                                </div>
                                <div
                                  className="whitespace-pre-line text-gray-900 leading-loose ruby-box select-text text-sm font-medium"
                                  dangerouslySetInnerHTML={{ __html: readingData.passageA.text_ruby || readingData.passageA.text }}
                                />
                                {showPassageTranslation && readingData.passageA.translation && (
                                  <div className="mt-3 pt-2.5 border-t border-amber-200/60 text-xs text-gray-700 leading-relaxed italic">
                                    <span className="font-extrabold text-teal-800 not-italic block mb-1">Dịch nghĩa A:</span>
                                    {readingData.passageA.translation}
                                  </div>
                                )}
                              </div>

                              {/* Passage B */}
                              <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-200/80 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-black rounded-lg">
                                    {readingData.passageB.title || "【文章 B】"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => playSentence(readingData.passageB!.text)}
                                    className="text-xs text-indigo-800 hover:text-indigo-950 font-bold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-3xs"
                                  >
                                    🔊 Nghe B
                                  </button>
                                </div>
                                <div
                                  className="whitespace-pre-line text-gray-900 leading-loose ruby-box select-text text-sm font-medium"
                                  dangerouslySetInnerHTML={{ __html: readingData.passageB.text_ruby || readingData.passageB.text }}
                                />
                                {showPassageTranslation && readingData.passageB.translation && (
                                  <div className="mt-3 pt-2.5 border-t border-indigo-200/60 text-xs text-gray-700 leading-relaxed italic">
                                    <span className="font-extrabold text-indigo-800 not-italic block mb-1">Dịch nghĩa B:</span>
                                    {readingData.passageB.translation}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : readingData.notice ? (
                            <div className="space-y-4">
                              <div className="bg-blue-50/40 p-5 rounded-2xl border-2 border-blue-200 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="text-sm font-black text-blue-900 flex items-center gap-2">
                                    <span>📢</span>
                                    <span>{readingData.notice.title || "Bảng thông báo / Tờ rơi tra cứu thông tin"}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => playSentence(readingData.notice!.content)}
                                    className="text-xs text-blue-800 hover:text-blue-950 font-bold flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-3xs"
                                  >
                                    🔊 Nghe thông báo
                                  </button>
                                </div>
                                <div
                                  className="whitespace-pre-line text-gray-900 leading-loose ruby-box select-text text-sm bg-white p-4 rounded-xl border border-blue-100 font-medium"
                                  dangerouslySetInnerHTML={{ __html: readingData.notice.content_ruby || readingData.notice.content }}
                                />
                                {readingData.notice.scenario && (
                                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 font-semibold">
                                    <div className="font-extrabold text-amber-900 mb-0.5">📌 Tình huống tra cứu:</div>
                                    <div>{readingData.notice.scenario}</div>
                                  </div>
                                )}
                                {showPassageTranslation && readingData.notice.translation && (
                                  <div className="pt-2.5 border-t border-blue-200 text-xs text-gray-700 leading-relaxed italic">
                                    <span className="font-extrabold text-blue-900 not-italic block mb-1">Dịch nghĩa thông báo:</span>
                                    {readingData.notice.translation}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 leading-loose text-base text-gray-800 font-semibold tracking-wide space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Bài đọc (Passage):</div>
                                <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full font-bold">
                                  💡 Bôi đen từ vựng để hiện nút tra Mazii
                                </span>
                              </div>
                              <div 
                                className="whitespace-pre-line text-gray-900 leading-loose ruby-box select-text font-medium"
                                dangerouslySetInnerHTML={{ __html: readingData.passage_ruby || readingData.passage || "" }}
                              />
                              {showPassageTranslation && readingData.passage_translation && (
                                <div className="mt-4 pt-3 border-t border-amber-200/50 text-xs text-gray-700 leading-relaxed italic">
                                  <span className="font-extrabold text-teal-800 not-italic block mb-1">Bản dịch tiếng Việt:</span>
                                  {readingData.passage_translation}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Vocabulary Extracted List */}
                          {readingData.vocabulary && readingData.vocabulary.length > 0 && (
                            <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100/80">
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                                Từ vựng quan trọng trong bài đọc:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {readingData.vocabulary.map((vocabItem: any, vIdx: number) => (
                                  <div key={vIdx} className="bg-white p-3 rounded-xl border border-gray-100/60 flex items-center justify-between gap-2 shadow-3xs">
                                    <div>
                                      <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-gray-900">{vocabItem.kanji}</span>
                                        {vocabItem.kanji !== vocabItem.hiragana && (
                                          <span className="text-[10px] text-indigo-600 font-semibold font-mono">({vocabItem.hiragana})</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-emerald-700 font-medium mt-0.5">{vocabItem.meaning}</div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMaziiLookupState({
                                            isOpen: true,
                                            queryWord: vocabItem.kanji || vocabItem.hiragana,
                                            initialFurigana: vocabItem.hiragana,
                                            initialMeaning: vocabItem.meaning,
                                          });
                                        }}
                                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-amber-200/60"
                                        title="Tra cứu chi tiết trên Mazii"
                                      >
                                        🔍 Mazii
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedWordForNotebook(vocabItem);
                                          setDuplicateError(null);
                                        }}
                                        className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                                      >
                                        + Sổ tay
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Questions List (Supports multi-questions) */}
                          <div className="space-y-4 pt-2">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Câu hỏi đọc hiểu ({readingData.questions?.length || (readingData.options ? 1 : 0)} câu):
                            </div>

                            {readingData.questions && readingData.questions.length > 0 ? (
                              readingData.questions.map((q, qIdx) => {
                                const isChecked = !!readingChecked[q.id];
                                const userAnsId = readingAnswers[q.id];
                                const correctOpt = q.options.find((o) => o.isCorrect);
                                const isCorrect = userAnsId !== undefined && userAnsId === correctOpt?.id;

                                return (
                                  <div key={q.id || qIdx} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                                    <div className="text-sm font-extrabold text-gray-900">
                                      ❓ Câu {qIdx + 1}: {q.question}
                                    </div>
                                    {q.question_vietnamese && (
                                      <div className="text-xs text-gray-500 italic">
                                        ({q.question_vietnamese})
                                      </div>
                                    )}

                                    {/* Options */}
                                    <div className="grid grid-cols-1 gap-2">
                                      {q.options.map((opt, optIdx) => {
                                        const isSelected = userAnsId === opt.id;
                                        let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-gray-100";
                                        if (isChecked) {
                                          if (opt.isCorrect) {
                                            optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                          } else if (isSelected) {
                                            optStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-300";
                                          } else {
                                            optStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                                          }
                                        } else if (isSelected) {
                                          optStyle = "border-teal-500 bg-teal-50 text-teal-900 font-bold ring-2 ring-teal-300";
                                        }

                                        return (
                                          <button
                                            key={opt.id}
                                            type="button"
                                            disabled={isChecked}
                                            onClick={() => setReadingAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                                            className={\`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-start gap-2.5 \${optStyle}\`}
                                          >
                                            <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                              {optIdx + 1}
                                            </span>
                                            <span className="leading-relaxed flex-1">{opt.text}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Check button & Feedback */}
                                    <div className="pt-2">
                                      {!isChecked ? (
                                        <button
                                          type="button"
                                          disabled={!userAnsId}
                                          onClick={() => checkGeneratedReadingAnswer(q)}
                                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                        >
                                          Kiểm tra đáp án
                                        </button>
                                      ) : (
                                        <div className={\`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 \${
                                          isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                        }\`}>
                                          <div className="font-extrabold flex items-center gap-1.5 text-sm">
                                            <span>{isCorrect ? "✓ Chính xác!" : "✕ Chưa chính xác"}</span>
                                            {!isCorrect && (
                                              <span className="text-xs font-semibold">
                                                (Đáp án đúng: {correctOpt?.text})
                                              </span>
                                            )}
                                          </div>
                                          {q.explanation && (
                                            <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10">
                                              <strong>💡 Giải thích:</strong> {q.explanation}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : readingData.options ? (
                              /* Fallback single question */
                              <div className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                                <div className="text-sm font-extrabold text-gray-900">
                                  ❓ {readingData.question}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {readingData.options.map((opt, optIdx) => {
                                    const isAnswered = selectedOptionId !== null;
                                    const isThisSelected = selectedOptionId === opt.id;
                                    let btnStyle = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer";
                                    if (isAnswered) {
                                      if (opt.isCorrect) {
                                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-300";
                                      } else if (isThisSelected) {
                                        btnStyle = "border-red-500 bg-red-50 text-red-800 font-bold ring-2 ring-red-300";
                                      } else {
                                        btnStyle = "border-gray-100 bg-gray-50/50 text-gray-400 opacity-60";
                                      }
                                    }
                                    return (
                                      <button
                                        key={opt.id}
                                        disabled={isAnswered}
                                        onClick={() => handleSelectReadingOption(opt)}
                                        className={\`w-full p-4 rounded-xl border text-left text-xs transition-all flex items-center justify-between \${btnStyle}\`}
                                      >
                                        <span>{optIdx + 1}. {opt.text}</span>
                                        {isAnswered && opt.isCorrect && <span className="text-emerald-600 font-extrabold text-sm">✓</span>}
                                        {isAnswered && isThisSelected && !opt.isCorrect && <span className="text-red-600 font-extrabold text-sm">✕</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                                {selectedOptionId && readingData.explanation && (
                                  <div className="mt-3 p-4 bg-teal-50/40 rounded-xl border border-teal-200 text-xs text-gray-700 leading-relaxed">
                                    <strong>💡 Giải thích:</strong> {readingData.explanation}
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-4 shadow-2xs">
                          <div className="text-4xl">📚</div>
                          <h3 className="text-base font-extrabold text-gray-900">
                            Luyện Chuyên Sâu Đọc Hiểu JLPT {selectedLevel} (Mondai {selectedReadingMondai})
                          </h3>
                          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                            Hãy chọn chủ đề và nhấn nút <strong>"✨ Biên soạn Đọc hiểu Mondai {selectedReadingMondai}"</strong> ở bảng bên trái để AI tạo bài đọc và câu hỏi trắc nghiệm chuẩn mẫu nhé!
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-teal-200 transition-all cursor-pointer"
                          >
                            {generating ? "🤖 Đang biên soạn bài đọc..." : \`✨ Tạo bài đọc Mondai \${selectedReadingMondai} ngay\`}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Extracted Past Exam Reading View */}
                  {readingViewMode === "extracted" && selectedLang === "ja" && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-6 text-white shadow-md shadow-teal-200">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-black uppercase">
                            📚 Đọc hiểu Đề thi thật {selectedLevel}
                          </span>
                          <span className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                            {filteredReadingPassages.length} đoạn văn
                          </span>
                        </div>
                        <h3 className="text-lg font-black">Kho Đọc Hiểu Trích Xuất Từ Đề Thi Chính Thức</h3>
                        <p className="text-xs text-white/90 mt-1 leading-relaxed">
                          Các bài đọc hiểu được trích xuất từ đề thi thật (N2 07/2025, N3 Mock, N5 Mock) phân theo từng Mondai.
                        </p>
                      </div>

                      {filteredReadingPassages.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-3">
                          <div className="text-3xl">📖</div>
                          <h4 className="text-sm font-bold text-gray-900">
                            Chưa có bài đọc trích xuất cho Mondai này ở cấp độ {selectedLevel}
                          </h4>
                          <p className="text-xs text-gray-500 max-w-md mx-auto">
                            Hãy chuyển sang tab "Đề AI biên soạn" ở trên để AI tạo bài đọc chuẩn cho bạn luyện tập ngay nhé!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {filteredReadingPassages.map((p) => (
                            <div key={p.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-5">
                              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-black rounded-lg">
                                    {p.mondaiName}: {p.mondaiSubtitle}
                                  </span>
                                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg">
                                    {p.examTitle}
                                  </span>
                                  {p.passageTitle && (
                                    <span className="text-xs font-black text-gray-900">
                                      {p.passageTitle}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => playSentence(p.passageText)}
                                  className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer bg-teal-50 px-3 py-1 rounded-xl"
                                >
                                  🔊 Nghe bài đọc (TTS)
                                </button>
                              </div>

                              <div className="bg-amber-50/20 p-5 rounded-2xl border border-amber-100 text-base text-gray-900 leading-loose whitespace-pre-line select-text font-medium">
                                {p.passageText}
                              </div>

                              <div className="space-y-4 pt-2">
                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                  Câu hỏi đọc hiểu ({p.questions.length} câu):
                                </div>
                                {p.questions.map((q) => {
                                  const isChecked = !!examReadingChecked[q.id];
                                  const userAns = examReadingAnswers[q.id];
                                  const isCorrect = userAns !== undefined && q.answers.includes(userAns);

                                  return (
                                    <div key={q.id} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                                      <div className="text-sm font-extrabold text-gray-900">
                                        ❓ Câu hỏi {q.id}: {q.question}
                                      </div>
                                      <div className="grid grid-cols-1 gap-2">
                                        {q.options.map((optText, optIdx) => {
                                          const isSelected = userAns === optIdx;
                                          let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-gray-100";
                                          if (isChecked) {
                                            if (q.answers.includes(optIdx)) {
                                              optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                            } else if (isSelected) {
                                              optStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-300";
                                            } else {
                                              optStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                                            }
                                          } else if (isSelected) {
                                            optStyle = "border-teal-500 bg-teal-50 text-teal-900 font-bold ring-2 ring-teal-300";
                                          }

                                          return (
                                            <button
                                              key={optIdx}
                                              type="button"
                                              disabled={isChecked}
                                              onClick={() => setExamReadingAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                              className={\`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-start gap-2.5 \${optStyle}\`}
                                            >
                                              <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                                {optIdx + 1}
                                              </span>
                                              <span className="leading-relaxed">{optText}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <div className="pt-2">
                                        {!isChecked ? (
                                          <button
                                            type="button"
                                            disabled={userAns === undefined}
                                            onClick={() => checkExamReadingAnswer(q.id, q.answers, q.question, q.explanation)}
                                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                          >
                                            Kiểm tra đáp án
                                          </button>
                                        ) : (
                                          <div className={\`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 \${
                                            isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                          }\`}>
                                            <div className="font-extrabold flex items-center gap-1.5 text-sm">
                                              <span>{isCorrect ? "✓ Chính xác!" : "✕ Chưa chính xác"}</span>
                                              {!isCorrect && (
                                                <span className="text-xs font-semibold">
                                                  (Đáp án đúng: Lựa chọn {q.answers.map((a) => a + 1).join(", ")})
                                                </span>
                                              )}
                                            </div>
                                            {q.explanation && (
                                              <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10">
                                                <strong>💡 Giải thích:</strong> {q.explanation}
                                              </div>
                                            )}
                                          </div>
                                        )}
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
                  )}
                </div>
              )}

              {/* PRESENTATION TRAINING DISPLAY */}`;

content = content.replace(oldReadingDisplayRegex, newReadingDisplay);

// 3. Replace the entire JLPT Listening section and the old extracted reading section (lines 2680-3060)
// Notice in the file, after PRESENTATION TRAINING DISPLAY, there was the old JLPT READING PRACTICE BY MONDAI and JLPT LISTENING PRACTICE BY MONDAI.
// We remove the old duplicate JLPT READING PRACTICE BY MONDAI and replace JLPT LISTENING PRACTICE with our new AI Listening + Sample bank!
const oldExtractedReadingRegex = /\{\/\* JLPT READING PRACTICE BY MONDAI \(When Japanese & Reading & no AI readingData active\) \*\/\}[\s\S]*?(?=\{\/\* JLPT LISTENING PRACTICE BY MONDAI)/;
content = content.replace(oldExtractedReadingRegex, "");

const oldListeningSectionRegex = /\{\/\* JLPT LISTENING PRACTICE BY MONDAI \(When Japanese & Listening\) \*\/\}[\s\S]*?(?=\s*\{\/\* Empty State \*\/\})/;

const newListeningSection = `{/* JLPT LISTENING PRACTICE BY MONDAI */}
              {selectedLang === "ja" && selectedType === "listening" && (
                <div className="space-y-6">
                  {/* Mode Switcher */}
                  <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl w-fit flex-wrap">
                    <button
                      type="button"
                      onClick={() => setListeningViewMode("ai")}
                      className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 \${
                        listeningViewMode === "ai"
                          ? "bg-white text-amber-900 shadow-xs ring-1 ring-black/5"
                          : "text-gray-600 hover:text-gray-900"
                      }\`}
                    >
                      <span>🤖 Bài nghe AI biên soạn Mondai {selectedListeningMondai}</span>
                      {generatedListeningData && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setListeningViewMode("extracted")}
                      className={\`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 \${
                        listeningViewMode === "extracted"
                          ? "bg-white text-amber-900 shadow-xs ring-1 ring-black/5"
                          : "text-gray-600 hover:text-gray-900"
                      }\`}
                    >
                      <span>🎧 Kho câu hỏi mẫu ({filteredListeningQuestions.length} câu)</span>
                    </button>
                  </div>

                  {/* AI Generated Listening View */}
                  {listeningViewMode === "ai" && (
                    <>
                      {generatedListeningData ? (
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-5">
                          {/* Card Header */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black rounded-lg">
                                {generatedListeningData.mondaiName || \`問題 \${selectedListeningMondai}\`}
                              </span>
                              <span className="text-xs font-bold text-gray-700">
                                {generatedListeningData.mondaiSubtitle}
                              </span>
                              {generatedListeningData.title && (
                                <span className="text-xs text-gray-500">
                                  • {generatedListeningData.title}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">
                              Cấp độ: {generatedListeningData.level}
                            </span>
                          </div>

                          {/* Audio Player Card */}
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200/80 space-y-3">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => playGeneratedListeningAudio(generatedListeningData)}
                                  className={\`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg transition-all shadow-md cursor-pointer \${
                                    isGenListeningPlaying
                                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                      : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                                  }\`}
                                  title={isGenListeningPlaying ? "Dừng phát" : "Phát âm thanh bài nghe"}
                                >
                                  {isGenListeningPlaying ? "⏹" : "▶"}
                                </button>
                                <div>
                                  <div className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                                    <span>{isGenListeningPlaying ? "Đang phát âm thanh bài nghe..." : "Sẵn sàng nghe bài tập"}</span>
                                    {isGenListeningPlaying && (
                                      <span className="flex gap-0.5 items-end h-3">
                                        <span className="w-1 bg-amber-600 animate-bounce h-2" />
                                        <span className="w-1 bg-amber-600 animate-bounce h-3 delay-75" />
                                        <span className="w-1 bg-amber-600 animate-bounce h-1.5 delay-150" />
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-amber-800 font-medium">
                                    Nghe lời dẫn bối cảnh, câu hỏi và hội thoại chuẩn giọng tiếng Nhật
                                  </div>
                                </div>
                              </div>

                              {/* Playback Rate & Controls */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-900 font-bold">Tốc độ:</span>
                                {[0.8, 1.0, 1.2].map((rate) => (
                                  <button
                                    key={rate}
                                    type="button"
                                    onClick={() => setPlaybackRate(rate)}
                                    className={\`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer \${
                                      playbackRate === rate
                                        ? "bg-amber-600 text-white shadow-3xs"
                                        : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-50"
                                    }\`}
                                  >
                                    {rate}x
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Situation Box */}
                          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 font-semibold space-y-1">
                            <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                              <span>📌</span>
                              <span>Tình huống (Bối cảnh):</span>
                            </div>
                            <div className="leading-relaxed pl-5 text-gray-900 font-medium">{generatedListeningData.situation}</div>
                            {generatedListeningData.situation_translation && (
                              <div className="leading-relaxed pl-5 text-gray-600 italic text-[11px] pt-1">
                                ({generatedListeningData.situation_translation})
                              </div>
                            )}
                          </div>

                          {/* Script and Translation reveal toggle */}
                          <div>
                            <button
                              type="button"
                              onClick={() => setShowGenListeningScript((prev) => !prev)}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <span>{showGenListeningScript ? "🙈 Ẩn kịch bản bài nghe (Script)" : "👁️ Xem kịch bản (Script) & Bản dịch"}</span>
                              <span className="text-[10px] text-gray-500 font-normal">
                                (Khuyên khích nghe trước khi mở)
                              </span>
                            </button>

                            {showGenListeningScript && (
                              <div className="mt-3 p-5 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-3">
                                <div>
                                  <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider mb-1">
                                    Kịch bản tiếng Nhật (Script):
                                  </div>
                                  <div 
                                    className="whitespace-pre-line text-sm text-gray-900 leading-loose ruby-box font-medium select-text"
                                    dangerouslySetInnerHTML={{ __html: generatedListeningData.audioScript_ruby || generatedListeningData.audioScript }}
                                  />
                                </div>

                                {generatedListeningData.vietnameseTranslation && (
                                  <div className="pt-3 border-t border-amber-200 text-xs text-gray-700 leading-relaxed italic">
                                    <div className="font-bold text-amber-900 not-italic mb-1">Bản dịch tiếng Việt:</div>
                                    <div className="whitespace-pre-line">{generatedListeningData.vietnameseTranslation}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Vocabulary List */}
                          {generatedListeningData.vocabulary && generatedListeningData.vocabulary.length > 0 && (
                            <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100">
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                                Từ vựng quan trọng trong bài nghe:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {generatedListeningData.vocabulary.map((vocabItem: any, vIdx: number) => (
                                  <div key={vIdx} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-2 shadow-3xs">
                                    <div>
                                      <div className="flex items-baseline gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-gray-900">{vocabItem.kanji}</span>
                                        {vocabItem.kanji !== vocabItem.hiragana && (
                                          <span className="text-[10px] text-indigo-600 font-semibold font-mono">({vocabItem.hiragana})</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-emerald-700 font-medium mt-0.5">{vocabItem.meaning}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMaziiLookupState({
                                          isOpen: true,
                                          queryWord: vocabItem.kanji || vocabItem.hiragana,
                                          initialFurigana: vocabItem.hiragana,
                                          initialMeaning: vocabItem.meaning,
                                        });
                                      }}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-amber-200/60"
                                      title="Tra cứu chi tiết trên Mazii"
                                    >
                                      🔍 Mazii
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Questions List */}
                          <div className="space-y-4 pt-2">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              Câu hỏi kiểm tra:
                            </div>

                            {(generatedListeningData.questions || [
                              {
                                id: "q_1",
                                question: generatedListeningData.question || "質問",
                                question_vietnamese: "",
                                options: generatedListeningData.options || [],
                                correctAnswer: generatedListeningData.correctAnswer ?? 0,
                                explanation: generatedListeningData.explanation || "",
                              },
                            ]).map((q, qIdx) => {
                              const isChecked = !!genListeningChecked[q.id];
                              const userAns = genListeningAnswers[q.id];
                              const isCorrect = userAns !== undefined && userAns === q.correctAnswer;

                              return (
                                <div key={q.id || qIdx} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                                  <div className="text-sm font-extrabold text-gray-900">
                                    ❓ {generatedListeningData.questions && generatedListeningData.questions.length > 1 ? \`Câu \${qIdx + 1}: \` : ""}
                                    {q.question}
                                  </div>
                                  {q.question_vietnamese && (
                                    <div className="text-xs text-gray-500 italic">
                                      ({q.question_vietnamese})
                                    </div>
                                  )}

                                  {/* Options */}
                                  <div className="grid grid-cols-1 gap-2">
                                    {q.options.map((optText, optIdx) => {
                                      const isSelected = userAns === optIdx;
                                      let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-gray-100";
                                      if (isChecked) {
                                        if (optIdx === q.correctAnswer) {
                                          optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                        } else if (isSelected) {
                                          optStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-300";
                                        } else {
                                          optStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                                        }
                                      } else if (isSelected) {
                                        optStyle = "border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-300";
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={isChecked}
                                          onClick={() => setGenListeningAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                                          className={\`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-start gap-2.5 \${optStyle}\`}
                                        >
                                          <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                            {optIdx + 1}
                                          </span>
                                          <span className="leading-relaxed flex-1">{optText}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Check button & Feedback */}
                                  <div className="pt-2">
                                    {!isChecked ? (
                                      <button
                                        type="button"
                                        disabled={userAns === undefined}
                                        onClick={() => checkGeneratedListeningAnswer(q)}
                                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                      >
                                        Kiểm tra đáp án
                                      </button>
                                    ) : (
                                      <div className={\`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 \${
                                        isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                      }\`}>
                                        <div className="font-extrabold flex items-center gap-1.5 text-sm">
                                          <span>{isCorrect ? "✓ Chính xác!" : "✕ Chưa chính xác"}</span>
                                          {!isCorrect && (
                                            <span className="text-xs font-semibold">
                                              (Đáp án đúng: {q.options[q.correctAnswer]} - Lựa chọn {q.correctAnswer + 1})
                                            </span>
                                          )}
                                        </div>
                                        {q.explanation && (
                                          <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10">
                                            <strong>💡 Giải thích:</strong> {q.explanation}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-4 shadow-2xs">
                          <div className="text-4xl">🎧</div>
                          <h3 className="text-base font-extrabold text-gray-900">
                            Luyện Chuyên Sâu Nghe Hiểu JLPT {selectedLevel} (Mondai {selectedListeningMondai})
                          </h3>
                          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                            Hãy chọn chủ đề và nhấn nút <strong>"🎧 Biên soạn Nghe hiểu Mondai {selectedListeningMondai}"</strong> ở bảng bên trái để AI tạo bài nghe kèm âm thanh TTS và câu hỏi theo đúng cấu trúc nhé!
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-200 transition-all cursor-pointer"
                          >
                            {generating ? "🤖 Đang biên soạn bài nghe..." : \`🎧 Tạo bài nghe Mondai \${selectedListeningMondai} ngay\`}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Sample / Extracted Listening View */}
                  {listeningViewMode === "extracted" && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-6 text-white shadow-md shadow-amber-200">
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                          <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-black uppercase">
                            🎧 Nghe hiểu JLPT {selectedLevel}
                          </span>
                          <span className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                            {filteredListeningQuestions.length} câu hỏi mẫu
                          </span>
                        </div>
                        <h3 className="text-lg font-black">Kho Bài Nghe Mẫu Chuẩn Đề Thi</h3>
                        <p className="text-xs text-white/90 mt-1 leading-relaxed">
                          Luyện nghe các câu hỏi mẫu chuẩn đề thi JLPT: Mondai 1 (Hiểu nhiệm vụ), Mondai 2 (Trọng điểm), Mondai 3 (Khái quát), Mondai 4 (Phản xạ tức thì) và Mondai 5 (Tổng hợp).
                        </p>
                      </div>

                      {filteredListeningQuestions.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-3">
                          <div className="text-3xl">🎧</div>
                          <h4 className="text-sm font-bold text-gray-900">
                            Chưa có câu hỏi mẫu cho Mondai này ở cấp độ {selectedLevel}
                          </h4>
                          <p className="text-xs text-gray-500 max-w-md mx-auto">
                            Hãy chuyển sang tab "Bài nghe AI biên soạn" ở trên để AI tạo bài nghe cho bạn học ngay nhé!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {filteredListeningQuestions.map((item) => {
                            const isChecked = !!listeningChecked[item.id];
                            const userAns = listeningAnswers[item.id];
                            const isCorrect = userAns === item.correctAnswer;
                            const isPlaying = listeningPlayingId === item.id;
                            const isScriptOpen = !!showListeningScript[item.id];

                            return (
                              <div key={item.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black rounded-lg">
                                      {item.mondaiName}: {item.mondaiSubtitle}
                                    </span>
                                    <span className="text-xs font-bold text-gray-700">
                                      {item.title}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-bold">
                                    Cấp độ: {item.level}
                                  </span>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs font-bold text-amber-950 flex items-start gap-2">
                                  <span className="text-base">📌</span>
                                  <div className="leading-relaxed">
                                    <span className="text-amber-800 font-bold block mb-0.5">Tình huống (Bối cảnh):</span>
                                    {item.situation}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => playListeningAudio(item)}
                                    className={\`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer \${
                                      isPlaying
                                        ? "bg-red-500 text-white animate-pulse"
                                        : "bg-amber-600 hover:bg-amber-700 text-white"
                                    }\`}
                                  >
                                    <span>{isPlaying ? "⏹ Dừng nghe" : "▶️ Phát bài nghe"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setShowListeningScript((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                                  >
                                    {isScriptOpen ? "Ẩn kịch bản (Script)" : "Xem kịch bản (Script)"}
                                  </button>
                                </div>

                                {isScriptOpen && (
                                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 leading-relaxed space-y-2 select-text">
                                    <div className="font-bold text-gray-900 mb-1">Kịch bản (Script):</div>
                                    <div className="whitespace-pre-line font-medium text-gray-900">{item.audioScript}</div>
                                    {item.vietnameseTranslation && (
                                      <div className="pt-2 border-t border-gray-200 text-gray-600 italic">
                                        <span className="font-bold text-gray-800 not-italic">Dịch nghĩa: </span>
                                        {item.vietnameseTranslation}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="space-y-3 pt-2">
                                  <div className="text-sm font-extrabold text-gray-900">
                                    ❓ Câu hỏi: {item.question}
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    {item.options.map((optText, optIdx) => {
                                      const isSelected = userAns === optIdx;
                                      let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-gray-100";
                                      if (isChecked) {
                                        if (optIdx === item.correctAnswer) {
                                          optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                        } else if (isSelected) {
                                          optStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-300";
                                        } else {
                                          optStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                                        }
                                      } else if (isSelected) {
                                        optStyle = "border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-300";
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={isChecked}
                                          onClick={() => setListeningAnswers((prev) => ({ ...prev, [item.id]: optIdx }))}
                                          className={\`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-start gap-2.5 \${optStyle}\`}
                                        >
                                          <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                            {optIdx + 1}
                                          </span>
                                          <span className="leading-relaxed flex-1">{optText}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <div className="pt-2">
                                    {!isChecked ? (
                                      <button
                                        type="button"
                                        disabled={userAns === undefined}
                                        onClick={() => checkListeningAnswer(item)}
                                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                      >
                                        Kiểm tra đáp án
                                      </button>
                                    ) : (
                                      <div className={\`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 \${
                                        isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                      }\`}>
                                        <div className="font-extrabold flex items-center gap-1.5 text-sm">
                                          <span>{isCorrect ? "✓ Chính xác!" : "✕ Chưa chính xác"}</span>
                                          {!isCorrect && (
                                            <span className="text-xs font-semibold">
                                              (Đáp án đúng: Lựa chọn {item.correctAnswer + 1})
                                            </span>
                                          )}
                                        </div>
                                        {item.explanation && (
                                          <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10">
                                            <strong>💡 Giải thích:</strong> {item.explanation}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}`;

content = content.replace(oldListeningSectionRegex, newListeningSection);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated practice rendering in practice/page.tsx!");
