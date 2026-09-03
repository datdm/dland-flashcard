const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'api', 'practice', 'generate', 'route.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the reading N2 block
const targetOld = `      } else {
        // reading N2
        prompt = \`Bạn là chuyên gia ôn luyện đọc hiểu JLPT N2.`;

const replaceNew = `      } else if (type === "listening") {
        prompt = buildJLPTListeningPrompt({
          level,
          topic,
          chosenContext,
          mondaiNumber,
          randomSeed,
        });
      } else {
        // reading by Mondai
        prompt = buildJLPTReadingPrompt({
          level,
          topic,
          chosenContext,
          mondaiNumber,
          randomSeed,
        });
      }`;

const targetEndOld = `    // Updated to latest 2025 Gemini models
    const candidateModels = ["gemini-3.5-flash", "gemini-3.1-flash", "gemini-2.5-flash"];`;

const replaceEndNew = `    // Updated Gemini models with fallback
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.5-flash", "gemini-3.1-flash"];`;

const oldBlockRegex = /      \} else \{\s*\/\/ reading N2[\s\S]*?      \}\s*\}\s*\/\/ Updated to latest 2025 Gemini models[\s\S]*?const candidateModels = \["gemini-3\.5-flash", "gemini-3\.1-flash", "gemini-2\.5-flash"\];/;

const newBlock = `      } else if (type === "listening") {
        prompt = buildJLPTListeningPrompt({
          level,
          topic,
          chosenContext,
          mondaiNumber,
          randomSeed,
        });
      } else {
        // reading by Mondai
        prompt = buildJLPTReadingPrompt({
          level,
          topic,
          chosenContext,
          mondaiNumber,
          randomSeed,
        });
      }
    }

    // Updated Gemini models with fallback
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.5-flash", "gemini-3.1-flash"];`;

if (!oldBlockRegex.test(content)) {
  console.error("Old block not found by regex!");
  process.exit(1);
}

content = content.replace(oldBlockRegex, newBlock);

// Normalize reading and listening data right after const data = JSON.parse(cleaned);
const normalizeTarget = `const data = JSON.parse(cleaned);`;
const normalizeInsert = `const data = JSON.parse(cleaned);

    // Normalize reading & listening data structures for consistent rendering
    if (data.reading) {
      if (data.reading.questions && data.reading.questions.length > 0) {
        if (!data.reading.question) data.reading.question = data.reading.questions[0].question;
        if (!data.reading.options) data.reading.options = data.reading.questions[0].options;
        if (!data.reading.explanation) data.reading.explanation = data.reading.questions[0].explanation;
      } else if (data.reading.question) {
        data.reading.questions = [
          {
            id: "q_1",
            question: data.reading.question,
            options: data.reading.options || [],
            explanation: data.reading.explanation || "",
          },
        ];
      }
    }

    if (data.listening) {
      if (data.listening.questions && data.listening.questions.length > 0) {
        if (!data.listening.question) data.listening.question = data.listening.questions[0].question;
        if (!data.listening.options) data.listening.options = data.listening.questions[0].options;
        if (data.listening.correctAnswer === undefined) data.listening.correctAnswer = data.listening.questions[0].correctAnswer;
        if (!data.listening.explanation) data.listening.explanation = data.listening.questions[0].explanation;
      } else if (data.listening.question) {
        data.listening.questions = [
          {
            id: "q_1",
            question: data.listening.question,
            options: data.listening.options || [],
            correctAnswer: data.listening.correctAnswer ?? 0,
            explanation: data.listening.explanation || "",
          },
        ];
      }
    }`;

content = content.replace(normalizeTarget, normalizeInsert);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated route.ts!");
