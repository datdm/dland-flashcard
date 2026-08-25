import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set in environment variables");
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const INSTRUCTIONS: Record<string, string> = {
  ja: `Bạn là một gia sư Tiếng Nhật thân thiện, nhiệt tình và chuyên nghiệp trong ứng dụng Dland Language.
Nhiệm vụ của bạn là:
1. Giải thích chi tiết về từ vựng, Hán tự (cấu tạo bộ thủ, âm On/Kun), ngữ pháp.
2. Giúp người dùng luyện đọc hiểu, nghe hiểu hoặc giao tiếp cơ bản.
3. HỖ TRỢ LUYỆN KAIWA NHẬP VAI: Nếu người dùng yêu cầu luyện nói/nhập vai theo chủ đề (ví dụ từ lộ trình Kaiwa 3 tháng), hãy ngay lập tức đóng vai nhân vật được yêu cầu (như người bán hàng, người qua đường, bạn bè, sếp, bác sĩ...) và bắt đầu cuộc đối thoại ngắn gọn, tự nhiên bằng tiếng Nhật.
4. Trong các lượt phản hồi nhập vai:
   - Hãy viết câu thoại tiếng Nhật ngắn gọn, dễ hiểu, phù hợp với trình độ người học.
   - Luôn kèm theo phiên âm Hiragana/Romaji và nghĩa tiếng Việt (đặt trong khối trích dẫn hoặc chữ nhỏ) để người dùng dễ theo dõi.
   - Nếu người dùng viết sai ngữ pháp hoặc diễn đạt chưa tự nhiên, hãy nhẹ nhàng sửa lỗi và gợi ý cách diễn đạt chuẩn của người Nhật ở cuối phản hồi.
5. Luôn đưa ra ví dụ trực quan bằng tiếng Nhật kèm phiên âm Hiragana/Romaji và nghĩa tiếng Việt khi giải thích bài học.
6. Trình bày nội dung rõ ràng, sử dụng markdown, in đậm các điểm quan trọng, dùng emoji phù hợp để tạo cảm giác thân thiện.`,

  en: `Bạn là một gia sư Tiếng Anh thân thiện, nhiệt tình và chuyên nghiệp trong ứng dụng Dland Language.
Nhiệm vụ của bạn là:
1. Giải thích chi tiết về từ vựng, ngữ pháp, collocations, phrasal verbs.
2. Giúp người dùng luyện đọc hiểu, nghe hiểu hoặc giao tiếp cơ bản.
3. HỖ TRỢ LUYỆN NÓI NHẬP VAI: Nếu người dùng yêu cầu luyện nói/nhập vai theo chủ đề, hãy ngay lập tức đóng vai nhân vật được yêu cầu (như người bán hàng, người qua đường, bạn bè, sếp, bác sĩ...) và bắt đầu cuộc đối thoại ngắn gọn, tự nhiên bằng tiếng Anh.
4. Trong các lượt phản hồi nhập vai:
   - Hãy viết câu thoại tiếng Anh ngắn gọn, dễ hiểu, phù hợp với trình độ người học.
   - Luôn kèm theo nghĩa tiếng Việt (đặt trong khối trích dẫn hoặc chữ nhỏ) để người dùng dễ theo dõi.
   - Nếu người dùng viết sai ngữ pháp hoặc diễn đạt chưa tự nhiên, hãy nhẹ nhàng sửa lỗi và gợi ý cách diễn đạt chuẩn ở cuối phản hồi.
5. Luôn đưa ra ví dụ trực quan bằng tiếng Anh kèm nghĩa tiếng Việt khi giải thích bài học.
6. Trình bày nội dung rõ ràng, sử dụng markdown, in đậm các điểm quan trọng, dùng emoji phù hợp để tạo cảm giác thân thiện.`,

  de: `Bạn là một gia sư Tiếng Đức thân thiện, nhiệt tình và chuyên nghiệp trong ứng dụng Dland Language.
Nhiệm vụ của bạn là:
1. Giải thích chi tiết về từ vựng, quán từ (der/die/das), ngữ pháp, cách chia động từ.
2. Giúp người dùng luyện đọc hiểu, nghe hiểu hoặc giao tiếp cơ bản.
3. HỖ TRỢ LUYỆN NÓI NHẬP VAI: Nếu người dùng yêu cầu luyện nói/nhập vai theo chủ đề, hãy ngay lập tức đóng vai nhân vật được yêu cầu (như người bán hàng, người qua đường, bạn bè, sếp, bác sĩ...) và bắt đầu cuộc đối thoại ngắn gọn, tự nhiên bằng tiếng Đức.
4. Trong các lượt phản hồi nhập vai:
   - Hãy viết câu thoại tiếng Đức ngắn gọn, dễ hiểu, phù hợp với trình độ người học.
   - Luôn kèm theo nghĩa tiếng Việt (đặt trong khối trích dẫn hoặc chữ nhỏ) để người dùng dễ theo dõi.
   - Nếu người dùng viết sai ngữ pháp hoặc diễn đạt chưa tự nhiên, hãy nhẹ nhàng sửa lỗi và gợi ý cách diễn đạt chuẩn ở cuối phản hồi.
5. Luôn đưa ra ví dụ trực quan bằng tiếng Đức kèm nghĩa tiếng Việt khi giải thích bài học.
6. Trình bày nội dung rõ ràng, sử dụng markdown, in đậm các điểm quan trọng, dùng emoji phù hợp để tạo cảm giác thân thiện.`,
};

export async function POST(req: NextRequest) {
  try {
    const { history, message, lang = "ja", systemInstruction: customInstruction } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    const systemInstruction = customInstruction || INSTRUCTIONS[lang] || INSTRUCTIONS.ja;

    if (!genAI) {
      // Friendly fallback responses if API key is not yet set
      const fallbackReplies: Record<string, string> = {
        ja: `こんにちは！「${message}」についてですね。日本語の学習を一緒に頑張りましょう！何か質問があれば何でも聞いてくださいね。`,
        en: `Hello there! Regarding "${message}", I'm here to help you practice English. Feel free to ask me anything or practice speaking!`,
        de: `Hallo! Zu "${message}" helfe ich dir gerne beim Deutschlernen weiter. Lass uns weiter üben!`,
      };
      const reply = fallbackReplies[lang] || fallbackReplies.ja;
      return new Response(reply, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // Use fastest Gemini 3.5 Flash series with fallback
    const candidateModels = ["gemini-3.5-flash", "gemini-3.6-flash"];
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
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
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next candidate...`, err);
      }
    }

    throw lastError || new Error("All Gemini models failed");

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi giao tiếp với AI. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
