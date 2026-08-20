"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getCurriculumRepository, getKanjiRepository } from "@/lib/repositories";
import { DetailedLesson } from "@/lib/repositories/types";
import { useProgress } from "@/hooks/useProgress";
import VocabularyListItem from "@/components/VocabularyListItem";
import GrammarCard from "@/components/GrammarCard";
import KanjiStrokeViewer from "@/components/KanjiStrokeViewer";

import { useGrammarProgress } from "@/hooks/useGrammarProgress";
import { useKanjiProgress } from "@/hooks/useKanjiProgress";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import MaziiQuickLookupModal from "@/components/MaziiQuickLookupModal";
import SelectionLookupTooltip from "@/components/SelectionLookupTooltip";
import AuthGuard from "@/components/AuthGuard";

interface Props {
  params: Promise<{ id: string }>;
}

export default function CurriculumLessonDetailPage({ params }: Props) {
  const { id } = use(params);
  const { activeLanguage } = useLanguageSetting();
  const langCode = activeLanguage.code;
  const [lesson, setLesson] = useState<DetailedLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"vocab" | "grammar" | "kanji" | "shadowing" | "translation" | "reading">("vocab");
  const { getVocabProgress, toggleLearned, toggleFavorite } = useProgress();
  const { getGrammarProgress, toggleLearned: toggleGrammarLearned, toggleFavorite: toggleGrammarFavorite } = useGrammarProgress();
  const { getKanjiProgress, toggleLearned: toggleKanjiLearned, toggleFavorite: toggleKanjiFavorite } = useKanjiProgress();

  // AI-generated activities states
  const [activities, setActivities] = useState<{
    shadowing?: any[];
    translation?: any[];
    reading?: any[];
  } | null>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const [maziiLookupState, setMaziiLookupState] = useState<{
    isOpen: boolean;
    queryWord: string;
    initialFurigana?: string;
    initialMeaning?: string;
  }>({
    isOpen: false,
    queryWord: "",
  });

  // Interaction states for activities
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [recognizingIndex, setRecognizingIndex] = useState<number | null>(null);
  const [recognitionTranscript, setRecognitionTranscript] = useState<string>("");
  const [translationInputs, setTranslationInputs] = useState<Record<string, string>>({});
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && lesson) {
      const stored = localStorage.getItem("flashcash-curriculum-history");
      const list = stored ? JSON.parse(stored) : [];
      setIsCompleted(list.some((item: any) => item.lessonId === lesson.id));
    }
  }, [lesson]);

  const handleToggleComplete = () => {
    if (!lesson) return;
    const stored = localStorage.getItem("flashcash-curriculum-history");
    let list = stored ? JSON.parse(stored) : [];
    const exists = list.some((item: any) => item.lessonId === lesson.id);

    if (exists) {
      list = list.filter((item: any) => item.lessonId !== lesson.id);
      setIsCompleted(false);
    } else {
      list.push({
        lessonId: lesson.id,
        lessonName: lesson.name,
        curriculumName: lesson.curriculum || "Giáo trình",
        completedAt: new Date().toISOString()
      });
      setIsCompleted(true);
    }
    localStorage.setItem("flashcash-curriculum-history", JSON.stringify(list));
  };

  useEffect(() => {
    async function loadLesson() {
      setLoading(true);
      const repo = getCurriculumRepository();
      const data = await repo.getLessonById(id);

      // Enrich kanjiItems with svgStrokes from KanjiRepository
      if (data && data.kanjiItems && data.kanjiItems.length > 0) {
        const kanjiRepo = getKanjiRepository();
        const enrichedKanjiItems = await Promise.all(
          data.kanjiItems.map(async (item) => {
            const fullKanji = await kanjiRepo.getKanjiByChar(item.kanji);
            if (fullKanji && fullKanji.svgStrokes) {
              return {
                ...item,
                svgStrokes: fullKanji.svgStrokes
              };
            }
            return item;
          })
        );
        data.kanjiItems = enrichedKanjiItems;
      }

      setLesson(data);
      setLoading(false);
    }
    loadLesson();
  }, [id]);

  // Load activities when switching tabs
  useEffect(() => {
    if (activeTab === "vocab" || activeTab === "grammar" || activeTab === "kanji") return;
    if (activities || !lesson) return;

    const cacheKey = `activities-lesson-${lesson.id}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setActivities(JSON.parse(cached));
        return;
      } catch (e) {
        console.error("Failed to parse cached activities", e);
      }
    }

    async function fetchActivities() {
      setLoadingActivities(true);
      setActivitiesError(null);
      try {
        const res = await fetch("/api/curriculum/activities", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            level: lesson?.level || "N5",
            lessonName: lesson?.name,
            vocabulary: lesson?.vocabulary,
            grammarPoints: lesson?.grammarPoints
          })
        });

        if (!res.ok) {
          throw new Error("Không thể kết nối đến máy chủ AI");
        }

        const resData = await res.json();
        if (resData.success && resData.data) {
          setActivities(resData.data);
          localStorage.setItem(cacheKey, JSON.stringify(resData.data));
        } else {
          throw new Error(resData.error || "Không thể tạo bài tập AI");
        }
      } catch (err: any) {
        console.error("Error fetching AI activities:", err);
        setActivitiesError(err.message || "Đã xảy ra lỗi khi tải bài tập");
      } finally {
        setLoadingActivities(false);
      }
    }

    fetchActivities();
  }, [activeTab, lesson, activities]);

  // Web Speech API TTS
  const playSentence = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === "de" ? "de-DE" : langCode === "en" ? "en-US" : "ja-JP";
    utterance.rate = playbackRate;
    window.speechSynthesis.speak(utterance);
  };

  // Web Speech API Voice Recognition
  const handleShadowingSpeech = (targetText: string, index: number) => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Khuyên dùng Chrome/Edge).");
      return;
    }

    if (recognizingIndex === index) {
      setRecognizingIndex(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langCode === "de" ? "de-DE" : langCode === "en" ? "en-US" : "ja-JP";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setRecognizingIndex(index);
    setRecognitionTranscript("Đang lắng nghe...");

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setRecognitionTranscript(resultText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setRecognitionTranscript("Không nhận diện được. Vui lòng nói to rõ hơn!");
      setRecognizingIndex(null);
    };

    recognition.onend = () => {
      setRecognizingIndex(null);
    };

    recognition.start();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-indigo-600 font-medium">
        Đang tải bài học...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài học</h2>
        <p className="text-gray-500 text-sm mb-4">Bài học bạn yêu cầu không tồn tại hoặc đã bị xóa.</p>
        <Link href="/curriculum" className="text-indigo-600 font-medium hover:underline text-sm">
          ← Quay lại danh sách giáo trình
        </Link>
      </div>
    );
  }

  const vocabCount = lesson.vocabulary?.length || 0;
  const grammarCount = lesson.grammarPoints?.length || 0;
  const kanjiCount = lesson.kanjiItems?.length || 0;

  const learnedVocabCount = lesson.vocabulary ? lesson.vocabulary.filter(v => getVocabProgress(v.id).learned).length : 0;
  const learnedGrammarCount = lesson.grammarPoints ? lesson.grammarPoints.filter(g => getGrammarProgress(g.id).learned).length : 0;
  const learnedKanjiCount = lesson.kanjiItems ? lesson.kanjiItems.filter(k => getKanjiProgress(k.id).learned).length : 0;

  return (
    <AuthGuard featureName="Bài Học Giáo Trình Chi Tiết" description="Đăng nhập để theo dõi bài học, làm bài tập Shadowing & Reading AI và ghi nhận tiến độ học tập.">
      <div className="p-4 max-w-5xl mx-auto pb-24">
      {/* Back Link */}
      <div className="mb-4">
        <Link href="/curriculum" className="text-xs text-indigo-600 font-medium hover:underline">
          ← Danh sách Lộ trình Bài học
        </Link>
      </div>

      {/* Lesson Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-md bg-indigo-100 text-indigo-700">
                {lesson.level || "Minna"}
              </span>
              {lesson.curriculum && (
                <span className="text-xs text-gray-400 font-medium">{lesson.curriculum}</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2">{lesson.name}</h1>
            {lesson.description && (
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{lesson.description}</p>
            )}
          </div>

          <div className="flex gap-2 flex-col sm:flex-row shrink-0">
            <button
              onClick={handleToggleComplete}
              className={`px-5 py-3 font-bold rounded-2xl border transition-all text-xs flex items-center justify-center gap-1.5 ${
                isCompleted
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span>{isCompleted ? "✅ Đã học xong" : "⭕ Đánh dấu hoàn thành"}</span>
            </button>

            <Link
              href={`/flashcard/lesson/${lesson.id}`}
              className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-md shadow-indigo-200 hover:opacity-95 transition-opacity text-center flex items-center justify-center gap-2 text-xs"
            >
              <span>🎴 Flashcard Ôn tập</span>
            </Link>
          </div>
        </div>

        {/* IELTS 4-Skills Breakdown Widget if present */}
        {(lesson as any).skills && (
          <div className="mt-5 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="font-extrabold text-indigo-400 text-sm flex items-center justify-between">
              <span>🎯 NHIỆM VỤ 4 KỸ NĂNG TUẦN NÀY</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                {(lesson as any).duration || "8 - 10h/tuần"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-slate-300">
              <div><span className="font-bold text-indigo-400">🎧 Listening:</span> {(lesson as any).skills.listening}</div>
              <div><span className="font-bold text-indigo-400">📖 Reading:</span> {(lesson as any).skills.reading}</div>
              <div><span className="font-bold text-indigo-400">✍️ Writing:</span> {(lesson as any).skills.writing}</div>
              <div><span className="font-bold text-indigo-400">🗣️ Speaking:</span> {(lesson as any).skills.speaking}</div>
            </div>
            <div className="pt-2 text-emerald-300 border-t border-slate-800 font-medium">
              🌟 <span className="font-bold text-emerald-400">KPI Đầu ra:</span> {(lesson as any).skills.kpi}
            </div>
          </div>
        )}

        {/* Lesson Progress Tracking Bar */}
        <div className="bg-indigo-50/40 rounded-2xl p-4 border border-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-5">
          <div className="space-y-1">
            <h4 className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
              📈 TIẾN ĐỘ CHI TIẾT
            </h4>
            <p className="text-[11px] text-gray-500 font-medium">
              Theo dõi tiến trình học từng từ vựng, ngữ pháp và chữ Hán
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold">
            {vocabCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">📝 Từ vựng:</span>
                <span className="text-gray-800 font-bold bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-3xs">
                  {learnedVocabCount}/{vocabCount}
                </span>
                <span className="text-[10px] text-teal-600">
                  ({Math.round((learnedVocabCount / vocabCount) * 100)}%)
                </span>
              </div>
            )}

            {grammarCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">📖 Ngữ pháp:</span>
                <span className="text-gray-800 font-bold bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-3xs">
                  {learnedGrammarCount}/{grammarCount}
                </span>
                <span className="text-[10px] text-indigo-600">
                  ({Math.round((learnedGrammarCount / grammarCount) * 100)}%)
                </span>
              </div>
            )}

            {kanjiCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">📚 Hán tự:</span>
                <span className="text-gray-800 font-bold bg-white px-2 py-0.5 rounded-lg border border-gray-100 shadow-3xs">
                  {learnedKanjiCount}/{kanjiCount}
                </span>
                <span className="text-[10px] text-purple-600">
                  ({Math.round((learnedKanjiCount / kanjiCount) * 100)}%)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-gray-100 mt-6 gap-6 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab("vocab")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "vocab"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          📝 Từ vựng ({learnedVocabCount}/{vocabCount})
        </button>
        <button
          onClick={() => setActiveTab("grammar")}
          className={`pb-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "grammar"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          📖 Ngữ pháp ({learnedGrammarCount}/{grammarCount})
        </button>
        {kanjiCount > 0 && (
          <button
            onClick={() => setActiveTab("kanji")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "kanji"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            🉐 Kanji ({learnedKanjiCount}/{kanjiCount})
          </button>
        )}
          <button
            onClick={() => setActiveTab("shadowing")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "shadowing"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            🗣️ Shadowing
          </button>
          <button
            onClick={() => setActiveTab("translation")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "translation"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            ✍️ Luyện dịch
          </button>
          <button
            onClick={() => setActiveTab("reading")}
            className={`pb-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === "reading"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            📚 Đọc hiểu
          </button>
        </div>

      {/* Tab Content */}
      {activeTab === "vocab" && (
        <div className="space-y-3">
          {vocabCount === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có từ vựng nào trong bài học này</div>
          ) : (
            lesson.vocabulary.map((v) => (
              <VocabularyListItem
                key={v.id}
                vocab={v}
                progress={getVocabProgress(v.id)}
                onToggleLearned={toggleLearned}
                onToggleFavorite={toggleFavorite}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "grammar" && (
        <div className="space-y-4">
          {grammarCount === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có mục ngữ pháp nào trong bài học này</div>
          ) : (
            lesson.grammarPoints?.map((grammar) => (
              <GrammarCard
                key={grammar.id}
                grammar={grammar}
                progress={getGrammarProgress(grammar.id)}
                onToggleLearned={toggleGrammarLearned}
                onToggleFavorite={toggleGrammarFavorite}
              />
            ))
          )}
        </div>
      )}

      {activeTab === "kanji" && (
        <div className="space-y-4">
          {kanjiCount === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có chữ Hán nào trong bài học này</div>
          ) : (
            lesson.kanjiItems?.map((kanji) => (
              <KanjiStrokeViewer
                key={kanji.id}
                kanji={kanji}
                progress={getKanjiProgress(kanji.id)}
                onToggleLearned={toggleKanjiLearned}
                onToggleFavorite={toggleKanjiFavorite}
              />
            ))
          )}
        </div>
      )}

      {/* Shadowing Tab */}
      {activeTab === "shadowing" && (
        <div className="space-y-4">
          {loadingActivities ? (
            <div className="text-center py-20 text-indigo-600 animate-pulse font-medium">
              🤖 AI đang biên soạn các mẫu câu Shadowing cho bài học...
            </div>
          ) : activitiesError ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl text-center border border-red-100">
              <p className="font-bold">Không thể tải bài tập AI</p>
              <p className="text-xs mt-1">{activitiesError}</p>
            </div>
          ) : !activities?.shadowing || activities.shadowing.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có câu mẫu Shadowing nào.</div>
          ) : (
            <div>
              {/* Playback Controls */}
              <div className="bg-indigo-50/50 rounded-2xl p-4 mb-4 flex items-center justify-between border border-indigo-100 text-xs">
                <span className="font-bold text-indigo-800">Tốc độ phát âm:</span>
                <div className="flex gap-2">
                  {([0.6, 0.8, 1.0, 1.2] as const).map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        playbackRate === rate
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {rate === 1.0 ? "Chuẩn" : `${rate}x`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sentences List */}
              <div className="space-y-4">
                {activities.shadowing.map((item, idx) => (
                  <div key={item.id || idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="text-lg font-extrabold text-gray-900 leading-relaxed">
                          {item.japanese}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {item.hiragana}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono">
                          {item.romaji}
                        </div>
                        <div className="text-xs font-semibold text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100">
                          💡 Nghĩa: {item.meaning}
                        </div>
                      </div>

                      {/* Play & Record Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => playSentence(item.japanese)}
                          className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-lg text-indigo-600 transition-colors"
                          title="Nghe phát âm"
                        >
                          🔊
                        </button>
                        <button
                          onClick={() => handleShadowingSpeech(item.japanese, idx)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                            recognizingIndex === idx
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                          }`}
                          title="Luyện đọc theo câu mẫu"
                        >
                          🎙️
                        </button>
                      </div>
                    </div>

                    {/* Microphone output */}
                    {recognizingIndex === idx && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs bg-red-50/50 rounded-xl p-3 text-red-900 flex items-center justify-between">
                        <div>
                          <span className="font-bold">Đang thu âm:</span> {recognitionTranscript}
                        </div>
                        <button
                          onClick={() => setRecognizingIndex(null)}
                          className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-lg"
                        >
                          Dừng
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Translation Tab */}
      {activeTab === "translation" && (
        <div className="space-y-4">
          {loadingActivities ? (
            <div className="text-center py-20 text-indigo-600 animate-pulse font-medium">
              🤖 AI đang chuẩn bị câu bài tập Luyện dịch cho bài học này...
            </div>
          ) : activitiesError ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl text-center border border-red-100">
              <p className="font-bold">Không thể tải bài tập AI</p>
              <p className="text-xs mt-1">{activitiesError}</p>
            </div>
          ) : !activities?.translation || activities.translation.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có bài tập luyện dịch nào.</div>
          ) : (
            <div className="space-y-4">
              {activities.translation.map((item, idx) => {
                const isShown = showAnswers[item.id || idx];
                return (
                  <div key={item.id || idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                        Câu {idx + 1}
                      </span>
                      <button
                        onClick={() => playSentence(item.japanese)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                      >
                        🔊 Nghe phát âm
                      </button>
                    </div>

                    <div className="text-base font-extrabold text-gray-900 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                      {item.japanese}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Bản dịch của bạn:</label>
                      <textarea
                        rows={2}
                        value={translationInputs[item.id || idx] || ""}
                        onChange={(e) =>
                          setTranslationInputs((prev) => ({ ...prev, [item.id || idx]: e.target.value }))
                        }
                        placeholder="Nhập nghĩa tiếng Việt cho câu này..."
                        className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-indigo-500 shadow-3xs"
                      />
                    </div>

                    {item.hint && (
                      <p className="text-[11px] text-indigo-600 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/50">
                        ℹ️ Gợi ý: {item.hint}
                      </p>
                    )}

                    <div className="pt-2 flex justify-between items-center">
                      <button
                        onClick={() =>
                          setShowAnswers((prev) => ({ ...prev, [item.id || idx]: !prev[item.id || idx] }))
                        }
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-2xs transition-colors"
                      >
                        {isShown ? "Ẩn đáp án" : "Xem đáp án chuẩn"}
                      </button>
                    </div>

                    {isShown && (
                      <div className="mt-3 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-2 text-xs">
                        <div>
                          <span className="font-bold text-emerald-800">Đáp án chuẩn:</span>{" "}
                          <span className="text-gray-900 font-medium">{item.meaning}</span>
                        </div>
                        {item.hiragana && (
                          <div className="text-gray-500 text-[10px] font-mono">
                            Phát âm: {item.hiragana}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reading Tab */}
      {activeTab === "reading" && (
        <div className="space-y-4">
          {loadingActivities ? (
            <div className="text-center py-20 text-indigo-600 animate-pulse font-medium">
              🤖 AI đang soạn thảo 2 đoạn văn đọc hiểu & câu hỏi tương tác...
            </div>
          ) : activitiesError ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-2xl text-center border border-red-100">
              <p className="font-bold">Không thể tải bài tập AI</p>
              <p className="text-xs mt-1">{activitiesError}</p>
            </div>
          ) : !activities?.reading || activities.reading.length === 0 ? (
            <div className="text-center py-12 text-gray-400">Không có bài tập đọc hiểu nào.</div>
          ) : (
            <div className="space-y-6">
              {activities.reading.map((item, idx) => {
                const selectedOptId = selectedOptions[item.id || idx];
                const isAnswered = !!selectedOptId;

                return (
                  <div key={item.id || idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md">
                      Đọc hiểu Bài {idx + 1}
                    </span>

                    {/* Reading passage box */}
                    <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100/50 leading-relaxed text-sm font-semibold text-gray-800 space-y-2">
                      <div className="flex justify-between items-center flex-wrap gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold">Đoạn văn (Passage):</span>
                          <span className="text-[10px] text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full font-bold">
                            💡 Chọn từ bất kỳ để tra Mazii
                          </span>
                        </div>
                        <button
                          onClick={() => playSentence(item.passage)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          🔊 Đọc to
                        </button>
                      </div>
                      <p className="whitespace-pre-line text-gray-900 leading-loose select-text hover:text-indigo-950 transition-colors">
                        {item.passage}
                      </p>
                    </div>

                    {/* Question */}
                    <div className="text-xs font-extrabold text-gray-900">
                      ❓ Câu hỏi: {item.question}
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {item.options.map((opt: any) => {
                        const isThisSelected = selectedOptId === opt.id;
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
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [item.id || idx]: opt.id }))}
                            className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt.text}</span>
                            {isAnswered && opt.isCorrect && <span className="text-emerald-600 font-extrabold text-sm">✓</span>}
                            {isAnswered && isThisSelected && !opt.isCorrect && <span className="text-red-600 font-extrabold text-sm">✕</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Answer Explanation */}
                    {isAnswered && (
                      <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs leading-relaxed space-y-1">
                        <div className="font-extrabold text-indigo-700">💡 Giải thích đáp án:</div>
                        <p className="text-gray-700">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Selection Tooltip for Mazii Lookup */}
      <SelectionLookupTooltip
        onLookup={(word) => {
          setMaziiLookupState({
            isOpen: true,
            queryWord: word,
          });
        }}
      />

      {/* Mazii Quick Lookup Modal */}
      <MaziiQuickLookupModal
        isOpen={maziiLookupState.isOpen}
        queryWord={maziiLookupState.queryWord}
        initialFurigana={maziiLookupState.initialFurigana}
        initialMeaning={maziiLookupState.initialMeaning}
        onClose={() => setMaziiLookupState((prev) => ({ ...prev, isOpen: false }))}
      />
      </div>
    </AuthGuard>
  );
}

