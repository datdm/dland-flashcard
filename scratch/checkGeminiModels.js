const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
let apiKey = "";
const match = envContent.match(/GEMINI_API_KEY="?([^"\r\n]+)"?/);
if (match) apiKey = match[1];

console.log("API Key found:", !!apiKey);
const genAI = new GoogleGenerativeAI(apiKey);

const testModels = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-3.5-flash",
  "gemini-2.0-flash-exp"
];

async function checkModels() {
  for (const modelName of testModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent("Say hi in 5 words");
      console.log(`✅ Model ${modelName}: SUCCESS ->`, res.response.text().trim().slice(0, 40));
    } catch (err) {
      console.log(`❌ Model ${modelName}: FAILED ->`, err.message?.slice(0, 80));
    }
  }
}

checkModels();
