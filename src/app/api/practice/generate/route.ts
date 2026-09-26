import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildJLPTListeningPrompt, buildJLPTReadingPrompt, buildJLPTVocabPrompt, buildJLPTGrammarPrompt } from "@/lib/jlptPromptBuilder";
import { getMondaiOfficialCount } from "@/lib/jlptMondaiConfig";

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
    const { type, topic, level = "N2", lang = "ja", mondaiNumber, mondaiSubtitle, questionCountMode } = await req.json();

    // Map main topics to a collection of sub-situations/contexts to guarantee diversity
    const subContextsMap: Record<string, string[]> = {
      "Sinh hoạt & Đời sống": [
        "Đi siêu thị mua sắm đồ gia dụng thiết yếu",
        "Hẹn gặp lại người bạn thân cũ ở quán cà phê ga",
        "Hỏi đường đi chi tiết đến bảo tàng mỹ thuật gần nhất",
        "Đàm phán thuê một căn hộ mới và thương lượng phí cọc",
        "Bàn luận về sự thay đổi thời tiết bất thường và dị ứng",
        "Đặt bàn trước cho nhóm bạn tại một nhà hàng truyền thống",
        "Trò chuyện với hàng xóm về quy định phân loại rác thải mới",
        "Đăng ký thẻ thư viện và mượn sách chuyên ngành",
        "Thủ tục đăng ký tạm trú và bảo hiểm y tế tại uỷ ban quận",
        "Đưa thú cưng đi khám bệnh tại phòng khám thú y",
        "Sửa chữa đồ điện gia dụng bị hỏng và gọi thợ bảo dưỡng",
        "Tham gia lớp học làm đồ gốm truyền thống cuối tuần",
        "Tổ chức tiệc tân gia và mời đồng nghiệp đến nhà",
        "Mua sắm trang phục phỏng vấn tại cửa hàng thời trang",
        "Đổi trả sản phẩm bị lỗi tại siêu thị điện máy"
      ],
      "Kinh doanh & Công sở": [
        "Họp giao ban báo cáo tiến độ công việc hàng tuần với giám đốc",
        "Báo cáo và giải trình kết quả doanh số bán hàng trong quý 2",
        "Chào hỏi xã giao và trao đổi danh thiếp với đối tác lần đầu gặp",
        "Thảo luận chi tiết về kế hoạch phát hành sản phẩm phần mềm mới",
        "Soạn thư điện tử xin lỗi khách hàng vì chậm trễ vận chuyển linh kiện",
        "Đề đạt xin phép nghỉ phép năm với sếp để đi nghỉ cùng gia đình",
        "Thuyết trình ngắn về phân tích đối thủ cạnh tranh trên thị trường",
        "Thương lượng hợp đồng cung ứng vật tư và chiết khấu số lượng lớn",
        "Phỏng vấn tuyển dụng ứng viên cho vị trí quản lý dự án",
        "Giải quyết tranh chấp và phản ánh của khách hàng về chất lượng dịch vụ",
        "Đào tạo nhân viên mới về văn hóa ứng xử và quy trình bảo mật",
        "Đánh giá hiệu suất làm việc cuối năm và xét tăng lương",
        "Đề xuất ngân sách tiếp thị cho chiến dịch truyền thông sắp tới",
        "Chuẩn bị tài liệu và hậu cần cho hội nghị khách hàng toàn quốc",
        "Đàm phán gia hạn hợp đồng hợp tác chiến lược giữa hai công ty"
      ],
      "Công nghệ & IT": [
        "Triển khai và kiểm thử chức năng xác thực hai yếu tố (2FA)",
        "Dò tìm nguyên nhân và sửa lỗi tràn bộ nhớ trên hệ thống",
        "Họp đánh giá lại thiết kế code (Review code) với kỹ sư trưởng",
        "Đưa ứng dụng lên môi trường điện toán đám mây AWS",
        "Thảo luận sôi nổi về việc ứng dụng trí tuệ nhân tạo (AI) trong y tế",
        "Phục hồi sự cố kết nối mạng nội bộ của văn phòng chi nhánh",
        "Thiết kế cấu trúc bảng cơ sở dữ liệu cho dự án ví điện tử",
        "Xây dựng quy trình tích hợp và triển khai tự động (CI/CD)",
        "Đánh giá lỗ hổng bảo mật và phòng chống tấn công mạng",
        "Tối ưu hóa tốc độ truy vấn cơ sở dữ liệu cho hệ thống lớn",
        "Chuyển đổi hệ thống cũ (Legacy System) sang kiến trúc Microservices",
        "Xử lý sự cố sập máy chủ trong giờ cao điểm traffic",
        "Thảo luận yêu cầu kỹ thuật cho tính năng thanh toán trực tuyến",
        "Nghiên cứu và thử nghiệm công nghệ blockchain trong quản lý chuỗi cung ứng",
        "Thiết kế giao diện trải nghiệm người dùng (UX/UI) cho ứng dụng di động"
      ],
      "Du lịch & Ẩm thực": [
        "Đặt phòng tại một khu nghỉ dưỡng suối nước nóng cổ kính hoặc khách sạn lớn",
        "Thưởng thức các món nhắm và gọi bia tươi tại quán ăn nhộn nhịp",
        "Hỏi đường và thông tin vé tham quan di tích lịch sử nổi tiếng",
        "Lựa chọn và thanh toán các món quà bánh lưu niệm đặc sản",
        "Bị lạc và hỏi nhân viên đồn cảnh sát cách quay về ga chính",
        "Trải nghiệm tắm hơi công cộng hoặc thư giãn chuẩn văn hóa bản xứ",
        "Đặt tour du lịch sinh thái khám phá rừng nguyên sinh",
        "Trải nghiệm lớp học nấu ăn các món ăn địa phương truyền thống",
        "Xử lý sự cố thất lạc hành lý tại sân bay quốc tế",
        "Đánh giá và viết nhận xét về chất lượng phục vụ của nhà hàng 5 sao",
        "Thuê xe tự lái và tìm hiểu luật giao thông đường bộ bản địa",
        "Tham gia lễ hội pháo hoa mùa hè và thuê trang phục truyền thống",
        "Mua vé tàu cao tốc shinkansen và đổi lịch trình chuyến đi",
        "Khám phá các khu chợ đêm ẩm thực đường phố sầm uất",
        "Thưởng thức buổi lễ trà đạo truyền thống và tìm hiểu nghệ thuật pha trà"
      ],
      "Tin tức & Xã hội": [
        "Thực trạng già hóa dân số nghiêm trọng và chính sách khuyến khích sinh",
        "Ảnh hưởng của việc nóng lên toàn cầu tới môi trường tự nhiên",
        "Lợi ích và khó khăn của xu hướng làm việc từ xa (Work from home) hiện nay",
        "Hệ thống phân loại và tái chế rác cực kỳ nghiêm ngặt tại các đô thị",
        "Tinh thần khởi nghiệp đổi mới sáng tạo của thế hệ trẻ",
        "Tác động của việc thay đổi số lượng ngày nghỉ lễ trong năm",
        "Sự gia tăng xu hướng tiêu dùng xanh và sản phẩm thân thiện môi trường",
        "Chuyển đổi số trong lĩnh vực hành chính công và dịch vụ công trực tuyến",
        "Vấn đề cân bằng giữa công việc và cuộc sống (Work-Life Balance) ở đô thị",
        "Ảnh hưởng của mạng xã hội tới tâm lý và thói quen của thanh thiếu niên",
        "Phát triển giao thông công cộng nhằm giảm ùn tắc và ô nhiễm đô thị",
        "Biến động giá cả sinh hoạt và ảnh hưởng tới chi tiêu gia đình",
        "Xu hướng học tập suốt đời và nâng cao kỹ năng nghề nghiệp trong thời đại AI",
        "Bảo tồn di sản văn hóa phi vật thể trước nguy cơ mai một",
        "Thúc đẩy bình đẳng giới và cơ hội phát triển trong môi trường làm việc"
      ]
    };

    const genericAngles = [
      "Khía cạnh chuyên sâu ít được đề cập đến",
      "Tình huống phát sinh sự cố bất ngờ cần giải quyết gấp",
      "Góc nhìn so sánh và phân tích ưu nhược điểm",
      "Trải nghiệm thực tế của người mới bắt đầu",
      "Đối thoại thảo luận chi tiết giữa hai chuyên gia"
    ];

    const contexts = subContextsMap[topic];
    let chosenContext = "";
    if (contexts && contexts.length > 0) {
      chosenContext = contexts[Math.floor(Math.random() * contexts.length)];
    } else {
      const angle = genericAngles[Math.floor(Math.random() * genericAngles.length)];
      chosenContext = `${topic} (${angle})`;
    }
    const randomSeed = Math.random().toString(36).substring(2, 7) + "-" + Date.now();

    const targetLangName = lang === "de" ? "tiếng Đức" : lang === "en" ? "tiếng Anh" : "tiếng Nhật";
    const targetLevel = lang === "de" || lang === "en" ? (level.startsWith("N") ? "A2" : level) : level;

    const diversityInstruction = `\n[YÊU CẦU ĐỘC ĐÁO & ĐỔI MỚI TỪ VỰNG TỐI ĐA - BẮT BUỘC]:
- TỰ ĐỘNG CHỌN TỪ VỰNG MỚI VÀ KHÁC BIỆT: Tuyệt đối KHÔNG lặp lại các từ vựng đơn giản, quen thuộc hoặc sơ cấp đã sử dụng phổ biến (như 行く, 食べる, 会社, 勉強, 友達, 本... trừ khi bối cảnh bắt buộc).
- Hãy chủ động khai thác các từ vựng cao cấp, chuyên sâu, các cụm từ diễn đạt đa dạng và tự nhiên thuộc trình độ ${targetLevel}.
- Mỗi lần khởi tạo nội dung phải tạo ra một tập hợp từ vựng, mẫu ngữ pháp và tình huống hoàn toàn mới lạ so với các lần trước.
- Mã định danh biến đổi ngẫu nhiên cho lượt gen này: ${randomSeed}.\n`;

    let prompt = "";

    if (lang === "de" || lang === "en") {
      if (type === "shadowing") {
        prompt = `Bạn là chuyên gia giáo trình ${targetLangName}.
Hãy tạo 3 câu luyện nói đuổi (Shadowing) cấp độ ${targetLevel} thuộc chủ đề "${topic}".
Bối cảnh cụ thể của bài luyện hôm nay là: "${chosenContext}".
Vì học viên đang học ${targetLangName}, hãy điều chỉnh bối cảnh cho phù hợp với các quốc gia nói ${targetLangName} (ví dụ thay ga Shinjuku thành ga Munich hoặc London, thay sushi thành món ăn bản xứ...).
(Mã ngẫu nhiên cho buổi học này để tạo nội dung khác biệt: ${randomSeed} - Hãy tạo câu độc đáo, khác biệt so với các lần trước).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "shadowing": [
    {
      "id": "sh_1",
      "japanese": "câu ${targetLangName} mẫu chuẩn đầy đủ để phát âm TTS",
      "japanese_ruby": "câu ${targetLangName} tương tự trường japanese (vì không dùng thẻ ruby)",
      "romaji": "hướng dẫn phát âm giản lược cho người Việt hoặc ghi chú ngữ pháp ngắn",
      "meaning": "dịch nghĩa tiếng Việt của câu này"
    },
    ... (tạo đúng 3 câu shadowing)
  ]
}`;
      } else if (type === "translation") {
        prompt = `Bạn là chuyên gia dịch thuật ${targetLangName}.
Hãy tạo đúng 4 câu bài tập Luyện dịch 2 chiều cấp độ ${targetLevel} thuộc chủ đề "${topic}".
Bối cảnh cụ thể của bài luyện hôm nay là: "${chosenContext}". Hãy điều chỉnh bối cảnh phù hợp với các quốc gia nói ${targetLangName}.
Yêu cầu: Phải có đúng 2 câu dịch từ ${targetLangName} sang Việt (direction là ja-vi) và đúng 2 câu dịch từ Việt sang ${targetLangName} (direction là vi-ja) để chia đều phản xạ dịch 2 chiều.
(Mã ngẫu nhiên cho buổi học này để tạo nội dung khác biệt: ${randomSeed} - Hãy tạo câu độc đáo, khác biệt so với các lần trước).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào nằm ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "translation": [
    {
      "id": "tr_1",
      "direction": "ja-vi",
      "source": "câu ${targetLangName} cần dịch (nếu direction là ja-vi) hoặc câu tiếng Việt cần dịch (nếu direction là vi-ja)",
      "source_ruby": "câu tương tự source (không dùng thẻ ruby)",
      "target": "đáp án dịch chuẩn tương ứng (tiếng Việt hoặc ${targetLangName})",
      "target_ruby": "câu tương tự target (không dùng thẻ ruby)",
      "pronunciation": "hướng dẫn phát âm giản lược hoặc ghi chú nhỏ cho đáp án hoặc nguồn ${targetLangName}",
      "hint": "gợi ý cách dịch hữu ích bằng tiếng Việt"
    },
    ... (tạo đúng 4 câu dịch, chia đều 2 câu xuôi và 2 câu ngược)
  ]
}`;
      } else if (type === "presentation_slides") {
        prompt = `Bạn là chuyên gia đào tạo thuyết trình ${targetLangName} chuyên nghiệp.
Hãy thiết kế cấu trúc 2 slide thuyết trình bằng ${targetLangName} về chủ đề "${topic}".
Bối cảnh chi tiết cần bám sát là: "${chosenContext}". Hãy điều chỉnh bối cảnh phù hợp với các quốc gia nói ${targetLangName}.
(Mã ngẫu nhiên để tạo nội dung mới lạ: ${randomSeed} - Hãy tạo ý tưởng slide độc đáo, khác biệt hoàn toàn).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "slides": [
    {
      "slide_number": 1,
      "title": "Tiêu đề Slide 1 bằng ${targetLangName}",
      "title_vietnamese": "Dịch nghĩa tiêu đề Slide 1 sang tiếng Việt",
      "bullets": [
        "Ý chính thứ nhất bằng ${targetLangName} (ngắn gọn dưới dạng gạch đầu dòng thuyết trình)",
        "Ý chính thứ hai bằng ${targetLangName}",
        "Ý chính thứ ba bằng ${targetLangName}"
      ],
      "bullets_vietnamese": [
        "Dịch nghĩa ý 1 sang tiếng Việt",
        "Dịch nghĩa ý 2 sang tiếng Việt",
        "Dịch nghĩa ý 3 sang tiếng Việt"
      ]
    },
    {
      "slide_number": 2,
      "title": "Tiêu đề Slide 2 bằng ${targetLangName}",
      "title_vietnamese": "Dịch nghĩa tiêu đề Slide 2 sang tiếng Việt",
      "bullets": [
        "Ý chính thứ nhất bằng ${targetLangName} của Slide 2",
        "Ý chính thứ hai bằng ${targetLangName} của Slide 2",
        "Ý chính thứ ba bằng ${targetLangName} của Slide 2"
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
        // reading
        prompt = `Bạn là chuyên gia ôn luyện đọc hiểu ${targetLangName} trình độ ${targetLevel}.
Hãy tạo 1 bài đọc hiểu trình độ ${targetLevel} thuộc chủ đề "${topic}".
Bối cảnh cụ thể của bài học hôm nay là: "${chosenContext}". Hãy điều chỉnh bối cảnh phù hợp với các quốc gia nói ${targetLangName}.
Bài đọc hiểu phải bao gồm một đoạn văn ${targetLangName} (khoảng 6-8 câu dài), CÂU HỎI BẰNG ${targetLangName.toUpperCase()}, 4 ĐÁP ÁN LỰA CHỌN BẰNG ${targetLangName}, bản dịch tiếng Việt trọn vẹn, giải thích chi tiết và danh sách từ vựng quan trọng.
(Mã ngẫu nhiên để tạo bài đọc mới lạ: ${randomSeed} - Hãy tạo bài đọc độc đáo, khác biệt so với các lần trước).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "reading": {
    "passage": "đoạn văn ${targetLangName} chuẩn không có thẻ HTML",
    "passage_ruby": "đoạn văn ${targetLangName} tương tự passage (không dùng thẻ ruby)",
    "passage_translation": "Bản dịch nghĩa tiếng Việt trọn vẹn và tự nhiên của đoạn văn trên",
    "question": "Câu hỏi đọc hiểu hoàn toàn bằng ${targetLangName.toUpperCase()} (Không dùng tiếng Việt)",
    "options": [
      { "id": "opt_1", "text": "lựa chọn đáp án 1 bằng ${targetLangName} (là đáp án đúng)", "isCorrect": true },
      { "id": "opt_2", "text": "lựa chọn đáp án 2 bằng ${targetLangName} (là đáp án sai)", "isCorrect": false },
      { "id": "opt_3", "text": "lựa chọn đáp án 3 bằng ${targetLangName} (là đáp án sai)", "isCorrect": false },
      { "id": "opt_4", "text": "lựa chọn đáp án 4 bằng ${targetLangName} (là đáp án sai)", "isCorrect": false }
    ],
    "explanation": "giải thích chi tiết ý nghĩa đoạn văn, cấu trúc ngữ pháp dùng trong bài và lý do đúng/sai bằng tiếng Việt",
    "vocabulary": [
      {
        "kanji": "từ vựng chính được trích xuất từ bài đọc (ví dụ trong tiếng Đức: Bahnhof, tiếng Anh: station)",
        "hiragana": "từ loại hoặc giống danh từ (ví dụ: noun (m) hoặc noun)",
        "meaning": "nghĩa của từ đó bằng tiếng Việt"
      },
      ... (trích xuất khoảng 4 đến 6 từ vựng hữu ích trong đoạn văn trên)
    ]
  }
}`;
      }
    } else {
      // Default Japanese (ja)
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
Yêu cầu: Phải có đúng 2 câu dịch từ Nhật sang Việt (direction là ja-vi) và đúng 2 câu dịch từ Việt sang Nhật (direction là vi-ja) để chia đều phản xạ dịch 2 chiều.
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
        "Ý ch��nh thứ hai bằng tiếng Nhật của Slide 2",
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
      } else if (type === "kaiwa") {
        prompt = `Bạn là chuyên gia giảng dạy giao tiếp Kaiwa tiếng Nhật trình độ JLPT N2 tự nhiên và chuẩn mực.
Hãy tạo 1 đoạn hội thoại Kaiwa trình độ N2 gồm ĐÚNG 10 LƯỢT LỜI HỘI THOẠI (10 câu) giữa 2 nhân vật (ví dụ: 田中 và 山田, hoặc tiền bối - hậu bối ở công sở, hoặc bạn - bạn, v.v.).
Bối cảnh cụ thể của đoạn hội thoại là: "${chosenContext}".
Sử dụng các cấu trúc ngữ pháp N2, từ vựng phong phú, kính ngữ (Keigo) hoặc cách nói tự nhiên nơi công sở/đời sống của người Nhật.
Sau 10 câu hội thoại, hãy tạo ĐÚNG 2 CÂU HỎI TRẮC NGHIỆM ĐỌC HIỂU/HỎI ĐÁP về nội dung mà 2 nhân vật vừa trao đổi (mỗi câu hỏi có 4 đáp án lựa chọn, 1 đáp án đúng, 3 đáp án sai).
(Mã ngẫu nhiên: ${randomSeed} - Hãy tạo tình huống và đối thoại độc đáo, khác biệt hoàn toàn).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown block, không có bất kỳ chữ nào ngoài cặp ngoặc nhọn JSON, phải là JSON hợp lệ):
{
  "kaiwa": {
    "title": "Tiêu đề ngắn gọn của đoạn hội thoại bằng tiếng Nhật và tiếng Việt",
    "situation": "Mô tả ngắn gọn bối cảnh và vai trò của 2 người bằng tiếng Việt",
    "speakerA": "田中 (Tanaka)",
    "speakerB": "山田 (Yamada)",
    "dialogue": [
      {
        "speaker": "A",
        "speaker_name": "田中",
        "japanese": "câu tiếng Nhật lượt 1 chuẩn N2 không thẻ HTML",
        "japanese_ruby": "câu tiếng Nhật lượt 1 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "B",
        "speaker_name": "山田",
        "japanese": "câu tiếng Nhật lượt 2 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 2 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "A",
        "speaker_name": "田中",
        "japanese": "câu tiếng Nhật lượt 3 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 3 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "B",
        "speaker_name": "山田",
        "japanese": "câu tiếng Nhật lượt 4 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 4 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "A",
        "speaker_name": "田中",
        "japanese": "câu tiếng Nhật lượt 5 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 5 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "B",
        "speaker_name": "山田",
        "japanese": "câu tiếng Nhật lượt 6 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 6 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "A",
        "speaker_name": "田中",
        "japanese": "câu tiếng Nhật lượt 7 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 7 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "B",
        "speaker_name": "山田",
        "japanese": "câu tiếng Nhật lượt 8 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 8 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "A",
        "speaker_name": "田中",
        "japanese": "câu tiếng Nhật lượt 9 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 9 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      },
      {
        "speaker": "B",
        "speaker_name": "山田",
        "japanese": "câu tiếng Nhật lượt 10 chuẩn N2",
        "japanese_ruby": "câu tiếng Nhật lượt 10 bọc thẻ <ruby> và <rt> Furigana",
        "romaji": "romaji phiên âm chuẩn",
        "meaning": "Dịch nghĩa tiếng Việt"
      }
    ],
    "questions": [
      {
        "id": "q_1",
        "question": "Câu hỏi trắc nghiệm 1 bằng TIẾNG NHẬT về nội dung cuộc trò chuyện",
        "question_vietnamese": "Dịch nghĩa câu hỏi 1 sang tiếng Việt",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 bằng tiếng Nhật (đáp án đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 bằng tiếng Nhật (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết tại sao đúng và dẫn chứng trong đoạn hội thoại bằng tiếng Việt"
      },
      {
        "id": "q_2",
        "question": "Câu hỏi trắc nghiệm 2 bằng TIẾNG NHẬT về ý định/quyết định của nhân vật",
        "question_vietnamese": "Dịch nghĩa câu hỏi 2 sang tiếng Việt",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 bằng tiếng Nhật (đáp án đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 bằng tiếng Nhật (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết tại sao đúng bằng tiếng Việt"
      }
    ],
    "key_grammar": [
      {
        "structure": "Cấu trúc ngữ pháp N2 xuất hiện trong bài (ví dụ: 〜わけにはいかない)",
        "meaning": "Ý nghĩa cấu trúc",
        "usage": "Cách dùng ngắn gọn trong bài"
      }
    ]
  }
}`;
      } else if (["listening", "jlpt_vocab", "jlpt_grammar", "reading"].includes(type)) {
        let targetCount: number | undefined = undefined;
        const currentMNum = Number(mondaiNumber) || (type === "reading" ? 10 : 1);
        if (questionCountMode === "full") {
          targetCount = getMondaiOfficialCount(type as any, level, currentMNum);
        }

        if (type === "listening") {
          prompt = buildJLPTListeningPrompt({
            level,
            topic,
            chosenContext,
            mondaiNumber: currentMNum,
            randomSeed,
            targetCount,
          });
        } else if (type === "jlpt_vocab") {
          prompt = buildJLPTVocabPrompt({
            level,
            topic,
            chosenContext,
            mondaiNumber: currentMNum,
            randomSeed,
            targetCount,
          });
        } else if (type === "jlpt_grammar") {
          prompt = buildJLPTGrammarPrompt({
            level,
            topic,
            chosenContext,
            mondaiNumber: currentMNum,
            randomSeed,
            targetCount,
          });
        } else {
          // reading by Mondai
          prompt = buildJLPTReadingPrompt({
            level,
            topic,
            chosenContext,
            mondaiNumber: currentMNum,
            randomSeed,
            targetCount,
          });
        }
      }
    }

    // Use Gemini 3.8 Flash model with reliable fallbacks
    const candidateModels = [
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ];
    let text = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.95,
            topP: 0.95
          }
        });

        const result = await model.generateContent(prompt);
        text = result.response.text();
        if (text) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} failed for practice generate, trying next candidate...`, err?.message);
      }
    }

    if (!text) {
      throw lastError || new Error("Không thể tạo nội dung từ AI. Vui lòng thử lại!");
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

    // Normalize reading & listening data structures for consistent rendering
    if (data.reading) {
      if (data.reading.questions && data.reading.questions.length > 0) {
        if (!data.reading.question) data.reading.question = data.reading.questions[0].question;
        if (!data.reading.options) data.reading.options = data.reading.questions[0].options;
        if (!data.reading.explanation) data.reading.explanation = data.reading.questions[0].explanation;
      } else if (data.reading.question) {
        data.reading.questions = [
          {
            id: "q_1",
            question: data.reading.question,
            options: data.reading.options || [],
            explanation: data.reading.explanation || "",
          },
        ];
      }
    }

    if (data.listening) {
      if (data.listening.questions && data.listening.questions.length > 0) {
        if (!data.listening.question) data.listening.question = data.listening.questions[0].question;
        if (!data.listening.options) data.listening.options = data.listening.questions[0].options;
        if (data.listening.correctAnswer === undefined) data.listening.correctAnswer = data.listening.questions[0].correctAnswer;
        if (!data.listening.explanation) data.listening.explanation = data.listening.questions[0].explanation;
      } else if (data.listening.question) {
        data.listening.questions = [
          {
            id: "q_1",
            question: data.listening.question,
            options: data.listening.options || [],
            correctAnswer: data.listening.correctAnswer ?? 0,
            explanation: data.listening.explanation || "",
          },
        ];
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("AI practice generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate practice content" },
      { status: 500 }
    );
  }
}
