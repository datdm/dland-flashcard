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

  const level = (examData.meta.level || "N2").toUpperCase();

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
        key: `${fallbackMajorId}-mondai-general`,
        num: "",
        title: "Câu hỏi chung",
        majorId: fallbackMajorId,
      };
    }

    const match = mondaiStr.match(/(?:問題|Mondai)\s*([0-9０-９]+)/i);
    const num = match ? parseInt(match[1], 10) : "";
    let majorId = fallbackMajorId;

    // 1. Nhận diện phần thi Nghe hiểu (Listening)
    if (
      fallbackMajorId === "listening" ||
      mondaiStr.includes("聴解") ||
      mondaiStr.toLowerCase().includes("listening") ||
      mondaiStr.includes("課題理解") ||
      mondaiStr.includes("ポイント理解") ||
      mondaiStr.includes("概要理解") ||
      mondaiStr.includes("即時応答")
    ) {
      majorId = "listening";
    } else if (
      mondaiStr.includes("文章の文法") ||
      mondaiStr.includes("文法形式の判断") ||
      mondaiStr.includes("文の組み立て")
    ) {
      majorId = "grammar";
    } else if (
      mondaiStr.includes("漢字読み") ||
      mondaiStr.includes("表記") ||
      mondaiStr.includes("語形成") ||
      mondaiStr.includes("形成語") ||
      mondaiStr.includes("文脈規定") ||
      mondaiStr.includes("類義語") ||
      mondaiStr.includes("言い換え類義") ||
      mondaiStr.includes("用法")
    ) {
      majorId = "vocab";
    } else if (
      mondaiStr.includes("短文") ||
      mondaiStr.includes("中文") ||
      mondaiStr.includes("長文") ||
      mondaiStr.includes("比較") ||
      mondaiStr.includes("統合理解") ||
      mondaiStr.includes("情報検索")
    ) {
      majorId = "reading";
    } else if (typeof num === "number" && !isNaN(num) && majorId !== "listening") {
      if (level === "N1") {
        if (num >= 1 && num <= 4) majorId = "vocab";
        else if (num >= 5 && num <= 7) majorId = "grammar";
        else if (num >= 8 && num <= 13) majorId = "reading";
      } else if (level === "N2") {
        if (num >= 1 && num <= 6) majorId = "vocab";
        else if (num >= 7 && num <= 9) majorId = "grammar";
        else if (num >= 10 && num <= 14) majorId = "reading";
      } else if (level === "N3") {
        if (num >= 1 && num <= 5) majorId = "vocab";
        else if (num >= 6 && num <= 8) majorId = "grammar";
        else if (num >= 9 && num <= 12) majorId = "reading";
      } else if (level === "N4") {
        if (num >= 1 && num <= 5) majorId = "vocab";
        else if (num >= 6 && num <= 8) majorId = "grammar";
        else if (num >= 9 && num <= 11) majorId = "reading";
      } else if (level === "N5") {
        if (num >= 1 && num <= 4) majorId = "vocab";
        else if (num >= 5 && num <= 7) majorId = "grammar";
        else if (num >= 8 && num <= 10) majorId = "reading";
      } else {
        if (num >= 1 && num <= 6) majorId = "vocab";
        else if (num >= 7 && num <= 9) majorId = "grammar";
        else if (num >= 10) majorId = "reading";
      }
    }

    let title = num ? `問題 ${num}` : (mondaiStr || "Câu hỏi");
    let instruction = "";

    if (mondaiStr.includes(":") || mondaiStr.includes("：")) {
      const sep = mondaiStr.includes(":") ? ":" : "：";
      const parts = mondaiStr.split(sep);
      const rawTitle = parts[0].trim();
      const rest = parts.slice(1).join(sep).trim();

      if (rest.includes("—") || rest.includes(" - ")) {
        const dashParts = rest.split(/—| - /);
        title = `${rawTitle}: ${dashParts[0].trim()}`;
        instruction = dashParts.slice(1).join(" — ").trim();
      } else {
        title = rawTitle;
        instruction = rest;
      }
    } else {
      instruction = mondaiStr;
    }

    return {
      key: `${majorId}-mondai-${num || mondaiStr}`,
      num: num || "",
      title,
      instruction,
      majorId,
    };
  };

  // 1. Process questions
  questions.forEach((q) => {
    let fallbackMajor = (q as any).majorSection || "vocab";
    const assignedSection = sections.find((s) => s.questionIds?.includes(q.id));
    if (assignedSection) {
      if (assignedSection.name.includes("聴解") || assignedSection.name.toLowerCase().includes("listening")) {
        fallbackMajor = "listening";
      } else if (assignedSection.name.includes("読解") || (assignedSection.mondai && assignedSection.mondai.includes("10"))) {
        fallbackMajor = "reading";
      } else if (assignedSection.name.includes("文法") || (assignedSection.mondai && assignedSection.mondai.includes("7"))) {
        fallbackMajor = "grammar";
      } else if (assignedSection.name.includes("文字") || assignedSection.name.includes("語彙")) {
        fallbackMajor = "vocab";
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
    let fallbackMajor = p.majorSection || "reading";
    const assignedSection = sections.find((s) => s.passageIds?.includes(p.id));
    if (assignedSection) {
      if (assignedSection.name.includes("文法")) {
        fallbackMajor = "grammar";
      }
    }

    const info = extractMondaiInfo(p.mondai, fallbackMajor);
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

    mondaiMap.get(key)!.passageIds.push(p.id);
  });

  // Filter out questionIds that are already inside passage.questions
  const passageQIdSet = new Set<number>();
  const passageMap = new Map<string, ExamPassageGroup>();
  passages.forEach((p) => {
    passageMap.set(p.id, p);
    (p.questions || []).forEach((q) => passageQIdSet.add(q.id));
  });

  mondaiMap.forEach((m) => {
    m.questionIds = m.questionIds.filter((qid) => !passageQIdSet.has(qid));
  });

  // 3. Assemble and sort into Major Sections
  const majorSections: ExamMajorSection[] = [];

  STANDARD_MAJOR_SECTIONS.forEach((std) => {
    const mondaisForSection: (ExamMondai & { _sortOrder: number })[] = [];

    mondaiMap.forEach((m) => {
      if (m.majorSectionId === std.id) {
        // Calculate minimum question ID in this Mondai to preserve exam sequence
        let minQId = Infinity;
        m.questionIds.forEach((qid) => {
          if (qid < minQId) minQId = qid;
        });
        m.passageIds.forEach((pid) => {
          const pg = passageMap.get(pid);
          if (pg) {
            pg.questions.forEach((q) => {
              if (q.id < minQId) minQId = q.id;
            });
          }
        });

        mondaisForSection.push({
          id: m.mondaiKey,
          mondaiNumber: m.mondaiNumber,
          title: m.title,
          instruction: m.instruction,
          questionIds: m.questionIds,
          passageIds: m.passageIds,
          _sortOrder: minQId !== Infinity ? minQId : 9999,
        });
      }
    });

    // Sort mondais by question order in the exam!
    mondaisForSection.sort((a, b) => a._sortOrder - b._sortOrder);

    // If meta.sections had explicit sections not captured
    if (mondaisForSection.length === 0) {
      sections.forEach((sec) => {
        let matchStd = false;
        if (std.id === "vocab" && (sec.name.includes("語彙") || sec.name.includes("文字"))) matchStd = true;
        if (std.id === "grammar" && sec.name.includes("文法")) matchStd = true;
        if (std.id === "reading" && sec.name.includes("読解")) matchStd = true;
        if (std.id === "listening" && (sec.name.includes("聴解") || sec.name.toLowerCase().includes("listening"))) matchStd = true;

        if (matchStd) {
          mondaisForSection.push({
            id: `sec-${sec.name}`,
            mondaiNumber: sec.mondai || "",
            title: sec.mondai ? `${sec.mondai}: ${sec.name}` : sec.name,
            questionIds: sec.questionIds || [],
            passageIds: sec.passageIds || [],
            _sortOrder: (sec.questionIds && sec.questionIds[0]) || 9999,
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
        mondais: mondaisForSection.map(({ _sortOrder, ...rest }) => rest),
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

/**
 * Determines whether an exam is an official real exam ("real") or a mock practice exam ("mock")
 */
export function getExamCategory(exam: { id?: string; data?: { meta?: { title?: string; year?: string; version?: string; category?: "real" | "mock" } } }): "real" | "mock" {
  const meta = exam.data?.meta;
  if (meta?.category === "real") return "real";
  if (meta?.category === "mock") return "mock";

  const title = (meta?.title || "").toLowerCase();
  const year = (meta?.year || "").toLowerCase();
  const version = (meta?.version || "").toLowerCase();
  const id = (exam.id || "").toLowerCase();

  // Explicit mock signals
  if (id.includes("mock") || title.includes("thi thử") || title.includes("mock") || year.includes("mock")) {
    return "mock";
  }

  // Explicit real / official exam signals
  if (
    title.includes("chính thức") ||
    title.includes("đề thật") ||
    title.includes("đề thi thật") ||
    version.includes("official") ||
    version.includes("original") ||
    /20\d\d[-_]\d\d/.test(year) ||
    /20\d\d[-_]\d\d/.test(id)
  ) {
    return "real";
  }

  return "mock";
}

