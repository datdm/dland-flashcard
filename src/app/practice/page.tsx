"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
import { searchJapaneseDictionary } from "@/lib/services/dictionaryService";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AddToNotebookModal from "@/components/AddToNotebookModal";
import MaziiQuickLookupModal from "@/components/MaziiQuickLookupModal";
import SelectionLookupTooltip from "@/components/SelectionLookupTooltip";
import AuthGuard from "@/components/AuthGuard";
import { autoSync } from "@/lib/syncService";
import { JLPT_LISTENING_QUESTIONS, JLPTListeningQuestion } from "@/data/jlptListeningPractice";
import {
  getAllExtractedReadingPassages,
  getReadingMondaisForLevel,
  ExtractedReadingPassage,
} from "@/lib/jlptReadingExtractor";

interface ShadowingItem {
  id: string;
  japanese: string;
  japanese_ruby: string;
  romaji: string;
  meaning: string;
}

interface TranslationItem {
  id: string;
  direction: "ja-vi" | "vi-ja";
  source: string;
  source_ruby?: string;
  target: string;
  target_ruby?: string;
  pronunciation?: string;
  hint?: string;
}

interface ReadingOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface ReadingItem {
  passage: string;
  passage_ruby: string;
  passage_translation: string;
  question: string;
  options: ReadingOption[];
  explanation: string;
  vocabulary?: {
    kanji: string;
    hiragana: string;
    meaning: string;
  }[];
}

interface SlideItem {
  slide_number: number;
  title: string;
  title_vietnamese: string;
  bullets: string[];
  bullets_vietnamese: string[];
}

interface PresentationCorrection {
  original: string;
  corrected: string;
  corrected_ruby: string;
  reason: string;
}

interface PresentationExercise {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface PresentationEvaluation {
  comprehensibility_score: number;
  feedback_general: string;
  corrections: PresentationCorrection[];
  exercises: PresentationExercise[];
}

export interface KaiwaTurn {
  speaker: "A" | "B";
  speaker_name: string;
  japanese: string;
  japanese_ruby: string;
  romaji: string;
  meaning: string;
}

export interface KaiwaQuestion {
  id: string;
  question: string;
  question_vietnamese?: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

export interface KaiwaGrammar {
  structure: string;
  meaning: string;
  usage: string;
}

export interface KaiwaData {
  title: string;
  situation: string;
  speakerA: string;
  speakerB: string;
  dialogue: KaiwaTurn[];
  questions: KaiwaQuestion[];
  key_grammar?: KaiwaGrammar[];
}

export interface PracticeHistoryEntry {
  id: string;
  type: "shadowing" | "translation" | "reading" | "presentation" | "ipa" | "kaiwa";
  typeName: string;
  topic: string;
  lang: string;
  score: number; // 0 - 100
  userAnswer?: string;
  correctAnswer?: string;
  feedback?: string;
  completedAt: string;
}

const POPULAR_TOPICS_BY_LANG: Record<string, { id: string; name: string; icon: string }[]> = {
  ja: [
    { id: "daily", name: "Sinh hoạt & Đời sống", icon: "🏡" },
    { id: "business", name: "Kinh doanh & Công sở", icon: "💼" },
    { id: "it", name: "Công nghệ & IT", icon: "💻" },
    { id: "travel", name: "Du lịch & Ẩm thực", icon: "🍣" },
    { id: "news", name: "Tin tức & Xã hội", icon: "📰" },
  ],
  en: [
    { id: "daily", name: "Daily Life & Habits", icon: "☕" },
    { id: "work", name: "Career & Business", icon: "💼" },
    { id: "tech", name: "Technology & AI", icon: "💻" },
    { id: "travel", name: "Travel, Culture & Food", icon: "✈️" },
    { id: "society", name: "Society & Environment", icon: "🌍" },
  ],
  de: [
    { id: "daily", name: "Alltag & Wohnen", icon: "🏡" },
    { id: "work", name: "Beruf & Büro", icon: "💼" },
    { id: "tech", name: "Technik & Medien", icon: "💻" },
    { id: "travel", name: "Reisen & Essen", icon: "🥨" },
    { id: "society", name: "Gesellschaft & Umwelt", icon: "📰" },
  ],
};

const SKILLS_BY_LANG: Record<string, { id: "kaiwa" | "shadowing" | "translation" | "reading" | "listening" | "presentation"; name: string; desc: string }[]> = {
  ja: [
    { id: "kaiwa", name: "💬 Hội thoại Kaiwa", desc: "10 câu đối thoại 2 người & Trắc nghiệm đọc hiểu" },
    { id: "shadowing", name: "🗣️ Shadowing JP", desc: "Luyện nghe nói đuổi tiếng Nhật kèm Furigana" },
    { id: "translation", name: "✍️ Luyện dịch 2 chiều", desc: "Xen kẽ dịch Nhật ➔ Việt & Việt ➔ Nhật" },
    { id: "reading", name: "📚 Đọc hiểu JLPT", desc: "Đoạn văn đề thi JLPT chia theo từng Mondai 10 - 14 & tra Mazii" },
    { id: "listening", name: "🎧 Nghe hiểu JLPT", desc: "Luyện nghe chuẩn đề thi JLPT chia theo từng Mondai 1 - 5" },
    { id: "presentation", name: "🎤 Luyện thuyết trình", desc: "Thuyết trình slide tiếng Nhật, AI sửa lỗi & chấm điểm" },
  ],
  en: [
    { id: "kaiwa", name: "💬 Hội thoại Kaiwa IELTS", desc: "10 câu đối thoại 2 người & Câu hỏi thảo luận" },
    { id: "shadowing", name: "🗣️ Shadowing IELTS Speaking", desc: "Luyện nghe nói đuổi tiếng Anh chuẩn native accent" },
    { id: "translation", name: "✍️ Luyện dịch 2 chiều Anh - Việt", desc: "Xen kẽ dịch câu Academic & đời sống" },
    { id: "reading", name: "📚 Đọc hiểu IELTS Reading", desc: "Đoạn văn học thuật, trắc nghiệm & từ vựng" },
    { id: "presentation", name: "🎤 Thuyết trình IELTS Part 2", desc: "Nói qua micro, AI sửa câu & chấm điểm Fluency" },
  ],
  de: [
    { id: "kaiwa", name: "💬 Hội thoại Kaiwa Deutsch", desc: "10 câu đối thoại 2 người & Đọc hiểu" },
    { id: "shadowing", name: "🗣️ Shadowing Deutsch", desc: "Luyện nghe nói đuổi tiếng Đức chuẩn Goethe" },
    { id: "translation", name: "✍️ Luyện dịch 2 chiều Đức - Việt", desc: "Xen kẽ dịch Đức ➔ Việt & Việt ➔ Đức" },
    { id: "reading", name: "📚 Đọc hiểu Leseverstehen", desc: "Đọc hiểu tiếng Đức Goethe A1/A2" },
    { id: "presentation", name: "🎤 Luyện thuyết trình / Sprechen", desc: "Nói qua micro, AI sửa câu & chấm điểm" },
  ],
};

const LEVELS_BY_LANG: Record<string, string[]> = {
  ja: ["N5", "N4", "N3", "N2", "N1"],
  en: ["Band 5.0", "Band 6.0", "Band 7.0", "Band 8.0"],
  de: ["A1", "A2", "B1", "B2"],
};

export default function PracticeHubPage() {
  const { notebooks, addVocab, checkDuplicate } = useNotebooks();
  const recognitionRef = useRef<any>(null);
  const { activeLanguage } = useLanguageSetting();

  // Language state for Practice Center
  const selectedLang = activeLanguage.code || "ja";

  // Config states
  const [selectedLevel, setSelectedLevel] = useState<string>(() => {
    const lang = activeLanguage.code || "ja";
    return lang === "de" ? "A2" : lang === "en" ? "Band 7.0" : "N2";
  });
  const [selectedType, setSelectedType] = useState<"kaiwa" | "shadowing" | "translation" | "reading" | "listening" | "presentation">("kaiwa");
  const [selectedTopic, setSelectedTopic] = useState(() => {
    const defaultTopics = POPULAR_TOPICS_BY_LANG[activeLanguage.code || "ja"] || POPULAR_TOPICS_BY_LANG.ja;
    return defaultTopics[0]?.name || "Sinh hoạt & Đời sống";
  });
  const [customTopic, setCustomTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync and reset data when global language changes
  useEffect(() => {
    setSelectedType("kaiwa");
    setSelectedLevel(activeLanguage.code === "de" ? "A2" : activeLanguage.code === "en" ? "Band 7.0" : "N2");
    setKaiwaData(null);
    setShadowingData([]);
    setTranslationData([]);
    setReadingData(null);
    setSlides([]);
    const defaultTopics = POPULAR_TOPICS_BY_LANG[activeLanguage.code] || POPULAR_TOPICS_BY_LANG.ja;
    setSelectedTopic(defaultTopics[0]?.name || "Sinh hoạt & Đời sống");
    setCustomTopic("");
  }, [activeLanguage.code]);

  // Kaiwa Data & Interaction States
  const [kaiwaData, setKaiwaData] = useState<KaiwaData | null>(null);
  const [kaiwaRole, setKaiwaRole] = useState<"all" | "A" | "B">("all");
  const [showKaiwaRuby, setShowKaiwaRuby] = useState(true);
  const [showKaiwaMeaning, setShowKaiwaMeaning] = useState(true);
  const [showKaiwaRomaji, setShowKaiwaRomaji] = useState(false);
  const [kaiwaPlayingIdx, setKaiwaPlayingIdx] = useState<number | null>(null);
  const [kaiwaMicIdx, setKaiwaMicIdx] = useState<number | null>(null);
  const [kaiwaScores, setKaiwaScores] = useState<Record<number, { score: number; transcript: string }>>({});
  const [kaiwaQuizAnswers, setKaiwaQuizAnswers] = useState<Record<string, { optionId: string; score: number; checked: boolean }>>({});
  const [isAutoplayingKaiwa, setIsAutoplayingKaiwa] = useState(false);
  const isAutoplayingKaiwaRef = useRef(false);

  const stopAllAudio = () => {
    isAutoplayingKaiwaRef.current = false;
    setIsAutoplayingKaiwa(false);
    setKaiwaPlayingIdx(null);
    setListeningPlayingId(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  useEffect(() => {
    stopAllAudio();
  }, [selectedType, activeLanguage.code]);

  // Data states
  const [shadowingData, setShadowingData] = useState<ShadowingItem[]>([]);
  const [translationData, setTranslationData] = useState<TranslationItem[]>([]);
  const [readingData, setReadingData] = useState<ReadingItem | null>(null);
  
  // Presentation States
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [presentationTranscripts, setPresentationTranscripts] = useState<Record<number, string>>({ 0: "", 1: "" });
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<PresentationEvaluation | null>(null);
  const [isSecondCheck, setIsSecondCheck] = useState(false);
  const [previousEvaluation, setPreviousEvaluation] = useState<PresentationEvaluation | null>(null);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<number, string>>({});
  const [exerciseChecked, setExerciseChecked] = useState(false);
  const [activeSlideTab, setActiveSlideTab] = useState<number>(0);

  // Interaction states
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [recognizingIndex, setRecognizingIndex] = useState<number | null>(null);
  const [recognitionTranscript, setRecognitionTranscript] = useState<string>("");
  const [showAnswerIdx, setShowAnswerIdx] = useState<Record<number, boolean>>({});
  const [translationInputs, setTranslationInputs] = useState<Record<number, string>>({});
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showPassageTranslation, setShowPassageTranslation] = useState(false);

  // Practice History & Scoring States
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryEntry[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [translationScores, setTranslationScores] = useState<Record<number, { score: number; checked: boolean }>>({});
  const [shadowingScores, setShadowingScores] = useState<Record<number, { score: number; transcript: string }>>({});
  const [readingScore, setReadingScore] = useState<{ score: number; optionId: string } | null>(null);

  // JLPT Reading & Listening by Mondai states (Japanese only)
  const [selectedReadingMondai, setSelectedReadingMondai] = useState<number | "all">("all");
  const [selectedListeningMondai, setSelectedListeningMondai] = useState<number | "all">("all");
  const [examReadingAnswers, setExamReadingAnswers] = useState<Record<number, number>>({});
  const [examReadingChecked, setExamReadingChecked] = useState<Record<number, boolean>>({});

  const [listeningAnswers, setListeningAnswers] = useState<Record<string, number>>({});
  const [listeningChecked, setListeningChecked] = useState<Record<string, boolean>>({});
  const [showListeningScript, setShowListeningScript] = useState<Record<string, boolean>>({});
  const [listeningPlayingId, setListeningPlayingId] = useState<string | null>(null);

  // Memos for Reading passages & Mondais
  const allReadingPassages = useMemo(() => {
    if (selectedLang !== "ja") return [];
    return getAllExtractedReadingPassages().filter(
      (p) => p.level.toUpperCase() === selectedLevel.toUpperCase()
    );
  }, [selectedLang, selectedLevel]);

  const readingMondais = useMemo(() => {
    if (selectedLang !== "ja") return [];
    return getReadingMondaisForLevel(selectedLevel);
  }, [selectedLang, selectedLevel]);

  const filteredReadingPassages = useMemo(() => {
    if (selectedReadingMondai === "all") return allReadingPassages;
    return allReadingPassages.filter((p) => p.mondaiNumber === selectedReadingMondai);
  }, [allReadingPassages, selectedReadingMondai]);

  // Memos for Listening questions & Mondais
  const allListeningQuestions = useMemo(() => {
    if (selectedLang !== "ja") return [];
    return JLPT_LISTENING_QUESTIONS.filter(
      (q) => q.level.toUpperCase() === selectedLevel.toUpperCase()
    );
  }, [selectedLang, selectedLevel]);

  const listeningMondais = useMemo(() => {
    if (selectedLang !== "ja") return [];
    const map = new Map<number, { name: string; subtitle: string; count: number }>();
    allListeningQuestions.forEach((q) => {
      const existing = map.get(q.mondaiNumber) || { name: q.mondaiName, subtitle: q.mondaiSubtitle, count: 0 };
      existing.count += 1;
      map.set(q.mondaiNumber, existing);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([num, val]) => ({
        mondaiNumber: num,
        mondaiName: val.name,
        mondaiSubtitle: val.subtitle,
        count: val.count,
      }));
  }, [allListeningQuestions, selectedLang]);

  const filteredListeningQuestions = useMemo(() => {
    if (selectedListeningMondai === "all") return allListeningQuestions;
    return allListeningQuestions.filter((q) => q.mondaiNumber === selectedListeningMondai);
  }, [allListeningQuestions, selectedListeningMondai]);

  // Play audio for JLPT Listening
  const playListeningAudio = (item: JLPTListeningQuestion) => {
    if (typeof window === "undefined") return;
    if (listeningPlayingId === item.id) {
      window.speechSynthesis.cancel();
      setListeningPlayingId(null);
      return;
    }

    stopAllAudio();
    setListeningPlayingId(item.id);

    const textToSpeak = `${item.situation}。
${item.audioScript}。
質問：${item.question}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "ja-JP";
    utterance.rate = playbackRate;
    utterance.onend = () => {
      setListeningPlayingId(null);
    };
    utterance.onerror = () => {
      setListeningPlayingId(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Check JLPT Reading Exam question answer
  const checkExamReadingAnswer = (qId: number, correctAnswers: number[], questionText: string, explanation?: string) => {
    const selectedIdx = examReadingAnswers[qId];
    if (selectedIdx === undefined) return;

    setExamReadingChecked((prev) => ({ ...prev, [qId]: true }));
    const isCorrect = correctAnswers.includes(selectedIdx);
    const score = isCorrect ? 100 : 0;

    recordPracticeHistory({
      type: "reading",
      typeName: `📚 Đọc hiểu JLPT ${selectedLevel}`,
      topic: `Câu hỏi ${qId}`,
      lang: "ja",
      score,
      userAnswer: `Lựa chọn ${selectedIdx + 1}`,
      correctAnswer: `Đáp án ${correctAnswers.map((a) => a + 1).join(", ")}`,
      feedback: isCorrect ? "Chính xác!" : (explanation || "Chưa chính xác. Hãy đọc kỹ lại đoạn văn."),
    });
  };

  // Check JLPT Listening question answer
  const checkListeningAnswer = (item: JLPTListeningQuestion) => {
    const selectedIdx = listeningAnswers[item.id];
    if (selectedIdx === undefined) return;

    setListeningChecked((prev) => ({ ...prev, [item.id]: true }));
    const isCorrect = selectedIdx === item.correctAnswer;
    const score = isCorrect ? 100 : 0;

    recordPracticeHistory({
      type: "shadowing",
      typeName: `🎧 Nghe hiểu JLPT ${item.level} (${item.mondaiName})`,
      topic: item.title,
      lang: "ja",
      score,
      userAnswer: item.options[selectedIdx] || `Lựa chọn ${selectedIdx + 1}`,
      correctAnswer: item.options[item.correctAnswer] || `Lựa chọn ${item.correctAnswer + 1}`,
      feedback: isCorrect ? "Chính xác! Bạn nghe bắt thông tin rất tốt." : (item.explanation || "Chưa chính xác. Hãy xem kịch bản (Script) để nghe lại."),
    });
  };

  const currentLangHistoryCount = useMemo(() => {
    return practiceHistory.filter((i) => (i.lang || "ja") === selectedLang).length;
  }, [practiceHistory, selectedLang]);

  const modalFilteredHistory = useMemo(() => {
    return practiceHistory.filter((i) => (i.lang || "ja") === selectedLang);
  }, [practiceHistory, selectedLang]);

  // Load history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("flashcash-practice-history");
      if (stored) {
        try {
          setPracticeHistory(JSON.parse(stored));
        } catch {}
      }
    }
  }, []);

  // Helper to record practice session to history
  const recordPracticeHistory = (entry: Omit<PracticeHistoryEntry, "id" | "completedAt">) => {
    const newEntry: PracticeHistoryEntry = {
      ...entry,
      id: `prac-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      completedAt: new Date().toISOString(),
    };
    setPracticeHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 100);
      if (typeof window !== "undefined") {
        localStorage.setItem("flashcash-practice-history", JSON.stringify(updated));
        window.dispatchEvent(new Event("practice-history-updated"));
        autoSync();
      }
      return updated;
    });
  };

  // Helper to calculate similarity score
  const calculateScore = (userText: string, targetText: string): number => {
    if (!userText || !targetText) return 0;
    const s1 = userText.toLowerCase().replace(/[\s.,!?;:()~ー\-「」『』、。]/g, "");
    const s2 = targetText.toLowerCase().replace(/[\s.,!?;:()~ー\-「」『』、。]/g, "");
    if (s1 === s2) return 100;
    if (!s1.length || !s2.length) return 0;

    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
    for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    const distance = matrix[s1.length][s2.length];
    const maxLen = Math.max(s1.length, s2.length);
    return Math.max(0, Math.round(((maxLen - distance) / maxLen) * 100));
  };

  // Notebook modal states
  const [selectedWordForNotebook, setSelectedWordForNotebook] = useState<any | null>(null);
  const [targetNotebookId, setTargetNotebookId] = useState<string>("");
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [modalKanji, setModalKanji] = useState("");
  const [modalHiragana, setModalHiragana] = useState("");
  const [modalMeaning, setModalMeaning] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (selectedWordForNotebook) {
      setModalKanji(selectedWordForNotebook.kanji || "");
      setModalHiragana(selectedWordForNotebook.hiragana || "");
      setModalMeaning(selectedWordForNotebook.meaning || "");
      
      const triggerSearch = async () => {
        setSearchLoading(true);
        setSearchResults([]);
        try {
          const query = selectedWordForNotebook.kanji || selectedWordForNotebook.hiragana;
          if (query) {
            const dictResults = await searchJapaneseDictionary(query);
            setSearchResults(dictResults);
            // If we have search results and meaning is empty, auto-populate with the first result
            if (dictResults.length > 0 && !selectedWordForNotebook.meaning) {
              setModalMeaning(dictResults[0].meaning);
              if (dictResults[0].kanji) {
                setModalKanji(dictResults[0].kanji);
              }
              if (dictResults[0].hiragana) {
                setModalHiragana(dictResults[0].hiragana);
              }
            }
          }
        } catch (err) {
          console.error("Error searching dictionary in modal:", err);
        } finally {
          setSearchLoading(false);
        }
      };
      triggerSearch();
    } else {
      setModalKanji("");
      setModalHiragana("");
      setModalMeaning("");
      setSearchResults([]);
      setSearchLoading(false);
    }
  }, [selectedWordForNotebook]);

  const activeTopic = customTopic.trim() || selectedTopic;

  const handleGenerate = async () => {
    stopAllAudio();
    setGenerating(true);
    setError(null);
    setSelectedOptionId(null);
    setShowAnswerIdx({});
    setTranslationInputs({});
    setShowPassageTranslation(false);

    // Reset Kaiwa states
    setKaiwaData(null);
    setKaiwaQuizAnswers({});
    setKaiwaScores({});
    setKaiwaPlayingIdx(null);
    setKaiwaMicIdx(null);
    setIsAutoplayingKaiwa(false);

    // Reset presentation states
    setSlides([]);
    setPresentationTranscripts({ 0: "", 1: "" });
    setEvaluation(null);
    setIsSecondCheck(false);
    setPreviousEvaluation(null);
    setExerciseAnswers({});
    setExerciseChecked(false);
    setActiveSlideTab(0);

    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType === "presentation" ? "presentation_slides" : selectedType,
          topic: activeTopic,
          level: selectedLevel,
          lang: selectedLang,
          seed: Math.floor(Math.random() * 1000000),
          nonce: Date.now(),
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối với máy chủ AI. Vui lòng thử lại!");
      }

      const resData = await res.json();
      if (resData.success && resData.data) {
        if (selectedType === "kaiwa") {
          setKaiwaData(resData.data.kaiwa || null);
        } else if (selectedType === "shadowing") {
          setShadowingData(resData.data.shadowing || []);
        } else if (selectedType === "translation") {
          setTranslationData(resData.data.translation || []);
        } else if (selectedType === "reading") {
          setReadingData(resData.data.reading || null);
        } else if (selectedType === "presentation") {
          setSlides(resData.data.slides || []);
        }
      } else {
        throw new Error(resData.error || "Không thể tạo bài tập. Thử lại sau!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi tạo bài học.");
    } finally {
      setGenerating(false);
    }
  };

  // Autoplay all turns of Kaiwa
  const playEntireKaiwa = async () => {
    if (!kaiwaData || !kaiwaData.dialogue?.length || typeof window === "undefined") return;

    if (isAutoplayingKaiwaRef.current) {
      stopAllAudio();
      return;
    }

    stopAllAudio();
    isAutoplayingKaiwaRef.current = true;
    setIsAutoplayingKaiwa(true);

    for (let i = 0; i < kaiwaData.dialogue.length; i++) {
      if (!isAutoplayingKaiwaRef.current) break;

      const turn = kaiwaData.dialogue[i];
      setKaiwaPlayingIdx(i);

      await new Promise<void>((resolve) => {
        if (!isAutoplayingKaiwaRef.current) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(turn.japanese);
        utterance.lang = selectedLang === "de" ? "de-DE" : selectedLang === "en" ? "en-US" : "ja-JP";
        utterance.rate = playbackRate;
        utterance.pitch = turn.speaker === "A" ? 1.0 : 1.15;

        let resolved = false;
        const done = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        utterance.onend = () => {
          if (!isAutoplayingKaiwaRef.current) {
            done();
            return;
          }
          setTimeout(done, 600);
        };

        utterance.onerror = () => {
          done();
        };

        window.speechSynthesis.speak(utterance);
      });

      if (!isAutoplayingKaiwaRef.current) break;
    }

    if (isAutoplayingKaiwaRef.current) {
      setKaiwaPlayingIdx(null);
      setIsAutoplayingKaiwa(false);
      isAutoplayingKaiwaRef.current = false;
    }
  };

  // Speech recognition for Kaiwa
  const startKaiwaMic = (targetText: string, index: number) => {
    if (typeof window === "undefined") return;
    stopAllAudio();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ micro nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.");
      return;
    }

    if (kaiwaMicIdx === index) {
      recognitionRef.current?.stop();
      setKaiwaMicIdx(null);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang === "de" ? "de-DE" : selectedLang === "en" ? "en-US" : "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setKaiwaMicIdx(index);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const score = calculateScore(transcript, targetText);
      setKaiwaScores((prev) => ({
        ...prev,
        [index]: { score, transcript },
      }));
      recordPracticeHistory({
        type: "kaiwa",
        typeName: "💬 Hội thoại Kaiwa",
        topic: activeTopic,
        lang: selectedLang,
        score: score,
        userAnswer: transcript,
        correctAnswer: targetText,
        feedback: score >= 80 ? "Phát âm rất tốt và tự nhiên!" : "Cần phát âm rõ ràng và chuẩn ngữ điệu hơn.",
      });
    };

    recognition.onerror = () => {
      setKaiwaMicIdx(null);
    };

    recognition.onend = () => {
      setKaiwaMicIdx(null);
    };

    recognition.start();
  };

  // Check Kaiwa comprehension quiz answer
  const checkKaiwaQuizAnswer = (qId: string) => {
    const answer = kaiwaQuizAnswers[qId];
    if (!answer || !answer.optionId || !kaiwaData) return;
    const question = kaiwaData.questions.find((q) => q.id === qId);
    if (!question) return;
    const selectedOpt = question.options.find((o) => o.id === answer.optionId);
    const isCorrect = !!selectedOpt?.isCorrect;
    const score = isCorrect ? 100 : 0;

    setKaiwaQuizAnswers((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], score, checked: true },
    }));

    recordPracticeHistory({
      type: "kaiwa",
      typeName: "💬 Trắc nghiệm Kaiwa",
      topic: activeTopic,
      lang: selectedLang,
      score: score,
      userAnswer: selectedOpt?.text || "",
      correctAnswer: question.options.find((o) => o.isCorrect)?.text || "",
      feedback: isCorrect ? "Trả lời chính xác!" : "Chưa chính xác. Hãy đọc kỹ lại lời thoại của các nhân vật.",
    });
  };

  // Play audio TTS
  const playSentence = (text: string) => {
    if (typeof window === "undefined") return;
    stopAllAudio();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLang === "de" ? "de-DE" : selectedLang === "en" ? "en-US" : "ja-JP";
    utterance.rate = playbackRate;
    window.speechSynthesis.speak(utterance);
  };

  // Speech recognition for shadowing
  const startShadowingMic = (targetText: string, index: number) => {
    if (typeof window === "undefined") return;
    stopAllAudio();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ micro nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.");
      return;
    }

    const wasSame = recognizingIndex === index;
    if (recognizingIndex !== null) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setRecognizingIndex(null);
      if (wasSame) return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang === "de" ? "de-DE" : selectedLang === "en" ? "en-US" : "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;

    setRecognizingIndex(index);
    setRecognitionTranscript("Đang lắng nghe...");

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setRecognitionTranscript((prev) => {
          const currentText = prev === "Đang lắng nghe..." || prev === "Không nhận diện được. Thử lại!" ? "" : prev;
          const fullText = currentText ? `${currentText} ${finalTranscript}` : finalTranscript;
          
          const score = calculateScore(fullText, targetText);
          setShadowingScores((sc) => ({
            ...sc,
            [index]: { score, transcript: fullText }
          }));

          return fullText;
        });
      }
    };

    recognition.onerror = () => {
      setRecognitionTranscript("Không nhận diện được. Thử lại!");
      setRecognizingIndex(null);
    };

    recognition.onend = () => {
      setRecognizingIndex((currIdx) => {
        if (currIdx !== null) {
          setShadowingScores((sc) => {
            const current = sc[currIdx];
            if (current && current.transcript && current.transcript !== "Đang lắng nghe...") {
              recordPracticeHistory({
                type: "shadowing",
                typeName: selectedLang === "en" ? "🗣️ Shadowing IELTS" : selectedLang === "de" ? "🗣️ Shadowing Deutsch" : "🗣️ Shadowing JP",
                topic: activeTopic,
                lang: selectedLang,
                score: current.score,
                userAnswer: current.transcript,
                correctAnswer: targetText,
                feedback: current.score >= 80 ? "Phát âm rất chuẩn xác và tự nhiên!" : "Cần phát âm rõ ràng và đúng thanh điệu hơn.",
              });
            }
            return sc;
          });
        }
        return null;
      });
    };

    recognition.start();
  };

  // Speech recognition for Presentation Slides
  const startPresentationMic = (slideIdx: number) => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ micro nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge.");
      return;
    }

    const wasSame = recognizingIndex === slideIdx;
    if (recognizingIndex !== null) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setRecognizingIndex(null);
      if (wasSame) return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang === "de" ? "de-DE" : selectedLang === "en" ? "en-US" : "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;

    setRecognizingIndex(slideIdx);
    
    // Set a placeholder while listening
    setPresentationTranscripts((prev) => ({
      ...prev,
      [slideIdx]: (prev[slideIdx] || "") ? prev[slideIdx] : "Đang ghi âm giọng nói..."
    }));

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setPresentationTranscripts((prev) => {
          const currentText = prev[slideIdx] === "Đang ghi âm giọng nói..." ? "" : prev[slideIdx];
          const newText = currentText ? `${currentText} ${finalTranscript}` : finalTranscript;
          return {
            ...prev,
            [slideIdx]: newText
          };
        });
      }
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      if (presentationTranscripts[slideIdx] === "Đang ghi âm giọng nói...") {
        setPresentationTranscripts((prev) => ({
          ...prev,
          [slideIdx]: ""
        }));
      }
      setRecognizingIndex(null);
    };

    recognition.onend = () => {
      setRecognizingIndex(null);
    };

    recognition.start();
  };

  // Grade translation input against target answer
  const handleGradeTranslation = (idx: number, item: TranslationItem) => {
    const userTranslation = translationInputs[idx] || "";
    const score = calculateScore(userTranslation, item.target);
    setTranslationScores((prev) => ({
      ...prev,
      [idx]: { score, checked: true },
    }));
    setShowAnswerIdx((prev) => ({ ...prev, [idx]: true }));

    const directionLabel = selectedLang === "en"
      ? (item.direction === "ja-vi" ? "Anh ➔ Việt" : "Việt ➔ Anh")
      : selectedLang === "de"
      ? (item.direction === "ja-vi" ? "Đức ➔ Việt" : "Việt ➔ Đức")
      : (item.direction === "ja-vi" ? "Nhật ➔ Việt" : "Việt ➔ Nhật");

    recordPracticeHistory({
      type: "translation",
      typeName: `✍️ Dịch 2 chiều (${directionLabel})`,
      topic: activeTopic,
      lang: selectedLang,
      score: score,
      userAnswer: userTranslation || "(Chưa nhập câu dịch)",
      correctAnswer: item.target,
      feedback: score >= 80 ? "Bản dịch rất chuẩn xác và tự nhiên!" : score >= 50 ? "Bản dịch tương đối sát nghĩa, lưu ý thêm ngữ pháp." : "Cần đối chiếu với câu mẫu để học thêm từ vựng.",
    });
  };

  // Grade and record reading choice
  const handleSelectReadingOption = (opt: ReadingOption) => {
    setSelectedOptionId(opt.id);
    const score = opt.isCorrect ? 100 : 0;
    setReadingScore({ score, optionId: opt.id });

    const readingTypeName = selectedLang === "en"
      ? "📚 Đọc hiểu IELTS Reading"
      : selectedLang === "de"
      ? "📚 Đọc hiểu Leseverstehen"
      : `📚 Đọc hiểu JLPT ${selectedLevel}`;

    if (readingData) {
      recordPracticeHistory({
        type: "reading",
        typeName: readingTypeName,
        topic: activeTopic,
        lang: selectedLang,
        score: score,
        userAnswer: opt.text,
        correctAnswer: readingData.options.find((o) => o.isCorrect)?.text || opt.text,
        feedback: readingData.explanation || (opt.isCorrect ? "Trả lời chính xác!" : "Đáp án chưa chính xác, hãy xem lại phần giải thích."),
      });
    }
  };

  // Submit presentation to AI for evaluation
  const handleEvaluatePresentation = async () => {
    setIsEvaluating(true);
    setError(null);
    setExerciseAnswers({});
    setExerciseChecked(false);

    try {
      const res = await fetch("/api/practice/presentation/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: activeTopic,
          slides: slides,
          speechTranscripts: [presentationTranscripts[0] || "", presentationTranscripts[1] || ""],
          isSecondCheck: isSecondCheck,
          previousEvaluation: previousEvaluation,
          lang: selectedLang,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối với máy chủ AI. Vui lòng thử lại!");
      }

      const resData = await res.json();
      if (resData.success && resData.data) {
        setEvaluation(resData.data);
        if (!isSecondCheck) {
          setPreviousEvaluation(resData.data);
        }

        // Record presentation to practice history
        const score = resData.data.comprehensibility_score || 80;
        const presTypeName = selectedLang === "en"
          ? "🎤 Thuyết trình IELTS Speaking"
          : selectedLang === "de"
          ? "🎤 Thuyết trình / Sprechen"
          : "🎤 Luyện thuyết trình JP";

        recordPracticeHistory({
          type: "presentation",
          typeName: presTypeName,
          topic: activeTopic,
          lang: selectedLang,
          score: score,
          userAnswer: [presentationTranscripts[0], presentationTranscripts[1]].filter(Boolean).join(" | "),
          correctAnswer: "Slide bài thuyết trình",
          feedback: resData.data.feedback_general || "Đã hoàn thành bài thuyết trình với AI nhận xét chi tiết.",
        });
      } else {
        throw new Error(resData.error || "Không thể nhận xét bài thuyết trình. Thử lại sau!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi gửi bài thuyết trình cho AI chấm điểm.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRetakePresentation = () => {
    setPresentationTranscripts({ 0: "", 1: "" });
    setEvaluation(null);
    setIsSecondCheck(true);
    setExerciseAnswers({});
    setExerciseChecked(false);
    setActiveSlideTab(0);
  };

  const handleAddToNotebook = async () => {
    if (!selectedWordForNotebook || !targetNotebookId) return;

    const kanjiVal = modalKanji.trim();
    const hiraganaVal = modalHiragana.trim();
    const meaningVal = modalMeaning.trim();

    if (!kanjiVal && !hiraganaVal) {
      setDuplicateError("Vui lòng nhập chữ Hán (Kanji) hoặc cách đọc (Hiragana)");
      return;
    }

    if (!meaningVal) {
      setDuplicateError("Vui lòng nhập ý nghĩa của từ");
      return;
    }

    // Check duplicate
    const duplicates = checkDuplicate(targetNotebookId, kanjiVal || undefined, hiraganaVal || undefined);
    if (duplicates && duplicates.length > 0) {
      setDuplicateError("Từ này đã có trong sổ tay");
      return;
    }

    const vocab = await addVocab(targetNotebookId, {
      kanji: kanjiVal,
      hiragana: hiraganaVal,
      meaning: meaningVal,
      onyomi: "",
      phonetic: ""
    });

    if (vocab) {
      setSelectedWordForNotebook(null);
      setTargetNotebookId("");
      setDuplicateError(null);
      setSaveSuccessMsg(`Đã thêm thành công "${kanjiVal || hiraganaVal}" vào sổ tay!`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
      }, 2000);
    }
  };

  const handleRecordIpaHistory = (entry: {
    type: "shadowing" | "translation" | "reading" | "presentation" | "ipa";
    typeName: string;
    topic: string;
    lang: string;
    score: number;
    userAnswer?: string;
    correctAnswer?: string;
    feedback?: string;
  }) => {
    const newEntry: PracticeHistoryEntry = {
      id: "ipa-" + Date.now(),
      type: entry.type as any,
      typeName: entry.typeName,
      topic: entry.topic,
      lang: entry.lang || "en",
      score: entry.score,
      userAnswer: entry.userAnswer,
      correctAnswer: entry.correctAnswer,
      feedback: entry.feedback,
      completedAt: new Date().toISOString(),
    };

    setPracticeHistory((prev) => {
      const updated = [newEntry, ...prev].slice(0, 100);
      try {
        localStorage.setItem("flashcash-practice-history", JSON.stringify(updated));
        window.dispatchEvent(new Event("practice-history-updated"));
      } catch {}
      return updated;
    });
  };

  const [maziiLookupState, setMaziiLookupState] = useState<{
    isOpen: boolean;
    queryWord: string;
    initialFurigana?: string;
    initialMeaning?: string;
  }>({
    isOpen: false,
    queryWord: "",
  });

  const handlePassageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const rubyElement = target.closest("ruby");
    
    let kanji = "";
    let hiragana = "";

    if (rubyElement) {
      // Clone ruby element to strip <rt> tags and get the clean kanji text
      const clone = rubyElement.cloneNode(true) as HTMLElement;
      const rts = clone.querySelectorAll("rt");
      rts.forEach((rt) => rt.remove());
      kanji = clone.textContent?.trim() || "";

      // Get the hiragana/furigana text from <rt> tag
      const rtElement = rubyElement.querySelector("rt");
      hiragana = rtElement?.textContent?.trim() || "";
    } else {
      // If user selected text with mouse cursor
      const selection = window.getSelection()?.toString().trim();
      if (selection && selection.length <= 25) {
        kanji = selection;
      }
    }

    if (!kanji && !hiragana) return;

    // Search in readingData.vocabulary for a matching item
    let meaning = "";
    if (readingData && readingData.vocabulary) {
      const match = readingData.vocabulary.find(
        (v: any) =>
          (kanji && v.kanji === kanji) ||
          (hiragana && v.hiragana === hiragana)
      );
      if (match) {
        meaning = match.meaning || "";
      }
    }

    // Open the Mazii quick lookup modal!
    setMaziiLookupState({
      isOpen: true,
      queryWord: kanji || hiragana,
      initialFurigana: hiragana,
      initialMeaning: meaning,
    });
  };

  return (
    <AuthGuard featureName="Trung Tâm Luyện Tập & Kỹ Năng">
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      {/* Header Banner */}
      <div className={`rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl mb-6 transition-all duration-300 bg-gradient-to-r ${
        selectedLang === "en"
          ? "from-indigo-900 via-purple-900 to-blue-900"
          : selectedLang === "de"
          ? "from-amber-950 via-red-950 to-stone-900"
          : "from-teal-800 via-indigo-900 to-purple-800"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
              {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
              {selectedLang === "en" 
                ? "Trung Tâm Luyện Kỹ Năng Tiếng Anh (IELTS)" 
                : selectedLang === "de" 
                ? "Trung Tâm Luyện Kỹ Năng Tiếng Đức (Goethe)" 
                : "Trung Tâm Luyện Kỹ Năng Tiếng Nhật (JLPT)"}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 mt-2 leading-relaxed max-w-3xl">
              {selectedLang === "en"
                ? "Luyện Shadowing IELTS Speaking chuẩn Oxford/Cambridge, rèn phản xạ dịch 2 chiều Anh-Việt, đọc hiểu IELTS Reading và thuyết trình Speaking Part 2 với AI chấm điểm trực tiếp."
                : selectedLang === "de"
                ? "Luyện Shadowing phát âm tiếng Đức chuẩn Goethe, rèn phản xạ dịch 2 chiều Đức-Việt, đọc hiểu Leseverstehen và thuyết trình Sprechen theo chủ đề với AI chấm điểm."
                : "Luyện Shadowing phát âm chuẩn Furigana, dịch thuật 2 chiều phản xạ nhanh, đọc hiểu JLPT và thuyết trình slide với AI tự động chấm điểm và lưu lịch sử học tập chi tiết."}
            </p>
          </div>
          <button
            onClick={() => {
              setShowHistoryModal(true);
            }}
            className="px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <span>📊</span>
            <span>Lịch Sử Chấm Điểm ({currentLangHistoryCount})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>🛠️</span> Cấu hình bài luyện tập
            </h2>

            {/* Step 1: Select Level FIRST */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                1. Chọn Trình độ / Cấp độ ({selectedLang.toUpperCase()}):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(LEVELS_BY_LANG[selectedLang] || LEVELS_BY_LANG.ja).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      selectedLevel === lvl
                        ? selectedLang === "en"
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                          : selectedLang === "de"
                          ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                          : "bg-teal-600 border-teal-600 text-white shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Select Skill */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                2. Chọn Kỹ năng học ({selectedLevel}):
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(SKILLS_BY_LANG[selectedLang] || SKILLS_BY_LANG.ja).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      selectedType === item.id
                        ? selectedLang === "en" 
                          ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-300"
                          : selectedLang === "de"
                          ? "border-amber-600 bg-amber-50/50 ring-2 ring-amber-300"
                          : "border-teal-600 bg-teal-50/50 ring-2 ring-teal-300"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-800">{item.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Select Mondai for JLPT Reading / Listening OR Select Topic */}
            {selectedLang === "ja" && selectedType === "reading" ? (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    3. Chọn Mondai Đọc hiểu ({selectedLevel}):
                  </label>
                  <span className="text-[10px] text-teal-600 font-bold">
                    {filteredReadingPassages.length} bài
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedReadingMondai("all")}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                      selectedReadingMondai === "all"
                        ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span>📑 Tất cả Mondai</span>
                    <span className="text-[10px] opacity-80">{allReadingPassages.length} bài</span>
                  </button>
                  {readingMondais.map((m) => (
                    <button
                      key={m.mondaiNumber}
                      type="button"
                      onClick={() => setSelectedReadingMondai(m.mondaiNumber)}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                        selectedReadingMondai === m.mondaiNumber
                          ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div>{m.mondaiName}</div>
                        <div className="text-[10px] font-normal opacity-80">{m.mondaiSubtitle}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/10">
                        {m.count}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-2 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-md shadow-teal-100 transition-all cursor-pointer"
                >
                  {generating ? "🤖 Đang biên soạn..." : "✨ Tạo thêm bài đọc bằng AI"}
                </button>
              </div>
            ) : selectedLang === "ja" && selectedType === "listening" ? (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    3. Chọn Mondai Nghe hiểu ({selectedLevel}):
                  </label>
                  <span className="text-[10px] text-amber-600 font-bold">
                    {filteredListeningQuestions.length} câu
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedListeningMondai("all")}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                      selectedListeningMondai === "all"
                        ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span>🎧 Tất cả Mondai</span>
                    <span className="text-[10px] opacity-80">{allListeningQuestions.length} câu</span>
                  </button>
                  {listeningMondais.map((m) => (
                    <button
                      key={m.mondaiNumber}
                      type="button"
                      onClick={() => setSelectedListeningMondai(m.mondaiNumber)}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                        selectedListeningMondai === m.mondaiNumber
                          ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div>{m.mondaiName}</div>
                        <div className="text-[10px] font-normal opacity-80">{m.mondaiSubtitle}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/10">
                        {m.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-[11px] text-amber-900">
                  💡 Chọn bài nghe ở danh sách bên phải và nhấn <strong>▶️ Phát bài nghe</strong> để luyện phản xạ!
                </div>
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
                        onClick={() => {
                          setSelectedTopic(t.name);
                          setCustomTopic("");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedTopic === t.name && !customTopic
                            ? selectedLang === "en" 
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                              : selectedLang === "de"
                              ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                              : "bg-teal-600 border-teal-600 text-white shadow-xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
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
                  onClick={handleGenerate}
                  disabled={generating}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md cursor-pointer ${
                    generating
                      ? "bg-gray-400 cursor-not-allowed"
                      : selectedLang === "en"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-indigo-200"
                      : selectedLang === "de"
                      ? "bg-gradient-to-r from-amber-600 to-red-600 hover:opacity-95 shadow-amber-200"
                      : "bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-teal-200"
                  }`}
                >
                  {generating ? "🤖 Đang biên soạn nội dung..." : `🚀 Tạo bài luyện tập ${selectedLevel} bằng AI`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Exercises Area */}
        <div className="lg:col-span-2 space-y-4">
          {generating ? (
            <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 font-bold animate-pulse">
                Gia sư AI đang viết đoạn văn, tạo câu hỏi & đánh Furigana...
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-6 rounded-3xl border border-red-100 text-center">
              <p className="font-bold text-sm">Đã xảy ra lỗi</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : (
            <>
              {/* Top Action Bar when exercise is loaded */}
              {(kaiwaData || shadowingData.length > 0 || translationData.length > 0 || readingData || slides.length > 0) && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-black rounded-xl border ${
                      selectedLang === "en" ? "bg-indigo-100 text-indigo-700 border-indigo-200" :
                      selectedLang === "de" ? "bg-amber-100 text-amber-800 border-amber-200" :
                      "bg-teal-100 text-teal-800 border-teal-200"
                    }`}>
                      {selectedLevel}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800">
                      Chủ đề: <span className="text-indigo-600 font-extrabold">{activeTopic}</span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 cursor-pointer disabled:opacity-50"
                  >
                    <span className={generating ? "animate-spin" : ""}>🔄</span>
                    <span>Gen bài học mới (Từ vựng & nội dung khác)</span>
                  </button>
                </div>
              )}

              {/* KAIWA CONVERSATION DISPLAY */}
              {selectedType === "kaiwa" && kaiwaData && (
                <div className="space-y-6">
                  {/* Kaiwa Header & Controls */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            💬 Hội Thoại {selectedLevel} (10 Lượt Lời)
                          </span>
                          <span className="text-xs text-gray-500 font-bold">
                            {kaiwaData.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-gray-50/80 p-3 rounded-2xl border border-gray-100">
                          💡 <strong>Tình huống:</strong> {kaiwaData.situation}
                        </p>
                      </div>

                      {/* Autoplay Button */}
                      <button
                        onClick={playEntireKaiwa}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                          isAutoplayingKaiwa
                            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200 animate-pulse"
                            : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white shadow-teal-200"
                        }`}
                      >
                        <span>{isAutoplayingKaiwa ? "⏹️ Dừng phát" : "▶️ Phát toàn bộ (10 câu)"}</span>
                      </button>
                    </div>

                    {/* Speaker Badges & View Options */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Speakers */}
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center gap-1.5">
                          <span>👨‍💼</span>
                          <span>A: {kaiwaData.speakerA}</span>
                        </span>
                        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-1.5">
                          <span>👩‍💼</span>
                          <span>B: {kaiwaData.speakerB}</span>
                        </span>
                      </div>

                      {/* Display Toggles */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setShowKaiwaRuby(!showKaiwaRuby)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            showKaiwaRuby
                              ? "bg-teal-600 text-white shadow-3xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          あ Furigana
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKaiwaMeaning(!showKaiwaMeaning)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            showKaiwaMeaning
                              ? "bg-teal-600 text-white shadow-3xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          🇻🇳 Dịch nghĩa
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowKaiwaRomaji(!showKaiwaRomaji)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            showKaiwaRomaji
                              ? "bg-teal-600 text-white shadow-3xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          🔤 Romaji
                        </button>
                      </div>
                    </div>

                    {/* Speed Controls */}
                    <div className="flex items-center justify-between bg-teal-50/40 p-3 rounded-2xl border border-teal-100 text-xs">
                      <span className="font-bold text-teal-900">Tốc độ phát âm:</span>
                      <div className="flex gap-1.5">
                        {([0.6, 0.8, 1.0, 1.2] as const).map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setPlaybackRate(rate)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                              playbackRate === rate
                                ? "bg-teal-600 text-white shadow-3xs"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {rate === 1.0 ? "Chuẩn" : `${rate}x`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 10 Conversation Speech Bubbles Stream */}
                  <div className="space-y-4">
                    {kaiwaData.dialogue.map((turn, idx) => {
                      const isSpeakerA = turn.speaker === "A";
                      const isPlayingThis = kaiwaPlayingIdx === idx;
                      const scoreData = kaiwaScores[idx];

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-3 transition-all duration-300 ${
                            isSpeakerA ? "justify-start" : "justify-end"
                          }`}
                        >
                          {/* Speaker A Avatar */}
                          {isSpeakerA && (
                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold flex flex-col items-center justify-center shrink-0 shadow-3xs">
                              <span className="text-sm">👨‍💼</span>
                              <span className="text-[9px] leading-none font-mono">A</span>
                            </div>
                          )}

                          {/* Bubble Container */}
                          <div
                            className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-5 border transition-all ${
                              isPlayingThis
                                ? "ring-2 ring-teal-500 bg-teal-50/80 border-teal-300 shadow-md scale-[1.01]"
                                : isSpeakerA
                                ? "bg-white border-indigo-100 shadow-2xs hover:border-indigo-200"
                                : "bg-white border-emerald-100 shadow-2xs hover:border-emerald-200"
                            }`}
                          >
                            {/* Speaker Header */}
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  isSpeakerA
                                    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                }`}
                              >
                                #{idx + 1} • {turn.speaker_name || (isSpeakerA ? kaiwaData.speakerA : kaiwaData.speakerB)}
                              </span>

                              {/* Audio & Mic Actions */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => playSentence(turn.japanese)}
                                  className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-teal-50 text-teal-600 hover:text-teal-700 flex items-center justify-center text-xs transition-colors border border-gray-100"
                                  title="Nghe câu này"
                                >
                                  🔊
                                </button>
                                <button
                                  type="button"
                                  onClick={() => startKaiwaMic(turn.japanese, idx)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors border ${
                                    kaiwaMicIdx === idx
                                      ? "bg-red-500 text-white animate-pulse border-red-500"
                                      : "bg-gray-50 hover:bg-emerald-50 text-emerald-600 border-gray-100"
                                  }`}
                                  title="Thu âm phát âm câu này"
                                >
                                  🎙️
                                </button>
                              </div>
                            </div>

                            {/* Japanese Sentence Text */}
                            {showKaiwaRuby ? (
                              <div
                                className="text-lg font-bold text-gray-900 leading-loose tracking-wide ruby-box my-1"
                                dangerouslySetInnerHTML={{ __html: turn.japanese_ruby }}
                              />
                            ) : (
                              <div className="text-base font-bold text-gray-900 my-1">
                                {turn.japanese}
                              </div>
                            )}

                            {/* Romaji */}
                            {showKaiwaRomaji && (
                              <div className="text-[11px] text-gray-400 font-mono mt-1">
                                {turn.romaji}
                              </div>
                            )}

                            {/* Meaning */}
                            {showKaiwaMeaning && (
                              <div className="text-xs font-semibold text-gray-700 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100/60 mt-2.5">
                                🇻🇳 {turn.meaning}
                              </div>
                            )}

                            {/* Mic Score Result */}
                            {scoreData && (
                              <div className="mt-2.5 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs flex items-center justify-between gap-2">
                                <div className="text-[11px] text-emerald-800 font-medium truncate">
                                  🎤 <em>&quot;{scoreData.transcript}&quot;</em>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  scoreData.score >= 80 ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                                }`}>
                                  {scoreData.score}%
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Speaker B Avatar */}
                          {!isSpeakerA && (
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold flex flex-col items-center justify-center shrink-0 shadow-3xs">
                              <span className="text-sm">👩‍💼</span>
                              <span className="text-[9px] leading-none font-mono">B</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Key N2 Grammar Points */}
                  {kaiwaData.key_grammar && kaiwaData.key_grammar.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-3">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <span>💡</span> Ngữ Pháp {selectedLevel} Trọng Tâm Trong Bài
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {kaiwaData.key_grammar.map((g, gIdx) => (
                          <div key={gIdx} className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/70 space-y-1">
                            <div className="text-xs font-extrabold text-indigo-900 font-mono">
                              {g.structure}
                            </div>
                            <div className="text-[11px] text-indigo-700 font-medium">
                              {g.meaning}
                            </div>
                            <div className="text-[10px] text-gray-500 italic">
                              Cách dùng: {g.usage}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comprehension Quiz Section */}
                  {kaiwaData.questions && kaiwaData.questions.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                          <span>📝</span> Trắc Nghiệm Đọc Hiểu Nội Dung Cuộc Hội Thoại
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Kiểm tra mức độ hiểu sâu về các quyết định, ý kiến và thông tin mà 2 nhân vật vừa trao đổi.
                        </p>
                      </div>

                      <div className="space-y-6">
                        {kaiwaData.questions.map((q, qIdx) => {
                          const currentAnswer = kaiwaQuizAnswers[q.id];
                          const isChecked = currentAnswer?.checked;

                          return (
                            <div key={q.id || qIdx} className="p-5 rounded-2xl bg-gray-50/60 border border-gray-200/70 space-y-3.5">
                              <div>
                                <div className="text-xs font-extrabold text-gray-900">
                                  Câu {qIdx + 1}: {q.question}
                                </div>
                                {q.question_vietnamese && (
                                  <div className="text-[11px] text-gray-500 italic mt-0.5">
                                    🇻🇳 {q.question_vietnamese}
                                  </div>
                                )}
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 gap-2">
                                {q.options.map((opt) => {
                                  const isSelected = currentAnswer?.optionId === opt.id;
                                  let optClasses = "border-gray-200 bg-white text-gray-800 hover:border-gray-300";

                                  if (isSelected) {
                                    optClasses = "border-teal-600 bg-teal-50/80 text-teal-900 font-bold ring-2 ring-teal-300";
                                  }

                                  if (isChecked) {
                                    if (opt.isCorrect) {
                                      optClasses = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                    } else if (isSelected) {
                                      optClasses = "border-red-500 bg-red-50 text-red-900 font-bold ring-2 ring-red-300";
                                    } else {
                                      optClasses = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                                    }
                                  }

                                  return (
                                    <button
                                      key={opt.id}
                                      disabled={isChecked}
                                      type="button"
                                      onClick={() =>
                                        setKaiwaQuizAnswers((prev) => ({
                                          ...prev,
                                          [q.id]: { optionId: opt.id, score: 0, checked: false },
                                        }))
                                      }
                                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${optClasses}`}
                                    >
                                      <span>{opt.text}</span>
                                      {isChecked && opt.isCorrect && (
                                        <span className="text-emerald-700 font-extrabold shrink-0">✓ Đáp án đúng</span>
                                      )}
                                      {isChecked && isSelected && !opt.isCorrect && (
                                        <span className="text-red-600 font-extrabold shrink-0">✕ Sai</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Check Answer Button & Explanation */}
                              {!isChecked ? (
                                <button
                                  type="button"
                                  disabled={!currentAnswer?.optionId}
                                  onClick={() => checkKaiwaQuizAnswer(q.id)}
                                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer"
                                >
                                  Kiểm tra đáp án
                                </button>
                              ) : (
                                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-gray-800 space-y-1 animate-in zoom-in-95">
                                  <div className="flex items-center gap-2 font-bold">
                                    <span className={currentAnswer.score === 100 ? "text-emerald-700" : "text-red-600"}>
                                      {currentAnswer.score === 100 ? "✓ Bạn đã trả lời chính xác (+100 điểm)!" : "✕ Chưa chính xác"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-600 leading-relaxed pt-1 border-t border-emerald-100">
                                    <strong>Giải thích:</strong> {q.explanation}
                                  </div>
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

              {/* SHADOWING DISPLAY */}
              {selectedType === "shadowing" && shadowingData.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-teal-50/50 rounded-2xl p-4 flex items-center justify-between border border-teal-100 text-xs">
                    <span className="font-bold text-teal-800">Tốc độ phát âm:</span>
                    <div className="flex gap-2">
                      {([0.6, 0.8, 1.0, 1.2] as const).map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setPlaybackRate(rate)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                            playbackRate === rate
                              ? "bg-teal-600 text-white shadow-xs"
                              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {rate === 1.0 ? "Chuẩn" : `${rate}x`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {shadowingData.map((item, idx) => (
                      <div key={item.id || idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-3 flex-1">
                            {/* Furigana Ruby Text rendering */}
                            <div 
                              className="text-xl font-bold text-gray-900 leading-loose tracking-wide ruby-box"
                              dangerouslySetInnerHTML={{ __html: item.japanese_ruby }}
                            />
                            <div className="text-[11px] text-gray-400 font-mono">
                              {item.romaji}
                            </div>
                            <div className="text-xs font-semibold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                              💡 Nghĩa: {item.meaning}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => playSentence(item.japanese)}
                              className="w-10 h-10 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center text-lg text-teal-600 transition-colors"
                              title="Phát âm câu mẫu"
                            >
                              🔊
                            </button>
                            <button
                              onClick={() => startShadowingMic(item.japanese, idx)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                                recognizingIndex === idx
                                  ? "bg-red-500 text-white animate-pulse"
                                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-600"
                              }`}
                              title="Thu âm đọc lại"
                            >
                              🎙️
                            </button>
                          </div>
                        </div>

                        {/* Mic recognition output */}
                        {recognizingIndex === idx && (
                          <div className="mt-2 pt-3 border-t border-gray-100 text-xs bg-red-50/50 rounded-xl p-3 text-red-900 flex items-center justify-between">
                            <div>
                              <span className="font-bold">Nhận dạng giọng bạn:</span> {recognitionTranscript}
                            </div>
                            <button
                              onClick={() => setRecognizingIndex(null)}
                              className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-lg cursor-pointer"
                            >
                              Dừng & Chấm điểm
                            </button>
                          </div>
                        )}

                        {/* Pronunciation Score Feedback */}
                        {shadowingScores[idx] && (
                          <div className="mt-2.5 p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200/80 text-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                                shadowingScores[idx].score >= 80 ? "bg-emerald-500" : shadowingScores[idx].score >= 50 ? "bg-amber-500" : "bg-red-500"
                              }`}>
                                {shadowingScores[idx].score}
                              </div>
                              <div>
                                <div className="font-extrabold text-gray-900">
                                  {shadowingScores[idx].score >= 80 ? "🎯 Phát âm rất chuẩn xác!" : shadowingScores[idx].score >= 50 ? "👍 Phát âm khá tốt, cần rõ ràng hơn" : "⚠️ Cần phát âm rõ và đúng âm điệu hơn"}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  Giọng đọc: "{shadowingScores[idx].transcript}"
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-teal-700 shrink-0">Độ khớp {shadowingScores[idx].score}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSLATION 2-WAY DISPLAY (4 sentences) */}
              {selectedType === "translation" && translationData.length > 0 && (
                <div className="space-y-4">
                  {translationData.map((item, idx) => {
                    const isShown = showAnswerIdx[idx];
                    const isJaToVi = item.direction === "ja-vi";

                    return (
                      <div key={item.id || idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                            {isJaToVi ? "Nhật ➔ Việt" : "Việt ➔ Nhật"}
                          </span>
                          {isJaToVi && (
                            <button
                              onClick={() => playSentence(item.source)}
                              className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              🔊 Nghe mẫu
                            </button>
                          )}
                        </div>

                        {/* Source box */}
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-base font-extrabold text-gray-800 leading-relaxed">
                          {isJaToVi && item.source_ruby ? (
                            <div dangerouslySetInnerHTML={{ __html: item.source_ruby }} />
                          ) : (
                            item.source
                          )}
                        </div>

                        {/* Translation draft textarea */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Bản dịch của bạn:</label>
                          <textarea
                            rows={2}
                            value={translationInputs[idx] || ""}
                            onChange={(e) =>
                              setTranslationInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                            }
                            placeholder="Nhập câu dịch tiếng Nhật hoặc tiếng Việt tương ứng..."
                            className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-teal-500 shadow-3xs"
                          />
                        </div>

                        {item.hint && (
                          <div className="text-[11px] text-indigo-600 bg-indigo-50/40 p-2.5 rounded-lg border border-indigo-100/50">
                            💡 Gợi ý: {item.hint}
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleGradeTranslation(idx, item)}
                            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>🎯</span>
                            <span>Chấm điểm & So sánh</span>
                          </button>
                          <button
                            onClick={() =>
                              setShowAnswerIdx((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            {isShown ? "Ẩn đáp án" : "Xem đáp án"}
                          </button>
                        </div>

                        {/* Score Feedback */}
                        {translationScores[idx] && (
                          <div className="p-3.5 bg-gradient-to-r from-teal-50/80 to-indigo-50/80 rounded-2xl border border-teal-200/80 text-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs ${
                                translationScores[idx].score >= 80 ? "bg-emerald-500" : translationScores[idx].score >= 50 ? "bg-amber-500" : "bg-red-500"
                              }`}>
                                {translationScores[idx].score}
                              </div>
                              <div>
                                <div className="font-extrabold text-gray-900">
                                  {translationScores[idx].score >= 80 ? "🎯 Bản dịch xuất sắc!" : translationScores[idx].score >= 50 ? "👍 Bản dịch khá sát nghĩa!" : "⚠️ Cần đối chiếu với câu mẫu"}
                                </div>
                                <div className="text-[10px] text-gray-500">Đã lưu vào lịch sử chấm điểm</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-indigo-700">Khớp {translationScores[idx].score}%</span>
                          </div>
                        )}

                        {isShown && (
                          <div className="mt-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs space-y-2">
                            <div>
                              <span className="font-bold text-emerald-800">Đáp án chuẩn:</span>{" "}
                              {!isJaToVi && item.target_ruby ? (
                                <span 
                                  className="text-gray-900 font-bold leading-loose tracking-wide ruby-box ml-1 inline-block" 
                                  dangerouslySetInnerHTML={{ __html: item.target_ruby }} 
                                />
                              ) : (
                                <span className="text-gray-900 font-semibold">{item.target}</span>
                              )}
                            </div>
                            {item.pronunciation && (
                              <div className="text-gray-500 text-[10px] font-mono">
                                Phát âm: {item.pronunciation}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* N2 READING DISPLAY */}
              {selectedType === "reading" && readingData && (
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                      Bài đọc hiểu {selectedLevel}
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => playSentence(readingData.passage)}
                        className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        🔊 Nghe bài đọc
                      </button>
                      <button
                        onClick={() => setShowPassageTranslation((prev) => !prev)}
                        className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                          showPassageTranslation
                            ? "bg-teal-100 text-teal-800"
                            : "text-teal-600 hover:text-teal-800"
                        }`}
                      >
                        🌐 {showPassageTranslation ? "Ẩn dịch" : "Dịch nghĩa"}
                      </button>
                    </div>
                  </div>

                  {/* Reading Passage with soft paper style and Ruby text */}
                  <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 leading-loose text-base text-gray-800 font-semibold tracking-wide space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Bài đọc (Passage):</div>
                      <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full font-bold">
                        💡 Bôi đen từ vựng để hiện nút tra Mazii
                      </span>
                    </div>
                    <div 
                      className="whitespace-pre-line text-gray-900 leading-loose ruby-box select-text"
                      dangerouslySetInnerHTML={{ __html: readingData.passage_ruby }}
                    />

                    {/* Passage Vietnamese Translation Toggle */}
                    {showPassageTranslation && (
                      <div className="mt-4 pt-3 border-t border-amber-200/50 text-xs text-gray-700 leading-relaxed italic">
                        <span className="font-extrabold text-teal-800 not-italic block mb-1">Bản dịch tiếng Việt:</span>
                        {readingData.passage_translation}
                      </div>
                    )}
                  </div>

                  {/* Vocabulary Extracted List */}
                  {readingData.vocabulary && readingData.vocabulary.length > 0 && (
                    <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100/80">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                        Từ vựng trong bài đọc:
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

                  {/* Question */}
                  <div className="text-xs font-extrabold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    ❓ Câu hỏi: {readingData.question}
                  </div>

                  {/* Multiple choice options */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {readingData.options.map((opt) => {
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
                          className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.text}</span>
                          {isAnswered && opt.isCorrect && <span className="text-emerald-600 font-extrabold text-sm">✓</span>}
                          {isAnswered && isThisSelected && !opt.isCorrect && <span className="text-red-600 font-extrabold text-sm">✕</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Reading Score Result */}
                  {readingScore && (
                    <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between ${
                      readingScore.score === 100 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{readingScore.score === 100 ? "🎉" : "❌"}</span>
                        <div>
                          <div className="font-black text-sm">
                            {readingScore.score === 100 ? "Chính xác! Điểm: 100/100" : "Chưa chính xác! Điểm: 0/100"}
                          </div>
                          <div className="text-[10px] opacity-80">Đã ghi nhận kết quả bài đọc vào lịch sử</div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold">{readingScore.score}/100</span>
                    </div>
                  )}

                  {/* Explanation reveal */}
                  {selectedOptionId && (
                    <div className="mt-4 p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50 text-xs leading-relaxed space-y-2">
                      <div className="font-extrabold text-teal-800 flex items-center gap-1">
                        <span>💡</span> Hướng dẫn giải nghĩa & Ngữ pháp {selectedLevel}:
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{readingData.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* PRESENTATION TRAINING DISPLAY */}
              {selectedType === "presentation" && slides.length > 0 && (
                <div className="space-y-5">
                  <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
                    <div className="flex border-b border-gray-100 gap-4 overflow-x-auto pb-1">
                      {slides.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlideTab(idx)}
                          className={`pb-2.5 font-bold text-xs border-b-2 whitespace-nowrap transition-colors ${
                            activeSlideTab === idx
                              ? "border-teal-600 text-teal-600"
                              : "border-transparent text-gray-400 hover:text-gray-600"
                          }`}
                        >
                          📋 Slide {s.slide_number}
                        </button>
                      ))}
                    </div>

                    {/* Active Slide Bullet Points */}
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-inner min-h-[160px] flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-teal-500 text-white text-[9px] font-bold rounded">
                            Slide {slides[activeSlideTab].slide_number}
                          </span>
                          <span className="text-[10px] text-indigo-200">
                            {slides[activeSlideTab].title_vietnamese}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-teal-400">
                          {slides[activeSlideTab].title}
                        </h3>
                        <ul className="mt-3.5 space-y-2 text-xs text-indigo-100 list-disc list-inside">
                          {slides[activeSlideTab].bullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              <span className="font-bold text-white">{bullet}</span>
                              <span className="block text-[10px] text-gray-400 pl-4 font-normal italic">
                                ({slides[activeSlideTab].bullets_vietnamese[bIdx]})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Micro Recording for Active Slide */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Nói tiếng Nhật thuyết trình Slide {activeSlideTab + 1}:
                        </span>
                        <button
                          onClick={() => startPresentationMic(activeSlideTab)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-3xs ${
                            recognizingIndex === activeSlideTab
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200"
                          }`}
                        >
                          🎙️ {recognizingIndex === activeSlideTab ? "Đang lắng nghe..." : "Nhấn để Nói"}
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={presentationTranscripts[activeSlideTab] || ""}
                        onChange={(e) =>
                          setPresentationTranscripts((prev) => ({
                            ...prev,
                            [activeSlideTab]: e.target.value
                          }))
                        }
                        placeholder="Hãy nhấp 'Nhấn để Nói' rồi nói bằng tiếng Nhật hoặc tự chỉnh sửa nhập bài thuyết trình tại đây..."
                        className="w-full rounded-xl border border-gray-200 p-3 text-xs focus:outline-none focus:border-teal-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Submission triggers evaluation */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleEvaluatePresentation}
                      disabled={isEvaluating || (!presentationTranscripts[0] && !presentationTranscripts[1])}
                      className="px-8 py-4 bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-100 disabled:opacity-50"
                    >
                      {isEvaluating ? "🤖 AI Đang chấm điểm và phân tích câu..." : "🔍 Gửi AI nhận xét & Đánh giá"}
                    </button>
                  </div>

                  {/* AI Presentation Feedback Evaluation */}
                  {evaluation && (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                        <div>
                          <span className="px-3.5 py-1 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Chấm điểm thuyết trình {isSecondCheck ? "(Lần 2)" : "(Lần 1)"}
                          </span>
                          <h3 className="font-extrabold text-gray-900 text-base mt-2">Kết quả đánh giá AI</h3>
                        </div>

                        {/* Score Circle */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-gray-400 font-bold block">ĐỘ HIỂU ĐỐI VỚI</span>
                            <span className="text-xs font-bold text-gray-800">Người Nhật Bản</span>
                          </div>
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-indigo-600 flex flex-col items-center justify-center text-white shadow-md">
                            <span className="text-lg font-extrabold">{evaluation.comprehensibility_score}%</span>
                          </div>
                        </div>
                      </div>

                      {/* General feedback */}
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-900">📝 Nhận xét tổng quan:</h4>
                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          {evaluation.feedback_general}
                        </p>
                      </div>

                      {/* Corrections */}
                      {evaluation.corrections && evaluation.corrections.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-900">✨ Chỉnh sửa & Tối ưu câu:</h4>
                          <div className="space-y-3.5">
                            {evaluation.corrections.map((corr, cIdx) => (
                              <div key={cIdx} className="p-4 rounded-2xl border border-rose-100 bg-rose-50/20 space-y-2">
                                <div className="text-xs text-rose-800 font-medium">
                                  ❌ <span className="font-bold">Bạn nói:</span> "{corr.original}"
                                </div>
                                <div className="text-xs text-emerald-800 font-bold leading-loose flex items-baseline flex-wrap">
                                  <span>✅ Sửa thành:</span>
                                  <span 
                                    className="ruby-box ml-1 inline-block"
                                    dangerouslySetInnerHTML={{ __html: corr.corrected_ruby }}
                                  />
                                </div>
                                <div className="text-[10px] text-gray-500 pl-4 border-l-2 border-indigo-200">
                                  💡 {corr.reason}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Generated Exercises */}
                      {evaluation.exercises && evaluation.exercises.length > 0 && (
                        <div className="space-y-4 border-t border-gray-100 pt-4">
                          <div>
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded uppercase">
                              Bài tập thực hành
                            </span>
                            <h4 className="text-xs font-extrabold text-gray-900 mt-1">💪 Luyện tập khắc phục lỗi sai:</h4>
                          </div>

                          <div className="space-y-4">
                            {evaluation.exercises.map((ex, exIdx) => {
                              const selectedAns = exerciseAnswers[exIdx];
                              const isCorrect = selectedAns === ex.correct_answer;

                              return (
                                <div key={exIdx} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                                  <div className="text-xs font-bold text-gray-900">
                                    {exIdx + 1}. {ex.question}
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    {ex.options.map((option, oIdx) => {
                                      let optStyle = "border-gray-200 bg-white text-gray-700";
                                      if (selectedAns === option) {
                                        optStyle = "border-teal-500 bg-teal-50 text-teal-800 font-bold ring-2 ring-teal-200";
                                      }

                                      if (exerciseChecked) {
                                        if (option === ex.correct_answer) {
                                          optStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                                        } else if (selectedAns === option) {
                                          optStyle = "border-red-500 bg-red-50 text-red-800 font-bold";
                                        } else {
                                          optStyle = "border-gray-100 bg-gray-50 text-gray-300 opacity-60";
                                        }
                                      }

                                      return (
                                        <button
                                          key={oIdx}
                                          disabled={exerciseChecked}
                                          onClick={() =>
                                            setExerciseAnswers((prev) => ({ ...prev, [exIdx]: option }))
                                          }
                                          className={`p-3 rounded-xl border text-left text-xs transition-all ${optStyle}`}
                                        >
                                          {option}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {exerciseChecked && (
                                    <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-[10px] text-gray-700 leading-relaxed">
                                      <span className={`font-bold ${isCorrect ? "text-emerald-700" : "text-red-600"} block mb-1`}>
                                        {isCorrect ? "✓ Chính xác!" : "✕ Chưa chính xác"}
                                      </span>
                                      {ex.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {!exerciseChecked && (
                            <button
                              onClick={() => setExerciseChecked(true)}
                              disabled={Object.keys(exerciseAnswers).length < evaluation.exercises.length}
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                            >
                              Nộp đáp án bài tập
                            </button>
                          )}
                        </div>
                      )}

                      {/* Presentation Retake 2nd check trigger */}
                      <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row gap-3 justify-between items-center">
                        <div className="text-[10px] text-gray-400 italic">
                          {isSecondCheck 
                            ? "Bạn đang xem đánh giá lần 2. Bạn có thể thuyết trình lại tiếp tục." 
                            : "Hãy xem kỹ lỗi sai, thực hành bài tập và thuyết trình lần 2 để nâng điểm!"}
                        </div>
                        <button
                          onClick={handleRetakePresentation}
                          className="px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-bold text-xs shadow-md transition-colors whitespace-nowrap"
                        >
                          🎙️ Trình bày lại (Lần 2)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* JLPT READING PRACTICE BY MONDAI (When Japanese & Reading & no AI readingData active) */}
              {selectedLang === "ja" && selectedType === "reading" && !readingData && (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-6 text-white shadow-md shadow-teal-200">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-black uppercase">
                        📚 Đọc hiểu JLPT {selectedLevel}
                      </span>
                      <span className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                        {filteredReadingPassages.length} đoạn văn trắc nghiệm
                      </span>
                    </div>
                    <h3 className="text-lg font-black">Luyện Đọc Hiểu Theo Từng Mondai Chuẩn Đề Thi</h3>
                    <p className="text-xs text-white/90 mt-1 leading-relaxed">
                      Các bài đọc hiểu được trích xuất trực tiếp từ các đề thi JLPT chính thức (như Đề thi chính thức N2 07/2025, N3 Mock, N5 Mock) và phân loại theo từng Mondai: Đoạn ngắn, Đoạn trung, So sánh, Đoạn dài và Tìm kiếm thông tin.
                    </p>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedReadingMondai("all")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedReadingMondai === "all"
                            ? "bg-white text-teal-900 shadow-xs"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        Tất cả Mondai ({allReadingPassages.length})
                      </button>
                      {readingMondais.map((m) => (
                        <button
                          key={m.mondaiNumber}
                          type="button"
                          onClick={() => setSelectedReadingMondai(m.mondaiNumber)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedReadingMondai === m.mondaiNumber
                              ? "bg-white text-teal-900 shadow-xs"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          {m.mondaiName}: {m.mondaiSubtitle} ({m.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Passages List */}
                  {filteredReadingPassages.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-3">
                      <div className="text-3xl">📖</div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Chưa có bài đọc trích xuất cho Mondai này ở cấp độ {selectedLevel}
                      </h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Hãy chọn cấp độ khác (như N2 có đầy đủ 11 đoạn văn chính thức) hoặc nhấn nút "Tạo thêm bài đọc bằng AI" ở cột bên trái để học ngay nhé!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredReadingPassages.map((p, pIdx) => (
                        <div key={p.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-5">
                          {/* Passage Header */}
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

                          {/* Passage Body */}
                          <div className="bg-amber-50/20 p-5 rounded-2xl border border-amber-100 text-base text-gray-900 leading-loose whitespace-pre-line select-text font-medium">
                            {p.passageText}
                          </div>

                          {/* Questions for this passage */}
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

                                  {/* Options */}
                                  <div className="grid grid-cols-1 gap-2">
                                    {q.options.map((optText, optIdx) => {
                                      const isSelected = userAns === optIdx;
                                      const isRight = q.answers.includes(optIdx);

                                      let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-gray-100";
                                      if (isChecked) {
                                        if (isRight) {
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
                                          className={`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-start gap-2.5 ${optStyle}`}
                                        >
                                          <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                            {optIdx + 1}
                                          </span>
                                          <span className="leading-relaxed">{optText}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Action & Feedback */}
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
                                      <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                                        isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                      }`}>
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

              {/* JLPT LISTENING PRACTICE BY MONDAI (When Japanese & Listening) */}
              {selectedLang === "ja" && selectedType === "listening" && (
                <div className="space-y-6">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-6 text-white shadow-md shadow-amber-200">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-black uppercase">
                        🎧 Nghe hiểu JLPT {selectedLevel}
                      </span>
                      <span className="text-xs bg-white/10 px-3 py-1 rounded-lg">
                        {filteredListeningQuestions.length} câu hỏi chuẩn hóa
                      </span>
                    </div>
                    <h3 className="text-lg font-black">Luyện Nghe Hiểu (聴解) Theo Từng Mondai JLPT</h3>
                    <p className="text-xs text-white/90 mt-1 leading-relaxed">
                      Luyện phản xạ và kỹ năng nghe bắt thông tin chuẩn cấu trúc kỳ thi JLPT: Mondai 1 (Hiểu nhiệm vụ), Mondai 2 (Trọng điểm), Mondai 3 (Khái quát ý đồ), Mondai 4 (Phản xạ tức thì) và Mondai 5 (Tổng hợp đối thoại).
                    </p>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedListeningMondai("all")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedListeningMondai === "all"
                            ? "bg-white text-amber-900 shadow-xs"
                            : "bg-white/20 text-white hover:bg-white/30"
                        }`}
                      >
                        Tất cả Mondai ({allListeningQuestions.length})
                      </button>
                      {listeningMondais.map((m) => (
                        <button
                          key={m.mondaiNumber}
                          type="button"
                          onClick={() => setSelectedListeningMondai(m.mondaiNumber)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedListeningMondai === m.mondaiNumber
                              ? "bg-white text-amber-900 shadow-xs"
                              : "bg-white/20 text-white hover:bg-white/30"
                          }`}
                        >
                          {m.mondaiName}: {m.mondaiSubtitle} ({m.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Listening Questions List */}
                  {filteredListeningQuestions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-3">
                      <div className="text-3xl">🎧</div>
                      <h4 className="text-sm font-bold text-gray-900">
                        Chưa có câu hỏi cho Mondai này ở cấp độ {selectedLevel}
                      </h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Vui lòng chuyển sang cấp độ N2, N3 hoặc chọn tab "Tất cả Mondai" để làm bài nhé!
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
                            {/* Card Header */}
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

                            {/* Situation Box */}
                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs font-bold text-amber-950 flex items-start gap-2">
                              <span className="text-base">📌</span>
                              <div className="leading-relaxed">
                                <span className="text-amber-800 font-bold block mb-0.5">Tình huống (Bối cảnh):</span>
                                {item.situation}
                              </div>
                            </div>

                            {/* Audio Player Controller */}
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => playListeningAudio(item)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                                  isPlaying
                                    ? "bg-amber-600 text-white animate-pulse shadow-amber-200"
                                    : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200"
                                }`}
                              >
                                <span>{isPlaying ? "⏸️" : "▶️"}</span>
                                <span>{isPlaying ? "Đang phát bài nghe... (Nhấn để dừng)" : "Phát bài nghe (Audio giọng Nhật)"}</span>
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setShowListeningScript((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    isScriptOpen
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                                  }`}
                                >
                                  📄 {isScriptOpen ? "Ẩn Kịch Bản (Script)" : "Hiện Kịch Bản (Script) & Dịch"}
                                </button>
                              </div>
                            </div>

                            {/* Script & Translation Accordion */}
                            {isScriptOpen && (
                              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-3 animate-in fade-in duration-150">
                                <div>
                                  <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-1">
                                    🎙️ Lời thoại bài nghe (Audio Script):
                                  </div>
                                  <div className="whitespace-pre-line text-gray-900 leading-relaxed font-medium pl-2 border-l-2 border-indigo-300">
                                    {item.audioScript}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-indigo-100">
                                  <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-1">
                                    🌐 Bản dịch tiếng Việt:
                                  </div>
                                  <div className="whitespace-pre-line text-gray-700 leading-relaxed italic pl-2 border-l-2 border-indigo-300">
                                    {item.vietnameseTranslation}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Question Box */}
                            <div className="text-sm font-extrabold text-gray-900 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100">
                              ❓ Câu hỏi: {item.question}
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 gap-2">
                              {item.options.map((optText, optIdx) => {
                                const isSelected = userAns === optIdx;
                                const isRight = optIdx === item.correctAnswer;

                                let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-gray-50";
                                if (isChecked) {
                                  if (isRight) {
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
                                    className={`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-start gap-2.5 ${optStyle}`}
                                  >
                                    <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                      {optIdx + 1}
                                    </span>
                                    <span className="leading-relaxed">{optText}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Check Answer Button & Explanation */}
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
                                <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                                  isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                }`}>
                                  <div className="font-extrabold flex items-center gap-1.5 text-sm">
                                    <span>{isCorrect ? "✓ Chính xác! (+100 điểm)" : "✕ Chưa chính xác"}</span>
                                    {!isCorrect && (
                                      <span className="text-xs font-semibold">
                                        (Đáp án đúng: Lựa chọn {item.correctAnswer + 1})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10">
                                    <strong>💡 Giải thích:</strong> {item.explanation}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* EMPTY VIEW STATE */}
              {!kaiwaData && !shadowingData.length && !translationData.length && !readingData && !slides.length && (selectedLang !== "ja" || (selectedType !== "reading" && selectedType !== "listening")) && (
                <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <div className="text-4xl">🏆</div>
                  <h3 className="font-bold text-gray-900 text-sm mt-2">Chưa chọn nội dung học</h3>
                  <p className="text-[11px] text-gray-500 max-w-sm">
                    Vui lòng chọn kỹ năng và chủ đề bạn muốn luyện ở bảng điều khiển bên trái, sau đó nhấn nút &quot;Tạo bài học AI&quot; để tạo nội dung luyện tập chuyên sâu!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Selection Tooltip for Mazii Lookup */}
      <SelectionLookupTooltip
        disabled={maziiLookupState.isOpen || showHistoryModal || !!selectedWordForNotebook}
        onLookup={(word, furigana, meaning) => {
          setMaziiLookupState({
            isOpen: true,
            queryWord: word,
            initialFurigana: furigana,
            initialMeaning: meaning,
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
        onAddToNotebook={(word) => {
          setSelectedWordForNotebook(word);
          setDuplicateError(null);
        }}
      />

      {/* Practice History & Scoring Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-indigo-800 to-purple-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-extrabold text-sm flex items-center gap-2 flex-wrap">
                    <span>Lịch Sử & Bảng Điểm Luyện Tập</span>
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold">
                      {activeLanguage.flag} {activeLanguage.name}
                    </span>
                  </h3>
                  <p className="text-[10px] text-teal-100 font-medium mt-0.5">Theo dõi chặng đường rèn luyện và đối chiếu đáp án chuẩn</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Score Summary Stats */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Tổng bài luyện</div>
                  <div className="text-2xl font-black text-gray-900 mt-1">{modalFilteredHistory.length}</div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Điểm trung bình</div>
                  <div className="text-2xl font-black text-teal-600 mt-1">
                    {modalFilteredHistory.length > 0 
                      ? Math.round(modalFilteredHistory.reduce((sum: number, item: PracticeHistoryEntry) => sum + (item.score || 0), 0) / modalFilteredHistory.length) 
                      : 0}
                    <span className="text-xs font-normal text-gray-400">/100</span>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">🗣️ Shadowing / ✍️ Dịch</div>
                  <div className="text-2xl font-black text-indigo-600 mt-1">
                    {modalFilteredHistory.filter((i: PracticeHistoryEntry) => i.type === "shadowing" || i.type === "translation").length}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-3xs text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">💬 Kaiwa / 📚 Đọc / 🎤 Thuyết trình</div>
                  <div className="text-2xl font-black text-purple-600 mt-1">
                    {modalFilteredHistory.filter((i: PracticeHistoryEntry) => i.type === "kaiwa" || i.type === "reading" || i.type === "presentation").length}
                  </div>
                </div>
              </div>
            </div>

            {/* History List */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {modalFilteredHistory.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-gray-400">
                  <span className="text-3xl">📝</span>
                  <p className="text-xs font-bold text-gray-600">Chưa có lượt luyện tập nào cho {activeLanguage.name}</p>
                  <p className="text-[10px]">Hãy thực hiện bài tập Kaiwa, Shadowing, Dịch thuật, Đọc hiểu hoặc Thuyết trình để tích lũy điểm số!</p>
                </div>
              ) : (
                modalFilteredHistory.map((entry: PracticeHistoryEntry) => (
                  <div key={entry.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-3xs space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 text-[10px] font-extrabold rounded-lg">
                          {entry.typeName}
                        </span>
                        <span className="text-xs font-bold text-gray-900">{entry.topic}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                          entry.score >= 80 ? "bg-emerald-100 text-emerald-800" : entry.score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                        }`}>
                          🎯 {entry.score}/100
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(entry.completedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                        </span>
                      </div>
                    </div>

                    {/* Answer Comparison */}
                    <div className="space-y-1.5 text-xs bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                      {entry.userAnswer && (
                        <div>
                          <span className="font-bold text-gray-500 text-[10px] uppercase block">Câu trả lời / Giọng nói của bạn:</span>
                          <span className="text-gray-900 font-semibold">{entry.userAnswer}</span>
                        </div>
                      )}
                      {entry.correctAnswer && (
                        <div className="pt-1.5 border-t border-gray-200/60">
                          <span className="font-bold text-teal-700 text-[10px] uppercase block">Đáp án chuẩn / Câu gốc:</span>
                          <span className="text-teal-900 font-bold">{entry.correctAnswer}</span>
                        </div>
                      )}
                      {entry.feedback && (
                        <div className="pt-1 text-[11px] text-indigo-700 italic">
                          💡 Nhận xét: {entry.feedback}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              {practiceHistory.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn xóa lịch sử luyện tập của ${activeLanguage.name} không?`)) {
                      const updated = practiceHistory.filter((i: PracticeHistoryEntry) => (i.lang || "ja") !== selectedLang);
                      setPracticeHistory(updated);
                      localStorage.setItem("flashcash-practice-history", JSON.stringify(updated));
                      window.dispatchEvent(new Event("practice-history-updated"));
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-bold transition-colors cursor-pointer"
                >
                  🗑️ Xóa lịch sử {activeLanguage.name}
                </button>
              )}
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors ml-auto cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Notebook Modal */}
      {selectedWordForNotebook && (
        <AddToNotebookModal
          selectedWord={selectedWordForNotebook}
          onClose={() => setSelectedWordForNotebook(null)}
          onSuccess={() => {
            setSelectedWordForNotebook(null);
            setSaveSuccessMsg("Đã lưu từ vựng vào sổ tay thành công!");
            setTimeout(() => setSaveSuccessMsg(null), 3000);
          }}
        />
      )}

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="fixed bottom-4 right-4 bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-lg z-50 animate-bounce">
          ✓ {saveSuccessMsg}
        </div>
      )}

      {/* Ruby text style tweaks */}
      <style jsx global>{`
        .ruby-box ruby {
          ruby-position: over;
          margin: 0 0.05em;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-radius: 4px;
          padding: 1px 2px;
        }
        .ruby-box ruby:hover {
          background-color: rgba(79, 70, 229, 0.15);
        }
        .ruby-box rt {
          font-size: 0.55em;
          color: #4f46e5; /* indigo-600 */
          letter-spacing: 0.05em;
          padding-bottom: 0.1em;
          font-weight: normal;
          user-select: none;
        }
      `}</style>
      </div>
    </AuthGuard>
  );
}
