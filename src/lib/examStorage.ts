import { StoredExam, ExamData, ExamProgress, ExamResult, SectionResult } from "@/types/exam";
import { autoSync } from "./syncService";

// Built-in exams
import n2Exam2025 from "@/data/exams/jlpt-n2-2025-07.json";
import n2Exam2022 from "@/data/exams/jlpt-n2-2022-07.json";
import n3ExamMock from "@/data/exams/jlpt-n3-mock.json";
import n5ExamMock from "@/data/exams/jlpt-n5-mock.json";

const STORAGE_KEYS = {
  CUSTOM_EXAMS: "dland_custom_exams",
  RESULTS: "dland_exam_results",
  PROGRESS_PREFIX: "dland_exam_progress_",
  PRACTICE_HISTORY: "flashcash-practice-history",
};

export const BUILTIN_EXAMS: StoredExam[] = [
  {
    id: "jlpt-n2-2025-07",
    uploadedAt: "2025-07-01T00:00:00Z",
    data: n2Exam2025 as unknown as ExamData,
    isBuiltin: true,
  },
  {
    id: "jlpt-n2-2022-07",
    uploadedAt: "2022-07-01T00:00:00Z",
    data: n2Exam2022 as unknown as ExamData,
    isBuiltin: true,
  },
  {
    id: "jlpt-n3-mock-01",
    uploadedAt: "2025-01-01T00:00:00Z",
    data: n3ExamMock as unknown as ExamData,
    isBuiltin: true,
  },
  {
    id: "jlpt-n5-mock-01",
    uploadedAt: "2025-01-01T00:00:00Z",
    data: n5ExamMock as unknown as ExamData,
    isBuiltin: true,
  },
];

// Get all available exams (builtin + custom uploaded)
export function getAllExams(): StoredExam[] {
  if (typeof window === "undefined") return BUILTIN_EXAMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAMS);
    const customExams: StoredExam[] = raw ? JSON.parse(raw) : [];
    return [...BUILTIN_EXAMS, ...customExams];
  } catch {
    return BUILTIN_EXAMS;
  }
}

// Get specific exam by ID
export function getExamById(id: string): StoredExam | null {
  const all = getAllExams();
  return all.find((e) => e.id === id) || null;
}

// Save custom exam (uploaded via JSON)
export function saveCustomExam(examData: ExamData): StoredExam {
  const id = `custom-exam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const stored: StoredExam = {
    id,
    uploadedAt: new Date().toISOString(),
    data: examData,
    isBuiltin: false,
  };

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAMS);
      const custom: StoredExam[] = raw ? JSON.parse(raw) : [];
      custom.unshift(stored);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_EXAMS, JSON.stringify(custom));
      window.dispatchEvent(new CustomEvent("exams-updated"));
      autoSync();
    } catch (e) {
      console.error("Save custom exam error:", e);
    }
  }

  return stored;
}

// Delete custom exam
export function deleteCustomExam(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXAMS);
    const custom: StoredExam[] = raw ? JSON.parse(raw) : [];
    const filtered = custom.filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_EXAMS, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("exams-updated"));
    autoSync();
    return true;
  } catch {
    return false;
  }
}

// Progress during exam taking
export function getExamProgress(examId: string): ExamProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.PROGRESS_PREFIX}${examId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasExamProgress(examId: string): boolean {
  const progress = getExamProgress(examId);
  if (!progress) return false;
  const hasAnswers = Object.keys(progress.answers || {}).length > 0;
  return hasAnswers && progress.timeRemaining > 0;
}

export function saveExamProgress(progress: ExamProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.PROGRESS_PREFIX}${progress.examId}`,
      JSON.stringify(progress)
    );
    window.dispatchEvent(new CustomEvent("exam-progress-updated", { detail: { examId: progress.examId } }));
  } catch {}
}

export function clearExamProgress(examId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_KEYS.PROGRESS_PREFIX}${examId}`);
    window.dispatchEvent(new CustomEvent("exam-progress-updated", { detail: { examId } }));
    autoSync();
  } catch {}
}

// Exam Results
export function getAllResults(): ExamResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getResultById(id: string): ExamResult | null {
  const list = getAllResults();
  return list.find((r) => r.id === id) || null;
}

export function saveExamResult(result: ExamResult): void {
  if (typeof window === "undefined") return;
  try {
    const list = getAllResults();
    list.unshift(result);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(list.slice(0, 100)));

    // Also record into global practice-history for timeline & streak
    const pracRaw = localStorage.getItem(STORAGE_KEYS.PRACTICE_HISTORY);
    const pracList = pracRaw ? JSON.parse(pracRaw) : [];
    const pracEntry = {
      id: `exam-${result.id}`,
      type: "jlpt_exam",
      typeName: `Thi thử JLPT ${result.level}`,
      topic: result.examTitle,
      lang: "ja",
      score: result.scorePercentage,
      correctCount: result.correctCount,
      totalQuestions: result.totalQuestions,
      completedAt: result.finishedAt,
      timeTaken: result.timeTaken,
      passed: result.passed,
    };
    pracList.unshift(pracEntry);
    localStorage.setItem(STORAGE_KEYS.PRACTICE_HISTORY, JSON.stringify(pracList.slice(0, 150)));

    window.dispatchEvent(new CustomEvent("practice-history-updated"));
    window.dispatchEvent(new CustomEvent("exam-results-updated"));
    autoSync();
  } catch (e) {
    console.error("Failed to save exam result:", e);
  }
}

export function getResultsByExamId(examId: string): ExamResult[] {
  const list = getAllResults();
  return list.filter((r) => r.examId === examId);
}

export function deleteExamResult(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = getAllResults();
    const updated = list.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("exam-results-updated"));
    autoSync();
  } catch (e) {
    console.error("Failed to delete exam result:", e);
  }
}

export function generateExamId(): string {
  return `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}
