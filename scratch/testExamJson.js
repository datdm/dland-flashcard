const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'exams', 'jlpt-n2-2025-07.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log("Exam Title:", data.meta.title);
console.log("Total Sections:", data.meta.sections.length);
data.meta.sections.forEach(s => {
  console.log(`- Section ${s.name}: ${s.questionIds?.length || 0} questions`);
});

// Count total questions across exam.questions and exam.passages
let passageQuestionsCount = 0;
if (data.passages) {
  data.passages.forEach(p => {
    passageQuestionsCount += (p.questions || []).length;
  });
}
console.log("Direct questions count:", data.questions.length);
console.log("Passage questions count:", passageQuestionsCount);
console.log("Overall Total:", data.questions.length + passageQuestionsCount);
