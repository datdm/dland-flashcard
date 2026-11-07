"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CONJUGATION_FORMS_THEORY,
  CONJUGATION_FORM_KEYS,
  ConjugationFormKey,
  JapaneseVerbItem,
  PRESET_JAPANESE_VERBS,
  VERB_GROUPS_OVERVIEW,
  VerbGroup,
} from "@/lib/japaneseConjugation";
import AddToNotebookModal from "@/components/AddToNotebookModal";

type ActiveTab = "theory" | "practice" | "ai-vocab";
type PracticeMode = "quiz" | "typing" | "matrix";

interface QuizQuestion {
  verb: JapaneseVerbItem;
  targetFormKey: ConjugationFormKey;
  targetFormTitle: string;
  targetFormJp: string;
  correctKanji: string;
  correctHiragana: string;
  correctRomaji: string;
  ruleApplied: string;
  options: {
    kanji: string;
    hiragana: string;
    formLabel: string;
    isCorrect: boolean;
  }[];
}

const STORAGE_KEY_AI_VERBS = "dland_japanese_conjugation_ai_verbs_v1";

export default function JapaneseConjugationPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("theory");

  // Verb bank: Preset + AI generated (persisted in localStorage, guaranteed non-duplicate)
  const [aiVerbs, setAiVerbs] = useState<JapaneseVerbItem[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiBannerMsg, setAiBannerMsg] = useState<string | null>(null);

  // AI Generator Filters
  const [aiLevel, setAiLevel] = useState<string>("ALL");
  const [aiGroup, setAiGroup] = useState<string>("ALL");
  const [aiCount, setAiCount] = useState<number>(6);
  const [aiTopic, setAiTopic] = useState<string>("");

  // Theory Tab State
  const [theorySearch, setTheorySearch] = useState("");
  const [selectedTheoryForm, setSelectedTheoryForm] = useState<ConjugationFormKey | "ALL">("ALL");

  // AI Vocab Explorer State
  const [vocabSearch, setVocabSearch] = useState("");
  const [vocabGroupFilter, setVocabGroupFilter] = useState<string>("ALL");
  const [vocabSourceFilter, setVocabSourceFilter] = useState<"ALL" | "ai" | "preset">("ALL");
  const [selectedVerbId, setSelectedVerbId] = useState<string>(
    PRESET_JAPANESE_VERBS[0]?.id || ""
  );
  const [notebookWord, setNotebookWord] = useState<{
    kanji: string;
    hiragana: string;
    meaning: string;
    wordType?: "Động từ";
  } | null>(null);

  // Practice Tab State
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("quiz");
  const [practiceGroupFilter, setPracticeGroupFilter] = useState<string>("ALL");
  const [practiceSelectedForms, setPracticeSelectedForms] = useState<ConjugationFormKey[]>(
    CONJUGATION_FORM_KEYS
  );

  // Quiz & Typing State
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [typingInput, setTypingInput] = useState("");
  const [typingChecked, setTypingChecked] = useState(false);
  const [typingIsCorrect, setTypingIsCorrect] = useState(false);
  const [showTypingHint, setShowTypingHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, streak: 0 });

  // Matrix (Full 13 forms) Drill State
  const [matrixVerb, setMatrixVerb] = useState<JapaneseVerbItem>(
    PRESET_JAPANESE_VERBS[0]
  );
  const [matrixInputs, setMatrixInputs] = useState<Record<ConjugationFormKey, string>>(
    {} as Record<ConjugationFormKey, string>
  );
  const [matrixChecked, setMatrixChecked] = useState(false);

  // Load saved AI verbs from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_AI_VERBS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiVerbs(parsed);
        }
      }
    } catch {
      // ignore storage error
    }
  }, []);

  // Combined non-duplicate verb bank (AI verbs first so newly generated words appear on top)
  const allVerbs = useMemo(() => {
    const map = new Map<string, JapaneseVerbItem>();
    for (const v of aiVerbs) {
      const key = `${v.kanji}|${v.hiragana}`;
      if (!map.has(key)) map.set(key, v);
    }
    for (const v of PRESET_JAPANESE_VERBS) {
      const key = `${v.kanji}|${v.hiragana}`;
      if (!map.has(key)) map.set(key, v);
    }
    return Array.from(map.values());
  }, [aiVerbs]);

  const speakJapanese = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Generate new unique AI verbs
  const handleGenerateAiVerbs = useCallback(
    async (options?: { customCount?: number; switchToVerb?: boolean; forPractice?: boolean }) => {
      if (isGeneratingAi) return;
      setIsGeneratingAi(true);
      setAiError(null);
      setAiBannerMsg(null);

      try {
        const excludeWords = allVerbs.flatMap((v) => [v.kanji, v.hiragana]);
        const countToRequest = options?.customCount || aiCount;

        const res = await fetch("/api/conjugation/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Silent-Loading": "1",
          },
          body: JSON.stringify({
            count: countToRequest,
            jlptLevel: aiLevel,
            groupFilter: options?.forPractice ? practiceGroupFilter : aiGroup,
            excludeWords,
            topic: aiTopic,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Lỗi khi tạo từ vựng AI.");
        }

        const newVerbs: JapaneseVerbItem[] = Array.isArray(data.verbs)
          ? data.verbs
          : [];

        if (newVerbs.length === 0) {
          setAiError("Không tìm thấy thêm động từ mới phù hợp bộ lọc. Hãy thử đổi nhóm hoặc cấp độ!");
          return;
        }

        setAiVerbs((prev) => {
          const existingKeys = new Set(prev.map((v) => `${v.kanji}|${v.hiragana}`));
          const uniqueNew = newVerbs.filter(
            (v) => !existingKeys.has(`${v.kanji}|${v.hiragana}`)
          );
          const updated = [...uniqueNew, ...prev];
          try {
            localStorage.setItem(STORAGE_KEY_AI_VERBS, JSON.stringify(updated));
          } catch {
            // ignore quota error
          }
          return updated;
        });

        setAiBannerMsg(
          `✨ Đã tạo thành công ${newVerbs.length} động từ mới (không trùng) với đầy đủ 13 thể!`
        );

        if (options?.switchToVerb !== false && newVerbs[0]) {
          setSelectedVerbId(newVerbs[0].id);
        }

        if (options?.forPractice && newVerbs[0]) {
          if (practiceMode === "matrix") {
            setMatrixVerb(newVerbs[0]);
            setMatrixInputs({} as Record<ConjugationFormKey, string>);
            setMatrixChecked(false);
          }
        }
      } catch (err: any) {
        setAiError(err?.message || "Không thể kết nối AI lúc này.");
      } finally {
        setIsGeneratingAi(false);
      }
    },
    [allVerbs, aiCount, aiGroup, aiLevel, aiTopic, isGeneratingAi, practiceGroupFilter, practiceMode]
  );

  // Filtered pool for practice
  const practiceVerbPool = useMemo(() => {
    return allVerbs.filter((v) => {
      if (practiceGroupFilter === "ALL") return true;
      if (practiceGroupFilter === "EXCEPTION") return !!v.isException;
      return String(v.group) === practiceGroupFilter;
    });
  }, [allVerbs, practiceGroupFilter]);

  // Build a random quiz/typing question
  const generateNextQuestion = useCallback(() => {
    const pool = practiceVerbPool.length > 0 ? practiceVerbPool : allVerbs;
    const activeForms =
      practiceSelectedForms.length > 0
        ? practiceSelectedForms
        : CONJUGATION_FORM_KEYS;

    const randomVerb = pool[Math.floor(Math.random() * pool.length)];
    const targetFormKey =
      activeForms[Math.floor(Math.random() * activeForms.length)];
    const theoryMeta = CONJUGATION_FORMS_THEORY.find(
      (f) => f.key === targetFormKey
    )!;
    const correctDetail = randomVerb.conjugations[targetFormKey];

    // Build 3 distractor options from other forms of the same verb (ensuring distinct kanji/hiragana)
    const distractorKeys = CONJUGATION_FORM_KEYS.filter(
      (k) =>
        k !== targetFormKey &&
        randomVerb.conjugations[k].hiragana !== correctDetail.hiragana
    ).sort(() => Math.random() - 0.5);

    const chosenDistractors = distractorKeys.slice(0, 3).map((k) => {
      const meta = CONJUGATION_FORMS_THEORY.find((f) => f.key === k)!;
      const d = randomVerb.conjugations[k];
      return {
        kanji: d.kanji,
        hiragana: d.hiragana,
        formLabel: meta.shortName,
        isCorrect: false,
      };
    });

    const options = [
      {
        kanji: correctDetail.kanji,
        hiragana: correctDetail.hiragana,
        formLabel: theoryMeta.shortName,
        isCorrect: true,
      },
      ...chosenDistractors,
    ].sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      verb: randomVerb,
      targetFormKey,
      targetFormTitle: theoryMeta.nameVi,
      targetFormJp: theoryMeta.nameJp,
      correctKanji: correctDetail.kanji,
      correctHiragana: correctDetail.hiragana,
      correctRomaji: correctDetail.romaji,
      ruleApplied: correctDetail.ruleApplied,
      options,
    });
    setSelectedOptionIdx(null);
    setTypingInput("");
    setTypingChecked(false);
    setTypingIsCorrect(false);
    setShowTypingHint(false);
  }, [allVerbs, practiceSelectedForms, practiceVerbPool]);

  useEffect(() => {
    if (!currentQuestion) {
      generateNextQuestion();
    }
  }, [currentQuestion, generateNextQuestion]);

  // Handle quiz option click
  const handleSelectQuizOption = (idx: number) => {
    if (selectedOptionIdx !== null || !currentQuestion) return;
    setSelectedOptionIdx(idx);
    const isCorrect = currentQuestion.options[idx].isCorrect;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: isCorrect ? prev.streak + 1 : 0,
    }));
  };

  // Handle typing check
  const handleCheckTyping = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentQuestion || typingChecked) return;
    const clean = typingInput.trim().toLowerCase();
    if (!clean) return;

    const isMatch =
      clean === currentQuestion.correctKanji.toLowerCase() ||
      clean === currentQuestion.correctHiragana.toLowerCase() ||
      clean === currentQuestion.correctRomaji.toLowerCase();

    setTypingChecked(true);
    setTypingIsCorrect(isMatch);
    setScore((prev) => ({
      correct: prev.correct + (isMatch ? 1 : 0),
      total: prev.total + 1,
      streak: isMatch ? prev.streak + 1 : 0,
    }));
  };

  // Matrix helpers
  const pickRandomMatrixVerb = () => {
    const pool = practiceVerbPool.length > 0 ? practiceVerbPool : allVerbs;
    const candidates = pool.filter((v) => v.id !== matrixVerb.id);
    const next =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : pool[0];
    setMatrixVerb(next);
    setMatrixInputs({} as Record<ConjugationFormKey, string>);
    setMatrixChecked(false);
  };

  const checkMatrixFormMatch = (verb: JapaneseVerbItem, key: ConjugationFormKey, inputVal: string) => {
    const clean = (inputVal || "").trim().toLowerCase();
    if (!clean) return false;
    const detail = verb.conjugations[key];
    return (
      clean === detail.kanji.toLowerCase() ||
      clean === detail.hiragana.toLowerCase() ||
      clean === detail.romaji.toLowerCase()
    );
  };

  // Filtered theory forms
  const filteredTheoryForms = useMemo(() => {
    return CONJUGATION_FORMS_THEORY.filter((form) => {
      if (selectedTheoryForm !== "ALL" && form.key !== selectedTheoryForm) {
        return false;
      }
      if (!theorySearch.trim()) return true;
      const q = theorySearch.toLowerCase();
      return (
        form.nameVi.toLowerCase().includes(q) ||
        form.nameJp.toLowerCase().includes(q) ||
        form.summary.toLowerCase().includes(q) ||
        form.rules.group1.toLowerCase().includes(q)
      );
    });
  }, [selectedTheoryForm, theorySearch]);

  // Filtered vocab list in Tab 3
  const filteredVocabList = useMemo(() => {
    return allVerbs.filter((v) => {
      if (vocabSourceFilter !== "ALL" && v.source !== vocabSourceFilter) {
        return false;
      }
      if (vocabGroupFilter === "EXCEPTION" && !v.isException) return false;
      if (
        vocabGroupFilter !== "ALL" &&
        vocabGroupFilter !== "EXCEPTION" &&
        String(v.group) !== vocabGroupFilter
      ) {
        return false;
      }
      if (!vocabSearch.trim()) return true;
      const q = vocabSearch.toLowerCase();
      return (
        v.kanji.toLowerCase().includes(q) ||
        v.hiragana.toLowerCase().includes(q) ||
        v.romaji.toLowerCase().includes(q) ||
        v.meaning.toLowerCase().includes(q)
      );
    });
  }, [allVerbs, vocabGroupFilter, vocabSearch, vocabSourceFilter]);

  const selectedVerb = useMemo(() => {
    return (
      allVerbs.find((v) => v.id === selectedVerbId) ||
      filteredVocabList[0] ||
      allVerbs[0]
    );
  }, [allVerbs, filteredVocabList, selectedVerbId]);

  const togglePracticeForm = (key: ConjugationFormKey) => {
    setPracticeSelectedForms((prev) => {
      if (prev.includes(key)) {
        if (prev.length === 1) return prev; // Keep at least 1 form
        return prev.filter((k) => k !== key);
      }
      return [...prev, key];
    });
    setCurrentQuestion(null);
  };

  const getGroupBadge = (group: VerbGroup, isException?: boolean) => {
    if (group === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          Nhóm I (五段){isException ? " ★ Ngoại lệ" : ""}
        </span>
      );
    }
    if (group === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Nhóm II (一段)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        Nhóm III (Bất quy tắc)
      </span>
    );
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-3">
              <span>🇯🇵 Ngữ pháp & Động từ Tiếng Nhật</span>
              <span>•</span>
              <span>Đầy đủ 13 Thể chuẩn JLPT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              🔀 Luyện Chia 13 Thể Động Từ Tiếng Nhật
            </h1>
            <p className="mt-2 text-sm sm:text-base text-indigo-100 max-w-3xl">
              Nắm vững lý thuyết phân nhóm, công thức biến âm 13 thể, thực hành phản xạ trắc nghiệm / tự gõ / điền bảng 13 thể và tạo kho động từ ngẫu nhiên không trùng lặp bằng AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 text-center min-w-[110px]">
              <div className="text-2xl font-black">13</div>
              <div className="text-[11px] font-medium text-indigo-100">Thể động từ</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 text-center min-w-[110px]">
              <div className="text-2xl font-black">{allVerbs.length}</div>
              <div className="text-[11px] font-medium text-indigo-100">Động từ không trùng</div>
            </div>
            <button
              onClick={() => {
                setActiveTab("ai-vocab");
                handleGenerateAiVerbs({ switchToVerb: true });
              }}
              disabled={isGeneratingAi}
              className="px-4 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-sm shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <span>{isGeneratingAi ? "⏳" : "✨"}</span>
              <span>{isGeneratingAi ? "AI đang tạo..." : "AI Tạo Từ Mới"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-white dark:bg-gray-800/90 p-2 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700/80">
        <button
          onClick={() => setActiveTab("theory")}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "theory"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
          }`}
        >
          <span>📖</span>
          <span>1. Lý thuyết 13 Thể</span>
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "practice"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
          }`}
        >
          <span>✍️</span>
          <span>2. Bài tập Thực hành</span>
        </button>
        <button
          onClick={() => setActiveTab("ai-vocab")}
          className={`flex-1 min-w-[160px] py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "ai-vocab"
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
          }`}
        >
          <span>🤖</span>
          <span>3. Kho Từ Vựng AI & Bảng 13 Thể ({allVerbs.length})</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: LÝ THUYẾT 13 THỂ ĐỘNG TỪ
         ===================================================================== */}
      {activeTab === "theory" && (
        <div className="space-y-8">
          {/* Section 1: 3 Verb Groups Overview */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200/80 dark:border-gray-700/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🧭</span> Bước 1: Cách phân biệt 3 Nhóm Động Từ Tiếng Nhật
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Muốn chia đúng 13 thể, trước tiên bạn cần xác định chính xác động từ thuộc Nhóm I, Nhóm II hay Nhóm III.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {VERB_GROUPS_OVERVIEW.map((g) => (
                <div
                  key={g.group}
                  className="rounded-2xl p-5 border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      {getGroupBadge(g.group)}
                      <span className="text-xs font-semibold text-gray-400">
                        Group {g.group}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base mb-2">
                      {g.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                      {g.description}
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Dấu hiệu nhận biết:
                      </div>
                      <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {g.identification.map((rule, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold mt-0.5">•</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick 5-Row (a-i-u-e-o) Map for Group 1 */}
            <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-pink-950/30 p-5 border border-indigo-200/70 dark:border-indigo-800/60">
              <h3 className="text-sm sm:text-base font-extrabold text-indigo-950 dark:text-indigo-200 mb-3 flex items-center gap-2">
                <span>💡</span> Sơ đồ 5 Cột Nguyên Âm (a - i - u - e - o) cho Động từ Nhóm I
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs sm:text-sm">
                <div className="bg-white/90 dark:bg-gray-800/90 p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/60">
                  <div className="font-extrabold text-rose-600 dark:text-rose-400 mb-1">
                    1. Cột A (あ段)
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs">
                    • <b>Thể ない</b> (+ ない)<br />
                    • <b>Thể Bị động</b> (+ れる)<br />
                    • <b>Thể Sai khiến</b> (+ せる)<br />
                    • <b>Sai khiến BĐ</b> (+ される)<br />
                    <span className="text-[11px] text-rose-500 font-semibold">
                      *Riêng う đổi thành わ!
                    </span>
                  </p>
                </div>
                <div className="bg-white/90 dark:bg-gray-800/90 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/60">
                  <div className="font-extrabold text-blue-600 dark:text-blue-400 mb-1">
                    2. Cột I (い段)
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs">
                    • <b>Thể ます</b> (+ ます)<br />
                    • Gốc ghép <b>〜たい, 〜ながら, 〜やすい, 〜にくい</b><br />
                    • Biến âm sang <b>Thể て / Thể た</b>
                  </p>
                </div>
                <div className="bg-white/90 dark:bg-gray-800/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    3. Cột U (う段)
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs">
                    • <b>Thể Từ điển</b> (Nguyên mẫu)<br />
                    • <b>Thể Cấm chỉ</b> (Nguyên mẫu + な)
                  </p>
                </div>
                <div className="bg-white/90 dark:bg-gray-800/90 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
                    4. Cột E (え段)
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs">
                    • <b>Thể Khả năng</b> (+ る)<br />
                    • <b>Thể Điều kiện</b> (+ ば)<br />
                    • <b>Thể Mệnh lệnh</b> (Giữ nguyên cột E)
                  </p>
                </div>
                <div className="bg-white/90 dark:bg-gray-800/90 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60">
                  <div className="font-extrabold text-purple-600 dark:text-purple-400 mb-1">
                    5. Cột O (お段)
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-xs">
                    • <b>Thể Ý chí</b> (+ う)<br />
                    (VD: 書く → 書こう, 行く → 行こう)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Detailed 13 Conjugation Forms */}
          <section className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200/80 dark:border-gray-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  📚 Chi tiết Công thức & Cách dùng 13 Thể Động Từ
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  Chọn nhanh từng thể hoặc tìm kiếm theo tên thể / công thức.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={theorySearch}
                  onChange={(e) => setTheorySearch(e.target.value)}
                  placeholder="🔍 Tìm thể (VD: bị động, sai khiến, て...)"
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                />
              </div>
            </div>

            {/* Quick Filter Pills for the 13 Forms */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedTheoryForm("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTheoryForm === "ALL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                }`}
              >
                Tất cả 13 thể
              </button>
              {CONJUGATION_FORMS_THEORY.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSelectedTheoryForm(f.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTheoryForm === f.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50"
                  }`}
                >
                  #{f.index}. {f.shortName}
                </button>
              ))}
            </div>

            {/* Cards for each of the 13 forms */}
            <div className="grid grid-cols-1 gap-5">
              {filteredTheoryForms.map((form) => (
                <div
                  key={form.key}
                  className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 dark:border-gray-700/80 transition-all hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700/70">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br ${form.badgeColor} text-white font-black text-sm shadow-sm`}
                      >
                        #{form.index}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            {form.nameVi}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                            {form.nameJp}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {form.summary}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setPracticeSelectedForms([form.key]);
                        setCurrentQuestion(null);
                        setActiveTab("practice");
                      }}
                      className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      ✍️ Luyện riêng {form.shortName} →
                    </button>
                  </div>

                  {/* Rules & Usages Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
                    {/* Left: Conjugation Formulas */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        📐 Quy tắc chia theo 3 nhóm:
                      </div>
                      <div className="space-y-2.5 text-xs sm:text-sm">
                        <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/50">
                          <span className="font-extrabold text-blue-700 dark:text-blue-300">
                            • Nhóm I (五段):{" "}
                          </span>
                          <span className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                            {form.rules.group1}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50">
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                            • Nhóm II (一段):{" "}
                          </span>
                          <span className="text-gray-800 dark:text-gray-200">
                            {form.rules.group2}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50">
                          <span className="font-extrabold text-purple-700 dark:text-purple-300">
                            • Nhóm III (Bất quy tắc):{" "}
                          </span>
                          <span className="text-gray-800 dark:text-gray-200">
                            {form.rules.group3}
                          </span>
                        </div>
                        {form.rules.exceptions && (
                          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50">
                            <span className="font-extrabold text-amber-700 dark:text-amber-300">
                              ⚠️ Lưu ý / Ngoại lệ:{" "}
                            </span>
                            <span className="text-gray-800 dark:text-gray-200">
                              {form.rules.exceptions}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Usages & Examples */}
                    <div className="lg:col-span-5 space-y-4">
                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                          💡 Mẫu câu ứng dụng thường gặp:
                        </div>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {form.usages.map((u, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-500 font-bold">✓</span>
                              <span>{u}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <div className="text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                          🎯 Ví dụ minh họa:
                        </div>
                        <div className="space-y-2">
                          {form.examples.map((ex, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/60 dark:border-gray-700/60 text-xs"
                            >
                              <div>
                                <span className="font-semibold text-gray-500 dark:text-gray-400">
                                  [{ex.group}] {ex.before} →{" "}
                                </span>
                                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm">
                                  {ex.after}
                                </span>{" "}
                                <span className="text-gray-500">({ex.afterReading})</span>
                                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                  Nghĩa: {ex.meaning}
                                </div>
                              </div>
                              <button
                                onClick={() => speakJapanese(ex.after)}
                                title="Nghe phát âm"
                                className="p-2 rounded-lg bg-white dark:bg-gray-800 hover:bg-indigo-50 text-indigo-600 border border-gray-200 dark:border-gray-700 cursor-pointer shrink-0"
                              >
                                🔊
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* =====================================================================
          TAB 2: BÀI TẬP THỰC HÀNH CHIA 13 THỂ
         ===================================================================== */}
      {activeTab === "practice" && (
        <div className="space-y-6">
          {/* Practice Mode & Filter Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 dark:border-gray-700/80 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* 3 Sub-modes */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPracticeMode("quiz")}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    practiceMode === "quiz"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  🎯 1. Trắc nghiệm nhanh (4 đáp án)
                </button>
                <button
                  onClick={() => setPracticeMode("typing")}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    practiceMode === "typing"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  ⌨️ 2. Tự gõ đáp án (Kanji / Hiragana)
                </button>
                <button
                  onClick={() => setPracticeMode("matrix")}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    practiceMode === "matrix"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  📋 3. Thử thách Bảng 13 Thể Đầy Đủ
                </button>
              </div>

              {/* Score & AI Add Verb Button */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅ Đúng: {score.correct}/{score.total}
                  </span>
                  <span>•</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    🔥 Chuỗi: {score.streak}
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleGenerateAiVerbs({
                      customCount: 5,
                      switchToVerb: false,
                      forPractice: true,
                    })
                  }
                  disabled={isGeneratingAi}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <span>{isGeneratingAi ? "⏳" : "🤖"}</span>
                  <span>
                    {isGeneratingAi
                      ? "AI đang tạo..."
                      : "+ AI Thêm 5 Động Từ Mới Vào Bài Tập"}
                  </span>
                </button>
              </div>
            </div>

            {aiBannerMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span>{aiBannerMsg}</span>
                <button
                  onClick={() => setAiBannerMsg(null)}
                  className="text-emerald-600 hover:underline ml-2"
                >
                  Đóng
                </button>
              </div>
            )}

            {/* Filter by Verb Group & Target Conjugation Forms */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mr-1">
                  Nhóm động từ:
                </span>
                {[
                  { id: "ALL", label: "Tất cả nhóm" },
                  { id: "1", label: "Nhóm I (五段)" },
                  { id: "2", label: "Nhóm II (一段)" },
                  { id: "3", label: "Nhóm III (する・来る)" },
                  { id: "EXCEPTION", label: "★ Chỉ từ Ngoại lệ" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setPracticeGroupFilter(g.id);
                      setCurrentQuestion(null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      practiceGroupFilter === g.id
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700"
                        : "bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              {practiceMode !== "matrix" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      Các thể muốn luyện ({practiceSelectedForms.length}/13 thể):
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setPracticeSelectedForms(CONJUGATION_FORM_KEYS);
                          setCurrentQuestion(null);
                        }}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Chọn tất cả 13 thể
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CONJUGATION_FORMS_THEORY.map((f) => {
                      const active = practiceSelectedForms.includes(f.key);
                      return (
                        <button
                          key={f.key}
                          onClick={() => togglePracticeForm(f.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            active
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-200"
                          }`}
                        >
                          #{f.index} {f.shortName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* MODE 1 & MODE 2: QUIZ OR TYPING */}
          {(practiceMode === "quiz" || practiceMode === "typing") && currentQuestion && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/80 dark:border-gray-700/80 max-w-3xl mx-auto">
              {/* Verb Prompt Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2">
                  {getGroupBadge(
                    currentQuestion.verb.group,
                    currentQuestion.verb.isException
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    JLPT {currentQuestion.verb.jlptLevel}
                  </span>
                  {currentQuestion.verb.source === "ai" && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      ✨ Từ AI Gen
                    </span>
                  )}
                </div>

                <button
                  onClick={() => speakJapanese(currentQuestion.verb.hiragana)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 cursor-pointer"
                >
                  <span>🔊</span> Nghe từ gốc
                </button>
              </div>

              <div className="text-center py-4 px-4 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/70 dark:to-gray-800 border border-gray-200/70 dark:border-gray-700 mb-6">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Động từ nguyên mẫu (辞書形)
                </div>
                <div className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">
                  {currentQuestion.verb.kanji}
                </div>
                <div className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {currentQuestion.verb.hiragana}{" "}
                  <span className="text-xs font-normal text-gray-400">
                    ({currentQuestion.verb.romaji})
                  </span>
                </div>
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-1">
                  Nghĩa: &ldquo;{currentQuestion.verb.meaning}&rdquo;
                </div>

                <div className="mt-5 pt-4 border-t border-gray-200/70 dark:border-gray-700/70">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    Hãy chia động từ trên sang:{" "}
                  </span>
                  <div className="mt-1.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-sm sm:text-base shadow-sm">
                    <span>{currentQuestion.targetFormTitle}</span>
                    <span className="text-indigo-200">({currentQuestion.targetFormJp})</span>
                  </div>
                </div>
              </div>

              {/* Quiz Options */}
              {practiceMode === "quiz" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentQuestion.options.map((opt, idx) => {
                    const isAnswered = selectedOptionIdx !== null;
                    const isSelected = selectedOptionIdx === idx;
                    let btnStyle =
                      "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/60 hover:border-indigo-400 hover:bg-indigo-50/40";

                    if (isAnswered) {
                      if (opt.isCorrect) {
                        btnStyle =
                          "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30";
                      } else if (isSelected && !opt.isCorrect) {
                        btnStyle =
                          "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200";
                      } else {
                        btnStyle =
                          "border-gray-200 dark:border-gray-700 opacity-55";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuizOption(idx)}
                        disabled={isAnswered}
                        className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                      >
                        <div>
                          <div className="text-lg font-extrabold text-gray-900 dark:text-white">
                            {opt.kanji}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                            {opt.hiragana}
                          </div>
                        </div>
                        {isAnswered && (
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            {opt.isCorrect ? "✅ Đúng" : opt.formLabel}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Typing Input */}
              {practiceMode === "typing" && (
                <form onSubmit={handleCheckTyping} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={typingInput}
                      onChange={(e) => setTypingInput(e.target.value)}
                      disabled={typingChecked}
                      placeholder="Nhập Kanji, Hiragana hoặc Romaji (VD: かきます / 書きます / kakimasu)..."
                      className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-base font-bold focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    {!typingChecked ? (
                      <button
                        type="submit"
                        className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md cursor-pointer"
                      >
                        Kiểm tra đáp án
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={generateNextQuestion}
                        className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md cursor-pointer"
                      >
                        Câu tiếp theo →
                      </button>
                    )}
                  </div>

                  {!typingChecked && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <button
                        type="button"
                        onClick={() => setShowTypingHint((v) => !v)}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        💡 {showTypingHint ? "Ẩn gợi ý công thức" : "Xem gợi ý công thức"}
                      </button>
                      <span>Chấp nhận cả chữ Hán, Hiragana hoặc Romaji</span>
                    </div>
                  )}

                  {showTypingHint && !typingChecked && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-medium">
                      📐 <b>Gợi ý quy tắc:</b> {currentQuestion.ruleApplied}
                    </div>
                  )}
                </form>
              )}

              {/* Explanation & Next Button after answering */}
              {(selectedOptionIdx !== null || typingChecked) && (
                <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                      <span>
                        {(practiceMode === "quiz" &&
                          selectedOptionIdx !== null &&
                          currentQuestion.options[selectedOptionIdx]?.isCorrect) ||
                        (practiceMode === "typing" && typingIsCorrect)
                          ? "🎉 Chính xác!"
                          : "💡 Đáp án chuẩn:"}
                      </span>
                      <span className="text-base text-indigo-600 dark:text-indigo-400">
                        {currentQuestion.correctKanji} ({currentQuestion.correctHiragana} /{" "}
                        {currentQuestion.correctRomaji})
                      </span>
                      <button
                        onClick={() => speakJapanese(currentQuestion.correctHiragana)}
                        className="px-2 py-0.5 rounded bg-white dark:bg-gray-800 border text-xs cursor-pointer"
                      >
                        🔊
                      </button>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      <b>Quy tắc áp dụng:</b> {currentQuestion.ruleApplied}
                    </p>
                  </div>

                  <button
                    onClick={generateNextQuestion}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shrink-0 cursor-pointer"
                  >
                    Câu tiếp theo →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: FULL 13-FORM MATRIX DRILL */}
          {practiceMode === "matrix" && matrixVerb && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 dark:border-gray-700/80 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getGroupBadge(matrixVerb.group, matrixVerb.isException)}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      JLPT {matrixVerb.jlptLevel}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{matrixVerb.kanji}</span>
                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      ({matrixVerb.hiragana} - {matrixVerb.meaning})
                    </span>
                    <button
                      onClick={() => speakJapanese(matrixVerb.hiragana)}
                      className="text-sm px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-indigo-50 cursor-pointer"
                    >
                      🔊
                    </button>
                  </h3>
                  {matrixVerb.exceptionNote && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                      ⚠️ {matrixVerb.exceptionNote}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={pickRandomMatrixVerb}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    🎲 Đổi động từ khác
                  </button>
                  <button
                    onClick={() => setMatrixChecked(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    ✅ Chấm điểm cả 13 thể
                  </button>
                  <button
                    onClick={() => {
                      const filled = {} as Record<ConjugationFormKey, string>;
                      for (const k of CONJUGATION_FORM_KEYS) {
                        filled[k] = matrixVerb.conjugations[k].kanji;
                      }
                      setMatrixInputs(filled);
                      setMatrixChecked(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold cursor-pointer"
                  >
                    👁️ Điền mẫu đáp án
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CONJUGATION_FORMS_THEORY.map((form) => {
                  const detail = matrixVerb.conjugations[form.key];
                  const val = matrixInputs[form.key] || "";
                  const isOk =
                    matrixChecked && checkMatrixFormMatch(matrixVerb, form.key, val);

                  return (
                    <div
                      key={form.key}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        matrixChecked
                          ? isOk
                            ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-gray-800 dark:text-gray-200">
                          #{form.index}. {form.shortName} ({form.nameJp})
                        </span>
                        <span className="text-gray-400">{detail.meaningVi}</span>
                      </div>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) =>
                          setMatrixInputs((prev) => ({
                            ...prev,
                            [form.key]: e.target.value,
                          }))
                        }
                        placeholder="Nhập Kanji / Hiragana / Romaji..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {matrixChecked && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span
                            className={
                              isOk
                                ? "text-emerald-700 dark:text-emerald-400 font-bold"
                                : "text-rose-600 dark:text-rose-400 font-bold"
                            }
                          >
                            {isOk ? "✅ Đúng!" : "❌ Đáp án:"}{" "}
                            <span className="text-indigo-600 dark:text-indigo-300">
                              {detail.kanji} ({detail.hiragana})
                            </span>
                          </span>
                          <button
                            onClick={() => speakJapanese(detail.hiragana)}
                            className="text-indigo-600 hover:underline cursor-pointer"
                          >
                            🔊 Nghe
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: TỪ VỰNG NGẪU NHIÊN TỪ AI GEN (KHÔNG TRÙNG & ĐẦY ĐỦ 13 THỂ)
         ===================================================================== */}
      {activeTab === "ai-vocab" && (
        <div className="space-y-6">
          {/* AI Random Verb Generator Control Box */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 dark:border-gray-700/80">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🤖</span> Tạo Động Từ Ngẫu Nhiên Bằng AI (Cam Kết Không Trùng & Đầy Đủ 13 Thể)
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Hệ thống tự động ghi nhớ toàn bộ <b>{allVerbs.length}</b> động từ đã có để yêu cầu AI sinh từ vựng hoàn toàn mới kèm bảng chia đủ 13 thể chuẩn xác.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {aiVerbs.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Xóa lịch sử từ AI đã lưu trên trình duyệt?")) {
                        setAiVerbs([]);
                        localStorage.removeItem(STORAGE_KEY_AI_VERBS);
                      }
                    }}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 hover:text-rose-600 cursor-pointer"
                  >
                    🗑️ Xóa từ AI đã lưu ({aiVerbs.length})
                  </button>
                )}
              </div>
            </div>

            {/* AI Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Trình độ JLPT
                </label>
                <select
                  value={aiLevel}
                  onChange={(e) => setAiLevel(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm font-bold"
                >
                  <option value="ALL">Tất cả (N5 - N1)</option>
                  <option value="N5">Sơ cấp N5</option>
                  <option value="N4">Sơ trung cấp N4</option>
                  <option value="N3">Trung cấp N3</option>
                  <option value="N2">Thượng cấp N2</option>
                  <option value="N1">Cao cấp N1</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Nhóm động từ
                </label>
                <select
                  value={aiGroup}
                  onChange={(e) => setAiGroup(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm font-bold"
                >
                  <option value="ALL">Đa dạng cả 3 nhóm</option>
                  <option value="1">Chỉ Nhóm I (Godan)</option>
                  <option value="2">Chỉ Nhóm II (Ichidan)</option>
                  <option value="3">Chỉ Nhóm III (〜する / 来る)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Số lượng mỗi lần tạo
                </label>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm font-bold"
                >
                  <option value={5}>5 động từ mới</option>
                  <option value={6}>6 động từ mới</option>
                  <option value={10}>10 động từ mới</option>
                  <option value={12}>12 động từ mới</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Chủ đề (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="VD: Công sở, nấu ăn, du lịch..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => handleGenerateAiVerbs({ switchToVerb: true })}
                  disabled={isGeneratingAi}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                >
                  <span>{isGeneratingAi ? "⏳" : "✨"}</span>
                  <span>
                    {isGeneratingAi
                      ? "Đang sinh từ vựng..."
                      : `AI Gen +${aiCount} Từ Mới`}
                  </span>
                </button>
              </div>
            </div>

            {aiError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 text-xs font-semibold">
                ⚠️ {aiError}
              </div>
            )}

            {aiBannerMsg && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                {aiBannerMsg}
              </div>
            )}
          </div>

          {/* Master-Detail Layout: Left = Verb List, Right = Full 13 Conjugation Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: Verb List */}
            <div className="lg:col-span-4 bg-white dark:bg-gray-800 rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-200/80 dark:border-gray-700/80 flex flex-col max-h-[820px]">
              <div className="space-y-3 mb-3">
                <input
                  type="text"
                  value={vocabSearch}
                  onChange={(e) => setVocabSearch(e.target.value)}
                  placeholder="🔍 Tìm kiếm Kanji, Hiragana, nghĩa..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs sm:text-sm"
                />

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "ALL", label: `Tất cả (${allVerbs.length})` },
                    { id: "ai", label: `🤖 AI Gen (${aiVerbs.length})` },
                    { id: "preset", label: `📌 Cơ bản (${PRESET_JAPANESE_VERBS.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setVocabSourceFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        vocabSourceFilter === tab.id
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {[
                    { id: "ALL", label: "Mọi nhóm" },
                    { id: "1", label: "Nhóm I" },
                    { id: "2", label: "Nhóm II" },
                    { id: "3", label: "Nhóm III" },
                    { id: "EXCEPTION", label: "★ Ngoại lệ" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setVocabGroupFilter(g.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        vocabGroupFilter === g.id
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredVocabList.map((verb) => {
                  const isSelected = selectedVerb?.id === verb.id;
                  return (
                    <button
                      key={verb.id}
                      onClick={() => setSelectedVerbId(verb.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 shadow-xs"
                          : "border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-gray-900 dark:text-white">
                            {verb.kanji}
                          </span>
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {verb.hiragana}
                          </span>
                          {verb.source === "ai" && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                              AI
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                          {verb.meaning}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          Nhóm {verb.group} • {verb.jlptLevel}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Detail Panel: Full 13-Form Conjugation Table */}
            <div className="lg:col-span-8">
              {selectedVerb && (
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 dark:border-gray-700/80 space-y-5">
                  {/* Verb Top Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {getGroupBadge(selectedVerb.group, selectedVerb.isException)}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          JLPT {selectedVerb.jlptLevel}
                        </span>
                        {selectedVerb.source === "ai" && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            ✨ Sinh bởi AI (Không trùng)
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">
                          {selectedVerb.kanji}
                        </h3>
                        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                          {selectedVerb.hiragana}
                        </span>
                        <span className="text-sm text-gray-400">
                          [{selectedVerb.romaji}]
                        </span>
                      </div>
                      <p className="text-base font-bold text-gray-700 dark:text-gray-200 mt-1">
                        Nghĩa: {selectedVerb.meaning}
                      </p>
                      {selectedVerb.exceptionNote && (
                        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                          ⚠️ {selectedVerb.exceptionNote}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => speakJapanese(selectedVerb.hiragana)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
                      >
                        🔊 Phát âm
                      </button>
                      <button
                        onClick={() =>
                          setNotebookWord({
                            kanji: selectedVerb.kanji,
                            hiragana: selectedVerb.hiragana,
                            meaning: selectedVerb.meaning,
                            wordType: "Động từ",
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold hover:bg-amber-100 cursor-pointer"
                      >
                        📓 Lưu Sổ tay
                      </button>
                      <button
                        onClick={() => {
                          setMatrixVerb(selectedVerb);
                          setMatrixInputs({} as Record<ConjugationFormKey, string>);
                          setMatrixChecked(false);
                          setPracticeMode("matrix");
                          setActiveTab("practice");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        ✍️ Luyện điền 13 thể từ này
                      </button>
                    </div>
                  </div>

                  {/* Example Sentence Box */}
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200/70 dark:border-gray-700/70 flex items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs sm:text-sm">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Câu ví dụ thực tế:
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                        {selectedVerb.exampleJa}
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400 text-xs">
                        {selectedVerb.exampleReading}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 text-xs">
                        → {selectedVerb.exampleVi}
                      </div>
                    </div>
                    <button
                      onClick={() => speakJapanese(selectedVerb.exampleJa)}
                      className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-indigo-600 hover:bg-indigo-50 cursor-pointer shrink-0"
                    >
                      🔊
                    </button>
                  </div>

                  {/* Complete 13-Form Table */}
                  <div>
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      📊 Bảng Chia Đầy Đủ 13 Thể Động Từ ({selectedVerb.kanji})
                    </h4>

                    <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                            <th className="py-3 px-3 font-extrabold">#</th>
                            <th className="py-3 px-3 font-extrabold">Tên Thể</th>
                            <th className="py-3 px-3 font-extrabold">Chia (Kanji)</th>
                            <th className="py-3 px-3 font-extrabold">Hiragana / Romaji</th>
                            <th className="py-3 px-3 font-extrabold">Ý nghĩa & Công thức</th>
                            <th className="py-3 px-3 font-extrabold text-center">Nghe</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                          {CONJUGATION_FORMS_THEORY.map((formMeta) => {
                            const detail = selectedVerb.conjugations[formMeta.key];
                            return (
                              <tr
                                key={formMeta.key}
                                className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                              >
                                <td className="py-3 px-3 font-bold text-gray-400">
                                  #{formMeta.index}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-gray-900 dark:text-white">
                                    {formMeta.shortName}
                                  </div>
                                  <div className="text-[11px] text-gray-400">
                                    {formMeta.nameJp}
                                  </div>
                                </td>
                                <td className="py-3 px-3 font-extrabold text-indigo-600 dark:text-indigo-400 text-sm sm:text-base">
                                  {detail.kanji}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-bold text-gray-800 dark:text-gray-200">
                                    {detail.hiragana}
                                  </div>
                                  <div className="text-[11px] text-gray-400">
                                    {detail.romaji}
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                    {detail.meaningVi}
                                  </div>
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {detail.ruleApplied}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    onClick={() => speakJapanese(detail.hiragana)}
                                    className="p-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-gray-700 text-indigo-600 cursor-pointer"
                                    title="Nghe phát âm"
                                  >
                                    🔊
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notebookWord && (
        <AddToNotebookModal
          selectedWord={notebookWord}
          onClose={() => setNotebookWord(null)}
        />
      )}
    </div>
  );
}
