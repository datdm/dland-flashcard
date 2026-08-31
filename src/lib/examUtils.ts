import {
  ExamData,
  ExamMajorSection,
  ExamMondai,
  ExamQuestion,
  ExamPassageGroup,
} from "@/types/exam";

// Standard JLPT Major Sections
export const STANDARD_MAJOR_SECTIONS = [
  {
    id: "vocab",
    name: "文字・語彙 (Chữ Hán & Từ vựng)",
    japaneseName: "言語知識（文字・語彙）",
    icon: "🔤",
    color: "indigo",
  },
  {
    id: "grammar",
    name: "文法 (Ngữ pháp & Dựng câu)",
    japaneseName: "言語知識（文法）",
    icon: "📖",
    color: "purple",
  },
  {
    id: "reading",
    name: "読解 (Đọc hiểu Đoạn văn)",
    japaneseName: "読解",
    icon: "📄",
    color: "emerald",
  },
  {
    id: "listening",
    name: "聴解 (Nghe hiểu)",
    japaneseName: "聴解",
    icon: "🎧",
    color: "amber",
  },
];

/**
 * Normalizes and structures an exam into standard Major Sections & Mondai groups
 */
export function getStructuredMajorSections(examData: ExamData): ExamMajorSection[] {
  if (examData.meta.majorSections && examData.meta.majorSections.length > 0) {
    return examData.meta.majorSections;
  }

  const { questions = [], passages = [], meta } = examData;
  const sections = meta.sections || [];

  // Group standalone questions by Mondai
  const mondaiMap = new Map<string, {
    mondaiKey: string;
    mondaiNumber: number | string;
    title: string;
    instruction?: string;
    majorSectionId: string;
    questionIds: number[];
    passageIds: string[];
  }>();

  // Helper to extract Mondai info
  const extractMondaiInfo = (
    mondaiStr?: string,
    fallbackMajorId: string = "vocab"
  ): {
    key: string;
    num: number | string;
    title: string;
    instruction?: string;
    majorId: string;
  } => {
    if (!mondaiStr) {
      return {
        key: "mondai-general",
        num: "",
        title: "Câu hỏi chung",
        majorId: fallbackMajorId,
      };
    }

    const match = mondaiStr.match(/問題\s*([0-9０-９]+)/);
    const num = match ? parseInt(match[1], 10) : "";
    let majorId = fallbackMajorId;

    if (typeof num === "number" && !isNaN(num)) {
      if (num >= 1 && num <= 6) majorId = "vocab";
      else if (num >= 7 && num <= 9) majorId = "grammar";
      else if (num >= 10) majorId = "reading";
    }

    let title = `問題 ${num}`;
    let instruction = mondaiStr;

    if (mondaiStr.includes(":")) {
      const parts = mondaiStr.split(":");
      title = parts[0].trim();
      instruction = parts.slice(1).join(":").trim();
    } else if (mondaiStr.includes("：")) {
      const parts = mondaiStr.split("：");
      title = parts[0].trim();
      instruction = parts.slice(1).join("：").trim();
    }

    return {
      key: `mondai-${num || mondaiStr}`,
      num: num || "",
      title,
      instruction,
      majorId,
    };
  };

  // 1. Process questions
  questions.forEach((q) => {
    // Check if question belongs to a defined section
    let assignedSection = sections.find((s) => s.questionIds?.includes(q.id));
    let fallbackMajor = "vocab";
    if (assignedSection) {
      if (assignedSection.name.includes("文法") || (assignedSection.mondai && assignedSection.mondai.includes("7"))) {
        fallbackMajor = "grammar";
      } else if (assignedSection.name.includes("読解") || (assignedSection.mondai && assignedSection.mondai.includes("10"))) {
        fallbackMajor = "reading";
      }
    }

    const info = extractMondaiInfo(q.mondai, fallbackMajor);
    const key = `${info.majorId}_${info.key}`;

    if (!mondaiMap.has(key)) {
      mondaiMap.set(key, {
        mondaiKey: info.key,
        mondaiNumber: info.num,
        title: info.title,
        instruction: info.instruction,
        majorSectionId: info.majorId,
        questionIds: [],
        passageIds: [],
      });
    }

    mondaiMap.get(key)!.questionIds.push(q.id);
  });

  // 2. Process passages
  passages.forEach((p) => {
    const info = extractMondaiInfo(p.mondai, "reading");
    const key = `reading_${info.key}`;

    if (!mondaiMap.has(key)) {
      mondaiMap.set(key, {
        mondaiKey: info.key,
        mondaiNumber: info.num,
        title: info.title,
        instruction: info.instruction,
        majorSectionId: "reading",
        questionIds: [],
        passageIds: [],
      });
    }

    mondaiMap.get(key)!.passageIds.push(p.id);
  });

  // 3. Assemble into Major Sections
  const majorSections: ExamMajorSection[] = [];

  STANDARD_MAJOR_SECTIONS.forEach((std) => {
    const mondaisForSection: ExamMondai[] = [];

    mondaiMap.forEach((m) => {
      if (m.majorSectionId === std.id) {
        mondaisForSection.push({
          id: m.mondaiKey,
          mondaiNumber: m.mondaiNumber,
          title: m.title,
          instruction: m.instruction,
          questionIds: m.questionIds,
          passageIds: m.passageIds,
        });
      }
    });

    // If meta.sections had explicit sections not captured
    if (mondaisForSection.length === 0) {
      sections.forEach((sec) => {
        let matchStd = false;
        if (std.id === "vocab" && sec.name.includes("語彙")) matchStd = true;
        if (std.id === "grammar" && sec.name.includes("文法")) matchStd = true;
        if (std.id === "reading" && sec.name.includes("読解")) matchStd = true;
        if (std.id === "listening" && sec.name.includes("聴解")) matchStd = true;

        if (matchStd) {
          mondaisForSection.push({
            id: `sec-${sec.name}`,
            mondaiNumber: sec.mondai || "",
            title: sec.mondai ? `${sec.mondai}: ${sec.name}` : sec.name,
            questionIds: sec.questionIds || [],
            passageIds: sec.passageIds || [],
          });
        }
      });
    }

    if (mondaisForSection.length > 0) {
      majorSections.push({
        id: std.id,
        name: std.name,
        japaneseName: std.japaneseName,
        icon: std.icon,
        mondais: mondaisForSection,
      });
    }
  });

  return majorSections.length > 0
    ? majorSections
    : [
        {
          id: "general",
          name: "Toàn bộ bài thi",
          japaneseName: "全問題",
          icon: "📝",
          mondais: [
            {
              id: "all",
              mondaiNumber: "1",
              title: "Tất cả câu hỏi",
              questionIds: questions.map((q) => q.id),
              passageIds: passages.map((p) => p.id),
            },
          ],
        },
      ];
}
