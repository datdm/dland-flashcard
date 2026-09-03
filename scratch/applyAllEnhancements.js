const fs = require('fs');
const path = require('path');

// 1. Update src/app/practice/page.tsx
const practicePath = path.join(__dirname, '..', 'src', 'app', 'practice', 'page.tsx');
let practiceContent = fs.readFileSync(practicePath, 'utf8');

// Add AudioSeekPlayer import
if (!practiceContent.includes('import AudioSeekPlayer')) {
  practiceContent = practiceContent.replace(
    'import { autoSync } from "@/lib/syncService";',
    `import { autoSync } from "@/lib/syncService";
import AudioSeekPlayer from "@/components/AudioSeekPlayer";`
  );
}

// Replace Listening Section (lines 3055 onwards) with full AI + Sample Bank using AudioSeekPlayer
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

                          {/* Seekable Audio Player */}
                          <AudioSeekPlayer
                            textToSpeak={
                              generatedListeningData.mondaiNumber === 1 || generatedListeningData.mondaiNumber === 2
                                ? \`\${generatedListeningData.situation}。\\n質問：\${generatedListeningData.questions?.[0]?.question || generatedListeningData.question || ""}。\\n\${generatedListeningData.audioScript}。\\n質問：\${generatedListeningData.questions?.[0]?.question || generatedListeningData.question || ""}\`
                                : generatedListeningData.mondaiNumber === 4
                                ? \`\${generatedListeningData.situation}。\\n\${generatedListeningData.audioScript}。\\n1、\${(generatedListeningData.questions?.[0]?.options || generatedListeningData.options || []).map((o, idx) => \`\${idx + 1}、\${o}\`).join("。\\n")}\`
                                : \`\${generatedListeningData.situation}。\\n\${generatedListeningData.audioScript}。\\n質問：\${generatedListeningData.questions?.[0]?.question || generatedListeningData.question || ""}\`
                            }
                            title={\`\${generatedListeningData.mondaiName} - \${generatedListeningData.title || "Bài nghe"}\`}
                          />

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
                                (Khuyến khích nghe trước khi mở)
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
                              Câu hỏi trắc nghiệm:
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
                            Hãy chọn chủ đề và nhấn nút <strong>"🎧 Biên soạn Nghe hiểu Mondai {selectedListeningMondai}"</strong> ở bảng bên trái để AI tạo bài nghe kèm trình phát âm thanh tua thời gian và câu hỏi theo đúng cấu trúc nhé!
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

                                {/* Seekable Audio Player */}
                                <AudioSeekPlayer
                                  textToSpeak={\`\${item.situation}。\\n\${item.audioScript}。\\n質問：\${item.question}\`}
                                  title={\`\${item.mondaiName}: \${item.title}\`}
                                />

                                <div className="flex items-center gap-3 flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => setShowListeningScript((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    {isScriptOpen ? "Ẩn kịch bản (Script)" : "👁️ Xem kịch bản (Script) & Dịch"}
                                  </button>
                                </div>

                                {isScriptOpen && (
                                  <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 text-xs text-gray-800 leading-relaxed space-y-2 select-text">
                                    <div className="font-bold text-amber-900 mb-1">Kịch bản (Script):</div>
                                    <div className="whitespace-pre-line font-medium text-gray-900">{item.audioScript}</div>
                                    {item.vietnameseTranslation && (
                                      <div className="pt-2 border-t border-amber-200 text-gray-600 italic">
                                        <span className="font-bold text-amber-900 not-italic">Dịch nghĩa: </span>
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

practiceContent = practiceContent.replace(oldListeningSectionRegex, newListeningSection);
fs.writeFileSync(practicePath, practiceContent, 'utf8');
console.log("Updated practice/page.tsx with AudioSeekPlayer!");

// 2. Update Gemini models in all 5 API routes to prioritize gemini-3.5-flash
const filesToUpdateModels = [
  path.join(__dirname, '..', 'src', 'app', 'api', 'practice', 'generate', 'route.ts'),
  path.join(__dirname, '..', 'src', 'app', 'api', 'chat', 'route.ts'),
  path.join(__dirname, '..', 'src', 'app', 'api', 'curriculum', 'activities', 'route.ts'),
  path.join(__dirname, '..', 'src', 'app', 'api', 'practice', 'presentation', 'evaluate', 'route.ts'),
  path.join(__dirname, '..', 'src', 'app', 'api', 'shadowing', 'transcript', 'route.ts'),
];

for (const f of filesToUpdateModels) {
  if (fs.existsSync(f)) {
    let code = fs.readFileSync(f, 'utf8');
    
    // Replace candidateModels array to put gemini-3.5-flash first
    code = code.replace(
      /const candidateModels = \[[^\]]+\];/,
      'const candidateModels = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];'
    );

    // In shadowing/transcript/route.ts
    code = code.replace(
      'genAI.getGenerativeModel({ model: "gemini-2.5-flash" })',
      'genAI.getGenerativeModel({ model: "gemini-3.5-flash" })'
    );

    fs.writeFileSync(f, code, 'utf8');
    console.log(`Updated model in ${path.basename(f)}`);
  }
}
