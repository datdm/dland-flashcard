const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Read API key from .env.local
const envPath = path.join(__dirname, '../.env.local');
let apiKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) {
    apiKey = match[1];
  }
}

if (!apiKey) {
  console.error("API Key not found in .env.local.");
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);

async function generateJSON(prompt) {
  let attempt = 0;
  while (attempt < 5) {
    try {
      attempt++;
      const model = ai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' }
      });

      let text = response.response.text().trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
      }
      const startIndex = text.indexOf('[');
      const endIndex = text.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        text = text.substring(startIndex, endIndex + 1);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error(`  [Attempt ${attempt}/5] API Error: ${error.message}`);
      if (attempt < 5) {
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }
  console.warn("  Failed after 5 attempts. Returning empty array fallback.");
  return [];
}

// ----------------------------------------------------
// 1. GENERATE N4 (Minna no Nihongo II: Lessons 26-50)
// ----------------------------------------------------
async function generateN4() {
  console.log("\n=========================================");
  console.log("STARTING N4 (Minna no Nihongo II: Lessons 26-50)");
  console.log("=========================================");
  
  const allLessons = [];
  const chunks = [];
  for (let i = 26; i <= 50; i += 2) {
    chunks.push([i, Math.min(i + 1, 50)]);
  }

  for (const [start, end] of chunks) {
    console.log(`Generating N4 Lessons ${start} to ${end}...`);
    const prompt = `
Generate a JSON array containing COMPLETE and HIGH-QUALITY data for Japanese Minna no Nihongo II lessons from Lesson ${start} to Lesson ${end}.

For EACH lesson in this chunk:
1. "vocabulary": 30 to 40 authentic vocabulary words from Minna no Nihongo II Lesson X.
2. "grammarPoints": 4 to 6 grammar points taught in Minna no Nihongo II Lesson X.
3. "kanjiItems": 4 to 6 N4 Kanji introduced in Lesson X.

JSON Schema per lesson object:
{
  "id": "minna-n4-[two-digit lesson number, e.g. 26, 27, 50]",
  "name": "Bài [number]: [Lesson Title in Vietnamese]",
  "description": "[Comprehensive summary of grammar & vocab topics in Vietnamese]",
  "level": "N4",
  "curriculum": "Minna no Nihongo II",
  "vocabulary": [
    {
      "id": "n4-[lesson number]-[vocab index, e.g. 26-01]",
      "kanji": "[Kanji form if exists, else hiragana/katakana]",
      "hiragana": "[Hiragana or Katakana reading]",
      "onyomi": "[Sino-Vietnamese / Hán Việt reading in ALL CAPS e.g. 'CHẨN', 'THÁM', 'THAM GIA'. Write '' for katakana loanwords or words without Sino-Vietnamese roots]",
      "meaning": "[Accurate, clear Vietnamese translation]",
      "phonetic": "[Romaji spelling]"
    }
  ],
  "grammarPoints": [
    {
      "id": "g-n4-[lesson number]-[index, e.g. g-n4-26-1]",
      "structure": "[Grammar formula, e.g. 'V (thể thông dụng) + んです', 'V-て + いただけませんか']",
      "meaning": "[Meaning in Vietnamese]",
      "explanation": "[Detailed usage explanation in Vietnamese]",
      "mnemonic": "[Practical tip in Vietnamese]",
      "level": "N4",
      "examples": [
        {
          "id": "eg-n4-[lesson number]-[index]-1",
          "sentence": "[Example sentence in Japanese]",
          "meaning": "[Vietnamese translation]"
        },
        {
          "id": "eg-n4-[lesson number]-[index]-2",
          "sentence": "[Second example sentence in Japanese]",
          "meaning": "[Vietnamese translation]"
        }
      ]
    }
  ],
  "kanjiItems": [
    {
      "id": "k-[lesson number]-[index, e.g. k-26-1]",
      "kanji": "[Single Kanji character]",
      "hanViet": "[Hán Việt reading in ALL CAPS, e.g. 'THÁM', 'CHẨN']",
      "radical": "[Radical name in Vietnamese, e.g. '扌 (Thủ)']",
      "strokeCount": [Number of strokes],
      "onyomi": [Array of Katakana readings],
      "kunyomi": [Array of Hiragana readings],
      "meaning": "[Vietnamese meaning of the Kanji]",
      "level": "N4",
      "compounds": [
        {
          "kanji": "[Compound word in Kanji]",
          "hiragana": "[Reading in Hiragana]",
          "meaning": "[Meaning in Vietnamese]"
        }
      ]
    }
  ]
}

Return ONLY valid JSON array starting with '[' and ending with ']'. No extra text.
`;

    const lessons = await generateJSON(prompt);
    allLessons.push(...lessons);
    console.log(`  -> Generated ${lessons.length} lessons for N4 ${start}-${end}`);
    await new Promise(r => setTimeout(r, 2000));
  }

  const finalOutput = {
    level: "N4",
    title: "N4 - Sơ cấp 2 (Minna no Nihongo II)",
    description: "Nâng cao bài 26 - 50: Động từ thể khả năng, thể bị động, sai khiến, kính ngữ và câu điều kiện.",
    lessons: allLessons
  };

  const outputPath = path.join(__dirname, '../public/data/n4-curriculum.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
  console.log(`Saved N4 Curriculum to ${outputPath}`);
}

// ----------------------------------------------------
// 2. GENERATE N3 (Trung cấp 1: Lessons 1-15)
// ----------------------------------------------------
async function generateN3() {
  console.log("\n=========================================");
  console.log("STARTING N3 (Trung cấp 1: 15 Lessons)");
  console.log("=========================================");

  const allLessons = [];
  const chunks = [
    [1, 3], [4, 6], [7, 9], [10, 12], [13, 15]
  ];

  for (const [start, end] of chunks) {
    console.log(`Generating N3 Lessons ${start} to ${end}...`);
    const prompt = `
Generate a JSON array containing COMPLETE and HIGH-QUALITY data for Japanese N3 level curriculum lessons from Lesson ${start} to Lesson ${end} (3 lessons).

For EACH lesson in this chunk:
1. "vocabulary": 30 to 40 N3 JLPT vocabulary words (Intermediate level).
2. "grammarPoints": 4 to 6 N3 JLPT grammar structures (e.g. ～おかげで, ～せいで, ～はずだ, ～に違いない, ～たびに).
3. "kanjiItems": 4 to 6 N3 Kanji characters.

JSON Schema per lesson object:
{
  "id": "n3-lesson-[two-digit lesson number, e.g. 01, 02, 15]",
  "name": "Bài [number]: [N3 Topic Title in Vietnamese, e.g. Đời sống & Công việc, Cảm xúc & Thái độ, Tự nhiên & Môi trường]",
  "description": "[Summary of N3 topics in Vietnamese]",
  "level": "N3",
  "curriculum": "N3 Intermediate Course",
  "vocabulary": [
    {
      "id": "n3-[lesson number]-[vocab index, e.g. 01-01]",
      "kanji": "[Kanji form]",
      "hiragana": "[Reading in Hiragana/Katakana]",
      "onyomi": "[Hán Việt reading in ALL CAPS]",
      "meaning": "[Vietnamese translation]",
      "phonetic": "[Romaji spelling]"
    }
  ],
  "grammarPoints": [
    {
      "id": "g-n3-[lesson number]-[index, e.g. g-n3-01-1]",
      "structure": "[N3 Grammar formula]",
      "meaning": "[Meaning in Vietnamese]",
      "explanation": "[Explanation in Vietnamese]",
      "mnemonic": "[Tip in Vietnamese]",
      "level": "N3",
      "examples": [
        {
          "id": "eg-n3-[lesson number]-[index]-1",
          "sentence": "[Example in Japanese]",
          "meaning": "[Vietnamese translation]"
        }
      ]
    }
  ],
  "kanjiItems": [
    {
      "id": "k-n3-[lesson number]-[index]",
      "kanji": "[Single N3 Kanji]",
      "hanViet": "[Hán Việt in ALL CAPS]",
      "radical": "[Radical name in Vietnamese]",
      "strokeCount": [Number of strokes],
      "onyomi": [Array of Katakana readings],
      "kunyomi": [Array of Hiragana readings],
      "meaning": "[Meaning in Vietnamese]",
      "level": "N3",
      "compounds": [
        {
          "kanji": "[Compound word]",
          "hiragana": "[Reading]",
          "meaning": "[Meaning]"
        }
      ]
    }
  ]
}

Return ONLY valid JSON array starting with '[' and ending with ']'.
`;

    const lessons = await generateJSON(prompt);
    allLessons.push(...lessons);
    console.log(`  -> Generated ${lessons.length} lessons for N3 ${start}-${end}`);
    await new Promise(r => setTimeout(r, 2000));
  }

  const finalOutput = {
    level: "N3",
    title: "N3 - Trung cấp 1 (Comprehensive N3 Course)",
    description: "Tổng hợp từ vựng, ngữ pháp và Hán tự N3 chuẩn JLPT: 15 chủ đề đời sống, công việc, tin tức và xã hội.",
    lessons: allLessons
  };

  const outputPath = path.join(__dirname, '../public/data/n3-curriculum.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
  console.log(`Saved N3 Curriculum to ${outputPath}`);
}

// ----------------------------------------------------
// 3. GENERATE N2 (Trung cấp 2: Lessons 1-15)
// ----------------------------------------------------
async function generateN2() {
  console.log("\n=========================================");
  console.log("STARTING N2 (Trung cấp 2: 15 Lessons)");
  console.log("=========================================");

  const allLessons = [];
  const chunks = [
    [1, 3], [4, 6], [7, 9], [10, 12], [13, 15]
  ];

  for (const [start, end] of chunks) {
    console.log(`Generating N2 Lessons ${start} to ${end}...`);
    const prompt = `
Generate a JSON array containing COMPLETE and HIGH-QUALITY data for Japanese N2 level curriculum lessons from Lesson ${start} to Lesson ${end} (3 lessons).

For EACH lesson in this chunk:
1. "vocabulary": 30 to 40 N2 JLPT vocabulary words (Upper-Intermediate level).
2. "grammarPoints": 4 to 6 N2 JLPT grammar structures (e.g. ～にともなって, ～に反して, ～をめぐって, ～に際して, ～ざるを得ない).
3. "kanjiItems": 4 to 6 N2 Kanji characters.

JSON Schema per lesson object:
{
  "id": "n2-lesson-[two-digit lesson number, e.g. 01, 02, 15]",
  "name": "Bài [number]: [N2 Topic Title in Vietnamese, e.g. Kinh tế & Chính trị, Khoa học & Công nghệ, Xã hội & Văn hóa]",
  "description": "[Summary of N2 topics in Vietnamese]",
  "level": "N2",
  "curriculum": "N2 Upper-Intermediate Course",
  "vocabulary": [
    {
      "id": "n2-[lesson number]-[vocab index, e.g. 01-01]",
      "kanji": "[Kanji form]",
      "hiragana": "[Reading in Hiragana/Katakana]",
      "onyomi": "[Hán Việt reading in ALL CAPS]",
      "meaning": "[Vietnamese translation]",
      "phonetic": "[Romaji spelling]"
    }
  ],
  "grammarPoints": [
    {
      "id": "g-n2-[lesson number]-[index]",
      "structure": "[N2 Grammar formula]",
      "meaning": "[Meaning in Vietnamese]",
      "explanation": "[Explanation in Vietnamese]",
      "mnemonic": "[Tip in Vietnamese]",
      "level": "N2",
      "examples": [
        {
          "id": "eg-n2-[lesson number]-[index]-1",
          "sentence": "[Example in Japanese]",
          "meaning": "[Vietnamese translation]"
        }
      ]
    }
  ],
  "kanjiItems": [
    {
      "id": "k-n2-[lesson number]-[index]",
      "kanji": "[Single N2 Kanji]",
      "hanViet": "[Hán Việt in ALL CAPS]",
      "radical": "[Radical name in Vietnamese]",
      "strokeCount": [Number of strokes],
      "onyomi": [Array of Katakana readings],
      "kunyomi": [Array of Hiragana readings],
      "meaning": "[Meaning in Vietnamese]",
      "level": "N2",
      "compounds": [
        {
          "kanji": "[Compound word]",
          "hiragana": "[Reading]",
          "meaning": "[Meaning]"
        }
      ]
    }
  ]
}

Return ONLY valid JSON array starting with '[' and ending with ']'.
`;

    const lessons = await generateJSON(prompt);
    allLessons.push(...lessons);
    console.log(`  -> Generated ${lessons.length} lessons for N2 ${start}-${end}`);
    await new Promise(r => setTimeout(r, 2000));
  }

  const finalOutput = {
    level: "N2",
    title: "N2 - Trung cấp 2 (Advanced N2 Course)",
    description: "Tổng hợp từ vựng, ngữ pháp và Hán tự N2 chuẩn JLPT: 15 chủ đề chuyên sâu về kinh tế, khoa học, tin tức và báo chí.",
    lessons: allLessons
  };

  const outputPath = path.join(__dirname, '../public/data/n2-curriculum.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
  console.log(`Saved N2 Curriculum to ${outputPath}`);
}

async function main() {
  await generateN4();
  await generateN3();
  await generateN2();
  console.log("\nALL CURRICULUM LEVELS (N5, N4, N3, N2) GENERATED SUCCESSFULLY!");
}

main().catch(err => {
  console.error("Master generation failed:", err);
  process.exit(1);
});
