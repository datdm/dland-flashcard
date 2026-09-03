const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
let apiKey = "";
const match = envContent.match(/GEMINI_API_KEY="?([^"\r\n]+)"?/);
if (match) apiKey = match[1];

const genAI = new GoogleGenerativeAI(apiKey);

const testModels = [
  "gemini-3.5-flash",
  "gemini-3.1-flash",
  "gemini-3.0-flash",
  "gemini-3.5-pro",
  "gemini-3.0-pro"
];

async function checkModels() {
  for (const modelName of testModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent("Say hi");
      console.log(`✅ Model ${modelName}: SUCCESS ->`, res.response.text().trim().slice(0, 40));
    } catch (err) {
      console.log(`❌ Model ${modelName}: FAILED ->`, err.message?.slice(0, 80));
    }
  }
}

checkModels();
