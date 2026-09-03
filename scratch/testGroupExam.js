const fs = require('fs');
const path = require('path');

const examData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'exams', 'jlpt-n2-2025-07.json'), 'utf8'));

// Run pure logic from examUtils.ts
const STANDARD_MAJOR_SECTIONS = [
  { id: "vocab", name: "文字・語彙" },
  { id: "grammar", name: "文法" },
  { id: "reading", name: "読解" },
  { id: "listening", name: "聴解" },
];

function extractMondaiInfo(mondaiStr, fallbackMajorId) {
  if (!mondaiStr) return { key: "general", num: "", title: "General", majorId: fallbackMajorId };
  const match = mondaiStr.match(/問題\s*([0-9０-９]+)/);
  const num = match ? parseInt(match[1], 10) : "";
  let majorId = fallbackMajorId;

  if (fallbackMajorId === "listening" || mondaiStr.includes("聴解") || mondaiStr.toLowerCase().includes("listening")) {
    majorId = "listening";
  } else if (fallbackMajorId === "reading" || mondaiStr.includes("読解") || mondaiStr.toLowerCase().includes("reading")) {
    majorId = "reading";
  } else if (typeof num === "number" && !isNaN(num)) {
    if (num >= 1 && num <= 6) majorId = "vocab";
    else if (num >= 7 && num <= 9) majorId = "grammar";
    else if (num >= 10 && num <= 14) majorId = "reading";
  }

  return {
    key: `mondai-${num || mondaiStr}`,
    num: num || "",
    title: num ? `問題 ${num}` : mondaiStr,
    majorId
  };
}

const { questions = [], passages = [], meta } = examData;
const sections = meta.sections || [];
const mondaiMap = new Map();

questions.forEach((q) => {
  let fallbackMajor = q.majorSection || "vocab";
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
      title: info.title,
      majorSectionId: info.majorId,
      questionIds: []
    });
  }
  mondaiMap.get(key).questionIds.push(q.id);
});

STANDARD_MAJOR_SECTIONS.forEach((std) => {
  console.log(`\n=== [${std.name}] (id: ${std.id}) ===`);
  mondaiMap.forEach((m) => {
    if (m.majorSectionId === std.id) {
      console.log(`  - ${m.title}: [${m.questionIds.join(", ")}]`);
    }
  });
});
