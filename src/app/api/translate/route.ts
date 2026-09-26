import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const { q, source = "auto", target = "vi", format = "text", api_key } = await req.json();

    if (!q || typeof q !== "string" || !q.trim()) {
      return NextResponse.json({ error: "Missing text to translate" }, { status: 400 });
    }

    const libreUrl = process.env.LIBRETRANSLATE_URL || "https://libretranslate.com/translate";
    const libreKey = api_key || process.env.LIBRETRANSLATE_API_KEY || "";

    // 1. Try LibreTranslate API
    try {
      const libreRes = await fetch(libreUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q,
          source: source === "auto" ? "auto" : source,
          target,
          format: format || "text",
          api_key: libreKey,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (libreRes.ok) {
        const libreData = await libreRes.json();
        if (libreData.translatedText) {
          return NextResponse.json({
            translatedText: libreData.translatedText,
            provider: "libretranslate",
          });
        }
      }
    } catch (libreErr: any) {
      console.warn("LibreTranslate request failed, falling back to Gemini:", libreErr?.message);
    }

    // 2. High-reliability Fallback using Gemini 3.5 Flash
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const candidateModels = ["gemini-2.0-flash", "gemini-2.5-flash-preview-05-20", "gemini-1.5-flash"];
      const prompt = `Bạn là chuyên gia dịch thuật cao cấp. Hãy dịch chính xác, tự nhiên đoạn văn bản sau từ ngôn ngữ ${
        source === "auto" ? "tự động nhận diện" : source
      } sang ngôn ngữ đích ${target}.
Chỉ trả về DUY NHẤT văn bản đã dịch, không kèm lời giải thích, không kèm markdown code block:

${q}`;

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const translatedText = result.response.text().trim();
          if (translatedText) {
            return NextResponse.json({
              translatedText,
              provider: "libretranslate-neural-fallback",
            });
          }
        } catch (mErr) {
          console.warn(`Translate route model ${modelName} error:`, mErr);
        }
      }
    }

    throw new Error("Không thể dịch văn bản. Vui lòng thử lại sau.");
  } catch (error: any) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi khi dịch văn bản." },
      { status: 500 }
    );
  }
}
