export interface JLPTListeningPromptParams {
  level: string;
  topic: string;
  chosenContext: string;
  mondaiNumber?: number;
  randomSeed: string;
  targetCount?: number;
}

export interface JLPTReadingPromptParams {
  level: string;
  topic: string;
  chosenContext: string;
  mondaiNumber?: number;
  randomSeed: string;
  targetCount?: number;
}

const DIVERSITY_RULE = (level: string, randomSeed: string) => `
[YÊU CẦU ĐỘC ĐÁO & ĐỔI MỚI TỪ VỰNG TỐI ĐA - BẮT BUỘC]:
- TỰ ĐỘNG CHỌN TỪ VỰNG MỚI VÀ KHÁC BIỆT: Tuyệt đối KHÔNG lặp lại các từ vựng đơn giản, quen thuộc hoặc sơ cấp đã sử dụng phổ biến (như 行く, 食べる, 会社, 勉強, 友達, 本... trừ khi bối cảnh bắt buộc).
- Hãy chủ động khai thác các từ vựng cao cấp, chuyên sâu, các cụm từ diễn đạt đa dạng và tự nhiên thuộc trình độ ${level}.
- Mỗi lần khởi tạo nội dung phải tạo ra một tập hợp từ vựng, mẫu ngữ pháp và tình huống hoàn toàn mới lạ so với các lần trước.
- Mã định danh biến đổi ngẫu nhiên cho lượt gen này: ${randomSeed}.`;

export function buildJLPTListeningPrompt({
  level,
  topic,
  chosenContext,
  mondaiNumber = 1,
  randomSeed,
  targetCount,
}: JLPTListeningPromptParams): string {
  const mNum = Number(mondaiNumber) || 1;

  if (mNum === 1) {
    if (targetCount && targetCount > 1) {
      return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn ĐÚNG ${targetCount} BÀI NGHE ĐỘC LẬP CHUẨN XÁC theo cấu trúc bộ đề thi thật 問題 1: 課題理解 (Hiểu nhiệm vụ tiếp theo) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh chủ đề: "${chosenContext}".
Đặc trưng cấu trúc Mondai 1:
Mỗi câu hỏi là một bài nghe độc lập có tình huống, câu hỏi và kịch bản đối thoại riêng biệt giữa 2 nhân vật (Nam và Nữ). Nhân vật bàn về các nhiệm vụ cần làm, có chi tiết gây nhiễu, xác định rõ việc PHẢI LÀM TRƯỚC TIÊN. Đúng 4 lựa chọn trắc nghiệm tiếng Nhật.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 1,
    "mondaiName": "問題 1: 課題理解",
    "mondaiSubtitle": "Hiểu nhiệm vụ hành động tiếp theo (${targetCount} câu chuẩn đề thi)",
    "title": "${topic}",
    "questions": [
      {
        "id": "q_1",
        "situation": "Câu bối cảnh tiếng Nhật mở đầu câu 1 (ví dụ: 会社で女の人と男の人が話しています。)",
        "situation_translation": "Dịch tiếng Việt câu bối cảnh câu 1",
        "audioScript": "Toàn bộ đoạn hội thoại tiếng Nhật câu 1 (có nhãn 女: ... và 男: ...)",
        "audioScript_ruby": "Toàn bộ đoạn hội thoại câu 1 có thẻ <ruby> và <rt> Furigana",
        "vietnameseTranslation": "Bản dịch tiếng Việt kịch bản câu 1",
        "question": "Câu hỏi tiếng Nhật câu 1 (ví dụ: 男の人はこのあと、まず何をしますか。)",
        "question_translation": "Dịch tiếng Việt câu hỏi 1",
        "options": [
          "Lựa chọn 1 bằng tiếng Nhật",
          "Lựa chọn 2 bằng tiếng Nhật",
          "Lựa chọn 3 bằng tiếng Nhật",
          "Lựa chọn 4 bằng tiếng Nhật"
        ],
        "correctAnswer": 0,
        "explanation": "Giải thích chi tiết tại sao đáp án đúng và phân tích bẫy câu 1"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${targetCount} CÂU HỎI TỪ q_1 ĐẾN q_${targetCount}, MỖI CÂU ĐỀU CÓ situation, audioScript, audioScript_ruby, vietnameseTranslation, question, options, correctAnswer, explanation RIÊNG BIỆT)
    ],
    "vocabulary": [
      { "kanji": "từ vựng trong các bài nghe", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
    }

    return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn 1 bài nghe CHUẨN XÁC theo cấu trúc 問題 1: 課題理解 (Hiểu nhiệm vụ tiếp theo) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
Đặc trưng cấu trúc Mondai 1:
1. Có lời dẫn mở đầu nêu bối cảnh (ví dụ: "会社で女の人と男の人が話しています。").
2. Câu hỏi nhiệm vụ đầu tiên (ví dụ: "男の人はこのあと、まず何をしますか。").
3. Kịch bản hội thoại tự nhiên giữa 2 người (Nam & Nữ) bàn luận về các công việc/nhiệm vụ. Có chi tiết gây nhiễu, ưu tiên thay đổi hoặc việc đã làm rồi, xác định rõ việc nhân vật PHẢI LÀM TRƯỚC TIÊN.
4. Câu hỏi được nhắc lại ở cuối.
5. Đúng 4 lựa chọn trắc nghiệm tiếng Nhật.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 1,
    "mondaiName": "問題 1: 課題理解",
    "mondaiSubtitle": "Hiểu nhiệm vụ hành động tiếp theo",
    "title": "Chủ đề ngắn gọn",
    "situation": "Câu bối cảnh tiếng Nhật mở đầu, ví dụ: 会社で女の人と男の人が話しています。",
    "situation_translation": "Dịch tiếng Việt câu bối cảnh",
    "audioScript": "Toàn bộ đoạn hội thoại tiếng Nhật (có nhãn 女: ... và 男: ...)",
    "audioScript_ruby": "Toàn bộ đoạn hội thoại có thẻ <ruby> và <rt> Furigana",
    "vietnameseTranslation": "Bản dịch tiếng Việt tự nhiên của toàn bộ kịch bản hội thoại",
    "question": "Câu hỏi tiếng Nhật (ví dụ: 男の人はこのあと、まず何をしますか。)",
    "question_translation": "Dịch tiếng Việt câu hỏi",
    "options": [
      "Lựa chọn 1 bằng tiếng Nhật",
      "Lựa chọn 2 bằng tiếng Nhật",
      "Lựa chọn 3 bằng tiếng Nhật",
      "Lựa chọn 4 bằng tiếng Nhật"
    ],
    "correctAnswer": 0,
    "explanation": "Giải thích chi tiết tại sao đáp án này đúng, dẫn chứng câu nói trong bài và phân tích bẫy bằng tiếng Việt",
    "vocabulary": [
      { "kanji": "từ vựng trong bài", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  if (mNum === 2) {
    if (targetCount && targetCount > 1) {
      return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn ĐÚNG ${targetCount} BÀI NGHE ĐỘC LẬP CHUẨN XÁC theo cấu trúc bộ đề thi thật 問題 2: ポイント理解 (Nắm bắt điểm mấu chốt & lý do) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh chủ đề: "${chosenContext}".
Đặc trưng cấu trúc Mondai 2:
Mỗi câu hỏi là một bài nghe độc lập có tình huống, câu hỏi về lý do then chốt và kịch bản hội thoại/độc thoại riêng. Đúng 4 đáp án tiếng Nhật.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 2,
    "mondaiName": "問題 2: ポイント理解",
    "mondaiSubtitle": "Nắm bắt trọng điểm & lý do (${targetCount} câu chuẩn đề thi)",
    "title": "${topic}",
    "questions": [
      {
        "id": "q_1",
        "situation": "Câu bối cảnh tiếng Nhật mở đầu câu 1",
        "situation_translation": "Dịch nghĩa tiếng Việt bối cảnh câu 1",
        "audioScript": "Toàn bộ bài nghe tiếng Nhật câu 1",
        "audioScript_ruby": "Toàn bộ bài nghe câu 1 có thẻ <ruby> và <rt>",
        "vietnameseTranslation": "Bản dịch tiếng Việt câu 1",
        "question": "Câu hỏi tiếng Nhật về lý do/điểm mấu chốt của câu 1",
        "question_translation": "Dịch tiếng Việt câu hỏi 1",
        "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
        "correctAnswer": 1,
        "explanation": "Giải thích chi tiết dẫn chứng từ bài nghe câu 1"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${targetCount} CÂU HỎI TỪ q_1 ĐẾN q_${targetCount}, MỖI CÂU CÓ situation, audioScript, audioScript_ruby, vietnameseTranslation, question, options, correctAnswer, explanation RIÊNG BIỆT)
    ],
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
    }

    return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn 1 bài nghe CHUẨN XÁC theo cấu trúc 問題 2: ポイント理解 (Nắm bắt điểm mấu chốt & lý do) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
Đặc trưng cấu trúc Mondai 2:
1. Câu hỏi mở đầu về lý do/điểm mấu chốt (ví dụ: "男の人が〜について話しています。〜の最も大きな理由は何ですか。").
2. Kịch bản hội thoại hoặc độc thoại có thảo luận nhiều yếu tố nhưng làm nổi bật lý do then chốt (nhất là sau các từ nối: でも、実は、何より、一番...).
3. Câu hỏi được nhắc lại ở cuối.
4. Đúng 4 đáp án tiếng Nhật.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 2,
    "mondaiName": "問題 2: ポイント理解",
    "mondaiSubtitle": "Nắm bắt trọng điểm & lý do",
    "title": "Chủ đề ngắn gọn",
    "situation": "Câu bối cảnh tiếng Nhật mở đầu",
    "situation_translation": "Dịch nghĩa tiếng Việt bối cảnh",
    "audioScript": "Toàn bộ bài nghe tiếng Nhật",
    "audioScript_ruby": "Toàn bộ bài nghe có thẻ <ruby> và <rt>",
    "vietnameseTranslation": "Bản dịch tiếng Việt",
    "question": "Câu hỏi tiếng Nhật về lý do/điểm mấu chốt",
    "question_translation": "Dịch tiếng Việt câu hỏi",
    "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
    "correctAnswer": 1,
    "explanation": "Giải thích chi tiết dẫn chứng từ bài nghe và phân tích bẫy bằng tiếng Việt",
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  if (mNum === 3) {
    if (targetCount && targetCount > 1) {
      return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn ĐÚNG ${targetCount} BÀI NGHE ĐỘC LẬP CHUẨN XÁC theo cấu trúc bộ đề thi thật 問題 3: 概要理解 (Hiểu chủ đề bao quát & quan điểm) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh chủ đề: "${chosenContext}".
Đặc trưng cấu trúc Mondai 3:
Mỗi câu hỏi là một bài độc thoại riêng biệt (6-8 câu dài), câu hỏi xuất hiện ở cuối bài. Đúng 4 đáp án tóm lược nội dung/quan điểm.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 3,
    "mondaiName": "問題 3: 概要理解",
    "mondaiSubtitle": "Hiểu chủ đề bao quát & quan điểm (${targetCount} câu chuẩn đề thi)",
    "title": "${topic}",
    "questions": [
      {
        "id": "q_1",
        "situation": "Câu bối cảnh tiếng Nhật mở đầu câu 1 (ví dụ: ラジオでアナウンサーが話しています。)",
        "situation_translation": "Dịch tiếng Việt bối cảnh 1",
        "audioScript": "Bài nói độc thoại tiếng Nhật chuẩn ${level} câu 1",
        "audioScript_ruby": "Bài nói câu 1 có thẻ <ruby> và <rt>",
        "vietnameseTranslation": "Dịch tiếng Việt bài nói câu 1",
        "question": "Câu hỏi tổng quát ở cuối bài bằng tiếng Nhật câu 1",
        "question_translation": "Dịch câu hỏi câu 1",
        "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
        "correctAnswer": 0,
        "explanation": "Giải thích tóm lược ý đồ người nói và phân tích từng đáp án câu 1"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${targetCount} CÂU HỎI TỪ q_1 ĐẾN q_${targetCount}, MỖI CÂU CÓ situation, audioScript, question, options RIÊNG BIỆT)
    ],
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
    }

    return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn 1 bài nghe CHUẨN XÁC theo cấu trúc 問題 3: 概要理解 (Hiểu chủ đề bao quát & quan điểm) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
Đặc trưng cấu trúc Mondai 3:
1. Lời dẫn ngắn (ví dụ: "テレビで専門家が〜について話しています。").
2. LƯU Ý: KHÔNG ĐỌC CÂU HỎI TRƯỚC! Người nghe nghe toàn bộ bài nói độc thoại (6-8 câu dài) phân tích hiện trạng và quan điểm.
3. Câu hỏi CHỈ XUẤT HIỆN Ở CUỐI BÀI (ví dụ: "専門家は何について話していますか。" hoặc "話者が最も伝えたいことは何ですか。").
4. Đúng 4 đáp án tóm lược nội dung/quan điểm.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 3,
    "mondaiName": "問題 3: 概要理解",
    "mondaiSubtitle": "Hiểu chủ đề bao quát & quan điểm",
    "title": "Chủ đề ngắn gọn",
    "situation": "Câu bối cảnh tiếng Nhật, ví dụ: ラジオでアナウンサーが話しています。",
    "situation_translation": "Dịch tiếng Việt",
    "audioScript": "Bài nói độc thoại tiếng Nhật chuẩn ${level}",
    "audioScript_ruby": "Bài nói có thẻ <ruby> và <rt>",
    "vietnameseTranslation": "Dịch tiếng Việt toàn bài",
    "question": "Câu hỏi tổng quát ở cuối bài bằng tiếng Nhật",
    "question_translation": "Dịch câu hỏi",
    "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
    "correctAnswer": 0,
    "explanation": "Giải thích tóm lược ý đồ người nói và phân tích từng đáp án bằng tiếng Việt",
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  if (mNum === 4) {
    if (targetCount && targetCount > 1) {
      return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn ĐÚNG ${targetCount} CÂU HỎI ĐỘC LẬP CHUẨN XÁC theo cấu trúc bộ đề thi thật 問題 4: 即時応答 (Phản xạ câu ứng đáp tức thì) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh chủ đề: "${chosenContext}".
ĐẶC TRƯNG BẮT BUỘC CỦA TỪNG CÂU:
1. Một câu nói ngắn của đối phương (tiền bối, cấp trên, khách hàng, bạn bè) chứa kính ngữ, cách nói gián tiếp, nhờ vả, hoặc than phiền.
2. ĐÚNG 3 LỰA CHỌN PHẢN XẠ (CHỈ CÓ 3 ĐÁP ÁN 1, 2, 3 THEO CHUẨN JLPT, KHÔNG ĐƯỢC CÓ ĐÁP ÁN 4!).
3. 1 đáp án đối đáp khéo léo, tự nhiên, đúng chuẩn mực; 2 đáp án sai là hiểu nhầm ý hoặc dùng sai kính ngữ.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 4,
    "mondaiName": "問題 4: 即時応答",
    "mondaiSubtitle": "Phản xạ câu ứng đáp tức thì (${targetCount} câu chuẩn đề thi - 3 đáp án)",
    "title": "${topic}",
    "questions": [
      {
        "id": "q_1",
        "situation": "Tình huống ngắn câu 1, ví dụ: 先輩から声をかけられました。何と答えますか。",
        "situation_translation": "Dịch tiếng Việt tình huống",
        "audioScript": "Câu nói tiếng Nhật của người phát ngôn (chỉ 1 câu)",
        "audioScript_ruby": "Câu nói có thẻ <ruby> và <rt>",
        "vietnameseTranslation": "Dịch nghĩa câu nói",
        "question": "最もよい返答を選びなさい。",
        "question_translation": "Hãy chọn câu trả lời thích hợp nhất.",
        "options": [
          "Câu đáp 1 bằng tiếng Nhật",
          "Câu đáp 2 bằng tiếng Nhật",
          "Câu đáp 3 bằng tiếng Nhật"
        ],
        "correctAnswer": 1,
        "explanation": "Giải thích chi tiết sắc thái ngữ cảnh và tại sao phương án này chuẩn mực, tại sao 2 phương án kia sai"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${targetCount} CÂU HỎI TỪ q_1 ĐẾN q_${targetCount}, MỖI CÂU ĐỀU CÓ audioScript 1 câu và ĐÚNG 3 options)
    ],
    "vocabulary": [
      { "kanji": "từ vựng/ngữ pháp", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
    }

    return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn 1 bài nghe CHUẨN XÁC theo cấu trúc 問題 4: 即時応答 (Phản xạ câu ứng đáp tức thì) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
ĐẶC TRƯNG BẮT BUỘC:
1. Một câu nói ngắn của đối phương (tiền bối, cấp trên, khách hàng, bạn bè) chứa kính ngữ, cách nói gián tiếp, nhờ vả, hoặc than phiền.
2. ĐÚNG 3 LỰA CHỌN PHẢN XẠ (CHỈ CÓ 3 ĐÁP ÁN 1, 2, 3 THEO CHUẨN JLPT, KHÔNG ĐƯỢC CÓ ĐÁP ÁN 4!).
3. 1 đáp án đối đáp khéo léo, tự nhiên, đúng chuẩn mực; 2 đáp án sai là hiểu nhầm ý hoặc dùng sai kính ngữ.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 4,
    "mondaiName": "問題 4: 即時応答",
    "mondaiSubtitle": "Phản xạ câu ứng đáp tức thì (3 đáp án)",
    "title": "Tình huống ứng đáp ngắn",
    "situation": "Tình huống ngắn, ví dụ: 先輩から声をかけられました。何と答えますか。",
    "situation_translation": "Dịch tiếng Việt tình huống",
    "audioScript": "Câu nói tiếng Nhật của người phát ngôn (chỉ 1 câu)",
    "audioScript_ruby": "Câu nói có thẻ <ruby> và <rt>",
    "vietnameseTranslation": "Dịch nghĩa câu nói",
    "question": "最もよい返答を選びなさい。",
    "question_translation": "Hãy chọn câu trả lời thích hợp nhất.",
    "options": [
      "Câu đáp 1 bằng tiếng Nhật",
      "Câu đáp 2 bằng tiếng Nhật",
      "Câu đáp 3 bằng tiếng Nhật"
    ],
    "correctAnswer": 1,
    "explanation": "Giải thích chi tiết sắc thái ngữ cảnh và tại sao phương án này chuẩn mực, tại sao 2 phương án kia sai",
    "vocabulary": [
      { "kanji": "từ vựng/ngữ pháp", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  // Mondai 5: 統合理解 (Integrated listening - 2 or 3 questions)
  const q5Count = targetCount && targetCount >= 2 ? targetCount : 2;
  return `Bạn là chuyên gia ra đề thi Nghe hiểu JLPT ${level} (聴解).${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn 1 bài nghe CHUẨN XÁC theo cấu trúc 問題 5: 統合理解 (Nghe hiểu tích hợp đối thoại dài) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
ĐẶC TRƯNG:
1. Hội thoại dài thảo luận giữa 2-3 người (ví dụ: người giới thiệu các gói/phương án; sau đó các nhân vật bàn luận và đưa ra quyết định).
2. CÓ ĐÚNG ${q5Count} CÂU HỎI TRẮC NGHIỆM LIÊN TIẾP (mỗi câu có 4 lựa chọn).
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "listening": {
    "id": "lis_${randomSeed}",
    "level": "${level}",
    "mondaiNumber": 5,
    "mondaiName": "問題 5: 統合理解",
    "mondaiSubtitle": "Nghe hiểu tích hợp đối thoại dài (${q5Count} câu hỏi)",
    "title": "Chủ đề bài nghe tích hợp",
    "situation": "Câu bối cảnh mở đầu bằng tiếng Nhật",
    "situation_translation": "Dịch bối cảnh",
    "audioScript": "Toàn bộ bài nghe đàm thoại dài bằng tiếng Nhật giữa các nhân vật",
    "audioScript_ruby": "Bài nghe có thẻ <ruby> và <rt>",
    "vietnameseTranslation": "Bản dịch tiếng Việt toàn bài",
    "questions": [
      {
        "id": "q_1",
        "question": "Câu hỏi 1 bằng tiếng Nhật",
        "question_vietnamese": "Dịch câu hỏi 1",
        "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
        "correctAnswer": 0,
        "explanation": "Giải thích chi tiết câu 1 bằng tiếng Việt"
      },
      {
        "id": "q_2",
        "question": "Câu hỏi 2 bằng tiếng Nhật",
        "question_vietnamese": "Dịch câu hỏi 2",
        "options": ["Lựa chọn 1", "Lựa chọn 2", "Lựa chọn 3", "Lựa chọn 4"],
        "correctAnswer": 2,
        "explanation": "Giải thích chi tiết câu 2 bằng tiếng Việt"
      }
    ],
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
}

export function buildJLPTReadingPrompt({
  level,
  topic,
  chosenContext,
  mondaiNumber = 10,
  randomSeed,
  targetCount,
}: JLPTReadingPromptParams): string {
  const mNum = Number(mondaiNumber) || 10;
  const isComparison = (level === "N1" && mNum === 11) || (level === "N2" && mNum === 12);
  const isInfoSearch = (level === "N1" && mNum === 13) || (level === "N2" && mNum === 14) || (level === "N3" && mNum === 12) || ((level === "N4" || level === "N5") && mNum === 10);
  const isMedium = (level === "N1" && mNum === 9) || (level === "N2" && mNum === 11) || (level === "N3" && mNum === 10) || ((level === "N4" || level === "N5") && mNum === 9);
  const isLong4 = (level === "N1" && mNum === 12) || (level === "N3" && mNum === 11);
  const isLong = (level === "N1" && mNum === 10) || (level === "N2" && mNum === 13) || isLong4;

  if (isComparison) {
    return `Bạn là chuyên gia ôn luyện đọc hiểu JLPT ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn 1 bài đọc hiểu CHUẨN XÁC theo cấu trúc Đọc hiểu so sánh (統合理解) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
ĐẶC TRƯNG BẮT BUỘC:
1. Gồm ĐÚNG 2 BÀI VĂN RIÊNG BIỆT:
   - Bài văn A (文章 A): khoảng 250-300 chữ, bàn về vấn đề từ góc nhìn thứ nhất.
   - Bài văn B (文章 B): khoảng 250-300 chữ, bàn về cùng vấn đề từ góc nhìn thứ hai.
2. Gồm ĐÚNG 2 CÂU HỎI TRẮC NGHIỆM ĐỐI CHIẾU:
   - Câu hỏi 1: So sánh quan điểm chung hoặc khác biệt giữa tác giả A và B.
   - Câu hỏi 2: Tác giả A và B nghĩ thế nào về một khía cạnh cụ thể.
   - Mỗi câu có 4 lựa chọn tiếng Nhật, 1 đúng 3 sai.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "reading": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: 統合理解",
    "mondaiSubtitle": "Đọc hiểu so sánh 2 bài viết (統合理解)",
    "title": "Tiêu đề chủ đề so sánh",
    "passageA": {
      "title": "文章 A",
      "text": "Nội dung bài viết A bằng tiếng Nhật",
      "text_ruby": "Nội dung bài viết A bọc thẻ <ruby> và <rt> Furigana",
      "translation": "Bản dịch tiếng Việt bài A"
    },
    "passageB": {
      "title": "文章 B",
      "text": "Nội dung bài viết B bằng tiếng Nhật",
      "text_ruby": "Nội dung bài viết B bọc thẻ <ruby> và <rt> Furigana",
      "translation": "Bản dịch tiếng Việt bài B"
    },
    "questions": [
      {
        "id": "q_1",
        "question": "Câu hỏi 1 so sánh bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 1 sang tiếng Việt",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết dẫn chứng từ bài A và bài B bằng tiếng Việt"
      },
      {
        "id": "q_2",
        "question": "Câu hỏi 2 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 2",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết bằng tiếng Việt"
      }
    ],
    "vocabulary": [
      { "kanji": "từ vựng chính", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  if (isInfoSearch) {
    return `Bạn là chuyên gia ôn luyện đọc hiểu JLPT ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy biên soạn 1 bài đọc hiểu CHUẨN XÁC theo cấu trúc Tìm kiếm thông tin (情報検索) cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
ĐẶC TRƯNG BẮT BUỘC:
1. Một văn bản thông báo/tờ rơi/hướng dẫn thực tế (notice): có tiêu đề rõ ràng, các mục điều kiện, thời gian, mức phí, quy định lưu ý, ngoại lệ.
2. Một tình huống cụ thể của người đọc (scenario: ví dụ "山田さんは土曜日に家族と利用したいと考えています...").
3. Gồm ĐÚNG 2 CÂU HỎI TRẮC NGHIỆM THỰC TẾ đối chiếu điều kiện để tìm phương án đúng nhất.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "reading": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: 情報検索",
    "mondaiSubtitle": "Tìm kiếm thông tin (情報検索)",
    "title": "Tiêu đề thông báo/tờ rơi",
    "notice": {
      "title": "Tiêu đề văn bản thông báo tiếng Nhật",
      "content": "Toàn bộ nội dung tờ rơi/thông báo tiếng Nhật",
      "content_ruby": "Nội dung có thẻ <ruby> và <rt> Furigana",
      "translation": "Bản dịch tiếng Việt trọn vẹn của thông báo",
      "scenario": "Tình huống nhân vật cần tra cứu thông tin (tiếng Nhật kèm tiếng Việt)"
    },
    "questions": [
      {
        "id": "q_1",
        "question": "Câu hỏi trắc nghiệm 1 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 1",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết đối chiếu điều kiện trong thông báo bằng tiếng Việt"
      },
      {
        "id": "q_2",
        "question": "Câu hỏi trắc nghiệm 2 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 2",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết bằng tiếng Việt"
      }
    ],
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  if (isMedium) {
    return `Bạn là chuyên gia ôn luyện đọc hiểu JLPT ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo 1 bài đọc hiểu Đoạn văn trung (中文) chuẩn JLPT ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
Đoạn văn tiếng Nhật khoảng 450-550 chữ, phát triển ý mạch lạc.
Gồm ĐÚNG 3 CÂU HỎI TRẮC NGHIỆM ĐỌC HIỂU (mỗi câu 4 lựa chọn tiếng Nhật, 1 đúng 3 sai):
- Câu 1: Hỏi về chi tiết cụ thể hoặc từ ngữ trong bài.
- Câu 2: Hỏi về lý do của nhận định/hành động.
- Câu 3: Hỏi về quan điểm/kết luận chung của tác giả.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "reading": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: 中文",
    "mondaiSubtitle": "Đoạn văn trung (中文 - 3 câu hỏi)",
    "title": "Tiêu đề bài đọc",
    "passage": "Đoạn văn tiếng Nhật chuẩn N2 không thẻ HTML",
    "passage_ruby": "Đoạn văn có gắn thẻ <ruby> và <rt> Furigana",
    "passage_translation": "Bản dịch tiếng Việt trọn vẹn",
    "questions": [
      {
        "id": "q_1",
        "question": "Câu hỏi 1 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 1",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết câu 1 bằng tiếng Việt"
      },
      {
        "id": "q_2",
        "question": "Câu hỏi 2 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 2",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết câu 2 bằng tiếng Việt"
      },
      {
        "id": "q_3",
        "question": "Câu hỏi 3 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 3",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết câu 3 bằng tiếng Việt"
      }
    ],
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  if (isLong) {
    const qCount = isLong4 ? 4 : 3;
    return `Bạn là chuyên gia ôn luyện đọc hiểu JLPT ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo 1 bài đọc hiểu Đoạn văn dài (長文) chuẩn JLPT ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
Đoạn văn tiếng Nhật khoảng 800-1000 chữ, lập luận sâu sắc.
Gồm ĐÚNG ${qCount} CÂU HỎI TRẮC NGHIỆM ĐỌC HIỂU (mỗi câu 4 lựa chọn tiếng Nhật, 1 đúng 3 sai).
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "reading": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: 長文",
    "mondaiSubtitle": "Đoạn văn dài (長文 - ${qCount} câu hỏi)",
    "title": "Tiêu đề bài đọc",
    "passage": "Đoạn văn tiếng Nhật chuẩn dài",
    "passage_ruby": "Đoạn văn dài có gắn thẻ <ruby> và <rt> Furigana",
    "passage_translation": "Bản dịch tiếng Việt trọn vẹn",
    "questions": [
      {
        "id": "q_1",
        "question": "Câu hỏi 1 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 1",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết câu 1 bằng tiếng Việt"
      },
      {
        "id": "q_2",
        "question": "Câu hỏi 2 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 2",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết câu 2 bằng tiếng Việt"
      },
      {
        "id": "q_3",
        "question": "Câu hỏi 3 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 3",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết câu 3 bằng tiếng Việt"
      }${isLong4 ? `,
      {
        "id": "q_4",
        "question": "Câu hỏi 4 bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch câu hỏi 4",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 (sai)", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết câu 4 bằng tiếng Việt"
      }` : ""}
    ],
    "vocabulary": [
      { "kanji": "từ vựng", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  // Default: Short passage (短文)
  if (targetCount && targetCount > 1) {
    return `Bạn là chuyên gia ôn luyện đọc hiểu JLPT ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo ĐÚNG ${targetCount} BÀI ĐỌC HIỂU ĐOẠN VĂN NGẮN (短文) ĐỘC LẬP chuẩn JLPT ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
Mỗi bài đọc gồm 1 đoạn văn ngắn khoảng 150-200 chữ và 1 CÂU HỎI TRẮC NGHIỆM ĐỌC HIỂU (tạo đủ ${targetCount} bài từ q_1 đến q_${targetCount}).
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "reading": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: 短文",
    "mondaiSubtitle": "Đoạn văn ngắn (短文 - ${targetCount} bài chuẩn đề thi)",
    "title": "${topic}",
    "questions": [
      {
        "id": "q_1",
        "passage": "Đoạn văn ngắn tiếng Nhật cho câu 1 không có thẻ HTML",
        "passage_ruby": "Đoạn văn ngắn 1 bọc thẻ <ruby> và <rt> Furigana",
        "passage_translation": "Bản dịch nghĩa tiếng Việt của đoạn 1",
        "question": "Câu hỏi đọc hiểu bằng TIẾNG NHẬT cho đoạn 1",
        "question_vietnamese": "Dịch nghĩa câu hỏi 1 sang tiếng Việt",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 bằng tiếng Nhật (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 bằng tiếng Nhật (sai)", "isCorrect": false }
        ],
        "explanation": "giải thích chi tiết dẫn chứng trong đoạn 1 và lý do đúng sai bằng tiếng Việt"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${targetCount} BÀI ĐỌC NGẮN TỪ q_1 ĐẾN q_${targetCount}, MỖI BÀI CÓ passage, passage_ruby, passage_translation, question, options RIÊNG BIỆT)
    ],
    "vocabulary": [
      { "kanji": "chữ Hán", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  return `Bạn là chuyên gia ôn luyện đọc hiểu JLPT ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo 1 bài đọc hiểu Đoạn văn ngắn (短文) chuẩn JLPT ${level} thuộc chủ đề "${topic}".
Bối cảnh cụ thể: "${chosenContext}".
Đoạn văn tiếng Nhật ngắn gọn khoảng 180-220 chữ.
Gồm ĐÚNG 1 CÂU HỎI TRẮC NGHIỆM ĐỌC HIỂU hoàn toàn bằng TIẾNG NHẬT, 4 ĐÁP ÁN TIẾNG NHẬT, bản dịch tiếng Việt, giải thích chi tiết và từ vựng.
(Mã ngẫu nhiên: ${randomSeed}).
Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "reading": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: 短文",
    "mondaiSubtitle": "Đoạn văn ngắn (短文)",
    "title": "Tiêu đề bài đọc",
    "passage": "đoạn văn tiếng Nhật chuẩn không có thẻ HTML",
    "passage_ruby": "đoạn văn tiếng Nhật bọc thẻ <ruby> và <rt> Furigana",
    "passage_translation": "Bản dịch nghĩa tiếng Việt trọn vẹn",
    "questions": [
      {
        "id": "q_1",
        "question": "Câu hỏi đọc hiểu bằng TIẾNG NHẬT",
        "question_vietnamese": "Dịch nghĩa câu hỏi sang tiếng Việt",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 bằng tiếng Nhật (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3 bằng tiếng Nhật (sai)", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4 bằng tiếng Nhật (sai)", "isCorrect": false }
        ],
        "explanation": "giải thích chi tiết dẫn chứng và lý do đúng sai bằng tiếng Việt"
      }
    ],
    "vocabulary": [
      { "kanji": "chữ Hán", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
}

export interface JLPTVocabPromptParams {
  level: string;
  topic: string;
  chosenContext: string;
  mondaiNumber?: number;
  randomSeed: string;
  targetCount?: number;
}

export interface JLPTGrammarPromptParams {
  level: string;
  topic: string;
  chosenContext: string;
  mondaiNumber?: number;
  randomSeed: string;
  targetCount?: number;
}

export function buildJLPTVocabPrompt({
  level,
  topic,
  chosenContext,
  mondaiNumber = 1,
  randomSeed,
  targetCount,
}: JLPTVocabPromptParams): string {
  const mNum = Number(mondaiNumber) || 1;
  const count = targetCount && targetCount > 0 ? targetCount : 5;

  return `Bạn là chuyên gia biên soạn đề thi JLPT phần 言語知識（文字・語彙） cấp độ ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo 1 bộ câu hỏi Luyện tập Từ vựng & Kanji CHUẨN XÁC theo Mondai ${mNum} JLPT ${level} thuộc chủ đề "${topic}".
Bối cảnh bài luyện: "${chosenContext}".
Mã ngẫu nhiên cho đề thi này: ${randomSeed}.

Yêu cầu cấu trúc bài tập BẮT BUỘC:
- Tạo ĐÚNG ${count} CÂU HỎI TRẮC NGHIỆM tiếng Nhật thuộc Mondai ${mNum} (từ q_1 đến q_${count}).
- Mỗi câu hỏi gồm câu dẫn tiếng Nhật có từ/cụm từ gạch chân (đánh dấu dạng 【từ】), 4 lựa chọn tiếng Nhật, 1 đáp án đúng, dịch tiếng Việt và giải thích đáp án chi tiết.

Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "jlpt_vocab": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: Từ vựng & Kanji",
    "mondaiSubtitle": "Luyện tập Từ vựng & Hán tự JLPT ${level} (${count} câu)",
    "questions": [
      {
        "id": "q_1",
        "question": "Câu tiếng Nhật thứ 1 chứa từ gạch chân 【漢字】",
        "question_vietnamese": "Dịch câu 1 sang tiếng Việt",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết nghĩa từ vựng, âm Hán Việt và lý do đúng/sai bằng tiếng Việt"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${count} CÂU HỎI TRẮC NGHIỆM TỪ q_1 ĐẾN q_${count})
    ],
    "vocabulary": [
      { "kanji": "chữ Hán", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
}

export function buildJLPTGrammarPrompt({
  level,
  topic,
  chosenContext,
  mondaiNumber = 1,
  randomSeed,
  targetCount,
}: JLPTGrammarPromptParams): string {
  const mNum = Number(mondaiNumber) || 1;

  // Mondai 2: 文の組み立て (Dựng câu dấu sao ★) -> 5 questions (standard JLPT is 5)
  if (mNum === 2) {
    const starCount = targetCount && targetCount > 0 ? targetCount : 5;
    return `Bạn là chuyên gia biên soạn đề thi JLPT phần 言語知識（文法） cấp độ ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo 1 bộ bài tập DỰNG CÂU DẤU SAO (文の組み立て) CHUẨN XÁC theo Mondai 2 (Dựng câu dấu sao ★) JLPT ${level} thuộc chủ đề "${topic}".
Bối cảnh bài luyện: "${chosenContext}".
Mã ngẫu nhiên cho đề thi này: ${randomSeed}.

Đặc trưng cấu trúc Dựng câu dấu sao ★:
- Tạo ĐÚNG ${starCount} CÂU HỎI TRẮC NGHIỆM (từ q_1 đến q_${starCount}).
- Mỗi câu gồm một câu tiếng Nhật có 4 vị trí xáo trộn: __ __ ★ __
- Cung cấp 4 cụm từ xáo trộn (options).
- Xác định cụm từ đúng phải nằm ở vị trí dấu sao ★.
- Cung cấp câu hoàn chỉnh đầy đủ sau khi xếp đúng thứ tự (fullSentence).

Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "jlpt_grammar": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 2: 文の組み立て (Dựng câu dấu sao ★)",
    "mondaiSubtitle": "Sắp xếp 4 cụm từ & tìm vị trí dấu ★ (${starCount} câu)",
    "questions": [
      {
        "id": "q_1",
        "question": "Phần đầu câu __ __ ★ __ phần cuối câu.",
        "question_vietnamese": "Dịch hoàn chỉnh câu sang tiếng Việt",
        "fullSentence": "Câu tiếng Nhật hoàn chỉnh sau khi ghép đúng thứ tự",
        "options": [
          { "id": "opt_1", "text": "cụm từ 1", "isCorrect": false },
          { "id": "opt_2", "text": "cụm từ 2 (nằm ở vị trí ★)", "isCorrect": true },
          { "id": "opt_3", "text": "cụm từ 3", "isCorrect": false },
          { "id": "opt_4", "text": "cụm từ 4", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết cấu trúc ngữ pháp và thứ tự sắp xếp câu bằng tiếng Việt"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${starCount} CÂU HỎI TỪ q_1 ĐẾN q_${starCount})
    ],
    "vocabulary": [
      { "kanji": "chữ Hán", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  // Mondai 3: 文章の文法 (Ngữ pháp đoạn văn) -> 4-5 questions
  if (mNum === 3) {
    const passageQCount = targetCount && targetCount > 0 ? targetCount : (level === "N4" || level === "N5" ? 5 : 5);
    return `Bạn là chuyên gia biên soạn đề thi JLPT phần 言語知識（文法） cấp độ ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo 1 bài tập NGỮ PHÁP ĐOẠN VĂN (文章の文法) CHUẨN XÁC theo Mondai 3 JLPT ${level} thuộc chủ đề "${topic}".
Bối cảnh bài luyện: "${chosenContext}".
Mã ngẫu nhiên cho đề thi này: ${randomSeed}.

Đặc trưng cấu trúc Ngữ pháp đoạn văn:
- Một đoạn văn tiếng Nhật hoàn chỉnh khoảng 350-500 chữ chứa ${passageQCount} vị trí trống đánh số [1] đến [${passageQCount}].
- Tạo ĐÚNG ${passageQCount} CÂU HỎI TRẮC NGHIỆM (q_1 tương ứng vị trí [1], ..., q_${passageQCount} tương ứng vị trí [${passageQCount}]).
- Mỗi câu hỏi có 4 lựa chọn liên từ, hình thức ngữ pháp hoặc câu kết đoạn phù hợp bối cảnh.

Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "jlpt_grammar": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 3: 文章の文法 (Ngữ pháp đoạn văn)",
    "mondaiSubtitle": "Chọn liên từ & mẫu ngữ pháp phù hợp cho đoạn văn (${passageQCount} câu)",
    "passage": "Toàn bộ đoạn văn tiếng Nhật chứa ${passageQCount} ô trống [1] đến [${passageQCount}]",
    "passage_translation": "Bản dịch tiếng Việt toàn bộ đoạn văn",
    "questions": [
      {
        "id": "q_1",
        "question": "Điền vào vị trí [1] trong đoạn văn",
        "question_vietnamese": "Chọn từ/mẫu ngữ pháp thích hợp điền vào vị trí [1]",
        "options": [
          { "id": "opt_1", "text": "lựa chọn 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "lựa chọn 2", "isCorrect": false },
          { "id": "opt_3", "text": "lựa chọn 3", "isCorrect": false },
          { "id": "opt_4", "text": "lựa chọn 4", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết lý do chọn ngữ pháp/liên từ này bằng tiếng Việt"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${passageQCount} CÂU HỎI TỪ q_1 ĐẾN q_${passageQCount})
    ],
    "vocabulary": [
      { "kanji": "chữ Hán", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
  }

  // Mondai 1 (Default): 文法形式の判断
  const m1Count = targetCount && targetCount > 0 ? targetCount : 5;
  return `Bạn là chuyên gia biên soạn đề thi JLPT phần 言語知識（文法） cấp độ ${level}.${DIVERSITY_RULE(level, randomSeed)}
Hãy tạo 1 bộ bài tập NGỮ PHÁP JLPT CHUẨN XÁC theo Mondai ${mNum} cấp độ ${level} thuộc chủ đề "${topic}".
Bối cảnh bài luyện: "${chosenContext}".
Mã ngẫu nhiên cho đề thi này: ${randomSeed}.

Yêu cầu cấu trúc bài tập BẮT BUỘC:
- Tạo ĐÚNG ${m1Count} CÂU HỎI TRẮC NGHIỆM ngữ pháp tiếng Nhật (từ q_1 đến q_${m1Count}).
- Mỗi câu gồm câu dẫn chứa vị trí trống ( ... ), 4 lựa chọn ngữ pháp tiếng Nhật, 1 đáp án đúng và giải thích ngữ pháp chi tiết.

Yêu cầu đầu ra là một đối tượng JSON duy nhất (không bọc trong markdown, phải là JSON hợp lệ):
{
  "jlpt_grammar": {
    "mondaiNumber": ${mNum},
    "mondaiName": "問題 ${mNum}: 文法形式の判断",
    "mondaiSubtitle": "Lựa chọn mẫu ngữ pháp đúng JLPT ${level} (${m1Count} câu)",
    "questions": [
      {
        "id": "q_1",
        "question": "Câu tiếng Nhật thứ 1 chứa vị trí trống ( ... ) cần điền ngữ pháp",
        "question_vietnamese": "Dịch nghĩa câu 1 sang tiếng Việt",
        "options": [
          { "id": "opt_1", "text": "mẫu ngữ pháp 1 (đúng)", "isCorrect": true },
          { "id": "opt_2", "text": "mẫu ngữ pháp 2", "isCorrect": false },
          { "id": "opt_3", "text": "mẫu ngữ pháp 3", "isCorrect": false },
          { "id": "opt_4", "text": "mẫu ngữ pháp 4", "isCorrect": false }
        ],
        "explanation": "Giải thích chi tiết ý nghĩa mẫu ngữ pháp, cách kết hợp từ và lý do chọn đáp án bằng tiếng Việt"
      },
      ... (BẮT BUỘC TẠO ĐỦ CHÍNH XÁC ${m1Count} CÂU HỎI TRẮC NGHIỆM TỪ q_1 ĐẾN q_${m1Count})
    ],
    "vocabulary": [
      { "kanji": "chữ Hán", "hiragana": "cách đọc", "meaning": "nghĩa tiếng Việt" }
    ]
  }
}`;
}
