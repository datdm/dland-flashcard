import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: NextRequest) {
  if (!genAI) {
    return NextResponse.json(
      { error: "Tính năng AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY." },
      { status: 500 }
    );
  }

  try {
    const { level, lessonName, vocabulary, grammarPoints } = await req.json();

    const vocabList = (vocabulary || []).slice(0, 15).map((v: any) => ({
      kanji: v.kanji,
      hiragana: v.hiragana,
      meaning: v.meaning
    }));

    const grammarList = (grammarPoints || []).map((g: any) => ({
      structure: g.structure,
      meaning: g.meaning
    }));

    const prompt = `Bạn là chuyên gia giáo trình tiếng Nhật JLPT.
Hãy tạo 3 phần hoạt động học tập: Shadowing, Luyện dịch (Translation), và Đọc hiểu (Reading) cho cấp độ ${level}, bài học "${lessonName}".
Dữ liệu đầu vào:
- Từ vựng gợi ý: ${JSON.stringify(vocabList)}
- Ngữ pháp gợi ý: ${JSON.stringify(grammarList)}

Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "shadowing": [
    {
      "id": "sh_1",
      "japanese": "câu tiếng Nhật chuẩn có chữ Hán",
      "hiragana": "câu tiếng Nhật chỉ chứa Hiragana/Katakana và dấu câu",
      "romaji": "phiên âm romaji câu tiếng Nhật",
      "meaning": "dịch nghĩa tiếng Việt"
    },
    ... (tạo đúng 3 câu shadowing)
  ],
  "translation": [
    {
      "id": "tr_1",
      "japanese": "câu tiếng Nhật cần dịch",
      "hiragana": "phiên âm Hiragana/Katakana",
      "meaning": "đáp án tiếng Việt chuẩn",
      "hint": "gợi ý cách dịch bằng tiếng Việt"
    },
    ... (tạo đúng 3 câu luyện dịch)
  ],
  "reading": [
    {
      "id": "rd_1",
      "passage": "đoạn văn tiếng Nhật ngắn khoảng 3-5 câu dùng từ vựng/ngữ pháp của bài",
      "question": "câu hỏi đọc hiểu bằng tiếng Việt",
      "options": [
        { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
        { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
        { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
        { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
      ],
      "explanation": "giải thích chi tiết tại sao đúng/sai bằng tiếng Việt"
    },
    ... (tạo đúng 2 câu/đoạn văn đọc hiểu, mỗi đoạn có 1 câu hỏi với 4 đáp án lựa chọn như trên)
  ]
}

Chú ý:
- Phải tạo các câu hỏi, đoạn văn thực tế, sử dụng chính các từ vựng và ngữ pháp của bài học này.
- Tiếng Nhật trong đoạn văn phải chuẩn xác, tự nhiên.
- Dữ liệu trả về PHẢI là chuỗi JSON hợp lệ.`;

    const candidateModels = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];
    let text = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json"
          }
        });

        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed for curriculum activities:`, err?.message);
      }
    }

    if (!text) {
      throw lastError || new Error("Không thể tạo hoạt động từ AI.");
    }
    
    // Parse the output to make sure it's valid JSON
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }
    const data = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("AI activities generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate activities" },
      { status: 500 }
    );
  }
}
