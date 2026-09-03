const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'examUtils.ts');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update extractMondaiInfo reading fallback check
const oldExtractPart = `    if (fallbackMajorId === "listening" || mondaiStr.includes("聴解") || mondaiStr.toLowerCase().includes("listening")) {
      majorId = "listening";
    } else if (typeof num === "number" && !isNaN(num)) {`;

const newExtractPart = `    if (fallbackMajorId === "listening" || mondaiStr.includes("聴解") || mondaiStr.toLowerCase().includes("listening")) {
      majorId = "listening";
    } else if (fallbackMajorId === "reading" || mondaiStr.includes("読解") || mondaiStr.toLowerCase().includes("reading")) {
      majorId = "reading";
    } else if (typeof num === "number" && !isNaN(num)) {`;

if (content.includes(oldExtractPart)) {
  content = content.replace(oldExtractPart, newExtractPart);
} else {
  console.error("oldExtractPart not found!");
}

// 2. Update questions.forEach to assign fallbackMajor properly
const oldQuestionsLoop = `  // 1. Process questions
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

    const info = extractMondaiInfo(q.mondai, fallbackMajor);`;

const newQuestionsLoop = `  // 1. Process questions
  questions.forEach((q) => {
    // Check if question belongs to a defined section or has majorSection explicitly
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

    const info = extractMondaiInfo(q.mondai, fallbackMajor);`;

if (content.includes(oldQuestionsLoop)) {
  content = content.replace(oldQuestionsLoop, newQuestionsLoop);
} else {
  console.error("oldQuestionsLoop not found!");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated examUtils.ts!");
