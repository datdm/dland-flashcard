import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface WordBreakdownItem {
  word: string;
  reading?: string;
  romaji?: string;
  pos?: string;
  meaning: string;
  level?: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      q,
      source = "auto",
      target = "vi",
      format = "text",
      includeBreakdown = false,
      api_key,
    } = await req.json();

    if (!q || typeof q !== "string" || !q.trim()) {
      return NextResponse.json({ error: "Missing text to translate" }, { status: 400 });
    }

    const trimmedText = q.trim();
    let translatedText = "";
    let detectedSource = source === "auto" ? "" : source;
    let romanization = "";
    let provider = "google-gtx";
    let words: WordBreakdownItem[] = [];

    // 1. Primary Ultra-fast Provider: Google Translate (GTX)
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
        source
      )}&tl=${encodeURIComponent(target)}&dt=t&dt=bd&dt=rm&q=${encodeURIComponent(trimmedText)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const gtxRes = await fetch(gtxUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
      });
      clearTimeout(timeoutId);

      if (gtxRes.ok) {
        const data = await gtxRes.json();

        // data[0] contains translated text chunks and romanization
        if (Array.isArray(data[0])) {
          const textChunks: string[] = [];
          for (const item of data[0]) {
            if (Array.isArray(item)) {
              if (item[0]) textChunks.push(item[0]);
              // Romanization is typically located at index 3 when item[0] is null/empty or at the end
              if (item[3] && typeof item[3] === "string" && !romanization) {
                romanization = item[3];
              }
            }
          }
          translatedText = textChunks.join("");
        }

        // data[2] contains detected source language code (e.g. "ja", "en", "de")
        if (data[2] && typeof data[2] === "string") {
          detectedSource = data[2];
        }
      }
    } catch (gtxErr: any) {
      console.warn("Google GTX translation request failed:", gtxErr?.message);
    }

    // 2. Fallback: LibreTranslate API
    if (!translatedText) {
      const libreUrl = process.env.LIBRETRANSLATE_URL || "https://libretranslate.com/translate";
      const libreKey = api_key || process.env.LIBRETRANSLATE_API_KEY || "";

      try {
        const libreRes = await fetch(libreUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: trimmedText,
            source: source === "auto" ? "auto" : source,
            target,
            format: format || "text",
            api_key: libreKey,
          }),
          signal: AbortSignal.timeout(4000),
        });

        if (libreRes.ok) {
          const libreData = await libreRes.json();
          if (libreData.translatedText) {
            translatedText = libreData.translatedText;
            provider = "libretranslate";
            if (libreData.detectedLanguage?.language) {
              detectedSource = libreData.detectedLanguage.language;
            }
          }
        }
      } catch (libreErr: any) {
        console.warn("LibreTranslate fallback failed:", libreErr?.message);
      }
    }

    // 3. Fallback: Google Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!translatedText && apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-3-flash-preview",
        "gemini-3.7-flash",
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
      ];
      const prompt = `Bạn là chuyên gia dịch thuật cao cấp. Hãy dịch chính xác, tự nhiên đoạn văn bản sau từ ngôn ngữ ${
        source === "auto" ? "tự động nhận diện" : source
      } sang ngôn ngữ đích ${target}.
Chỉ trả về DUY NHẤT văn bản đã dịch, không kèm lời giải thích, không kèm markdown code block:

${trimmedText}`;

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const aiText = result.response.text().trim();
          if (aiText) {
            translatedText = aiText;
            provider = "gemini-ai";
            break;
          }
        } catch (mErr: any) {
          console.warn(`Translate Gemini model ${modelName} error:`, mErr?.message);
        }
      }
    }

    if (!translatedText) {
      throw new Error("Không thể dịch văn bản. Vui lòng thử lại sau.");
    }

    // 4. Vocabulary Breakdown (Mazii / Extension Style)
    if (includeBreakdown && apiKey && trimmedText.length <= 600) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const breakdownModels = [
          "gemini-3.8-flash",
          "gemini-3.7-flash",
          "gemini-flash-lite-latest",
          "gemini-3.5-flash",
        ];

        const srcLangName =
          detectedSource === "ja"
            ? "tiếng Nhật"
            : detectedSource === "en"
            ? "tiếng Anh"
            : detectedSource === "de"
            ? "tiếng Đức"
            : detectedSource === "zh"
            ? "tiếng Trung"
            : detectedSource === "ko"
            ? "tiếng Hàn"
            : "ngôn ngữ nguồn";

        const breakdownPrompt = `Bạn là từ điển và chuyên gia phân tích ngữ pháp ${srcLangName}.
Hãy phân tích các từ vựng chính yếu xuất hiện trong văn bản sau:
"${trimmedText}"

Yêu cầu xuất ra JSON hợp lệ (không có markdown \`\`\`json):
[
  {
    "word": "từ gốc/chữ Hán",
    "reading": "cách đọc kana/pinyin/IPA",
    "romaji": "phiên âm la-tinh",
    "pos": "loại từ (Danh từ, Động từ, Tính từ...)",
    "meaning": "nghĩa tiếng Việt ngắn gọn",
    "level": "cấp độ JLPT/HSK/CEFR nếu có (vd N5, N4, A1, B1...)"
  }
]`;

        for (const bModel of breakdownModels) {
          try {
            const model = genAI.getGenerativeModel({
              model: bModel,
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            });
            const bRes = await model.generateContent(breakdownPrompt);
            const rawJson = bRes.response.text().trim();
            const parsed = JSON.parse(rawJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              words = parsed;
              break;
            }
          } catch (bErr: any) {
            console.warn(`Breakdown error with ${bModel}:`, bErr?.message);
          }
        }
      } catch (err: any) {
        console.warn("Failed to generate word breakdown:", err?.message);
      }
    }

    return NextResponse.json({
      translatedText,
      detectedSource: detectedSource || (source === "auto" ? "auto" : source),
      romanization: romanization || undefined,
      provider,
      words: words.length > 0 ? words : undefined,
    });
  } catch (error: any) {
    console.error("Translation API error:", error);
    return NextResponse.json(
      { error: error?.message || "Đã xảy ra lỗi khi dịch văn bản." },
      { status: 500 }
    );
  }
}
