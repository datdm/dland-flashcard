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
    const { type, topic, level = "N2" } = await req.json();

    let prompt = "";

    if (type === "shadowing") {
      prompt = `Bạn là chuyên gia giáo trình tiếng Nhật.
Hãy tạo 3 câu luyện nói đuổi (Shadowing) cấp độ ${level} thuộc chủ đề "${topic}".
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "shadowing": [
    {
      "id": "sh_1",
      "japanese": "câu tiếng Nhật chuẩn (ví dụ: 日本では多く の人が...) để truyền vào bộ phát âm TTS",
      "japanese_ruby": "câu tiếng Nhật tương ứng được bọc trong thẻ <ruby> và <rt> để hiển thị Furigana (phát âm) trên đầu của mọi chữ Kanji, ví dụ: <ruby>日本<rt>にほん</rt></ruby>では、<ruby>多く<rt>おお</rt></ruby>の<ruby>人<rt>ひと</rt></ruby>が...",
      "romaji": "phiên âm romaji câu tiếng Nhật",
      "meaning": "dịch nghĩa tiếng Việt câu này"
    },
    ... (tạo đúng 3 câu shadowing)
  ]
}`;
    } else if (type === "translation") {
      prompt = `Bạn là chuyên gia dịch thuật tiếng Nhật.
Hãy tạo 3 câu bài tập Luyện dịch 2 chiều cấp độ ${level} thuộc chủ đề "${topic}".
Trong đó có ít nhất 1 câu dịch từ Nhật sang Việt (ja-vi) và ít nhất 1 câu dịch từ Việt sang Nhật (vi-ja).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "translation": [
    {
      "id": "tr_1",
      "direction": "ja-vi",
      "source": "câu tiếng Nhật (nếu direction là ja-vi) hoặc câu tiếng Việt (nếu direction là vi-ja)",
      "source_ruby": "chuỗi HTML có thẻ <ruby> và <rt> để hiển thị Furigana trên đầu các chữ Hán tự (chỉ áp dụng cho tiếng Nhật)",
      "target": "đáp án dịch chuẩn tương ứng (tiếng Việt hoặc tiếng Nhật)",
      "target_ruby": "chuỗi HTML có thẻ <ruby> và <rt> cho chữ Hán tự (chỉ áp dụng nếu đáp án dịch là tiếng Nhật)",
      "pronunciation": "phiên âm Hiragana/kana (chỉ áp dụng nếu target hoặc source là tiếng Nhật)",
      "hint": "gợi ý cách dịch bằng tiếng Việt"
    },
    ... (tạo đúng 3 câu luyện dịch 2 chiều)
  ]
}`;
    } else {
      // reading N2
      prompt = `Bạn là chuyên gia ôn luyện đọc hiểu JLPT N2.
Hãy tạo 1 bài đọc hiểu đọc hiểu trình độ N2 (đáp ứng đúng tiêu chuẩn kỳ thi JLPT N2) thuộc chủ đề "${topic}".
Bài đọc hiểu phải bao gồm một đoạn văn tiếng Nhật (khoảng 6-8 câu dài) kèm câu hỏi và 4 đáp án lựa chọn.
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "reading": {
    "passage": "đoạn văn tiếng Nhật chuẩn N2 không có thẻ HTML",
    "passage_ruby": "đoạn văn tiếng Nhật N2 bọc thẻ <ruby> và <rt> hiển thị Furigana trên đầu mọi chữ Kanji để người dùng dễ tra cứu học tập, ví dụ: <ruby>東京<rt>とうきょう</rt></ruby>にある...",
    "question": "câu hỏi đọc hiểu bằng tiếng Việt về đoạn văn trên",
    "options": [
      { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
      { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
      { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
      { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
    ],
    "explanation": "giải thích chi tiết ý nghĩa đoạn văn, cấu trúc ngữ pháp N2 dùng trong bài và lý do đúng/sai bằng tiếng Việt"
  }
}`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }
    const data = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("AI practice generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate practice content" },
      { status: 500 }
    );
  }
}
