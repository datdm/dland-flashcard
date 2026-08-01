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

async function generateChunk(startLesson, endLesson) {
  console.log(`Generating FULL data for Lessons ${startLesson} to ${endLesson}...`);
  
  const prompt = `
Generate a JSON array containing COMPLETE, EXHAUSTIVE, and HIGH-QUALITY data for Japanese Minna no Nihongo I lessons from Lesson ${startLesson} to Lesson ${endLesson}.

For EACH lesson in this chunk:
1. "vocabulary": MUST include ALL vocabulary words taught in Minna no Nihongo I Lesson X (typically 35 to 45 words per lesson). Include all nouns, verbs, i-adjectives, na-adjectives, adverbs, greetings, and expressions for that lesson.
2. "grammarPoints": MUST include ALL grammar points taught in Minna no Nihongo I Lesson X (typically 4 to 6 grammar structures per lesson).
3. "kanjiItems": Include ALL N5 Kanji introduced in or associated with this lesson (typically 4 to 6 Kanji per lesson).

JSON Schema per lesson object:
{
  "id": "minna-n5-[two-digit lesson number, e.g. 01, 02, 15]",
  "name": "Bài [number]: [Lesson Title in Vietnamese]",
  "description": "[Comprehensive summary of grammar & vocab topics in Vietnamese]",
  "level": "N5",
  "curriculum": "Minna no Nihongo I",
  "vocabulary": [
    {
      "id": "n5-[lesson number]-[vocab index, e.g. 01-01, 01-35]",
      "kanji": "[Kanji form if exists, else hiragana/katakana]",
      "hiragana": "[Hiragana or Katakana reading]",
      "onyomi": "[Sino-Vietnamese / Hán Việt reading in ALL CAPS e.g. 'NHÂN', 'THỜI KẾ', 'ĐẠI HỌC'. Write '' for katakana loanwords or words without Sino-Vietnamese roots]",
      "meaning": "[Accurate, clear Vietnamese translation]",
      "phonetic": "[Romaji spelling]"
    }
  ],
  "grammarPoints": [
    {
      "id": "g-n5-[lesson number]-[index, e.g. g-n5-01-1]",
      "structure": "[Grammar formula, e.g. 'N1 は N2 です', 'V-ます / V-ません']",
      "meaning": "[Meaning in Vietnamese]",
      "explanation": "[Detailed usage explanation in Vietnamese]",
      "mnemonic": "[Practical tip or note in Vietnamese]",
      "level": "N5",
      "examples": [
        {
          "id": "eg-n5-[lesson number]-[index]-1",
          "sentence": "[Example sentence in Japanese with kanji/hiragana]",
          "meaning": "[Vietnamese translation]"
        },
        {
          "id": "eg-n5-[lesson number]-[index]-2",
          "sentence": "[Second example sentence in Japanese]",
          "meaning": "[Vietnamese translation]"
        }
      ]
    }
  ],
  "kanjiItems": [
    {
      "id": "k-[lesson number]-[index, e.g. k-01-1]",
      "kanji": "[Single Kanji character]",
      "hanViet": "[Hán Việt reading in ALL CAPS, e.g. 'NHÂN', 'TƯ']",
      "radical": "[Radical name in Vietnamese, e.g. '人 (Nhân)']",
      "strokeCount": [Number of strokes],
      "onyomi": [Array of Katakana readings, e.g. ["ジン", "ニン"]],
      "kunyomi": [Array of Hiragana readings, e.g. ["ひと"]],
      "meaning": "[Vietnamese meaning of the Kanji]",
      "level": "N5",
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

Ensure high precision, authentic Minna no Nihongo I vocabulary and grammar accuracy, natural Vietnamese translations.
Return ONLY valid JSON array starting with '[' and ending with ']'. No markdown fences or extra text.
`;

  let attempt = 0;
  while (attempt < 3) {
    try {
      attempt++;
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
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const jsonStr = text.substring(startIndex, endIndex + 1);
        const parsed = JSON.parse(jsonStr);
        console.log(`  -> Successfully generated ${parsed.length} lessons for ${startLesson}-${endLesson}. Vocab count in L${startLesson}: ${parsed[0]?.vocabulary?.length || 0}`);
        return parsed;
      }
      throw new Error("Could not locate valid JSON array boundaries.");
    } catch (error) {
      console.error(`  [Attempt ${attempt}/3] Error for lessons ${startLesson}-${endLesson}: ${error.message}`);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 4000));
      } else {
        throw error;
      }
    }
  }
}

async function main() {
  const allLessons = [];
  
  // 13 chunks of 2 lessons each (1-2, 3-4, ..., 23-24, 25)
  const chunks = [];
  for (let i = 1; i <= 25; i += 2) {
    const end = Math.min(i + 1, 25);
    chunks.push([i, end]);
  }

  for (const [start, end] of chunks) {
    const chunkLessons = await generateChunk(start, end);
    allLessons.push(...chunkLessons);
    await new Promise(resolve => setTimeout(resolve, 2500));
  }

  const finalOutput = {
    level: "N5",
    title: "N5 - Sơ cấp 1 (Minna no Nihongo I)",
    description: "Toàn bộ 25 bài học Minna no Nihongo I đầy đủ và chi tiết nhất: Từ vựng (35-45 từ/bài), Ngữ pháp (4-6 cấu trúc/bài) và Hán tự N5.",
    lessons: allLessons
  };

  const outputPath = path.join(__dirname, '../public/data/n5-curriculum.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf8');
  
  // Summary statistics
  let totalVocab = 0;
  let totalGrammar = 0;
  let totalKanji = 0;
  for (const l of allLessons) {
    totalVocab += l.vocabulary ? l.vocabulary.length : 0;
    totalGrammar += l.grammarPoints ? l.grammarPoints.length : 0;
    totalKanji += l.kanjiItems ? l.kanjiItems.length : 0;
  }
  
  console.log(`\n==================================================`);
  console.log(`SUCCESSFULLY GENERATED FULL MINNA NO NIHONGO I!`);
  console.log(`Total Lessons: ${allLessons.length}`);
  console.log(`Total Vocabulary Words: ${totalVocab}`);
  console.log(`Total Grammar Points: ${totalGrammar}`);
  console.log(`Total Kanji Items: ${totalKanji}`);
  console.log(`Saved to: ${outputPath}`);
  console.log(`==================================================\n`);
}

main().catch(err => {
  console.error("Script failed:", err);
  process.exit(1);
});
