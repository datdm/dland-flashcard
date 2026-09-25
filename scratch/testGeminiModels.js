const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Read .env.local manually
const envPath = path.join(__dirname, "../.env.local");
let apiKey = "";
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf8");
  const match = envText.match(/GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
  if (match) apiKey = match[1];
}

console.log("API Key found:", apiKey ? `${apiKey.slice(0, 10)}...` : "NONE");
if (!apiKey) process.exit(1);

const genAI = new GoogleGenerativeAI(apiKey);

const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-2.5-pro",
  "gemini-1.5-pro"
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
