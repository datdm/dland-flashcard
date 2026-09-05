export interface ExamSection {
  name: string;
  mondai?: string;
  questionIds: number[];
  passageIds?: string[];
  maxScore?: number;
}

export interface ExamMondai {
  id: string; // e.g. "mondai-1"
  mondaiNumber: number | string; // e.g. 1, 2, 7...
  title: string; // e.g. "問題 1: 漢字読み (Cách đọc Kanji)"
  instruction?: string; // e.g. "＿＿の言葉の読み方として最もよいものを、1・2・3・4から一つ選びなさい。"
  questionIds: number[];
  passageIds?: string[];
}

export interface ExamMajorSection {
  id: string; // "vocab" | "grammar" | "reading" | "listening"
  name: string; // "文字・語彙 (Chữ Hán & Từ vựng)"
  japaneseName: string; // "言語知識（文字・語彙）"
  icon: string; // "🔤" | "📖" | "📄" | "🎧"
  mondais: ExamMondai[];
}

export interface ExamMeta {
  title: string;
  subject: string;
  level: "N1" | "N2" | "N3" | "N4" | "N5" | string;
  exam: string;
  version?: string;
  totalQuestions: number;
  timeLimit: number; // in seconds (e.g. 105 mins = 6300s for N2)
  sections: ExamSection[];
  majorSections?: ExamMajorSection[];
  passMark?: number; // e.g. 90/180
  description?: string;
  year?: string;
}

export interface ExamQuestion {
  id: number;
  question: string;
  type: "single" | "multiple";
  options: string[];
  answers: number[]; // 0-indexed correct option indices (e.g. [2] for ③)
  explanation?: string;
  audioUrl?: string;
  mondai?: string;
  mondaiNumber?: number | string;
  majorSection?: string; // "vocab" | "grammar" | "reading" | "listening"
}

export interface ExamSubQuestion {
  id: number;
  question: string;
  type: "single" | "multiple";
  options: string[];
  answers: number[];
  explanation?: string;
  audioUrl?: string;
}

export interface ExamPassageGroup {
  kind: "passage";
  id: string;
  mondai?: string;
  mondaiNumber?: number | string;
  majorSection?: string; // "reading"
  passageTitle?: string;
  passageText: string;
  passageAudioUrl?: string;
  questions: ExamSubQuestion[];
}

export interface ExamData {
  meta: ExamMeta;
  questions: ExamQuestion[];
  passages?: ExamPassageGroup[];
}

export interface StoredExam {
  id: string;
  uploadedAt: string;
  data: ExamData;
  isBuiltin?: boolean;
}

export interface ExamProgress {
  examId: string;
  userId?: string;
  answers: Record<number, number[]>;
  startedAt: number;
  timeRemaining: number;
  selectedSectionIds?: string[];
}

export interface MondaiResult {
  mondaiTitle: string;
  correct: number;
  total: number;
}

export interface SectionResult {
  name: string;
  majorSectionId?: string;
  correct: number;
  total: number;
  score?: number;
  maxScore?: number;
  mondaiResults?: MondaiResult[];
}

export interface ExamResult {
  id: string;
  examId: string;
  userId?: string;
  examTitle: string;
  subject: string;
  level: string;
  finishedAt: string;
  totalQuestions: number;
  correctCount: number;
  sectionResults: SectionResult[];
  answers: Record<number, number[]>;
  timeTaken: number;
  passed: boolean;
  scorePercentage: number;
  selectedSectionIds?: string[];
  maxScore?: number;
  scaledScore?: number;
}
