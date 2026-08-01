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
  console.error("API Key not found in .env.local. Please make sure GEMINI_API_KEY is defined.");
  process.exit(1);
}

const ai = new GoogleGenerativeAI(apiKey);

async function generateChunk(startLesson, endLesson) {
  console.log(`Generating lessons ${startLesson} to ${endLesson}...`);
  
  const prompt = `
Generate a JSON array containing data for Japanese Minna no Nihongo I lessons from Lesson ${startLesson} to Lesson ${endLesson} (total 5 lessons).
Each lesson object in the array MUST strictly follow this JSON schema:
{
  "id": "minna-n5-[lesson number with two digits, e.g., 01, 02]",
  "name": "Bài [number]: [Lesson Topic/Title in Vietnamese]",
  "description": "[Brief description of what is learned in this lesson in Vietnamese]",
  "level": "N5",
  "curriculum": "Minna no Nihongo I",
  "vocabulary": [
    {
      "id": "n5-[lesson number]-[two-digit vocab counter, e.g., 01-01, 01-02]",
      "kanji": "[Kanji form of the word, if any. Otherwise write the hiragana/katakana form]",
      "hiragana": "[Hiragana/Katakana reading]",
      "onyomi": "[Sino-Vietnamese / Hán Việt reading of the word in ALL CAPS, e.g., 'NHÂN', 'TIÊN SINH', 'ĐẠI HỌC'. Write empty string if none]",
      "meaning": "[Vietnamese meaning of the word]",
      "phonetic": "[Romaji spelling]"
    }
  ],
  "grammarPoints": [
    {
      "id": "g-n5-[unique grammar ID, e.g., g-n5-01]",
      "structure": "[Grammar structure formula, e.g., 'N1 は N2 です']",
      "meaning": "[Brief meaning of structure in Vietnamese]",
      "explanation": "[Explanation of how to use it in Vietnamese]",
      "mnemonic": "[Optional tip to remember in Vietnamese]",
      "level": "N5",
      "examples": [
        {
          "id": "eg-n5-[unique example ID, e.g., eg-n5-01-1]",
          "sentence": "[Example sentence in Japanese hiragana/kanji]",
          "meaning": "[Vietnamese translation of the example]"
        }
      ]
    }
  ],
  "kanjiItems": [
    {
      "id": "k-[lesson-number]-[two-digit kanji counter, e.g., k-01-01]",
      "kanji": "[A single Kanji character introduced in this lesson, e.g., '私', '人', '日']",
      "hanViet": "[Hán Việt reading of this kanji in ALL CAPS, e.g., 'TƯ', 'NHÂN']",
      "radical": "[Radical of the kanji, e.g., '禾 (Hòa)']",
      "strokeCount": [number of strokes, e.g., 7],
      "onyomi": [array of Katakana onyomi readings, e.g., ["シ"]],
      "kunyomi": [array of Hiragana kunyomi readings, e.g., ["わたし", "わたくし"]],
      "meaning": "[Vietnamese meaning of this kanji]",
      "level": "N5",
      "compounds": [
        {
          "kanji": "[Compound word containing this kanji, e.g., '私立']",
          "hiragana": "[Reading of compound word in hiragana]",
          "meaning": "[Vietnamese meaning of compound word]"
        }
      ]
    }
  ]
}

Please generate exactly 5 lessons. For each lesson:
- Include 12-15 core vocabulary words.
- Include 2-3 key grammar points.
- Include 2-3 core Kanji characters that belong to N5 level.
Make sure all Vietnamese translations are natural and accurate. Return ONLY a valid JSON array, do not wrap in markdown or add text outside the JSON.
`;

  try {
    const model = ai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.response.text();
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
      return JSON.parse(text.substring(startIndex, endIndex + 1));
    }
    return JSON.parse(text);
  } catch (error) {
    console.error(`Error generating chunk ${startLesson}-${endLesson}:`, error);
    // Retry once
    console.log("Retrying in 5 seconds...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    const model = ai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });
    
    const text = response.response.text();
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');
    if (startIndex !== -1 && endIndex !== -1) {
      return JSON.parse(text.substring(startIndex, endIndex + 1));
    }
    return JSON.parse(text);
  }
}

async function main() {
  const allLessons = [];
  
  // 5 chunks of 5 lessons each = 25 lessons
  for (let i = 0; i < 5; i++) {
    const start = i * 5 + 1;
    const end = (i + 1) * 5;
    const chunkData = await generateChunk(start, end);
    allLessons.push(...chunkData);
    // Throttle API requests slightly
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const finalOutput = {
    level: "N5",
    title: "N5 - Sơ cấp 1 (Minna no Nihongo I)",
    description: "Nhập môn Tiếng Nhật bài 1 - 25: Hiragana, Katakana, chào hỏi, từ vựng và ngữ pháp nền tảng",
    lessons: allLessons
  };

  const outputPath = path.join(__dirname, '../public/data/n5-curriculum.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
  console.log(`Successfully generated and saved all 25 lessons to ${outputPath}`);
}

main().catch(err => {
  console.error("Main execution failed:", err);
  process.exit(1);
});
