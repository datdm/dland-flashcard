"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNotebooks } from "@/hooks/useNotebooks";
import { searchJapaneseDictionary } from "@/lib/services/dictionaryService";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";
import AddToNotebookModal from "@/components/AddToNotebookModal";
import AuthGuard from "@/components/AuthGuard";

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

const POPULAR_TOPICS = [
  { id: "daily", name: "Sinh hoạt & Đời sống", icon: "🏡" },
  { id: "business", name: "Kinh doanh & Công sở", icon: "💼" },
  { id: "it", name: "Công nghệ & IT", icon: "💻" },
  { id: "travel", name: "Du lịch & Ẩm thực", icon: "🍣" },
  { id: "news", name: "Tin tức & Xã hội", icon: "📰" },
];

export default function PracticeHubPage() {
  const { notebooks, addVocab, checkDuplicate } = useNotebooks();
  const recognitionRef = useRef<any>(null);
  const { activeLanguage } = useLanguageSetting();

  // Config states
  const [selectedType, setSelectedType] = useState<"shadowing" | "translation" | "reading" | "presentation">("shadowing");
  const [selectedTopic, setSelectedTopic] = useState("Sinh hoạt & Đời sống");
  const [customTopic, setCustomTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setGenerating(true);
    setError(null);
    setSelectedOptionId(null);
    setShowAnswerIdx({});
    setTranslationInputs({});
    setShowPassageTranslation(false);

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
          level: selectedType === "reading" ? "N2" : "N3", // N2 level reading by default, others N3
          lang: activeLanguage.code,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể kết nối với máy chủ AI. Vui lòng thử lại!");
      }

      const resData = await res.json();
      if (resData.success && resData.data) {
        if (selectedType === "shadowing") {
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

  // Play audio TTS
  const playSentence = (text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = playbackRate;
    window.speechSynthesis.speak(utterance);
  };

  // Speech recognition for shadowing
  const startShadowingMic = (targetText: string, index: number) => {
    if (typeof window === "undefined") return;
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
    recognition.lang = activeLanguage.code === "de" ? "de-DE" : activeLanguage.code === "en" ? "en-US" : "ja-JP";
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
          return currentText ? `${currentText} ${finalTranscript}` : finalTranscript;
        });
      }
    };

    recognition.onerror = () => {
      setRecognitionTranscript("Không nhận diện được. Thử lại!");
      setRecognizingIndex(null);
    };

    recognition.onend = () => {
      setRecognizingIndex(null);
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
    recognition.lang = activeLanguage.code === "de" ? "de-DE" : activeLanguage.code === "en" ? "en-US" : "ja-JP";
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
          lang: activeLanguage.code,
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
      } else {
        throw new Error(resData.error || "Không thể nhận xét bài thuyết trình. Thử lại sau!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi đánh giá.");
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

  const handlePassageClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const rubyElement = target.closest("ruby");
    if (!rubyElement) return;

    // Clone ruby element to strip <rt> tags and get the clean kanji text
    const clone = rubyElement.cloneNode(true) as HTMLElement;
    const rts = clone.querySelectorAll("rt");
    rts.forEach((rt) => rt.remove());
    const kanji = clone.textContent?.trim() || "";

    // Get the hiragana/furigana text from <rt> tag
    const rtElement = rubyElement.querySelector("rt");
    const hiragana = rtElement?.textContent?.trim() || "";

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

    // Open the notebook modal with this word
    setSelectedWordForNotebook({
      kanji,
      hiragana,
      meaning
    });
    setDuplicateError(null);
  };

  return (
    <AuthGuard featureName="Trung Tâm Luyện Tập & Kỹ Năng">
      <div className="p-4 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-indigo-900 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6">
        <div>
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
            JP Practice Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Trung Tâm Luyện Kỹ Năng Chuyên Sâu
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-2 leading-relaxed">
            Luyện Shadowing phát âm chuẩn, dịch thuật 2 chiều phản xạ nhanh, và luyện thuyết trình slide nhờ AI chỉnh sửa lỗi sai ngữ pháp, gợi ý diễn đạt tự nhiên như người Nhật.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>🛠️</span> Cấu hình bài luyện tập
            </h2>

            {/* Select Skill */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Kỹ năng học:</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "shadowing", name: "🗣️ Shadowing JP", desc: "Luyện nghe nói đuổi" },
                  { id: "translation", name: "✍️ Luyện dịch 2 chiều", desc: "Xen kẽ dịch Nhật-Việt & Việt-Nhật" },
                  { id: "reading", name: "📚 Đọc hiểu JLPT N2", desc: "Đọc hiểu tiếng Nhật Furigana" },
                  { id: "presentation", name: "🎤 Luyện thuyết trình", desc: "Nói qua micro, AI sửa câu & chấm điểm" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedType(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      selectedType === item.id
                        ? "border-teal-600 bg-teal-50/50 ring-2 ring-teal-300"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs font-bold text-gray-800">{item.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Topic */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Chọn chủ đề có sẵn:</label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_TOPICS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTopic(t.name);
                      setCustomTopic("");
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      selectedTopic === t.name && !customTopic
                        ? "bg-teal-600 border-teal-600 text-white shadow-xs"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {t.icon} {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Topic Input */}
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

            {/* Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className={`w-full py-3.5 rounded-2xl text-xs font-bold text-white transition-all shadow-md ${
                generating
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-95 shadow-teal-200"
              }`}
            >
              {generating ? "🤖 Đang biên soạn nội dung..." : "🚀 Tạo bài luyện tập bằng AI"}
            </button>
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
                              className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1"
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

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setShowAnswerIdx((prev) => ({ ...prev, [idx]: !prev[idx] }))
                            }
                            className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 shadow-2xs transition-colors"
                          >
                            {isShown ? "Ẩn đáp án" : "Xem đáp án"}
                          </button>
                        </div>

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
                      Bài đọc hiểu N2
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => playSentence(readingData.passage)}
                        className="text-xs text-teal-600 hover:text-teal-800 font-bold flex items-center gap-1"
                      >
                        🔊 Nghe bài đọc
                      </button>
                      <button
                        onClick={() => setShowPassageTranslation((prev) => !prev)}
                        className={`text-xs font-bold flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors ${
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
                  <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/50 leading-loose text-base text-gray-800 font-semibold tracking-wide">
                    <div className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-2">Bài đọc (Passage):</div>
                    <div 
                      className="whitespace-pre-line text-gray-900 leading-loose ruby-box"
                      dangerouslySetInnerHTML={{ __html: readingData.passage_ruby }}
                      onClick={handlePassageClick}
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
                            <button
                              onClick={() => {
                                setSelectedWordForNotebook(vocabItem);
                                setDuplicateError(null);
                              }}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg transition-all shrink-0"
                            >
                              + Sổ tay
                            </button>
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
                      let btnStyle = "border-gray-200 bg-white hover:bg-gray-50 text-gray-700";

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
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={`w-full p-4 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt.text}</span>
                          {isAnswered && opt.isCorrect && <span className="text-emerald-600 font-extrabold text-sm">✓</span>}
                          {isAnswered && isThisSelected && !opt.isCorrect && <span className="text-red-600 font-extrabold text-sm">✕</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation reveal */}
                  {selectedOptionId && (
                    <div className="mt-4 p-4 bg-teal-50/30 rounded-2xl border border-teal-100/50 text-xs leading-relaxed space-y-2">
                      <div className="font-extrabold text-teal-800 flex items-center gap-1">
                        <span>💡</span> Hướng dẫn giải nghĩa & Ngữ pháp N2:
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

              {/* EMPTY VIEW STATE */}
              {!shadowingData.length && !translationData.length && !readingData && !slides.length && (
                <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <div className="text-4xl">🏆</div>
                  <h3 className="font-bold text-gray-900 text-sm mt-2">Chưa chọn nội dung học</h3>
                  <p className="text-[11px] text-gray-500 max-w-sm">
                    Vui lòng chọn kỹ năng và chủ đề bạn muốn luyện ở bảng điều khiển bên trái, sau đó nhấn nút "Tạo bài học AI" để tạo nội dung luyện tập chuyên sâu!
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
