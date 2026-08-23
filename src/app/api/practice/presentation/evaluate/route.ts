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
    const { topic, slides, speechTranscripts, isSecondCheck, previousEvaluation, lang = "ja" } = await req.json();

    const targetLangName = lang === "de" ? "tiếng Đức" : lang === "en" ? "tiếng Anh" : "tiếng Nhật";
    const nativeSpeakerDesc = lang === "de" ? "người bản xứ nói tiếng Đức (Đức/Áo/Thụy Sĩ)" : lang === "en" ? "người bản xứ nói tiếng Anh" : "người bản xứ Nhật Bản";

    const rubyNote = lang === "ja"
      ? `"corrected_ruby": "câu đã được chỉnh sửa tương ứng nhưng bọc thẻ <ruby> và <rt> để hiển thị Furigana, ví dụ: <ruby>発表<rt>はっぴょう</rt></ruby>いたします...",`
      : `"corrected_ruby": "câu tương tự trường corrected (không dùng thẻ ruby vì đây là ${targetLangName})",`;

    const prompt = `Bạn là một chuyên gia đào tạo thuyết trình ${targetLangName} chuyên nghiệp.
Bối cảnh: Học viên vừa thực hiện thuyết trình 2 slide về chủ đề "${topic}" bằng ${targetLangName}.

Thông tin 2 Slide đã chuẩn bị:
Slide 1:
- Tiêu đề: ${slides[0]?.title}
- Các ý chính: ${slides[0]?.bullets?.join(", ")}

Slide 2:
- Tiêu đề: ${slides[1]?.title}
- Các ý chính: ${slides[1]?.bullets?.join(", ")}

Nội dung học viên nói thực tế (được chuyển tự ghi âm từ micro):
- Slide 1 nói: "${speechTranscripts[0] || "(Học viên không nói hoặc không thu âm được gì)"}"
- Slide 2 nói: "${speechTranscripts[1] || "(Học viên không nói hoặc không thu âm được gì)"}"

${
  isSecondCheck
    ? `LƯU Ý ĐẶC BIỆT: Đây là lần trình bày thứ hai (Lần 2) của học viên sau khi đã xem góp ý đầu tiên của bạn.
Nhận xét trước đó của bạn có điểm số là: ${previousEvaluation?.comprehensibility_score || 0}%.
Hãy so sánh nội dung nói lần này với lần trước để thấy được sự tiến bộ, đánh giá xem học viên đã sửa các lỗi sai cũ chưa, chấm điểm mới cao hơn nếu họ tiến bộ, và viết lời động viên thích hợp.`
    : ""
}

Hãy đánh giá bài thuyết trình và trả về kết quả dưới dạng JSON duy nhất khớp chính xác với định dạng sau (không bọc trong markdown block, không có ký tự thừa):
{
  "comprehensibility_score": 85,
  "feedback_general": "Nhận xét tổng quát bằng tiếng Việt về khả năng phát âm, ngữ pháp, độ trôi chảy và mức độ dễ hiểu đối với ${nativeSpeakerDesc}.",
  "corrections": [
    {
      "original": "câu gốc ${targetLangName} chứa lỗi sai của học viên",
      "corrected": "câu đã được chỉnh sửa chuẩn xác, tự nhiên theo văn phong thuyết trình ${targetLangName}",
      ${rubyNote}
      "reason": "Giải thích chi tiết lỗi sai (ngữ pháp, từ vựng, cách dùng...) bằng tiếng Việt"
    }
  ],
  "exercises": [
    {
      "question": "Câu hỏi trắc nghiệm tiếng Việt hoặc điền từ ${targetLangName} giúp ôn tập lại chính lỗi sai ngữ pháp/từ vựng học viên vừa mắc phải",
      "options": [
        "Đáp án A",
        "Đáp án B",
        "Đáp án C",
        "Đáp án D"
      ],
      "correct_answer": "Đáp án đúng (phải khớp hoàn toàn với một trong bốn đáp án ở options)",
      "explanation": "Giải thích chi tiết lý do đáp án đúng bằng tiếng Việt"
    },
    {
      "question": "Câu hỏi ôn tập thứ hai...",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "..."
    }
  ]
}`;

    const candidateModels = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];
    let text = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.8
          }
        });

        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed for presentation evaluate:`, err?.message);
      }
    }

    if (!text) {
      throw lastError || new Error("Không thể đánh giá bài thuyết trình từ AI.");
    }

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    }
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    const data = JSON.parse(cleaned);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("AI presentation evaluation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to evaluate presentation" },
      { status: 500 }
    );
  }
}
