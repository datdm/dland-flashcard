import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_INSTRUCTION = `Bạn là một gia sư Tiếng Nhật thân thiện, nhiệt tình và chuyên nghiệp trong ứng dụng Dland Language.
Nhiệm vụ của bạn là:
1. Giải thích chi tiết về từ vựng, Hán tự (cấu tạo bộ thủ, âm On/Kun), ngữ pháp.
2. Giúp người dùng luyện đọc hiểu, nghe hiểu hoặc giao tiếp cơ bản.
3. Luôn đưa ra ví dụ trực quan bằng tiếng Nhật kèm phiên âm Hiragana/Romaji và nghĩa tiếng Việt.
4. Trình bày nội dung rõ ràng, sử dụng markdown, in đậm các điểm quan trọng, dùng emoji phù hợp để tạo cảm giác thân thiện.
Nếu người dùng hỏi vấn đề ngoài lề (không liên quan ngôn ngữ/học tập), hãy khéo léo từ chối và hướng họ quay lại việc học.`;

export async function POST(req: NextRequest) {
  if (!genAI) {
    return NextResponse.json(
      { error: "Tính năng AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY vào .env.local" },
      { status: 500 }
    );
  }

  try {
    const { history, message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessageStream(message);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi giao tiếp với AI. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
