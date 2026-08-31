export interface ExamSection {
  name: string;
  mondai?: string;
  questionIds: number[];
  passageIds?: string[];
  maxScore?: number;
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
}

export interface SectionResult {
  name: string;
  correct: number;
  total: number;
  score?: number;
  maxScore?: number;
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
}
