"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNotebooks } from "@/hooks/useNotebooks";
import { searchJapaneseDictionary } from "@/lib/services/dictionaryService";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AddToNotebookModal from "@/components/AddToNotebookModal";
import MaziiQuickLookupModal from "@/components/MaziiQuickLookupModal";
import SelectionLookupTooltip from "@/components/SelectionLookupTooltip";
import AuthGuard from "@/components/AuthGuard";
import BreadcrumbNav from "@/components/BreadcrumbNav";
import { autoSync } from "@/lib/syncService";
import AudioSeekPlayer from "@/components/AudioSeekPlayer";
import {
  getReadingMondaisForLevel as getReadingMondaiConfigs,
  getListeningMondaisForLevel as getListeningMondaiConfigs,
  getVocabMondaisForLevel as getVocabMondaiConfigs,
  getGrammarMondaisForLevel as getGrammarMondaiConfigs,
  getMondaiOfficialCount,
  JLPTMondaiInfo,
} from "@/lib/jlptMondaiConfig";
import { JLPT_LISTENING_QUESTIONS, JLPTListeningQuestion } from "@/data/jlptListeningPractice";
import {
  getAllExtractedReadingPassages,
  getReadingMondaisForLevel,
  ExtractedReadingPassage,
} from "@/lib/jlptReadingExtractor";

export interface JLPTVocabQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface JLPTVocabQuestionItem {
  id: string;
  question: string;
  question_vietnamese?: string;
  options: JLPTVocabQuestionOption[];
  explanation: string;
}

export interface JLPTVocabData {
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  questions: JLPTVocabQuestionItem[];
  vocabulary?: { kanji: string; hiragana: string; meaning: string }[];
}

export interface JLPTGrammarQuestionItem {
  id: string;
  question: string;
  question_vietnamese?: string;
  fullSentence?: string;
  options: JLPTVocabQuestionOption[];
  explanation: string;
}

export interface JLPTGrammarData {
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  questions: JLPTGrammarQuestionItem[];
  vocabulary?: { kanji: string; hiragana: string; meaning: string }[];
}

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

export interface ReadingQuestionItem {
  id: string;
  question: string;
  question_vietnamese?: string;
  options: ReadingOption[];
  explanation: string;
  passage?: string;
  passage_ruby?: string;
  passage_translation?: string;
}

export interface ReadingItem {
  mondaiNumber?: number;
  mondaiName?: string;
  mondaiSubtitle?: string;
  title?: string;
  passage?: string;
  passage_ruby?: string;
  passage_translation?: string;
  passageA?: {
    title?: string;
    text: string;
    text_ruby: string;
    translation: string;
  };
  passageB?: {
    title?: string;
    text: string;
    text_ruby: string;
    translation: string;
  };
  notice?: {
    title: string;
    content: string;
    content_ruby: string;
    translation: string;
    scenario?: string;
  };
  questions?: ReadingQuestionItem[];
  question?: string;
  options?: ReadingOption[];
  explanation?: string;
  vocabulary?: {
    kanji: string;
    hiragana: string;
    meaning: string;
  }[];
}

export interface GeneratedListeningQuestion {
  id: string;
  question: string;
  question_vietnamese?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  situation?: string;
  situation_translation?: string;
  audioScript?: string;
  audioScript_ruby?: string;
  vietnameseTranslation?: string;
}

export interface GeneratedListeningItem {
  id: string;
  level: string;
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  title: string;
  situation: string;
  situation_translation?: string;
  audioScript: string;
  audioScript_ruby?: string;
  vietnameseTranslation: string;
  questions?: GeneratedListeningQuestion[];
  question?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
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
  type: "shadowing" | "translation" | "reading" | "presentation" | "ipa" | "kaiwa" | "jlpt_vocab" | "jlpt_grammar";
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
    { id: "it", name: "Công nghệ & AI", icon: "💻" },
    { id: "society", name: "Môi trường & Xã hội", icon: "🌿" },
    { id: "travel", name: "Du lịch & Ẩm thực", icon: "🍣" },
    { id: "health", name: "Y tế & Sức khỏe", icon: "🩺" },
    { id: "education", name: "Giáo dục & Tâm lý", icon: "🎓" },
    { id: "news", name: "Tin tức & Thời sự", icon: "📰" },
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

const SKILLS_BY_LANG: Record<string, { id: "kaiwa" | "shadowing" | "translation" | "reading" | "listening" | "presentation" | "jlpt_vocab" | "jlpt_grammar"; name: string; desc: string }[]> = {
  ja: [
    { id: "kaiwa", name: "💬 Hội thoại Kaiwa", desc: "10 câu đối thoại 2 người & Trắc nghiệm đọc hiểu" },
    { id: "jlpt_vocab", name: "🈁 Từ vựng & Kanji JLPT", desc: "Luyện tập Hán tự, đọc Kanji, chọn từ vựng Mondai 1 - 6" },
    { id: "jlpt_grammar", name: "📐 Ngữ pháp & Dấu ★", desc: "Chọn ngữ pháp, dựng câu dấu sao ★ Mondai 1 - 3" },
    { id: "reading", name: "📚 Đọc hiểu JLPT", desc: "Đoạn văn đề thi JLPT chia theo từng Mondai 10 - 14 & tra Mazii" },
    { id: "listening", name: "🎧 Nghe hiểu JLPT", desc: "Luyện nghe chuẩn đề thi JLPT chia theo từng Mondai 1 - 5" },
    { id: "shadowing", name: "🗣️ Shadowing JP", desc: "Luyện nghe nói đuổi tiếng Nhật kèm Furigana" },
    { id: "translation", name: "✍️ Luyện dịch 2 chiều", desc: "Xen kẽ dịch Nhật ➔ Việt & Việt ➔ Nhật" },
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
    { id: "reading", name: "📚 Đọc hiểu Leseverstehen", desc: "Đoạn văn đọc hiểu tiếng Đức Goethe A1/A2" },
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
  const router = useRouter();

  const handleAiTutorReview = (promptText: string) => {
    router.push(`/chat?prompt=${encodeURIComponent(promptText)}`);
  };

  // Language state for Practice Center
  const selectedLang = activeLanguage.code || "ja";

  // Config states
  const [selectedLevel, setSelectedLevel] = useState<string>(() => {
    const lang = activeLanguage.code || "ja";
    return lang === "de" ? "A2" : lang === "en" ? "Band 7.0" : "N2";
  });
  const [selectedType, setSelectedType] = useState<"kaiwa" | "shadowing" | "translation" | "reading" | "listening" | "presentation" | "jlpt_vocab" | "jlpt_grammar">("kaiwa");
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
    setIsGenListeningPlaying(false);
    setPlayingQuestionId(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  // Effect to auto-select valid mondai when level changes
  useEffect(() => {
    if (selectedLang === "ja") {
      const rList = getReadingMondaiConfigs(selectedLevel);
      if (rList.length > 0 && !rList.some((m) => m.mondaiNumber === selectedReadingMondai)) {
        setSelectedReadingMondai(rList[0].mondaiNumber);
      }
      const lList = getListeningMondaiConfigs(selectedLevel);
      if (lList.length > 0 && !lList.some((m) => m.mondaiNumber === selectedListeningMondai)) {
        setSelectedListeningMondai(lList[0].mondaiNumber);
      }
      const vList = getVocabMondaiConfigs(selectedLevel);
      if (vList.length > 0 && !vList.some((m) => m.mondaiNumber === selectedVocabMondai)) {
        setSelectedVocabMondai(vList[0].mondaiNumber);
      }
      const gList = getGrammarMondaiConfigs(selectedLevel);
      if (gList.length > 0 && !gList.some((m) => m.mondaiNumber === selectedGrammarMondai)) {
        setSelectedGrammarMondai(gList[0].mondaiNumber);
      }
    }
  }, [selectedLevel, selectedLang]);

  // Check JLPT Vocab answer
  const checkJlptVocabAnswer = (qItem: JLPTVocabQuestionItem) => {
    const selectedOptId = vocabAnswers[qItem.id];
    if (!selectedOptId) return;

    setVocabChecked((prev) => ({ ...prev, [qItem.id]: true }));
    const correctOpt = qItem.options.find((o) => o.isCorrect);
    const isCorrect = selectedOptId === correctOpt?.id;
    const score = isCorrect ? 100 : 0;
    const chosenOpt = qItem.options.find((o) => o.id === selectedOptId);

    recordPracticeHistory({
      type: "jlpt_vocab",
      typeName: `🈁 Từ vựng JLPT ${selectedLevel} (Mondai ${jlptVocabData?.mondaiNumber || selectedVocabMondai})`,
      topic: activeTopic,
      lang: "ja",
      score,
      userAnswer: chosenOpt?.text || selectedOptId,
      correctAnswer: correctOpt?.text || "Đáp án đúng",
      feedback: isCorrect ? "Chính xác! Bạn nắm từ vựng rất vững." : (qItem.explanation || "Chưa chính xác. Xem giải thích chi tiết bên dưới."),
    });
  };

  // Check JLPT Grammar answer
  const checkJlptGrammarAnswer = (qItem: JLPTGrammarQuestionItem) => {
    const selectedOptId = grammarAnswers[qItem.id];
    if (!selectedOptId) return;

    setGrammarChecked((prev) => ({ ...prev, [qItem.id]: true }));
    const correctOpt = qItem.options.find((o) => o.isCorrect);
    const isCorrect = selectedOptId === correctOpt?.id;
    const score = isCorrect ? 100 : 0;
    const chosenOpt = qItem.options.find((o) => o.id === selectedOptId);

    recordPracticeHistory({
      type: "jlpt_grammar",
      typeName: `📐 Ngữ pháp JLPT ${selectedLevel} (Mondai ${jlptGrammarData?.mondaiNumber || selectedGrammarMondai})`,
      topic: activeTopic,
      lang: "ja",
      score,
      userAnswer: chosenOpt?.text || selectedOptId,
      correctAnswer: correctOpt?.text || "Đáp án đúng",
      feedback: isCorrect ? "Chính xác! Cấu trúc ngữ pháp hoàn toàn đúng." : (qItem.explanation || "Chưa chính xác. Xem phân tích cấu trúc bên dưới."),
    });
  };

  // Audio player for AI generated listening
  const playGeneratedListeningAudio = (item: GeneratedListeningItem) => {
    if (typeof window === "undefined") return;
    if (isGenListeningPlaying) {
      window.speechSynthesis.cancel();
      setIsGenListeningPlaying(false);
      return;
    }

    stopAllAudio();
    setIsGenListeningPlaying(true);

    let textToSpeak = "";
    if (item.mondaiNumber === 1 || item.mondaiNumber === 2) {
      const qText = item.questions?.[0]?.question || item.question || "";
      textToSpeak = `${item.situation}。\n質問：${qText}。\n${item.audioScript}。\n質問：${qText}`;
    } else if (item.mondaiNumber === 3) {
      const qText = item.questions?.[0]?.question || item.question || "";
      textToSpeak = `${item.situation}。\n${item.audioScript}。\n質問：${qText}`;
    } else if (item.mondaiNumber === 4) {
      const opts = (item.questions?.[0]?.options || item.options || []).map((o, idx) => `${idx + 1}、${o}`).join("。\n");
      textToSpeak = `${item.situation}。\n${item.audioScript}。\n${opts}`;
    } else if (item.mondaiNumber === 5) {
      const q1 = item.questions?.[0]?.question ? `質問1：${item.questions[0].question}` : "";
      const q2 = item.questions?.[1]?.question ? `質問2：${item.questions[1].question}` : "";
      textToSpeak = `${item.situation}。\n${item.audioScript}。\n${q1}。\n${q2}`;
    } else {
      textToSpeak = `${item.situation}。\n${item.audioScript}。\n質問：${item.question || ""}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "ja-JP";
    utterance.rate = playbackRate;
    utterance.onend = () => {
      setIsGenListeningPlaying(false);
    };
    utterance.onerror = () => {
      setIsGenListeningPlaying(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Check generated reading answer
  const checkGeneratedReadingAnswer = (qItem: ReadingQuestionItem) => {
    const selectedOptId = readingAnswers[qItem.id];
    if (!selectedOptId) return;

    setReadingChecked((prev) => ({ ...prev, [qItem.id]: true }));
    const correctOpt = qItem.options.find((o) => o.isCorrect);
    const isCorrect = selectedOptId === correctOpt?.id;
    const score = isCorrect ? 100 : 0;

    const chosenOpt = qItem.options.find((o) => o.id === selectedOptId);

    recordPracticeHistory({
      type: "reading",
      typeName: `📚 Đọc hiểu JLPT ${selectedLevel} (Mondai ${readingData?.mondaiNumber || selectedReadingMondai})`,
      topic: readingData?.title || activeTopic,
      lang: "ja",
      score,
      userAnswer: chosenOpt?.text || selectedOptId,
      correctAnswer: correctOpt?.text || "Đáp án đúng",
      feedback: isCorrect ? "Chính xác! Bạn phân tích bài đọc rất tốt." : (qItem.explanation || "Chưa chính xác. Hãy đọc lại dẫn chứng trong bài."),
    });
  };

  // Check generated listening answer
  const checkGeneratedListeningAnswer = (qItem: GeneratedListeningQuestion) => {
    const selectedIdx = genListeningAnswers[qItem.id];
    if (selectedIdx === undefined) return;

    setGenListeningChecked((prev) => ({ ...prev, [qItem.id]: true }));
    const isCorrect = selectedIdx === qItem.correctAnswer;
    const score = isCorrect ? 100 : 0;

    recordPracticeHistory({
      type: "shadowing",
      typeName: `🎧 Nghe hiểu JLPT ${selectedLevel} (Mondai ${generatedListeningData?.mondaiNumber || selectedListeningMondai})`,
      topic: generatedListeningData?.title || activeTopic,
      lang: "ja",
      score,
      userAnswer: qItem.options[selectedIdx] || `Lựa chọn ${selectedIdx + 1}`,
      correctAnswer: qItem.options[qItem.correctAnswer] || `Lựa chọn ${qItem.correctAnswer + 1}`,
      feedback: isCorrect ? "Chính xác! Bạn nghe bắt thông tin rất chuẩn." : (qItem.explanation || "Chưa chính xác. Hãy mở kịch bản (Script) để nghe lại kỹ."),
    });
  };

  // Question count mode: Quick (1-5 questions) vs Full (official JLPT exam standard count)
  const [questionCountMode, setQuestionCountMode] = useState<"quick" | "full">("quick");
  const [playingQuestionId, setPlayingQuestionId] = useState<string | null>(null);
  const [showQuestionScripts, setShowQuestionScripts] = useState<Record<string, boolean>>({});
  const [showQuestionRuby, setShowQuestionRuby] = useState<Record<string, boolean>>({});

  // Play audio for an individual listening question
  const playQuestionAudio = (qItem: GeneratedListeningQuestion, mondaiNumber: number) => {
    if (typeof window === "undefined") return;
    if (playingQuestionId === qItem.id) {
      window.speechSynthesis.cancel();
      setPlayingQuestionId(null);
      return;
    }

    stopAllAudio();
    setPlayingQuestionId(qItem.id);

    let textToSpeak = "";
    if (mondaiNumber === 1 || mondaiNumber === 2) {
      const sit = qItem.situation ? `${qItem.situation}。\n` : "";
      textToSpeak = `${sit}質問：${qItem.question}。\n${qItem.audioScript || ""}。\n質問：${qItem.question}`;
    } else if (mondaiNumber === 3) {
      const sit = qItem.situation ? `${qItem.situation}。\n` : "";
      textToSpeak = `${sit}${qItem.audioScript || ""}。\n質問：${qItem.question}`;
    } else if (mondaiNumber === 4) {
      const sit = qItem.situation ? `${qItem.situation}。\n` : "";
      const opts = (qItem.options || []).map((o, idx) => `${idx + 1}、${o}`).join("。\n");
      textToSpeak = `${sit}${qItem.audioScript || ""}。\n${opts}`;
    } else {
      const sit = qItem.situation ? `${qItem.situation}。\n` : "";
      textToSpeak = `${sit}${qItem.audioScript || ""}。\n質問：${qItem.question}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "ja-JP";
    utterance.rate = playbackRate;
    utterance.onend = () => {
      setPlayingQuestionId(null);
    };
    utterance.onerror = () => {
      setPlayingQuestionId(null);
    };
    window.speechSynthesis.speak(utterance);
  };

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

  // JLPT Reading, Listening, Vocab & Grammar by Mondai states (Japanese only)
  const [selectedReadingMondai, setSelectedReadingMondai] = useState<number | "all">(10);
  const [selectedListeningMondai, setSelectedListeningMondai] = useState<number | "all">(1);
  const [selectedVocabMondai, setSelectedVocabMondai] = useState<number>(1);
  const [selectedGrammarMondai, setSelectedGrammarMondai] = useState<number>(1);

  const [generatedListeningData, setGeneratedListeningData] = useState<GeneratedListeningItem | null>(null);
  const [jlptVocabData, setJlptVocabData] = useState<JLPTVocabData | null>(null);
  const [jlptGrammarData, setJlptGrammarData] = useState<JLPTGrammarData | null>(null);

  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [readingChecked, setReadingChecked] = useState<Record<string, boolean>>({});
  const [genListeningAnswers, setGenListeningAnswers] = useState<Record<string, number>>({});
  const [genListeningChecked, setGenListeningChecked] = useState<Record<string, boolean>>({});
  const [vocabAnswers, setVocabAnswers] = useState<Record<string, string>>({});
  const [vocabChecked, setVocabChecked] = useState<Record<string, boolean>>({});
  const [grammarAnswers, setGrammarAnswers] = useState<Record<string, string>>({});
  const [grammarChecked, setGrammarChecked] = useState<Record<string, boolean>>({});

  const [showGenListeningScript, setShowGenListeningScript] = useState<boolean>(false);
  const [showGenListeningRuby, setShowGenListeningRuby] = useState<boolean>(true);
  const [isGenListeningPlaying, setIsGenListeningPlaying] = useState<boolean>(false);
  const [readingViewMode, setReadingViewMode] = useState<"ai" | "extracted">("ai");
  const [listeningViewMode, setListeningViewMode] = useState<"ai" | "extracted">("ai");
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

  const vocabMondais = useMemo(() => {
    if (selectedLang !== "ja") return [];
    return getVocabMondaiConfigs(selectedLevel);
  }, [selectedLang, selectedLevel]);

  const grammarMondais = useMemo(() => {
    if (selectedLang !== "ja") return [];
    return getGrammarMondaiConfigs(selectedLevel);
  }, [selectedLang, selectedLevel]);

  const filteredReadingPassages = useMemo(() => {
    const list = allReadingPassages.filter((p) => p.mondaiNumber === selectedReadingMondai);
    return list.length > 0 ? list : allReadingPassages;
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
    const list = allListeningQuestions.filter((q) => q.mondaiNumber === selectedListeningMondai);
    return list.length > 0 ? list : allListeningQuestions;
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
    setReadingAnswers({});
    setReadingChecked({});
    setGenListeningAnswers({});
    setGenListeningChecked({});
    setVocabAnswers({});
    setVocabChecked({});
    setGrammarAnswers({});
    setGrammarChecked({});
    setShowGenListeningScript(false);
    setIsGenListeningPlaying(false);
    setPlayingQuestionId(null);
    setShowQuestionScripts({});
    setShowQuestionRuby({});

    // Reset Kaiwa states
    setKaiwaData(null);
    setKaiwaQuizAnswers({});
    setKaiwaScores({});
    setKaiwaPlayingIdx(null);
    setKaiwaMicIdx(null);
    setIsAutoplayingKaiwa(false);

    // Reset JLPT Vocab & Grammar states
    setJlptVocabData(null);
    setJlptGrammarData(null);

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
          mondaiNumber:
            selectedType === "reading"
              ? (selectedReadingMondai === "all" ? 10 : selectedReadingMondai)
              : selectedType === "listening"
              ? (selectedListeningMondai === "all" ? 1 : selectedListeningMondai)
              : selectedType === "jlpt_vocab"
              ? selectedVocabMondai
              : selectedType === "jlpt_grammar"
              ? selectedGrammarMondai
              : undefined,
          questionCountMode,
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
          setReadingViewMode("ai");
        } else if (selectedType === "listening") {
          setGeneratedListeningData(resData.data.listening || null);
          setListeningViewMode("ai");
        } else if (selectedType === "jlpt_vocab") {
          setJlptVocabData(resData.data.jlpt_vocab || null);
        } else if (selectedType === "jlpt_grammar") {
          setJlptGrammarData(resData.data.jlpt_grammar || null);
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
        correctAnswer: readingData.options?.find((o) => o.isCorrect)?.text || opt.text,
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

  const renderQuestionCountModeToggle = (
    type: "reading" | "listening" | "jlpt_vocab" | "jlpt_grammar",
    mondaiNum: number,
    themeColor: "teal" | "amber" | "indigo" | "purple"
  ) => {
    const officialCount = getMondaiOfficialCount(type, selectedLevel, mondaiNum);
    const colorClasses = {
      teal: {
        activeText: "text-teal-700",
        activeRing: "ring-teal-200",
        badge: "bg-teal-100 text-teal-800",
      },
      amber: {
        activeText: "text-amber-700",
        activeRing: "ring-amber-200",
        badge: "bg-amber-100 text-amber-800",
      },
      indigo: {
        activeText: "text-indigo-700",
        activeRing: "ring-indigo-200",
        badge: "bg-indigo-100 text-indigo-800",
      },
      purple: {
        activeText: "text-purple-700",
        activeRing: "ring-purple-200",
        badge: "bg-purple-100 text-purple-800",
      },
    }[themeColor];

    return (
      <div className="space-y-1.5 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <span>🎯</span> Số lượng câu hỏi:
          </label>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClasses.badge}`}>
            {questionCountMode === "full" ? `Full ${officialCount} câu chuẩn đề` : "Luyện nhanh (1-5 câu)"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100/80 rounded-xl">
          <button
            type="button"
            onClick={() => setQuestionCountMode("quick")}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
              questionCountMode === "quick"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-1">⚡ Luyện nhanh</span>
            <span className="text-[10px] font-normal text-gray-400">1 - 5 câu (~3s)</span>
          </button>
          <button
            type="button"
            onClick={() => setQuestionCountMode("full")}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center gap-0.5 cursor-pointer ${
              questionCountMode === "full"
                ? `bg-white ${colorClasses.activeText} shadow-xs ring-1 ${colorClasses.activeRing}`
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-1">🏛️ Chuẩn đề thi</span>
            <span className="text-[10px] font-semibold text-gray-700">Đủ {officialCount} câu</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <AuthGuard featureName="Trung Tâm Luyện Tập & Kỹ Năng">
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 space-y-4 sm:space-y-5 pb-8 md:pb-4">
        {/* Breadcrumb Bar */}
        <BreadcrumbNav items={[{ label: "Luyện Tập AI", icon: "🏋️" }]} />

        {/* Header Banner (Compact Minimalist - Light Theme matching background) */}
        <div className={`rounded-xl sm:rounded-2xl px-3.5 py-2.5 sm:px-5 sm:py-3 shadow-2xs border transition-all duration-300 bg-gradient-to-r ${
          selectedLang === "en"
            ? "from-white via-blue-50/40 to-indigo-50/30 border-blue-100/80"
            : selectedLang === "de"
            ? "from-white via-amber-50/40 to-orange-50/30 border-amber-100/80"
            : selectedLang === "ko"
            ? "from-white via-rose-50/40 to-pink-50/30 border-rose-100/80"
            : selectedLang === "zh"
            ? "from-white via-red-50/40 to-amber-50/30 border-red-100/80"
            : "from-white via-teal-50/40 to-indigo-50/30 border-teal-100/80"
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase shrink-0 border ${
                selectedLang === "en"
                  ? "bg-blue-50 text-blue-700 border-blue-200/80"
                  : selectedLang === "de"
                  ? "bg-amber-50 text-amber-800 border-amber-200/80"
                  : selectedLang === "ko"
                  ? "bg-rose-50 text-rose-700 border-rose-200/80"
                  : selectedLang === "zh"
                  ? "bg-red-50 text-red-700 border-red-200/80"
                  : "bg-teal-50 text-teal-700 border-teal-200/80"
              }`}>
                {activeLanguage.name} ({activeLanguage.code.toUpperCase()})
              </span>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight truncate">
                  {selectedLang === "en" 
                    ? "Trung Tâm Luyện Kỹ Năng Tiếng Anh (IELTS)" 
                    : selectedLang === "de" 
                    ? "Trung Tâm Luyện Kỹ Năng Tiếng Đức (Goethe)" 
                    : "Trung Tâm Luyện Kỹ Năng Tiếng Nhật (JLPT)"}
                </h1>
                <p className="text-[11px] text-gray-500 truncate hidden sm:block">
                  {selectedLang === "en"
                    ? "Luyện Shadowing IELTS Speaking, dịch 2 chiều Anh-Việt, đọc hiểu IELTS Reading."
                    : selectedLang === "de"
                    ? "Luyện Shadowing tiếng Đức Goethe, dịch 2 chiều Đức-Việt, đọc hiểu Leseverstehen."
                    : "Luyện Shadowing Furigana, dịch thuật phản xạ 2 chiều, đọc hiểu JLPT & thuyết trình."}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowHistoryModal(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg sm:rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-3xs"
            >
              <span>📊</span>
              <span>Lịch Sử ({currentLangHistoryCount})</span>
            </button>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-xs space-y-3">
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border ${
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
              <div className="grid grid-cols-1 gap-1.5">
                {(SKILLS_BY_LANG[selectedLang] || SKILLS_BY_LANG.ja).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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

            {/* Step 3: Select Mondai for JLPT Reading / Listening */}
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
                        className={`px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-600 border-teal-600 text-white shadow-xs ring-2 ring-teal-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{isSelected ? "🔘" : "⚪"}</span>
                            <span>{m.mondaiName}</span>
                          </div>
                          <div className={`text-[10px] font-normal mt-0.5 pl-5 ${isSelected ? "text-teal-100" : "text-gray-500"}`}>
                            {m.mondaiSubtitle}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
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
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedTopic === t.name && !customTopic
                            ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
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

                {/* Step 5: Mode Selector & AI Generate Button */}
                {renderQuestionCountModeToggle("reading", Number(selectedReadingMondai), "teal")}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-md shadow-teal-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>
                      {generating
                        ? "🤖 Đang biên soạn..."
                        : questionCountMode === "full"
                        ? `✨ Biên soạn Chuẩn đề thi (${getMondaiOfficialCount("reading", selectedLevel, Number(selectedReadingMondai))} câu)`
                        : "✨ Biên soạn Đọc hiểu bằng AI"}
                    </span>
                  </div>
                  <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                    Mondai {selectedReadingMondai} • {questionCountMode === "full" ? `Full ${getMondaiOfficialCount("reading", selectedLevel, Number(selectedReadingMondai))} câu theo bộ đề` : "Luyện nhanh"} • {activeTopic}
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
                        className={`px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-amber-600 border-amber-600 text-white shadow-xs ring-2 ring-amber-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{isSelected ? "🔘" : "⚪"}</span>
                            <span>{m.mondaiName}</span>
                          </div>
                          <div className={`text-[10px] font-normal mt-0.5 pl-5 ${isSelected ? "text-amber-100" : "text-gray-500"}`}>
                            {m.mondaiSubtitle}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
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
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedTopic === t.name && !customTopic
                            ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
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

                {/* Step 5: Mode Selector & AI Generate Button */}
                {renderQuestionCountModeToggle("listening", Number(selectedListeningMondai), "amber")}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 shadow-md shadow-amber-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>
                      {generating
                        ? "🤖 Đang biên soạn..."
                        : questionCountMode === "full"
                        ? `🎧 Biên soạn Chuẩn đề thi (${getMondaiOfficialCount("listening", selectedLevel, Number(selectedListeningMondai))} câu)`
                        : "🎧 Biên soạn Nghe hiểu bằng AI"}
                    </span>
                  </div>
                  <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                    Mondai {selectedListeningMondai} • {questionCountMode === "full" ? `Full ${getMondaiOfficialCount("listening", selectedLevel, Number(selectedListeningMondai))} câu theo bộ đề` : "Luyện nhanh"} • {activeTopic}
                  </span>
                </button>
              </div>
            ) : selectedLang === "ja" && selectedType === "jlpt_vocab" ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    3. Chọn Mondai Từ vựng ({selectedLevel}) - Chọn 1:
                  </label>
                  <span className="text-[10px] text-indigo-600 font-bold">
                    Mondai {selectedVocabMondai}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {vocabMondais.map((m) => {
                    const isSelected = selectedVocabMondai === m.mondaiNumber;
                    return (
                      <button
                        key={m.mondaiNumber}
                        type="button"
                        onClick={() => setSelectedVocabMondai(m.mondaiNumber)}
                        className={`px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs ring-2 ring-indigo-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{isSelected ? "🔘" : "⚪"}</span>
                            <span>{m.mondaiName}</span>
                          </div>
                          <div className={`text-[10px] font-normal mt-0.5 pl-5 ${isSelected ? "text-indigo-100" : "text-gray-500"}`}>
                            {m.mondaiSubtitle}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                          JLPT {selectedLevel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 4: Topic Selection */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      4. Chọn chủ đề luyện tập:
                    </label>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200/60">
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
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedTopic === t.name && !customTopic
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
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
                      placeholder="Ví dụ: Đời sống công sở, Mua sắm, Động vật, Môi trường..."
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-indigo-500 shadow-3xs"
                    />
                  </div>
                </div>

                {/* Step 5: Mode Selector & AI Generate Button */}
                {renderQuestionCountModeToggle("jlpt_vocab", selectedVocabMondai, "indigo")}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>
                      {generating
                        ? "🤖 Đang biên soạn..."
                        : questionCountMode === "full"
                        ? `🈁 Biên soạn Chuẩn đề thi (${getMondaiOfficialCount("jlpt_vocab", selectedLevel, selectedVocabMondai)} câu)`
                        : "🈁 Biên soạn Từ vựng bằng AI"}
                    </span>
                  </div>
                  <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                    Mondai {selectedVocabMondai} • {questionCountMode === "full" ? `Full ${getMondaiOfficialCount("jlpt_vocab", selectedLevel, selectedVocabMondai)} câu theo bộ đề` : "Luyện nhanh"} • {activeTopic}
                  </span>
                </button>
              </div>
            ) : selectedLang === "ja" && selectedType === "jlpt_grammar" ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    3. Chọn Mondai Ngữ pháp ({selectedLevel}) - Chọn 1:
                  </label>
                  <span className="text-[10px] text-purple-600 font-bold">
                    Mondai {selectedGrammarMondai}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {grammarMondais.map((m) => {
                    const isSelected = selectedGrammarMondai === m.mondaiNumber;
                    return (
                      <button
                        key={m.mondaiNumber}
                        type="button"
                        onClick={() => setSelectedGrammarMondai(m.mondaiNumber)}
                        className={`px-3.5 py-2.5 rounded-2xl text-left text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-purple-600 border-purple-600 text-white shadow-xs ring-2 ring-purple-200"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{isSelected ? "🔘" : "⚪"}</span>
                            <span>{m.mondaiName}</span>
                          </div>
                          <div className={`text-[10px] font-normal mt-0.5 pl-5 ${isSelected ? "text-purple-100" : "text-gray-500"}`}>
                            {m.mondaiSubtitle}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                          JLPT {selectedLevel}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 4: Topic Selection */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      4. Chọn chủ đề luyện tập:
                    </label>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200/60">
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
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          selectedTopic === t.name && !customTopic
                            ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
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
                      placeholder="Ví dụ: Quan điểm cá nhân, Nhờ vả, Xin lỗi, Giải thích..."
                      className="w-full rounded-xl border border-gray-200 p-2.5 text-xs focus:outline-none focus:border-purple-500 shadow-3xs"
                    />
                  </div>
                </div>

                {/* Step 5: Mode Selector & AI Generate Button */}
                {renderQuestionCountModeToggle("jlpt_grammar", selectedGrammarMondai, "purple")}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full mt-1 py-3.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 shadow-md shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>
                      {generating
                        ? "🤖 Đang biên soạn..."
                        : questionCountMode === "full"
                        ? `📐 Biên soạn Chuẩn đề thi (${getMondaiOfficialCount("jlpt_grammar", selectedLevel, selectedGrammarMondai)} câu)`
                        : "📐 Biên soạn Ngữ pháp bằng AI"}
                    </span>
                  </div>
                  <span className="block text-[10px] font-normal opacity-90 mt-0.5">
                    Mondai {selectedGrammarMondai} • {questionCountMode === "full" ? `Full ${getMondaiOfficialCount("jlpt_grammar", selectedLevel, selectedGrammarMondai)} câu theo bộ đề` : "Luyện nhanh"} • {activeTopic}
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
                  type="button"
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
              {(kaiwaData || shadowingData.length > 0 || translationData.length > 0 || readingData || generatedListeningData || jlptVocabData || jlptGrammarData || slides.length > 0) && (
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

                      {/* Autoplay & AI Tutor Buttons */}
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <button
                          onClick={playEntireKaiwa}
                          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                            isAutoplayingKaiwa
                              ? "bg-red-500 hover:bg-red-600 text-white shadow-red-200 animate-pulse"
                              : "bg-gradient-to-r from-teal-600 to-emerald-600 hover:opacity-95 text-white shadow-teal-200"
                          }`}
                        >
                          <span>{isAutoplayingKaiwa ? "⏹️ Dừng phát" : "▶️ Phát toàn bộ (10 câu)"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const dialogText = kaiwaData.dialogue.map((t) => `${t.speaker}: ${t.japanese} (${t.meaning})`).join("\n");
                            const prompt = `Hãy đóng vai Gia sư AI. Giúp tôi phân tích & giải thích chi tiết bài hội thoại sau:\n\nChủ đề: ${kaiwaData.title}\nTình huống: ${kaiwaData.situation}\n\nNội dung hội thoại:\n${dialogText}`;
                            handleAiTutorReview(prompt);
                          }}
                          className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>🤖 Review với Gia sư AI</span>
                        </button>
                      </div>
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
                                  <div className="text-[11px] text-gray-600 leading-relaxed pt-1 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div><strong>Giải thích:</strong> {q.explanation}</div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const selectedOpt = q.options.find((o) => o.id === currentAnswer?.optionId);
                                        const correctOpt = q.options.find((o) => o.isCorrect);
                                        const prompt = `Nhờ Gia sư AI giải thích chi tiết câu hỏi sau trong bài hội thoại "${kaiwaData.title}":\n\nCâu hỏi: ${q.question} (${q.question_vietnamese || ""})\nCác lựa chọn:\n${q.options.map((o, idx) => `${idx + 1}. ${o.text}${o.isCorrect ? " (Đáp án đúng)" : ""}`).join("\n")}\n\nLựa chọn của tôi: ${selectedOpt?.text || "Chưa chọn"}\nĐáp án đúng: ${correctOpt?.text || ""}\nGiải thích: ${q.explanation}\n\nNhờ Gia sư AI giải thích kỹ hơn lý do chọn đáp án đúng và phân tích ngữ pháp liên quan.`;
                                        handleAiTutorReview(prompt);
                                      }}
                                      className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                                    >
                                      <span>🤖 Hỏi Gia sư AI về câu này</span>
                                    </button>
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
                            <button
                              onClick={() => {
                                const scoreInfo = shadowingScores[idx]
                                  ? `\nĐiểm phát âm của tôi: ${shadowingScores[idx].score}%\nGiọng nhận diện: "${shadowingScores[idx].transcript}"`
                                  : "";
                                const prompt = `Hãy đóng vai Gia sư AI tiếng Nhật. Giải thích chi tiết từ vựng, ngữ pháp, ngữ điệu và ngắt câu của câu Shadowing sau:\n\nCâu tiếng Nhật: ${item.japanese}\nRomaji: ${item.romaji}\nDịch nghĩa: ${item.meaning}${scoreInfo}`;
                                handleAiTutorReview(prompt);
                              }}
                              className="w-10 h-10 rounded-full bg-indigo-50 hover:bg-indigo-100 flex items-center justify-center text-lg text-indigo-600 transition-colors"
                              title="🤖 Hỏi Gia sư AI phân tích câu này"
                            >
                              🤖
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
                            type="button"
                            onClick={() => {
                              const userDraft = translationInputs[idx] || "";
                              const prompt = `Nhờ Gia sư AI tiếng Nhật nhận xét và chữa chi tiết bản dịch sau:\n\nHướng dịch: ${item.direction === "ja-vi" ? "Tiếng Nhật ➔ Tiếng Việt" : "Tiếng Việt ➔ Tiếng Nhật"}\nCâu gốc: ${item.source}\n${userDraft ? `Bản dịch của tôi: ${userDraft}\n` : ""}Đáp án tham khảo: ${item.target}\n${item.hint ? `Gợi ý: ${item.hint}\n` : ""}\nNhờ Gia sư AI phân tích cấu trúc, ngữ pháp và gợi ý thêm các bản dịch hay, tự nhiên hơn.`;
                              handleAiTutorReview(prompt);
                            }}
                            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>🤖 Hỏi AI sửa bài</span>
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

              {/* N2 & JLPT READING DISPLAY */}
              {selectedType === "reading" && (
                <div className="space-y-6">
                  {/* Mode Switcher when Japanese */}
                  {selectedLang === "ja" && (
                    <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl w-fit flex-wrap">
                      <button
                        type="button"
                        onClick={() => setReadingViewMode("ai")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                          readingViewMode === "ai"
                            ? "bg-white text-teal-800 shadow-xs ring-1 ring-black/5"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span>🤖 Bài AI biên soạn Mondai {selectedReadingMondai}</span>
                        {readingData && <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReadingViewMode("extracted")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                          readingViewMode === "extracted"
                            ? "bg-white text-teal-800 shadow-xs ring-1 ring-black/5"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
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
                                {readingData.mondaiName || `問題 ${selectedReadingMondai}`}
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
                                className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border ${
                                  showPassageTranslation
                                    ? "bg-teal-100 border-teal-300 text-teal-900"
                                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                }`}
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
                          ) : (readingData.passage || readingData.passage_ruby) ? (
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
                          ) : null}

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
                                    {q.passage && (
                                      <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/70 text-xs text-gray-900 space-y-2 mb-2 select-text">
                                        <div className="text-[10px] text-teal-800 font-bold uppercase tracking-wider flex items-center justify-between">
                                          <span>📖 Đoạn văn câu {qIdx + 1}:</span>
                                          <button
                                            type="button"
                                            onClick={() => playSentence(q.passage || "")}
                                            className="text-[10px] text-teal-700 hover:text-teal-900 flex items-center gap-1 font-semibold cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-teal-200"
                                          >
                                            <span>🔊 Nghe đọc đoạn này</span>
                                          </button>
                                        </div>
                                        <div className="text-xs leading-relaxed font-medium">
                                          {q.passage_ruby ? (
                                            <div dangerouslySetInnerHTML={{ __html: q.passage_ruby }} />
                                          ) : (
                                            q.passage
                                          )}
                                        </div>
                                        {showPassageTranslation && q.passage_translation && (
                                          <div className="text-[11px] text-teal-900/80 italic pt-1.5 border-t border-teal-200/50">
                                            <span className="font-bold not-italic">Dịch nghĩa: </span>
                                            {q.passage_translation}
                                          </div>
                                        )}
                                      </div>
                                    )}

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
                                            className={`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-start gap-2.5 ${optStyle}`}
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
                                        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                                          isCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                                        }`}>
                                          <div className="font-extrabold flex items-center gap-1.5 text-sm">
                                            <span>{isCorrect ? "✓ Chính xác!" : "✕ Chưa chính xác"}</span>
                                            {!isCorrect && (
                                              <span className="text-xs font-semibold">
                                                (Đáp án đúng: {correctOpt?.text})
                                              </span>
                                            )}
                                          </div>
                                          {q.explanation && (
                                            <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                              <div><strong>💡 Giải thích:</strong> {q.explanation}</div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const userOpt = q.options.find((o) => o.id === userAnsId);
                                                  const passageContent = readingData?.passage || (readingData?.passageA ? `A: ${readingData.passageA.text}\nB: ${readingData.passageB?.text}` : "");
                                                  const prompt = `Nhờ Gia sư AI giải thích chi tiết bài đọc hiểu và câu hỏi sau:\n\nTiêu đề/Mondai: ${readingData?.mondaiName || ""} - ${readingData?.title || ""}\nBài đọc:\n${passageContent}\n\nCâu hỏi: ${q.question} (${q.question_vietnamese || ""})\nCác lựa chọn:\n${q.options.map((o, idx) => `${idx + 1}. ${o.text}${o.isCorrect ? " (Đáp án đúng)" : ""}`).join("\n")}\n\nLựa chọn của tôi: ${userOpt?.text || "Chưa chọn"}\nĐáp án đúng: ${correctOpt?.text || ""}\nGiải thích: ${q.explanation}\n\nNhờ Gia sư AI giải thích chi tiết đoạn văn liên quan đến đáp án này.`;
                                                  handleAiTutorReview(prompt);
                                                }}
                                                className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                                              >
                                                <span>🤖 Hỏi Gia sư AI về câu này</span>
                                              </button>
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
                                        className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
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
                            {generating ? "🤖 Đang biên soạn bài đọc..." : `✨ Tạo bài đọc Mondai ${selectedReadingMondai} ngay`}
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
                                              <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div><strong>💡 Giải thích:</strong> {q.explanation}</div>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const userOptText = userAns !== undefined ? q.options[userAns] : "Chưa chọn";
                                                    const correctOptTexts = q.answers.map((a) => q.options[a]).join(", ");
                                                    const prompt = `Nhờ Gia sư AI giải thích chi tiết bài đọc hiểu và câu hỏi sau:\n\nBài đọc:\n${p.passageText}\n\nCâu hỏi: ${q.question}\nCác lựa chọn:\n${q.options.map((optText, idx) => `${idx + 1}. ${optText}${q.answers.includes(idx) ? " (Đáp án đúng)" : ""}`).join("\n")}\n\nLựa chọn của tôi: ${userOptText}\nĐáp án đúng: ${correctOptTexts}\nGiải thích: ${q.explanation}\n\nNhờ Gia sư AI giải thích chi tiết lý do và phân tích bài đọc liên quan.`;
                                                    handleAiTutorReview(prompt);
                                                  }}
                                                  className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                                                >
                                                  <span>🤖 Hỏi Gia sư AI về câu này</span>
                                                </button>
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
                  <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
                    <button
                      onClick={handleEvaluatePresentation}
                      disabled={isEvaluating || (!presentationTranscripts[0] && !presentationTranscripts[1])}
                      className="px-8 py-4 bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-teal-100 disabled:opacity-50 cursor-pointer"
                    >
                      {isEvaluating ? "🤖 AI Đang chấm điểm và phân tích câu..." : "🔍 Gửi AI nhận xét & Đánh giá"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const transcriptsText = slides.map((s, idx) => `Slide ${s.slide_number} (${s.title}):\n${presentationTranscripts[idx] || "(Chưa nhập nội dung)"}`).join("\n\n");
                        const evalText = evaluation ? `\n\nKết quả đánh giá hiện tại (${evaluation.comprehensibility_score}%):\nNhận xét: ${evaluation.feedback_general}` : "";
                        const prompt = `Hãy đóng vai Gia sư AI tiếng Nhật. Nhờ AI nhận xét, chữa lỗi ngữ pháp, từ vựng và tư vấn cách trình bày bài thuyết trình sau đây cho tự nhiên và thuyết phục hơn:\n\nNội dung các slide:\n${transcriptsText}${evalText}`;
                        handleAiTutorReview(prompt);
                      }}
                      className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold rounded-2xl text-xs shadow-md shadow-indigo-100 cursor-pointer flex items-center gap-2"
                    >
                      <span>🤖 Thảo luận chi tiết với Gia sư AI</span>
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

              {/* JLPT LISTENING PRACTICE BY MONDAI (When Japanese & Listening) */}
              {selectedLang === "ja" && selectedType === "listening" && (
                <div className="space-y-6">
                  {/* Mode Switcher when Japanese & Listening */}
                  <div className="flex items-center gap-2 p-1.5 bg-gray-100/90 rounded-2xl w-fit flex-wrap">
                    <button
                      type="button"
                      onClick={() => setListeningViewMode("ai")}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        listeningViewMode === "ai"
                          ? "bg-white text-amber-900 shadow-xs ring-1 ring-black/5"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <span>🤖 Bài AI biên soạn Mondai {selectedListeningMondai === "all" ? 1 : selectedListeningMondai}</span>
                      {generatedListeningData && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setListeningViewMode("extracted")}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        listeningViewMode === "extracted"
                          ? "bg-white text-amber-900 shadow-xs ring-1 ring-black/5"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <span>📑 Đề thi thật trích xuất ({filteredListeningQuestions.length} câu)</span>
                    </button>
                  </div>

                  {/* 1. AI Generated Listening View */}
                  {listeningViewMode === "ai" && (
                    <>
                      {generatedListeningData ? (
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-5">
                          {/* Card Header Bar */}
                          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black rounded-lg">
                                {generatedListeningData.mondaiName || `問題 ${selectedListeningMondai}`}
                              </span>
                              {generatedListeningData.mondaiSubtitle && (
                                <span className="text-xs font-bold text-gray-700">
                                  {generatedListeningData.mondaiSubtitle}
                                </span>
                              )}
                              {generatedListeningData.title && (
                                <span className="text-xs text-gray-500">
                                  • {generatedListeningData.title}
                                </span>
                              )}
                            </div>

                            {generatedListeningData.audioScript ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => playGeneratedListeningAudio(generatedListeningData)}
                                  className={`text-xs font-bold flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs ${
                                    isGenListeningPlaying
                                      ? "bg-amber-600 text-white animate-pulse shadow-amber-200"
                                      : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200"
                                  }`}
                                >
                                  <span>{isGenListeningPlaying ? "⏸️" : "▶️"}</span>
                                  <span>{isGenListeningPlaying ? "Dừng phát audio" : "Phát bài nghe (TTS giọng Nhật)"}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowGenListeningScript((prev) => !prev)}
                                  className={`text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-xl transition-colors cursor-pointer border ${
                                    showGenListeningScript
                                      ? "bg-indigo-600 border-indigo-600 text-white"
                                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                                  }`}
                                >
                                  📄 {showGenListeningScript ? "Ẩn Kịch bản" : "Hiện Kịch bản (Script)"}
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-800 bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-200/80 shadow-3xs flex items-center gap-1.5">
                                  <span>🏛️</span>
                                  <span>Bộ đề chuẩn thi thật ({generatedListeningData.questions?.length || 0} câu độc lập)</span>
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Situation Box */}
                          {generatedListeningData.situation && (
                            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                              <div className="flex items-center gap-1.5 font-black text-amber-800">
                                <span>📌</span>
                                <span>Tình huống (Bối cảnh bài nghe):</span>
                              </div>
                              <p className="font-bold text-sm leading-relaxed select-text">{generatedListeningData.situation}</p>
                              {generatedListeningData.situation_translation && (
                                <p className="text-xs text-amber-900/80 italic select-text">{generatedListeningData.situation_translation}</p>
                              )}
                            </div>
                          )}

                          {/* Script & Translation Accordion */}
                          {showGenListeningScript && (
                            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-3 animate-in fade-in duration-150">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">
                                    🎙️ Lời thoại bài nghe (Audio Script):
                                  </span>
                                  {generatedListeningData.audioScript_ruby && (
                                    <button
                                      type="button"
                                      onClick={() => setShowGenListeningRuby((prev) => !prev)}
                                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      🈳 {showGenListeningRuby ? "Tắt Furigana" : "Bật Furigana"}
                                    </button>
                                  )}
                                </div>
                                {generatedListeningData.audioScript_ruby && showGenListeningRuby ? (
                                  <div
                                    className="whitespace-pre-line text-gray-900 leading-loose font-medium pl-2 border-l-2 border-indigo-300 text-sm select-text"
                                    dangerouslySetInnerHTML={{ __html: generatedListeningData.audioScript_ruby }}
                                  />
                                ) : (
                                  <div className="whitespace-pre-line text-gray-900 leading-relaxed font-medium pl-2 border-l-2 border-indigo-300 select-text">
                                    {generatedListeningData.audioScript}
                                  </div>
                                )}
                              </div>

                              {generatedListeningData.vietnameseTranslation && (
                                <div className="pt-2 border-t border-indigo-100">
                                  <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-1">
                                    🌐 Bản dịch tiếng Việt:
                                  </div>
                                  <div className="whitespace-pre-line text-gray-700 leading-relaxed italic pl-2 border-l-2 border-indigo-300 select-text">
                                    {generatedListeningData.vietnameseTranslation}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Questions Section */}
                          {(() => {
                            const genQuestions: GeneratedListeningQuestion[] = generatedListeningData.questions && generatedListeningData.questions.length > 0
                              ? generatedListeningData.questions
                              : generatedListeningData.question
                              ? [
                                  {
                                    id: "q_gen_1",
                                    question: generatedListeningData.question,
                                    question_vietnamese: (generatedListeningData as any).question_translation || "",
                                    options: generatedListeningData.options || [],
                                    correctAnswer: generatedListeningData.correctAnswer ?? 0,
                                    explanation: generatedListeningData.explanation || "",
                                    audioScript: generatedListeningData.audioScript,
                                    audioScript_ruby: generatedListeningData.audioScript_ruby,
                                    vietnameseTranslation: generatedListeningData.vietnameseTranslation,
                                    situation: generatedListeningData.situation,
                                    situation_translation: (generatedListeningData as any).situation_translation,
                                  }
                                ]
                              : [];

                            return (
                              <div className="space-y-4">
                                {genQuestions.map((qItem, qIdx) => {
                                  const isChecked = !!genListeningChecked[qItem.id];
                                  const userAns = genListeningAnswers[qItem.id];
                                  const isCorrect = userAns === qItem.correctAnswer;

                                  return (
                                    <div key={qItem.id || qIdx} className="p-5 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                                      {/* Individual Situation if question has its own situation */}
                                      {qItem.situation && (
                                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-950 space-y-1">
                                          <div className="font-bold text-amber-800 text-[11px] flex items-center gap-1">
                                            <span>📌</span> Tình huống câu {qIdx + 1}:
                                          </div>
                                          <p className="font-semibold text-xs select-text">{qItem.situation}</p>
                                          {qItem.situation_translation && (
                                            <p className="text-[11px] text-amber-900/80 italic select-text">{qItem.situation_translation}</p>
                                          )}
                                        </div>
                                      )}

                                      {/* Individual Audio & Script Controls if question has its own audioScript */}
                                      {qItem.audioScript && (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                              type="button"
                                              onClick={() => playQuestionAudio(qItem, generatedListeningData.mondaiNumber)}
                                              className={`text-xs font-bold flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-3xs ${
                                                playingQuestionId === qItem.id
                                                  ? "bg-amber-600 text-white animate-pulse shadow-amber-200"
                                                  : "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200"
                                              }`}
                                            >
                                              <span>{playingQuestionId === qItem.id ? "⏸️" : "▶️"}</span>
                                              <span>{playingQuestionId === qItem.id ? "Dừng audio" : `Nghe câu ${qIdx + 1} (TTS giọng Nhật)`}</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setShowQuestionScripts(prev => ({ ...prev, [qItem.id]: !prev[qItem.id] }))}
                                              className={`text-xs font-bold flex items-center gap-1 px-3 py-2 rounded-xl transition-colors cursor-pointer border ${
                                                showQuestionScripts[qItem.id]
                                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                              }`}
                                            >
                                              📄 {showQuestionScripts[qItem.id] ? "Ẩn kịch bản câu này" : "Xem kịch bản (Script)"}
                                            </button>
                                          </div>

                                          {showQuestionScripts[qItem.id] && (
                                            <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-2 animate-in fade-in">
                                              <div>
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">
                                                    🎙️ Lời thoại câu {qIdx + 1}:
                                                  </span>
                                                  {qItem.audioScript_ruby && (
                                                    <button
                                                      type="button"
                                                      onClick={() => setShowQuestionRuby(prev => ({ ...prev, [qItem.id]: !prev[qItem.id] }))}
                                                      className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                                    >
                                                      🈳 {showQuestionRuby[qItem.id] ? "Tắt Furigana" : "Bật Furigana"}
                                                    </button>
                                                  )}
                                                </div>
                                                {qItem.audioScript_ruby && showQuestionRuby[qItem.id] ? (
                                                  <div
                                                    className="whitespace-pre-line text-gray-900 leading-loose font-medium pl-2 border-l-2 border-indigo-300 text-xs select-text"
                                                    dangerouslySetInnerHTML={{ __html: qItem.audioScript_ruby }}
                                                  />
                                                ) : (
                                                  <div className="whitespace-pre-line text-gray-900 leading-relaxed font-medium pl-2 border-l-2 border-indigo-300 select-text text-xs">
                                                    {qItem.audioScript}
                                                  </div>
                                                )}
                                              </div>

                                              {qItem.vietnameseTranslation && (
                                                <div className="pt-1.5 border-t border-indigo-100">
                                                  <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider mb-0.5">
                                                    🌐 Bản dịch tiếng Việt:
                                                  </div>
                                                  <div className="whitespace-pre-line text-gray-700 leading-relaxed italic pl-2 border-l-2 border-indigo-300 select-text text-[11px]">
                                                    {qItem.vietnameseTranslation}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="text-sm font-extrabold text-gray-900 select-text">
                                        ❓ {genQuestions.length > 1 ? `Câu hỏi ${qIdx + 1}: ` : "Câu hỏi: "}{qItem.question}
                                        {qItem.question_vietnamese && (
                                          <span className="block text-xs font-normal text-gray-500 mt-0.5 italic">
                                            {qItem.question_vietnamese}
                                          </span>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 gap-2">
                                        {qItem.options.map((optText, optIdx) => {
                                          const isSelected = userAns === optIdx;
                                          const isRight = optIdx === qItem.correctAnswer;

                                          let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-gray-50";
                                          if (isChecked) {
                                            if (isRight) {
                                              optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                            } else if (isSelected) {
                                              optStyle = "border-rose-400 bg-rose-50 text-rose-800 line-through";
                                            } else {
                                              optStyle = "border-gray-200 bg-gray-50 text-gray-400 opacity-60";
                                            }
                                          } else if (isSelected) {
                                            optStyle = "border-amber-600 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-200";
                                          }

                                          return (
                                            <button
                                              key={optIdx}
                                              type="button"
                                              disabled={isChecked}
                                              onClick={() => setGenListeningAnswers((prev) => ({ ...prev, [qItem.id]: optIdx }))}
                                              className={`w-full p-3.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${optStyle}`}
                                            >
                                              <div className="flex items-center gap-2.5">
                                                <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-bold">
                                                  {optIdx + 1}
                                                </span>
                                                <span className="leading-relaxed">{optText}</span>
                                              </div>
                                              {isChecked && isRight && <span className="text-emerald-600 font-bold text-xs">✓ Đúng</span>}
                                              {isChecked && isSelected && !isRight && <span className="text-rose-500 font-bold text-xs">✗ Sai</span>}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Check button & Feedback */}
                                      <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                                        {!isChecked ? (
                                          <button
                                            type="button"
                                            disabled={userAns === undefined}
                                            onClick={() => checkGeneratedListeningAnswer(qItem)}
                                            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                                          >
                                            Kiểm tra đáp án
                                          </button>
                                        ) : (
                                          <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                                              isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                            }`}>
                                              {isCorrect ? "🎉 Chính xác! (+100 điểm)" : `❌ Chưa chính xác (Đáp án đúng: Lựa chọn ${qItem.correctAnswer + 1})`}
                                            </span>
                                          </div>
                                        )}

                                        {isChecked && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const userOptText = userAns !== undefined ? qItem.options[userAns] : "Chưa chọn";
                                              const correctOptText = qItem.options[qItem.correctAnswer];
                                              const activeAudioScript = qItem.audioScript || generatedListeningData.audioScript;
                                              const activeTranslation = qItem.vietnameseTranslation || generatedListeningData.vietnameseTranslation;
                                              const activeSituation = qItem.situation || generatedListeningData.situation;
                                              const scriptText = activeAudioScript
                                                ? `\n\nLời thoại (Script):\n${activeAudioScript}\n\nDịch nghĩa:\n${activeTranslation || ""}`
                                                : "";
                                              const prompt = `Nhờ Gia sư AI giải thích chi tiết câu hỏi Luyện nghe hiểu JLPT ${generatedListeningData.level} (${generatedListeningData.mondaiName}: ${generatedListeningData.mondaiSubtitle}):\n\nTình huống: ${activeSituation || ""}\nTiêu đề: ${generatedListeningData.title}${scriptText}\n\nCâu hỏi: ${qItem.question}\nCác lựa chọn:\n${qItem.options.map((optText, idx) => `${idx + 1}. ${optText}${idx === qItem.correctAnswer ? " (Đáp án đúng)" : ""}`).join("\n")}\n\nLựa chọn của tôi: ${userOptText}\nĐáp án đúng: Lựa chọn ${qItem.correctAnswer + 1} (${correctOptText})\nGiải thích: ${qItem.explanation || generatedListeningData.explanation}\n\nNhờ Gia sư AI phân tích từ vựng quan trọng, bẫy thông tin và mẹo nghe hiệu quả cho dạng bài này.`;
                                              handleAiTutorReview(prompt);
                                            }}
                                            className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-3xs"
                                          >
                                            <span>🤖 Hỏi Gia sư AI về câu này</span>
                                          </button>
                                        )}
                                      </div>

                                      {/* Explanation */}
                                      {isChecked && (qItem.explanation || generatedListeningData.explanation) && (
                                        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1 animate-in fade-in">
                                          <div className="font-bold text-amber-800">💡 Lời giải chi tiết:</div>
                                          <p className="leading-relaxed">{qItem.explanation || generatedListeningData.explanation}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}

                          {/* Vocabulary List */}
                          {generatedListeningData.vocabulary && generatedListeningData.vocabulary.length > 0 && (
                            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/60 space-y-2">
                              <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                                <span>📝</span> Từ vựng trọng tâm trong bài nghe:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {generatedListeningData.vocabulary.map((vocab, vIdx) => (
                                  <div key={vIdx} className="bg-white p-2.5 rounded-xl border border-amber-100 text-xs flex items-center justify-between">
                                    <span className="font-bold text-gray-900">{vocab.kanji} ({vocab.hiragana})</span>
                                    <span className="text-gray-600">{vocab.meaning}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Regenerate CTA */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleGenerate}
                              disabled={generating}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <span>🔄</span>
                              <span>{generating ? "Đang biên soạn..." : `Tạo bài nghe Mondai ${selectedListeningMondai === "all" ? 1 : selectedListeningMondai} mới`}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-4 shadow-2xs">
                          <div className="text-4xl">🎧</div>
                          <h3 className="text-base font-extrabold text-gray-900">
                            Luyện Chuyên Sâu Nghe Hiểu JLPT {selectedLevel} (Mondai {selectedListeningMondai === "all" ? 1 : selectedListeningMondai})
                          </h3>
                          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                            Hãy chọn chủ đề và nhấn nút <strong>"🎧 Biên soạn Nghe hiểu bằng AI"</strong> ở bảng bên trái để AI tạo bài nghe kèm audio thoại, bối cảnh thực tế và câu hỏi trắc nghiệm chuẩn mẫu nhé!
                          </p>
                          <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={generating}
                            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-amber-200 transition-all cursor-pointer"
                          >
                            {generating ? "🤖 Đang biên soạn bài nghe..." : `✨ Tạo bài nghe Mondai ${selectedListeningMondai === "all" ? 1 : selectedListeningMondai} ngay`}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* 2. Extracted Past Exam Listening View */}
                  {listeningViewMode === "extracted" && (
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
                                      <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div><strong>💡 Giải thích:</strong> {item.explanation}</div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const userOptText = userAns !== undefined ? item.options[userAns] : "Chưa chọn";
                                            const correctOptText = item.options[item.correctAnswer];
                                            const scriptText = item.audioScript ? `\n\nLời thoại (Script):\n${item.audioScript}\n\nDịch nghĩa:\n${item.vietnameseTranslation}` : "";
                                            const prompt = `Nhờ Gia sư AI giải thích chi tiết câu hỏi Luyện nghe hiểu JLPT ${item.level} (${item.mondaiName}: ${item.mondaiSubtitle}):\n\nTình huống: ${item.situation}\nTiêu đề/Bài nghe: ${item.title}${scriptText}\n\nCâu hỏi: ${item.question}\nCác lựa chọn:\n${item.options.map((optText, idx) => `${idx + 1}. ${optText}${idx === item.correctAnswer ? " (Đáp án đúng)" : ""}`).join("\n")}\n\nLựa chọn của tôi: ${userOptText}\nĐáp án đúng: Lựa chọn ${item.correctAnswer + 1} (${correctOptText})\nGiải thích: ${item.explanation}\n\nNhờ Gia sư AI phân tích từ vựng quan trọng, bẫy thông tin và mẹo nghe hiệu quả cho dạng bài này.`;
                                            handleAiTutorReview(prompt);
                                          }}
                                          className="px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                                        >
                                          <span>🤖 Hỏi Gia sư AI về câu này</span>
                                        </button>
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
                </div>
              )}

              {/* JLPT VOCAB PRACTICE DISPLAY */}
              {selectedType === "jlpt_vocab" && (
                <div className="space-y-6">
                  {jlptVocabData ? (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            🈁 Từ Vựng & Kanji JLPT {selectedLevel}
                          </span>
                          <h3 className="text-base font-extrabold text-gray-900 mt-1">
                            {jlptVocabData.mondaiName}: {jlptVocabData.mondaiSubtitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={generating}
                          className="px-4 py-2 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
                        >
                          🔄 Luyện bài khác
                        </button>
                      </div>

                      {/* Questions list */}
                      <div className="space-y-6">
                        {jlptVocabData.questions.map((q, qIdx) => {
                          const isChecked = !!vocabChecked[q.id];
                          const userAnsId = vocabAnswers[q.id];
                          const correctOpt = q.options.find((o) => o.isCorrect);
                          const isCorrect = userAnsId !== undefined && userAnsId === correctOpt?.id;

                          return (
                            <div key={q.id || qIdx} className="p-5 rounded-2xl bg-indigo-50/30 border border-indigo-100/80 space-y-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                                    Câu {qIdx + 1} / {jlptVocabData.questions.length}
                                  </span>
                                  <div className="text-base font-extrabold text-gray-900 leading-relaxed">
                                    {q.question}
                                  </div>
                                  {q.question_vietnamese && (
                                    <div className="text-xs text-gray-600 italic">
                                      ({q.question_vietnamese})
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = userAnsId === opt.id;
                                  let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-indigo-50/50";
                                  if (isChecked) {
                                    if (opt.isCorrect) {
                                      optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                    } else if (isSelected) {
                                      optStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-300";
                                    } else {
                                      optStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                                    }
                                  } else if (isSelected) {
                                    optStyle = "border-indigo-500 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-300";
                                  }

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      disabled={isChecked}
                                      onClick={() => setVocabAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                                      className={`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-center gap-3 ${optStyle}`}
                                    >
                                      <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0">
                                        {optIdx + 1}
                                      </span>
                                      <span className="leading-relaxed flex-1 font-medium">{opt.text}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Check action & Feedback */}
                              <div>
                                {!isChecked ? (
                                  <button
                                    type="button"
                                    disabled={!userAnsId}
                                    onClick={() => checkJlptVocabAnswer(q)}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                        })}
                      </div>

                      {/* Vocabulary list at bottom */}
                      {jlptVocabData.vocabulary && jlptVocabData.vocabulary.length > 0 && (
                        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 pt-4">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                            Sổ tay từ vựng bài học:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {jlptVocabData.vocabulary.map((vocabItem, vIdx) => (
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
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-4 shadow-2xs">
                      <div className="text-4xl">🈁</div>
                      <h3 className="text-base font-extrabold text-gray-900">
                        Luyện Chuyên Sâu Từ Vựng & Kanji JLPT {selectedLevel} (Mondai {selectedVocabMondai})
                      </h3>
                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        Hãy chọn chủ đề và nhấn nút <strong>"🈁 Biên soạn Từ vựng bằng AI"</strong> ở bảng bên trái để AI tạo bộ câu hỏi trắc nghiệm từ vựng chuẩn thi JLPT nhé!
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-indigo-200 transition-all cursor-pointer"
                      >
                        {generating ? "🤖 Đang biên soạn bài tập..." : `🈁 Tạo bài tập Mondai ${selectedVocabMondai} ngay`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* JLPT GRAMMAR PRACTICE DISPLAY */}
              {selectedType === "jlpt_grammar" && (
                <div className="space-y-6">
                  {jlptGrammarData ? (
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            📐 Ngữ Pháp JLPT {selectedLevel}
                          </span>
                          <h3 className="text-base font-extrabold text-gray-900 mt-1">
                            {jlptGrammarData.mondaiName}: {jlptGrammarData.mondaiSubtitle}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerate}
                          disabled={generating}
                          className="px-4 py-2 rounded-2xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all cursor-pointer shadow-xs"
                        >
                          🔄 Luyện bài khác
                        </button>
                      </div>

                      {/* Questions list */}
                      <div className="space-y-6">
                        {jlptGrammarData.questions.map((q, qIdx) => {
                          const isChecked = !!grammarChecked[q.id];
                          const userAnsId = grammarAnswers[q.id];
                          const correctOpt = q.options.find((o) => o.isCorrect);
                          const isCorrect = userAnsId !== undefined && userAnsId === correctOpt?.id;
                          const isStarMondai = jlptGrammarData.mondaiNumber === 2 || q.question.includes("★");

                          return (
                            <div key={q.id || qIdx} className="p-5 rounded-2xl bg-purple-50/30 border border-purple-100/80 space-y-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                                    Câu {qIdx + 1} / {jlptGrammarData.questions.length} {isStarMondai && "⭐ (Dựng câu dấu ★)"}
                                  </span>
                                  <div className="text-base font-extrabold text-gray-900 leading-relaxed">
                                    {q.question}
                                  </div>
                                  {q.question_vietnamese && (
                                    <div className="text-xs text-gray-600 italic">
                                      ({q.question_vietnamese})
                                    </div>
                                  )}
                                  {isChecked && q.fullSentence && (
                                    <div className="mt-2 p-3 bg-purple-100/60 rounded-xl text-xs text-purple-950 font-bold border border-purple-200">
                                      ✨ Câu hoàn chỉnh: {q.fullSentence}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Options */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = userAnsId === opt.id;
                                  let optStyle = "border-gray-200 bg-white text-gray-800 hover:bg-purple-50/50";
                                  if (isChecked) {
                                    if (opt.isCorrect) {
                                      optStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-300";
                                    } else if (isSelected) {
                                      optStyle = "border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-300";
                                    } else {
                                      optStyle = "border-gray-100 bg-gray-50 text-gray-400 opacity-60";
                                    }
                                  } else if (isSelected) {
                                    optStyle = "border-purple-500 bg-purple-50 text-purple-900 font-bold ring-2 ring-purple-300";
                                  }

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      disabled={isChecked}
                                      onClick={() => setGrammarAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                                      className={`p-3.5 rounded-xl border text-left text-sm transition-all cursor-pointer flex items-center gap-3 ${optStyle}`}
                                    >
                                      <span className="w-6 h-6 rounded-full bg-black/5 flex items-center justify-center font-bold text-xs shrink-0">
                                        {optIdx + 1}
                                      </span>
                                      <span className="leading-relaxed flex-1 font-medium">{opt.text}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Check action & Feedback */}
                              <div>
                                {!isChecked ? (
                                  <button
                                    type="button"
                                    disabled={!userAnsId}
                                    onClick={() => checkJlptGrammarAnswer(q)}
                                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                                          (Cụm từ ở vị trí ★: {correctOpt?.text})
                                        </span>
                                      )}
                                    </div>
                                    {q.explanation && (
                                      <div className="text-[11px] text-gray-700 pt-1 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div><strong>💡 Phân tích ngữ pháp:</strong> {q.explanation}</div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const userOpt = q.options.find((o) => o.id === userAnsId);
                                            const fullSent = q.fullSentence ? `\nCâu hoàn chỉnh: ${q.fullSentence}` : "";
                                            const prompt = `Nhờ Gia sư AI giải thích chi tiết câu hỏi Ngữ pháp JLPT ${selectedLevel} (${jlptGrammarData.mondaiName}):\n\nCâu hỏi: ${q.question} (${q.question_vietnamese || ""})${fullSent}\nCác lựa chọn:\n${q.options.map((o, idx) => `${idx + 1}. ${o.text}${o.isCorrect ? " (Đáp án đúng)" : ""}`).join("\n")}\n\nLựa chọn của tôi: ${userOpt?.text || "Chưa chọn"}\nĐáp án đúng: ${correctOpt?.text || ""}\nPhân tích có sẵn: ${q.explanation}\n\nNhờ Gia sư AI giải thích chi tiết cấu trúc ngữ pháp này, lý do vị trí sắp xếp câu và đưa ra thêm ví dụ tương tự.`;
                                            handleAiTutorReview(prompt);
                                          }}
                                          className="px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-3xs"
                                        >
                                          <span>🤖 Hỏi Gia sư AI về câu này</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Vocabulary list at bottom */}
                      {jlptGrammarData.vocabulary && jlptGrammarData.vocabulary.length > 0 && (
                        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 pt-4">
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                            Sổ tay từ vựng bài học:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {jlptGrammarData.vocabulary.map((vocabItem, vIdx) => (
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
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-10 border border-gray-100 text-center space-y-4 shadow-2xs">
                      <div className="text-4xl">📐</div>
                      <h3 className="text-base font-extrabold text-gray-900">
                        Luyện Chuyên Sâu Ngữ Pháp JLPT {selectedLevel} (Mondai {selectedGrammarMondai})
                      </h3>
                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        Hãy chọn chủ đề và nhấn nút <strong>"📐 Biên soạn Ngữ pháp bằng AI"</strong> ở bảng bên trái để AI tạo bộ câu hỏi trắc nghiệm ngữ pháp chuẩn thi JLPT nhé!
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-md shadow-purple-200 transition-all cursor-pointer"
                      >
                        {generating ? "🤖 Đang biên soạn bài tập..." : `📐 Tạo bài tập Mondai ${selectedGrammarMondai} ngay`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* EMPTY VIEW STATE */}
              {!kaiwaData && !shadowingData.length && !translationData.length && !readingData && !slides.length && (selectedLang !== "ja" || (selectedType !== "reading" && selectedType !== "listening" && selectedType !== "jlpt_vocab" && selectedType !== "jlpt_grammar")) && (
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
