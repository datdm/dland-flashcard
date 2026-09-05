const fs = require('fs');
const path = require('path');

// 1. Update ExamQuestionCard.tsx
const cardPath = path.join(__dirname, '..', 'src', 'components', 'exam', 'ExamQuestionCard.tsx');
let cardContent = fs.readFileSync(cardPath, 'utf8');

cardContent = cardContent.replace(
  '  onOpenMazii?: (word: string) => void;\n}',
  '  onOpenMazii?: (word: string) => void;\n  isFocused?: boolean;\n}'
);

cardContent = cardContent.replace(
  '  showMondaiBadge = false,\n  onOpenMazii,',
  '  showMondaiBadge = false,\n  onOpenMazii,\n  isFocused = false,'
);

const oldCardContainerRegex = /<div\s+id=\{`question-\$\{question\.id\}`\}\s+className=\{`p-4 sm:p-5[\s\S]*?`\}\s*>/;

const newCardContainer = `<div
      id={\`question-\${question.id}\`}
      className={\`p-4 sm:p-5 rounded-2xl sm:rounded-3xl mb-3.5 sm:mb-4 border transition-all duration-300 scroll-mt-28 \${
        isFocused
          ? "ring-2 ring-indigo-500 border-indigo-500 shadow-md bg-indigo-50/40"
          : showResult
          ? isCorrect
            ? "bg-emerald-50/60 border-emerald-200 shadow-xs"
            : hasAnswered
            ? "bg-rose-50/60 border-rose-200 shadow-xs"
            : "bg-gray-50 border-gray-200"
          : hasAnswered
          ? "bg-indigo-50/40 border-indigo-200/80 shadow-xs"
          : "bg-white border-gray-100 shadow-2xs hover:border-gray-200"
      }\`}>`;

cardContent = cardContent.replace(oldCardContainerRegex, newCardContainer);
fs.writeFileSync(cardPath, cardContent, 'utf8');
console.log("Updated ExamQuestionCard.tsx with isFocused prop!");

// 2. Update src/app/exam/[id]/page.tsx to pass isFocused
const examPagePath = path.join(__dirname, '..', 'src', 'app', 'exam', '[id]', 'page.tsx');
let examPageContent = fs.readFileSync(examPagePath, 'utf8');

// In navigateToQuestion, set currentQId
examPageContent = examPageContent.replace(
  `  const navigateToQuestion = (qid: number) => {
    setIsDrawerOpen(false);`,
  `  const navigateToQuestion = (qid: number) => {
    setIsDrawerOpen(false);
    setCurrentQId(qid);`
);

// Pass isFocused to ExamQuestionCard in standalone questions
examPageContent = examPageContent.replace(
  `                          <ExamQuestionCard
                            key={q.id}
                            question={q}
                            index={qIndex}
                            selected={answers[q.id] || []}
                            onChange={handleAnswerChange}`,
  `                          <ExamQuestionCard
                            key={q.id}
                            question={q}
                            index={qIndex}
                            isFocused={currentQId === q.id}
                            selected={answers[q.id] || []}
                            onChange={handleAnswerChange}`
);

// Pass isFocused to ExamQuestionCard in passage questions
examPageContent = examPageContent.replace(
  `                            <ExamQuestionCard
                              key={subQ.id}
                              question={subQ}
                              index={subQIndex}
                              selected={answers[subQ.id] || []}
                              onChange={handleAnswerChange}`,
  `                            <ExamQuestionCard
                              key={subQ.id}
                              question={subQ}
                              index={subQIndex}
                              isFocused={currentQId === subQ.id}
                              selected={answers[subQ.id] || []}
                              onChange={handleAnswerChange}`
);

fs.writeFileSync(examPagePath, examPageContent, 'utf8');
console.log("Updated exam/[id]/page.tsx with isFocused pass!");

// 3. Update src/app/exam/result/[id]/page.tsx to also support isFocused
const resultPagePath = path.join(__dirname, '..', 'src', 'app', 'exam', 'result', '[id]', 'page.tsx');
if (fs.existsSync(resultPagePath)) {
  let resultContent = fs.readFileSync(resultPagePath, 'utf8');
  if (!resultContent.includes('const [focusedQId, setFocusedQId]')) {
    resultContent = resultContent.replace(
      'export default function ExamResultPage() {',
      'export default function ExamResultPage() {\n  const [focusedQId, setFocusedQId] = useState<number | null>(null);'
    );
  }

  // Update navigate scroll in review drawer
  resultContent = resultContent.replace(
    `                  onNavigateQuestion={(qid) => {
                    document.getElementById(\`question-\${qid}\`)?.scrollIntoView({`,
    `                  onNavigateQuestion={(qid) => {
                    setFocusedQId(qid);
                    document.getElementById(\`question-\${qid}\`)?.scrollIntoView({`
  );

  // Pass isFocused to ExamQuestionCard
  resultContent = resultContent.replace(
    `                          <ExamQuestionCard
                            key={q.id}
                            question={q}
                            index={qIndex}
                            selected={selectedAnswers}`,
    `                          <ExamQuestionCard
                            key={q.id}
                            question={q}
                            index={qIndex}
                            isFocused={focusedQId === q.id}
                            selected={selectedAnswers}`
  );

  resultContent = resultContent.replace(
    `                            <ExamQuestionCard
                              key={subQ.id}
                              question={subQ}
                              index={subQIndex}
                              selected={selectedAnswers}`,
    `                            <ExamQuestionCard
                              key={subQ.id}
                              question={subQ}
                              index={subQIndex}
                              isFocused={focusedQId === subQ.id}
                              selected={selectedAnswers}`
  );

  fs.writeFileSync(resultPagePath, resultContent, 'utf8');
  console.log("Updated exam/result/[id]/page.tsx with isFocused!");
}
