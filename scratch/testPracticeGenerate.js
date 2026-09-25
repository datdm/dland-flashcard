const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
let apiKey = "";
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf8");
  const match = envText.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) apiKey = match[1];
}

const genAI = new GoogleGenerativeAI(apiKey);

const candidateModels = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.8-flash"];

async function testPracticeGenerate() {
  const prompt = `Bạn là chuyên gia ra đề thi JLPT N2 tiếng Nhật. Hãy tạo 1 bài Kaiwa gồm 4 lượt thoại.
Trả về JSON đúng cấu trúc:
{
  "kaiwa": {
    "title": "Hội thoại mẫu N2",
    "situation": "Bán hàng",
    "dialogue": [
      { "speaker": "A", "japanese": "こんにちは", "vietnamese": "Xin chào", "romaji": "konnichiwa" }
    ]
  }
}`;

  for (const modelName of candidateModels) {
    try {
      console.log(`Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        }
      });
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      console.log(`✅ SUCCESS [${modelName}]:`, text.slice(0, 150));
      return;
    } catch (err) {
      console.error(`❌ Model ${modelName} failed:`, err.message);
    }
  }
}

testPracticeGenerate();
