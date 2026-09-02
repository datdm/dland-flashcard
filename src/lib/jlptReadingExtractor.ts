import { getAllExams } from "./examStorage";
import { ExamPassageGroup } from "@/types/exam";

export interface ExtractedReadingPassage {
  id: string;
  examId: string;
  examTitle: string;
  level: string;
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  passageTitle?: string;
  passageText: string;
  questions: {
    id: number;
    question: string;
    options: string[];
    answers: number[];
    explanation?: string;
  }[];
}

export interface ReadingMondaiInfo {
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  count: number;
}

const MONDAI_SUBTITLES: Record<string, Record<number, string>> = {
  N1: {
    8: "Đoạn văn ngắn (短文)",
    9: "Đoạn văn trung (中文)",
    10: "Đoạn văn dài (長文)",
    11: "Đọc hiểu tích hợp / So sánh (統合理解)",
    12: "Bài luận / Luận giải (主張理解)",
    13: "Tìm kiếm thông tin (情報検索)",
  },
  N2: {
    10: "Đoạn văn ngắn (短文)",
    11: "Đoạn văn trung (中文)",
    12: "Đọc hiểu tích hợp / So sánh (統合理解)",
    13: "Đoạn văn dài (長文)",
    14: "Tìm kiếm thông tin (情報検索)",
  },
  N3: {
    9: "Đoạn văn ngắn (短文)",
    10: "Đoạn văn trung (中文)",
    11: "Đoạn văn dài (長文)",
    12: "Tìm kiếm thông tin (情報検索)",
  },
  N4: {
    8: "Đoạn văn ngắn (短文)",
    9: "Đoạn văn trung (中文)",
    10: "Tìm kiếm thông tin (情報検索)",
  },
  N5: {
    8: "Đoạn văn ngắn (短文)",
    9: "Đoạn văn trung (中文)",
    10: "Tìm kiếm thông tin (情報検索)",
  },
};

export function getAllExtractedReadingPassages(): ExtractedReadingPassage[] {
  const exams = getAllExams();
  const passagesList: ExtractedReadingPassage[] = [];

  exams.forEach((exam) => {
    const level = (exam.data.meta.level || "N2").toUpperCase();
    const passages = exam.data.passages || [];

    passages.forEach((p: ExamPassageGroup) => {
      // Determine if reading passage or grammar passage
      // Grammar passages are typically Mondai 9 in N2, or majorSection === "grammar"
      if (p.majorSection === "grammar") return;

      let mondaiNum: number =
        typeof p.mondaiNumber === "number"
          ? p.mondaiNumber
          : parseInt(String(p.mondaiNumber || 0), 10) || 0;
      let mondaiTitle = p.mondai || "";

      // If not parsed, extract from mondai string
      if (!mondaiNum && mondaiTitle) {
        const m = mondaiTitle.match(/問題\s*([0-9０-９]+)/);
        if (m) mondaiNum = parseInt(m[1], 10);
      }

      // Default mondai numbers per level if still 0
      if (!mondaiNum) {
        mondaiNum = level === "N2" ? 10 : level === "N3" ? 9 : 8;
      }

      const subtitlesForLevel: Record<number, string> = MONDAI_SUBTITLES[level] || MONDAI_SUBTITLES.N2 || {};
      const subtitle = subtitlesForLevel[Number(mondaiNum)] || (mondaiTitle ? mondaiTitle.replace(/問題\s*[0-9０-９]+[:：]?\s*/, "") : "Đọc hiểu");

      const name = `問題 ${mondaiNum}`;

      passagesList.push({
        id: `${exam.id}-${p.id}`,
        examId: exam.id,
        examTitle: exam.data.meta.title,
        level,
        mondaiNumber: mondaiNum,
        mondaiName: name,
        mondaiSubtitle: subtitle,
        passageTitle: p.passageTitle,
        passageText: p.passageText,
        questions: p.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          answers: q.answers,
          explanation: q.explanation,
        })),
      });
    });
  });

  return passagesList;
}

export function getReadingMondaisForLevel(level: string): ReadingMondaiInfo[] {
  const allPassages = getAllExtractedReadingPassages().filter(
    (p) => p.level.toUpperCase() === level.toUpperCase()
  );

  const map = new Map<number, { count: number; name: string; subtitle: string }>();

  // Pre-seed known Mondais for this level from JLPT structure
  const subMap = MONDAI_SUBTITLES[level.toUpperCase()] || {};
  Object.entries(subMap).forEach(([numStr, sub]) => {
    const num = parseInt(numStr, 10);
    map.set(num, { count: 0, name: `問題 ${num}`, subtitle: sub });
  });

  // Count actual passages
  allPassages.forEach((p) => {
    const existing = map.get(p.mondaiNumber) || {
      count: 0,
      name: p.mondaiName,
      subtitle: p.mondaiSubtitle,
    };
    existing.count += 1;
    map.set(p.mondaiNumber, existing);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([num, val]) => ({
      mondaiNumber: num,
      mondaiName: val.name,
      mondaiSubtitle: val.subtitle,
      count: val.count,
    }));
}
