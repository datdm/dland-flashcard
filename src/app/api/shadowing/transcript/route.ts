import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { youtubeUrl, title, languageCode = "ja", level = "N2" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chưa cấu hình GEMINI_API_KEY" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `Bạn là chuyên gia biên soạn giáo trình luyện Shadowing video tiếng Nhật / đa ngôn ngữ.
Nhiệm vụ của bạn là tạo các câu phụ đề chia theo từng câu ngắn (mỗi câu 3-6 giây) chuẩn cho phương pháp Shadowing (Luyện nói đuổi) từ video YouTube có chủ đề: "${title || youtubeUrl}".

Hãy tạo 5 đến 8 câu phụ đề mẫu chất lượng cao, có độ khó phù hợp cấp độ ${level}.
Mỗi câu phụ đề BẮT BUỘC có cấu trúc JSON:
- id: số thứ tự (1, 2, 3...)
- startTime: thời gian bắt đầu (giây, ví dụ 0.5)
- endTime: thời gian kết thúc (giây, ví dụ 4.8)
- japanese: câu tiếng Nhật hoàn chỉnh
- vietnamese: bản dịch tiếng Việt mượt mà
- romaji: phiên âm romaji
- furiganaTokens: mảng các từ phân tích Furigana (surface: chữ gốc, reading: cách đọc hiragana cho Kanji nếu có, isKanji: true/false, meaning: ý nghĩa ngắn)
- highlightPhrases: mảng các cụm từ quan trọng / điểm ngữ pháp (phrase, type: "grammar"|"vocabulary"|"key", meaning)

Định dạng JSON trả về:
{
  "title": "${title || "Luyện Shadowing Video"}",
  "level": "${level}",
  "subtitles": [
    ...
  ]
}
Chỉ trả về JSON thuần túy, không kèm markdown backticks.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let rawText = response.text() || "{}";
    rawText = rawText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    const data = JSON.parse(rawText);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Shadowing transcript generation error:", error);
    return NextResponse.json({ error: error?.message || "Lỗi tạo phụ đề Shadowing" }, { status: 500 });
  }
}
