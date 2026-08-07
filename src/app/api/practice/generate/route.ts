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

    // Map main topics to a collection of sub-situations/contexts to guarantee diversity
    const subContextsMap: Record<string, string[]> = {
      "Sinh hoạt & Đời sống": [
        "Đi siêu thị mua sắm đồ gia dụng thiết yếu",
        "Hẹn gặp lại người bạn thân cũ ở quán cà phê ga Shinjuku",
        "Hỏi đường đi chi tiết đến bảo tàng mỹ thuật gần nhất",
        "Đàm phán thuê một căn hộ mới và thương lượng phí cọc lễ",
        "Bàn luận về sự thay đổi thời tiết bất thường và dị ứng phấn hoa",
        "Đặt bàn trước cho nhóm bạn tại một nhà hàng Sushi truyền thống",
        "Trò chuyện với hàng xóm về quy định phân loại rác thải nhựa mới"
      ],
      "Kinh doanh & Công sở": [
        "Họp giao ban báo cáo tiến độ công việc hàng tuần với giám đốc",
        "Báo cáo và giải trình kết quả doanh số bán hàng trong quý 2",
        "Chào hỏi xã giao và trao đổi danh thiếp với đối tác Nhật lần đầu gặp",
        "Thảo luận chi tiết về kế hoạch phát hành sản phẩm phần mềm mới",
        "Soạn thư điện tử xin lỗi khách hàng vì chậm trễ vận chuyển linh kiện",
        "Đề đạt xin phép nghỉ phép năm với sếp để đi nghỉ cùng gia đình",
        "Thuyết trình ngắn về phân tích đối thủ cạnh tranh trên thị trường"
      ],
      "Công nghệ & IT": [
        "Triển khai và kiểm thử chức năng xác thực hai yếu tố (2FA)",
        "Dò tìm nguyên nhân và sửa lỗi tràn bộ nhớ trên hệ thống",
        "Họp đánh giá lại thiết kế code (Review code) với kỹ sư trưởng Nhật",
        "Đưa ứng dụng lên môi trường điện toán đám mây AWS",
        "Thảo luận sôi nổi về việc ứng dụng trí tuệ nhân tạo (AI) trong y tế",
        "Phục hồi sự cố kết nối mạng nội bộ của văn phòng chi nhánh",
        "Thiết kế cấu trúc bảng cơ sở dữ liệu cho dự án ví điện tử"
      ],
      "Du lịch & Ẩm thực": [
        "Đặt phòng tại một khu nghỉ dưỡng suối nước nóng Ryokan cổ kính ở Hakone",
        "Thưởng thức các món nhắm và gọi bia tươi tại quán Izakaya nhộn nhịp",
        "Hỏi đường và thông tin vé tham quan chùa vàng Kinkaku-ji ở Kyoto",
        "Lựa chọn và thanh toán các món quà bánh lưu niệm Omiyage đặc sản",
        "Bị lạc và hỏi nhân viên đồn cảnh sát Koban cách quay về ga chính",
        "Trải nghiệm cách tắm bồn công cộng Sento chuẩn văn hóa Nhật Bản"
      ],
      "Tin tức & Xã hội": [
        "Thực trạng già hóa dân số nghiêm trọng và chính sách khuyến khích sinh của Nhật",
        "Ảnh hưởng của việc nóng lên toàn cầu tới mùa hoa anh đào nở sớm",
        "Lợi ích và khó khăn của xu hướng làm việc từ xa (Work from home) hiện nay",
        "Hệ thống phân loại và tái chế rác cực kỳ nghiêm ngặt tại các đô thị",
        "Tinh thần khởi nghiệp đổi mới sáng tạo của thế hệ trẻ Nhật Bản",
        "Tác động của việc thay đổi số lượng ngày nghỉ lễ vàng (Golden Week)"
      ]
    };

    const contexts = subContextsMap[topic] || [topic];
    const chosenContext = contexts[Math.floor(Math.random() * contexts.length)];
    const randomSeed = Math.random().toString(36).substring(2, 7) + "-" + Date.now();

    let prompt = "";

    if (type === "shadowing") {
      prompt = `Bạn là chuyên gia giáo trình tiếng Nhật.
Hãy tạo 3 câu luyện nói đuổi (Shadowing) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể của bài luyện hôm nay là: "${chosenContext}".
(Mã ngẫu nhiên cho buổi học này để tạo nội dung khác biệt: ${randomSeed} - Hãy tạo câu độc đáo, khác biệt so với các lần trước).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "shadowing": [
    {
      "id": "sh_1",
      "japanese": "câu tiếng Nhật mẫu chuẩn đầy đủ để máy đọc TTS phát âm",
      "japanese_ruby": "câu tiếng Nhật tương ứng bọc thẻ <ruby> và <rt> hiển thị Furigana, ví dụ: <ruby>日本<rt>にほん</rt></ruby>...",
      "romaji": "phiên âm romaji câu tiếng Nhật",
      "meaning": "dịch nghĩa tiếng Việt của câu này"
    },
    ... (tạo đúng 3 câu shadowing)
  ]
}`;
    } else if (type === "translation") {
      prompt = `Bạn là chuyên gia dịch thuật tiếng Nhật.
Hãy tạo đúng 4 câu bài tập Luyện dịch 2 chiều cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể của bài luyện hôm nay là: "${chosenContext}".
Yêu cầu: Phải có đúng 2 câu dịch từ Nhật sang Việt (direction là ja-vi) và đúng 2 câu dịch từ Việt sang Nhật (direction là vi-ja) để chia đều phản xạ dịch.
(Mã ngẫu nhiên cho buổi học này để tạo nội dung khác biệt: ${randomSeed} - Hãy tạo câu độc đáo, khác biệt so với các lần trước).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "translation": [
    {
      "id": "tr_1",
      "direction": "ja-vi",
      "source": "câu tiếng Nhật cần dịch (nếu direction là ja-vi) hoặc câu tiếng Việt cần dịch (nếu direction là vi-ja)",
      "source_ruby": "chuỗi HTML có thẻ <ruby> và <rt> để hiển thị Furigana trên đầu các chữ Hán tự (chỉ áp dụng nếu source là tiếng Nhật)",
      "target": "đáp án dịch chuẩn tương ứng (tiếng Việt hoặc tiếng Nhật)",
      "target_ruby": "chuỗi HTML có thẻ <ruby> và <rt> cho chữ Hán tự (chỉ áp dụng nếu đáp án dịch target là tiếng Nhật)",
      "pronunciation": "phiên âm Hiragana/kana của đáp án hoặc nguồn tiếng Nhật tương ứng",
      "hint": "gợi ý cách dịch hữu ích bằng tiếng Việt"
    },
    ... (tạo đúng 4 câu dịch, chia đều 2 Nhật-Việt và 2 Việt-Nhật)
  ]
}`;
    } else if (type === "presentation_slides") {
      prompt = `Bạn là chuyên gia đào tạo thuyết trình tiếng Nhật chuyên nghiệp.
Hãy thiết kế cấu trúc 2 slide thuyết trình bằng tiếng Nhật về chủ đề "${topic}".
Bối cảnh chi tiết cần bám sát là: "${chosenContext}".
(Mã ngẫu nhiên để tạo nội dung mới lạ: ${randomSeed} - Hãy tạo ý tưởng slide độc đáo, khác biệt hoàn toàn).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Tiêu đề Slide 1 bằng tiếng Nhật",
      "title_vietnamese": "Dịch nghĩa tiêu đề Slide 1 sang tiếng Việt",
      "bullets": [
        "Ý chính thứ nhất bằng tiếng Nhật (ngắn gọn dưới dạng gạch đầu dòng thuyết trình)",
        "Ý chính thứ hai bằng tiếng Nhật",
        "Ý chính thứ ba bằng tiếng Nhật"
      ],
      "bullets_vietnamese": [
        "Dịch nghĩa ý 1 sang tiếng Việt",
        "Dịch nghĩa ý 2 sang tiếng Việt",
        "Dịch nghĩa ý 3 sang tiếng Việt"
      ]
    },
    {
      "slide_number": 2,
      "title": "Tiêu đề Slide 2 bằng tiếng Nhật",
      "title_vietnamese": "Dịch nghĩa tiêu đề Slide 2 sang tiếng Việt",
      "bullets": [
        "Ý chính thứ nhất bằng tiếng Nhật của Slide 2",
        "Ý chính thứ hai bằng tiếng Nhật của Slide 2",
        "Ý chính thứ ba bằng tiếng Nhật của Slide 2"
      ],
      "bullets_vietnamese": [
        "Dịch nghĩa ý 1",
        "Dịch nghĩa ý 2",
        "Dịch nghĩa ý 3"
      ]
    }
  ]
}`;
    } else {
      // reading N2
      prompt = `Bạn là chuyên gia ôn luyện đọc hiểu JLPT N2.
Hãy tạo 1 bài đọc hiểu trình độ N2 (đáp ứng đúng tiêu chuẩn kỳ thi JLPT N2) thuộc chủ đề "${topic}".
Bối cảnh cụ thể của bài học hôm nay là: "${chosenContext}".
Bài đọc hiểu phải bao gồm một đoạn văn tiếng Nhật (khoảng 6-8 câu dài), CÂU HỎI BẰNG TIẾNG NHẬT, 4 ĐÁP ÁN LỰA CHỌN BẰNG TIẾNG NHẬT, bản dịch tiếng Việt của đoạn văn, và danh sách các từ vựng chính xuất hiện trong bài đọc.
(Mã ngẫu nhiên để tạo bài đọc mới lạ: ${randomSeed} - Hãy tạo bài đọc độc đáo, khác biệt so với các lần trước).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "reading": {
    "passage": "đoạn văn tiếng Nhật chuẩn N2 không có thẻ HTML",
    "passage_ruby": "đoạn văn tiếng Nhật N2 bọc thẻ <ruby> và <rt> hiển thị Furigana trên đầu mọi chữ Hán tự để người dùng dễ đọc, ví dụ: <ruby>東京<rt>とうきょう</rt></ruby>にある...",
    "passage_translation": "Bản dịch nghĩa tiếng Việt trọn vẹn và tự nhiên của đoạn văn trên",
    "question": "Câu hỏi đọc hiểu hoàn toàn bằng TIẾNG NHẬT (Không dùng tiếng Việt)",
    "options": [
      { "id": "opt_1", "text": "lựa chọn đáp án 1 bằng tiếng Nhật (là đáp án đúng)", "isCorrect": true },
      { "id": "opt_2", "text": "lựa chọn đáp án 2 bằng tiếng Nhật (là đáp án sai)", "isCorrect": false },
      { "id": "opt_3", "text": "lựa chọn đáp án 3 bằng tiếng Nhật (là đáp án sai)", "isCorrect": false },
      { "id": "opt_4", "text": "lựa chọn đáp án 4 bằng tiếng Nhật (là đáp án sai)", "isCorrect": false }
    ],
    "explanation": "giải thích chi tiết ý nghĩa đoạn văn, cấu trúc ngữ pháp N2 dùng trong bài và lý do đúng/sai bằng tiếng Việt",
    "vocabulary": [
      {
        "kanji": "chữ Hán tự chính được trích xuất từ bài đọc (ví dụ: 医師)",
        "hiragana": "cách đọc chữ Hán tự đó (ví dụ: いし)",
        "meaning": "nghĩa của từ đó bằng tiếng Việt (ví dụ: Bác sĩ)"
      },
      ... (trích xuất khoảng 4 đến 6 từ vựng hữu ích trong đoạn văn trên)
    ]
  }
}`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.95
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

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
    console.error("AI practice generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate practice content" },
      { status: 500 }
    );
  }
}
