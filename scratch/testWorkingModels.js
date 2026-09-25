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

const modelsToTest = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash"
];

async function testAll() {
  for (const modelName of modelsToTest) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" }
      });
      const res = await model.generateContent("Return JSON: {\"status\": \"ok\"}");
      const text = res.response.text();
      console.log(`✅ SUCCESS [${modelName}]:`, text.trim());
    } catch (err) {
      console.error(`❌ FAILED [${modelName}]:`, err.message);
    }
  }
}

testAll();
