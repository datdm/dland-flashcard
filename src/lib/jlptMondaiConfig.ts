export interface JLPTMondaiInfo {
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  description: string;
  questionsCount: number; // default / quick count
  examQuestionsCount: number; // official JLPT exam standard count
  optionsCount: number; // usually 4, but 3 for listening Mondai 4 (即時応答)
  typeFormat:
    | "short" // 短文
    | "medium" // 中文
    | "long" // 長文 / 主張理解
    | "comparison" // 統合理解 (So sánh A & B)
    | "info_search" // 情報検索 (Tìm kiếm thông tin)
    | "task" // 課題理解 (Nghe hiểu nhiệm vụ)
    | "point" // ポイント理解 (Nghe trọng điểm / lý do)
    | "outline" // 概要理解 (Nghe đại ý / quan điểm)
    | "quick_response" // 即時応答 (Nghe phản xạ tức thì)
    | "integrated_listening"; // 統合理解 (Nghe tích hợp)
}

export const JLPT_READING_MONDAIS: Record<string, JLPTMondaiInfo[]> = {
  N1: [
    {
      mondaiNumber: 8,
      mondaiName: "問題 8: 短文 (Đoạn văn ngắn)",
      mondaiSubtitle: "Đoạn ngắn ~200 chữ",
      description: "Đoạn văn ngắn trình bày ý kiến, thông báo hoặc giải thích ngắn gọn, trả lời 1 câu hỏi trọng tâm.",
      questionsCount: 1,
      examQuestionsCount: 4,
      optionsCount: 4,
      typeFormat: "short",
    },
    {
      mondaiNumber: 9,
      mondaiName: "問題 9: 中文 (Đoạn văn trung)",
      mondaiSubtitle: "Đoạn trung ~500 chữ",
      description: "Đoạn văn bình luận, tiểu luận về khoa học, xã hội, đời sống, gồm 3 câu hỏi phân tích chi tiết.",
      questionsCount: 3,
      examQuestionsCount: 9,
      optionsCount: 4,
      typeFormat: "medium",
    },
    {
      mondaiNumber: 10,
      mondaiName: "問題 10: 長文 (Đoạn văn dài)",
      mondaiSubtitle: "Đoạn dài ~1000 chữ",
      description: "Bài văn dài phân tích sâu sắc theo mạch lập luận logic, gồm 3 câu hỏi lần lượt theo thứ tự đoạn văn.",
      questionsCount: 3,
      examQuestionsCount: 4,
      optionsCount: 4,
      typeFormat: "long",
    },
    {
      mondaiNumber: 11,
      mondaiName: "問題 11: 統合理解 (Đọc hiểu so sánh)",
      mondaiSubtitle: "So sánh 2 bài viết A & B",
      description: "2 văn bản độc lập A và B bàn về cùng một chủ đề, gồm 2 câu hỏi đối chiếu ý kiến và quan điểm tác giả.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "comparison",
    },
    {
      mondaiNumber: 12,
      mondaiName: "問題 12: 主張理解 (Bài luận giải)",
      mondaiSubtitle: "Bài luận học thuật ~1200 chữ",
      description: "Bài luận triết lý, văn hóa hoặc xã hội sâu sắc, gồm 4 câu hỏi đào sâu tư tưởng tác giả.",
      questionsCount: 4,
      examQuestionsCount: 4,
      optionsCount: 4,
      typeFormat: "long",
    },
    {
      mondaiNumber: 13,
      mondaiName: "問題 13: 情報検索 (Tìm kiếm thông tin)",
      mondaiSubtitle: "Bảng biểu & Hướng dẫn",
      description: "Bảng giá, tờ rơi, thông báo tuyển sinh/sự kiện với điều kiện ràng buộc, gồm 2 câu hỏi thực tế.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "info_search",
    },
  ],
  N2: [
    {
      mondaiNumber: 10,
      mondaiName: "問題 10: 短文 (Đoạn văn ngắn)",
      mondaiSubtitle: "Đoạn ngắn ~200 chữ",
      description: "Đoạn văn ngắn về công việc, thông báo, ý kiến cá nhân, trả lời 1 câu hỏi nắm bắt ý chính tác giả.",
      questionsCount: 1,
      examQuestionsCount: 5,
      optionsCount: 4,
      typeFormat: "short",
    },
    {
      mondaiNumber: 11,
      mondaiName: "問題 11: 中文 (Đoạn văn trung)",
      mondaiSubtitle: "Đoạn trung ~500 chữ",
      description: "Bài văn giải thích, bình luận về đời sống, văn hóa công sở, gồm 3 câu hỏi chi tiết và ý nghĩa từ ngữ.",
      questionsCount: 3,
      examQuestionsCount: 9,
      optionsCount: 4,
      typeFormat: "medium",
    },
    {
      mondaiNumber: 12,
      mondaiName: "問題 12: 統合理解 (Đọc hiểu so sánh)",
      mondaiSubtitle: "So sánh 2 bài viết A & B",
      description: "2 bài văn A & B thảo luận cùng 1 vấn đề dưới 2 góc nhìn khác nhau, gồm 2 câu hỏi so sánh điểm chung và khác biệt.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "comparison",
    },
    {
      mondaiNumber: 13,
      mondaiName: "問題 13: 長文 (Đoạn văn dài)",
      mondaiSubtitle: "Đoạn dài ~900 chữ",
      description: "Bài văn lập luận chặt chẽ về xã hội hoặc kinh nghiệm nhân sinh, gồm 3 câu hỏi theo dòng suy nghĩ tác giả.",
      questionsCount: 3,
      examQuestionsCount: 3,
      optionsCount: 4,
      typeFormat: "long",
    },
    {
      mondaiNumber: 14,
      mondaiName: "問題 14: 情報検索 (Tìm kiếm thông tin)",
      mondaiSubtitle: "Bảng biểu & Tờ rơi",
      description: "Tờ rơi thông báo, hướng dẫn thủ tục, quy định dịch vụ kèm điều kiện cụ thể, gồm 2 câu hỏi chọn phương án đúng.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "info_search",
    },
  ],
  N3: [
    {
      mondaiNumber: 9,
      mondaiName: "問題 9: 短文 (Đoạn văn ngắn)",
      mondaiSubtitle: "Đoạn ngắn ~350 chữ",
      description: "Đoạn văn thông báo hoặc thư từ ngắn, 1 câu hỏi kiểm tra nội dung chính.",
      questionsCount: 1,
      examQuestionsCount: 4,
      optionsCount: 4,
      typeFormat: "short",
    },
    {
      mondaiNumber: 10,
      mondaiName: "問題 10: 中文 (Đoạn văn trung)",
      mondaiSubtitle: "Đoạn trung ~550 chữ",
      description: "Bài văn về đề tài thường ngày hoặc xã hội, 3 câu hỏi kiểm tra lý do và nội dung chi tiết.",
      questionsCount: 3,
      examQuestionsCount: 6,
      optionsCount: 4,
      typeFormat: "medium",
    },
    {
      mondaiNumber: 11,
      mondaiName: "問題 11: 長文 (Đoạn văn dài)",
      mondaiSubtitle: "Đoạn dài ~750 chữ",
      description: "Bài văn nghị luận hoặc tự sự dài hơn, gồm 4 câu hỏi đọc hiểu bao quát.",
      questionsCount: 4,
      examQuestionsCount: 4,
      optionsCount: 4,
      typeFormat: "long",
    },
    {
      mondaiNumber: 12,
      mondaiName: "問題 12: 情報検索 (Tìm kiếm thông tin)",
      mondaiSubtitle: "Bảng thông báo & Quảng cáo",
      description: "Bảng thông báo, tờ rơi chương trình, 2 câu hỏi tìm kiếm chi tiết theo nhu cầu.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "info_search",
    },
  ],
  N4: [
    {
      mondaiNumber: 8,
      mondaiName: "問題 8: 短文 (Đoạn văn ngắn)",
      mondaiSubtitle: "Đoạn ngắn ~150 chữ",
      description: "Đoạn văn ngắn về đời sống sinh hoạt, 1 câu hỏi nội dung cơ bản.",
      questionsCount: 1,
      examQuestionsCount: 4,
      optionsCount: 4,
      typeFormat: "short",
    },
    {
      mondaiNumber: 9,
      mondaiName: "問題 9: 中文 (Đoạn văn trung)",
      mondaiSubtitle: "Đoạn trung ~450 chữ",
      description: "Đoạn văn kể chuyện hoặc giải thích đơn giản, 2 câu hỏi đọc hiểu.",
      questionsCount: 2,
      examQuestionsCount: 4,
      optionsCount: 4,
      typeFormat: "medium",
    },
    {
      mondaiNumber: 10,
      mondaiName: "問題 10: 情報検索 (Tìm kiếm thông tin)",
      mondaiSubtitle: "Bảng thông báo",
      description: "Bảng thông báo ngắn, tờ hướng dẫn có hình ảnh/bảng, 2 câu hỏi tìm dữ liệu.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "info_search",
    },
  ],
  N5: [
    {
      mondaiNumber: 8,
      mondaiName: "問題 8: 短文 (Đoạn văn ngắn)",
      mondaiSubtitle: "Đoạn ngắn ~100 chữ",
      description: "Đoạn văn đơn giản với Hiragana và Kanji cơ bản, 1 câu hỏi đọc hiểu.",
      questionsCount: 1,
      examQuestionsCount: 3,
      optionsCount: 4,
      typeFormat: "short",
    },
    {
      mondaiNumber: 9,
      mondaiName: "問題 9: 中文 (Đoạn văn trung)",
      mondaiSubtitle: "Đoạn trung ~250 chữ",
      description: "Bài đọc ngắn về thói quen, sinh hoạt, gồm 2 câu hỏi.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "medium",
    },
    {
      mondaiNumber: 10,
      mondaiName: "問題 10: 情報検索 (Tìm kiếm thông tin)",
      mondaiSubtitle: "Thông báo & Lịch trình",
      description: "Bảng lịch trình hoặc thông báo đơn giản, 2 câu hỏi đối chiếu thông tin.",
      questionsCount: 2,
      examQuestionsCount: 2,
      optionsCount: 4,
      typeFormat: "info_search",
    },
  ],
};

export const JLPT_LISTENING_MONDAIS: Record<string, JLPTMondaiInfo[]> = {
  N1: [
    {
      mondaiNumber: 1,
      mondaiName: "問題 1: 課題理解",
      mondaiSubtitle: "Hiểu nhiệm vụ hành động tiếp theo",
      description: "Được nghe tình huống và câu hỏi trước, nghe hội thoại có sự thay đổi điều kiện, xác định việc cần làm trước tiên.",
      questionsCount: 1,
      examQuestionsCount: 6,
      optionsCount: 4,
      typeFormat: "task",
    },
    {
      mondaiNumber: 2,
      mondaiName: "問題 2: ポイント理解",
      mondaiSubtitle: "Nắm bắt trọng điểm & lý do",
      description: "Được nghe câu hỏi trước, có thời gian đọc đáp án, nghe bài đàm thoại để bắt lý do hoặc nguyên nhân then chốt.",
      questionsCount: 1,
      examQuestionsCount: 7,
      optionsCount: 4,
      typeFormat: "point",
    },
    {
      mondaiNumber: 3,
      mondaiName: "問題 3: 概要理解",
      mondaiSubtitle: "Hiểu chủ đề bao quát & quan điểm",
      description: "KHÔNG có câu hỏi trước, nghe toàn bộ bài độc thoại/thuyết trình, cuối bài mới nghe câu hỏi về quan điểm người nói.",
      questionsCount: 1,
      examQuestionsCount: 6,
      optionsCount: 4,
      typeFormat: "outline",
    },
    {
      mondaiNumber: 4,
      mondaiName: "問題 4: 即時応答",
      mondaiSubtitle: "Phản xạ ứng đáp tức thì (3 đáp án)",
      description: "Nghe 1 câu thoại ngắn bất ngờ (kính ngữ, than phiền, nhờ vả), chọn câu đáp lại tự nhiên nhất (chỉ có 3 đáp án).",
      questionsCount: 1,
      examQuestionsCount: 13,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
    {
      mondaiNumber: 5,
      mondaiName: "問題 5: 統合理解",
      mondaiSubtitle: "Nghe hiểu tích hợp đối thoại dài",
      description: "Hội thoại dài giữa nhiều người bàn luận 4 phương án, trả lời 2 câu hỏi đối chiếu quyết định của từng nhân vật.",
      questionsCount: 2,
      examQuestionsCount: 3,
      optionsCount: 4,
      typeFormat: "integrated_listening",
    },
  ],
  N2: [
    {
      mondaiNumber: 1,
      mondaiName: "問題 1: 課題理解",
      mondaiSubtitle: "Hiểu nhiệm vụ hành động tiếp theo",
      description: "Nghe bối cảnh và câu hỏi trước, nghe hội thoại bàn việc, tìm xem người nam/nữ sẽ làm gì trước tiên.",
      questionsCount: 1,
      examQuestionsCount: 5,
      optionsCount: 4,
      typeFormat: "task",
    },
    {
      mondaiNumber: 2,
      mondaiName: "問題 2: ポイント理解",
      mondaiSubtitle: "Nắm bắt trọng điểm & lý do",
      description: "Nghe câu hỏi trước, nghe hội thoại/độc thoại để nắm lý do, nguyên nhân hoặc điểm người nói chú trọng nhất.",
      questionsCount: 1,
      examQuestionsCount: 6,
      optionsCount: 4,
      typeFormat: "point",
    },
    {
      mondaiNumber: 3,
      mondaiName: "問題 3: 概要理解",
      mondaiSubtitle: "Hiểu chủ đề bao quát & quan điểm",
      description: "KHÔNG có câu hỏi trước, nghe bài nói trên tivi/radio để hiểu đại ý hoặc ý đồ mà người nói muốn truyền đạt.",
      questionsCount: 1,
      examQuestionsCount: 5,
      optionsCount: 4,
      typeFormat: "outline",
    },
    {
      mondaiNumber: 4,
      mondaiName: "問題 4: 即時応答",
      mondaiSubtitle: "Phản xạ ứng đáp tức thì (3 đáp án)",
      description: "Nghe 1 câu ngắn trong đời sống hoặc công sở, chọn ngay câu phản xạ đúng mực (chỉ có 3 đáp án chuẩn JLPT).",
      questionsCount: 1,
      examQuestionsCount: 11,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
    {
      mondaiNumber: 5,
      mondaiName: "問題 5: 統合理解",
      mondaiSubtitle: "Nghe hiểu tích hợp đối thoại dài",
      description: "Hội thoại dài so sánh 4 kế hoạch hoặc sản phẩm, gồm 2 câu hỏi xem mỗi nhân vật quyết định chọn cái nào.",
      questionsCount: 2,
      examQuestionsCount: 3,
      optionsCount: 4,
      typeFormat: "integrated_listening",
    },
  ],
  N3: [
    {
      mondaiNumber: 1,
      mondaiName: "問題 1: 課題理解",
      mondaiSubtitle: "Hiểu nhiệm vụ hành động tiếp theo",
      description: "Nghe tình huống và câu hỏi trước, nghe hội thoại để biết nhân vật sẽ làm gì tiếp theo.",
      questionsCount: 1,
      examQuestionsCount: 6,
      optionsCount: 4,
      typeFormat: "task",
    },
    {
      mondaiNumber: 2,
      mondaiName: "問題 2: ポイント理解",
      mondaiSubtitle: "Nắm bắt điểm mấu chốt & lý do",
      description: "Nghe câu hỏi trước, nghe bài nói để tìm câu trả lời đúng trọng tâm.",
      questionsCount: 1,
      examQuestionsCount: 6,
      optionsCount: 4,
      typeFormat: "point",
    },
    {
      mondaiNumber: 3,
      mondaiName: "問題 3: 概要理解",
      mondaiSubtitle: "Hiểu đại ý & chủ đề bài nói",
      description: "Nghe toàn bộ bài độc thoại ngắn, trả lời câu hỏi về chủ đề ở cuối bài.",
      questionsCount: 1,
      examQuestionsCount: 3,
      optionsCount: 4,
      typeFormat: "outline",
    },
    {
      mondaiNumber: 4,
      mondaiName: "問題 4: 発話表現",
      mondaiSubtitle: "Cách nói trong tình huống cụ thể (3 đáp án)",
      description: "Quan sát/nghe tình huống người chỉ vào ai đó, chọn câu nói thích hợp để mở lời (3 đáp án).",
      questionsCount: 1,
      examQuestionsCount: 4,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
    {
      mondaiNumber: 5,
      mondaiName: "問題 5: 即時応答",
      mondaiSubtitle: "Phản xạ câu trả lời nhanh (3 đáp án)",
      description: "Nghe 1 câu đối đáp ngắn, chọn câu phản hồi hợp lý nhất (3 đáp án).",
      questionsCount: 1,
      examQuestionsCount: 9,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
  ],
  N4: [
    {
      mondaiNumber: 1,
      mondaiName: "問題 1: 課題理解",
      mondaiSubtitle: "Hiểu nhiệm vụ",
      description: "Nghe đoạn đối thoại ngắn, trả lời nhân vật sẽ làm gì tiếp.",
      questionsCount: 1,
      examQuestionsCount: 8,
      optionsCount: 4,
      typeFormat: "task",
    },
    {
      mondaiNumber: 2,
      mondaiName: "問題 2: ポイント理解",
      mondaiSubtitle: "Hiểu điểm mấu chốt",
      description: "Nghe bắt thông tin cụ thể (thời gian, địa điểm, lý do).",
      questionsCount: 1,
      examQuestionsCount: 7,
      optionsCount: 4,
      typeFormat: "point",
    },
    {
      mondaiNumber: 3,
      mondaiName: "問題 3: 発言表現",
      mondaiSubtitle: "Cách nói trong tình huống (3 đáp án)",
      description: "Chọn câu nói đúng ngữ cảnh giao tiếp hàng ngày (3 đáp án).",
      questionsCount: 1,
      examQuestionsCount: 5,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
    {
      mondaiNumber: 4,
      mondaiName: "問題 4: 即時応答",
      mondaiSubtitle: "Phản xạ câu trả lời (3 đáp án)",
      description: "Phản hồi câu chào hỏi hoặc câu hỏi thường ngày (3 đáp án).",
      questionsCount: 1,
      examQuestionsCount: 8,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
  ],
  N5: [
    {
      mondaiNumber: 1,
      mondaiName: "問題 1: 課題理解",
      mondaiSubtitle: "Hiểu hành động tiếp theo",
      description: "Nghe hội thoại đơn giản giữa 2 người, chọn hành động tiếp theo.",
      questionsCount: 1,
      examQuestionsCount: 7,
      optionsCount: 4,
      typeFormat: "task",
    },
    {
      mondaiNumber: 2,
      mondaiName: "問題 2: ポイント理解",
      mondaiSubtitle: "Nắm bắt thông tin cơ bản",
      description: "Nghe thông tin về số lượng, giá tiền, thời gian, phương tiện.",
      questionsCount: 1,
      examQuestionsCount: 6,
      optionsCount: 4,
      typeFormat: "point",
    },
    {
      mondaiNumber: 3,
      mondaiName: "問題 3: 発言表現",
      mondaiSubtitle: "Cách nói trong tình huống (3 đáp án)",
      description: "Chọn câu chào hỏi hoặc xin phép chuẩn mực (3 đáp án).",
      questionsCount: 1,
      examQuestionsCount: 5,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
    {
      mondaiNumber: 4,
      mondaiName: "問題 4: 即時応答",
      mondaiSubtitle: "Phản xạ câu trả lời (3 đáp án)",
      description: "Chọn câu trả lời ngắn cho câu hỏi đời sống cơ bản (3 đáp án).",
      questionsCount: 1,
      examQuestionsCount: 6,
      optionsCount: 3,
      typeFormat: "quick_response",
    },
  ],
};

export const JLPT_VOCAB_MONDAIS: Record<string, JLPTMondaiInfo[]> = {
  N1: [
    { mondaiNumber: 1, mondaiName: "問題 1: 漢字読み (Cách đọc Hán tự)", mondaiSubtitle: "Cách đọc Kanji gạch chân", description: "Chọn Hiragana tương ứng với chữ Hán N1 gạch chân", questionsCount: 5, examQuestionsCount: 6, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 2: 文脈規定 (Điền từ ngữ cảnh)", mondaiSubtitle: "Điền từ vựng hợp bối cảnh", description: "Chọn từ vựng cao cấp N1 điền vào vị trí ngoặc", questionsCount: 5, examQuestionsCount: 7, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 3: 言い換え類義 (Từ đồng nghĩa)", mondaiSubtitle: "Tìm từ/cụm từ tương đương", description: "Chọn từ hoặc câu có ý nghĩa giống nhất với từ gạch chân", questionsCount: 5, examQuestionsCount: 6, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 4, mondaiName: "問題 4: 用法 (Cách dùng từ vựng)", mondaiSubtitle: "Chọn câu dùng từ chuẩn xác", description: "Xác định câu sử dụng từ ngữ cảnh N1 đúng tự nhiên nhất", questionsCount: 5, examQuestionsCount: 6, optionsCount: 4, typeFormat: "short" },
  ],
  N2: [
    { mondaiNumber: 1, mondaiName: "問題 1: 漢字読み (Cách đọc Hán tự)", mondaiSubtitle: "Cách đọc Kanji gạch chân", description: "Chọn Hiragana cho chữ Hán N2 gạch chân", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 2: 表記 (Cách viết Hán tự)", mondaiSubtitle: "Chọn Kanji đúng cho Hiragana", description: "Chọn Hán tự N2 viết chuẩn cho từ Hiragana", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 3: 語形成 (Cấu tạo từ vựng)", mondaiSubtitle: "Tiền tố & Hậu tố tiếng Nhật", description: "Ghép tiền tố/hậu tố cấu tạo từ vựng N2", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 4, mondaiName: "問題 4: 文脈規定 (Điền từ ngữ cảnh)", mondaiSubtitle: "Điền từ vựng đúng bối cảnh", description: "Chọn từ vựng đúng hợp bối cảnh câu", questionsCount: 5, examQuestionsCount: 7, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 5, mondaiName: "問題 5: 言い換え類義 (Từ đồng nghĩa)", mondaiSubtitle: "Tìm cách nói tương đương", description: "Chọn từ đồng nghĩa với từ gạch chân N2", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 6, mondaiName: "問題 6: 用法 (Cách dùng từ vựng)", mondaiSubtitle: "Chọn câu dùng từ chuẩn nhất", description: "Xác định câu dùng từ vựng N2 đúng ngữ pháp và tự nhiên", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
  ],
  N3: [
    { mondaiNumber: 1, mondaiName: "問題 1: 漢字読み (Cách đọc Hán tự)", mondaiSubtitle: "Cách đọc Kanji gạch chân", description: "Chọn Hiragana cho Hán tự N3", questionsCount: 5, examQuestionsCount: 8, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 2: 表記 (Cách viết Hán tự)", mondaiSubtitle: "Chọn Kanji cho Hiragana", description: "Chọn Hán tự N3 chuẩn cho từ Hiragana", questionsCount: 5, examQuestionsCount: 6, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 3: 文脈規定 (Điền từ ngữ cảnh)", mondaiSubtitle: "Điền từ vựng hợp ngữ cảnh", description: "Chọn từ vựng hợp nghĩa câu N3", questionsCount: 5, examQuestionsCount: 11, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 4, mondaiName: "問題 4: 言い換え類義 (Từ đồng nghĩa)", mondaiSubtitle: "Tìm cách nói đồng nghĩa", description: "Chọn từ đồng nghĩa N3", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 5, mondaiName: "問題 5: 用法 (Cách dùng từ vựng)", mondaiSubtitle: "Chọn câu dùng từ đúng", description: "Xác định câu dùng từ vựng N3 chuẩn xác", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
  ],
  N4: [
    { mondaiNumber: 1, mondaiName: "問題 1: 漢字読み (Cách đọc Hán tự)", mondaiSubtitle: "Cách đọc Kanji gạch chân", description: "Chọn cách đọc Hiragana Hán tự N4", questionsCount: 5, examQuestionsCount: 9, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 2: 表記 (Cách viết Hán tự)", mondaiSubtitle: "Chọn Kanji đúng", description: "Chọn Hán tự N4 chuẩn", questionsCount: 5, examQuestionsCount: 6, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 3: 文脈規定 (Điền từ ngữ cảnh)", mondaiSubtitle: "Điền từ vựng bối cảnh", description: "Điền từ vựng N4 vào ô trống", questionsCount: 5, examQuestionsCount: 10, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 4, mondaiName: "問題 4: 言い換え類義 (Từ đồng nghĩa)", mondaiSubtitle: "Từ/cụm từ đồng nghĩa", description: "Chọn câu/từ đồng nghĩa N4", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
  ],
  N5: [
    { mondaiNumber: 1, mondaiName: "問題 1: 漢字読み (Cách đọc Hán tự)", mondaiSubtitle: "Cách đọc Kanji cơ bản", description: "Chọn Hiragana cho Kanji N5", questionsCount: 5, examQuestionsCount: 12, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 2: 表記 (Cách viết Hán tự)", mondaiSubtitle: "Chọn Kanji cơ bản", description: "Chọn Hán tự N5 cho Hiragana", questionsCount: 5, examQuestionsCount: 8, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 3: 文脈規定 (Điền từ ngữ cảnh)", mondaiSubtitle: "Điền từ đời sống", description: "Điền từ vựng N5 hợp cảnh", questionsCount: 5, examQuestionsCount: 10, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 4, mondaiName: "問題 4: 言い換え類義 (Từ đồng nghĩa)", mondaiSubtitle: "Câu đồng nghĩa đơn giản", description: "Chọn câu có nghĩa tương đương N5", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
  ],
};

export const JLPT_GRAMMAR_MONDAIS: Record<string, JLPTMondaiInfo[]> = {
  N1: [
    { mondaiNumber: 1, mondaiName: "問題 5: 文法形式の判断 (Hình thức ngữ pháp)", mondaiSubtitle: "Chọn mẫu ngữ pháp điền ô trống", description: "Trắc nghiệm chọn ngữ pháp nâng cao N1", questionsCount: 5, examQuestionsCount: 10, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 6: 文の組み立て (Dựng câu dấu sao ★)", mondaiSubtitle: "Sắp xếp 4 cụm từ & tìm vị trí dấu ★", description: "Dựng câu và chọn cụm từ ở vị trí dấu sao ★", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 7: 文章の文法 (Ngữ pháp đoạn văn)", mondaiSubtitle: "Chọn liên từ & kết thúc câu cho đoạn văn", description: "Đọc đoạn văn và chọn ngữ pháp điền chỗ trống", questionsCount: 4, examQuestionsCount: 5, optionsCount: 4, typeFormat: "medium" },
  ],
  N2: [
    { mondaiNumber: 1, mondaiName: "問題 7: 文法形式の判断 (Hình thức ngữ pháp)", mondaiSubtitle: "Chọn mẫu ngữ pháp điền ô trống", description: "Trắc nghiệm chọn ngữ pháp N2", questionsCount: 5, examQuestionsCount: 12, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 8: 文の組み立て (Dựng câu dấu sao ★)", mondaiSubtitle: "Sắp xếp 4 cụm từ & tìm vị trí dấu ★", description: "Dựng câu và chọn cụm từ ở vị trí dấu sao ★", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 9: 文章の文法 (Ngữ pháp đoạn văn)", mondaiSubtitle: "Chọn liên từ & kết thúc câu cho đoạn văn", description: "Đọc đoạn văn và chọn ngữ pháp điền chỗ trống", questionsCount: 4, examQuestionsCount: 5, optionsCount: 4, typeFormat: "medium" },
  ],
  N3: [
    { mondaiNumber: 1, mondaiName: "問題 6: 文法形式の判断 (Hình thức ngữ pháp)", mondaiSubtitle: "Chọn mẫu ngữ pháp điền ô trống", description: "Trắc nghiệm chọn ngữ pháp N3", questionsCount: 5, examQuestionsCount: 13, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 7: 文の組み立て (Dựng câu dấu sao ★)", mondaiSubtitle: "Sắp xếp 4 cụm từ & tìm vị trí dấu ★", description: "Dựng câu và chọn cụm từ ở vị trí dấu sao ★", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 8: 文章の文法 (Ngữ pháp đoạn văn)", mondaiSubtitle: "Chọn liên từ & kết thúc câu cho đoạn văn", description: "Đọc đoạn văn và chọn ngữ pháp điền chỗ trống", questionsCount: 4, examQuestionsCount: 5, optionsCount: 4, typeFormat: "medium" },
  ],
  N4: [
    { mondaiNumber: 1, mondaiName: "問題 5: 文法形式の判断 (Hình thức ngữ pháp)", mondaiSubtitle: "Chọn mẫu ngữ pháp điền ô trống", description: "Trắc nghiệm chọn ngữ pháp N4", questionsCount: 5, examQuestionsCount: 15, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 6: 文の組み立て (Dựng câu dấu sao ★)", mondaiSubtitle: "Sắp xếp 4 cụm từ & tìm vị trí dấu ★", description: "Dựng câu và chọn cụm từ ở vị trí dấu sao ★", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 7: 文章の文法 (Ngữ pháp đoạn văn)", mondaiSubtitle: "Chọn liên từ & kết thúc câu cho đoạn văn", description: "Đọc đoạn văn và chọn ngữ pháp điền chỗ trống", questionsCount: 4, examQuestionsCount: 5, optionsCount: 4, typeFormat: "medium" },
  ],
  N5: [
    { mondaiNumber: 1, mondaiName: "問題 5: 文法形式の判断 (Hình thức ngữ pháp)", mondaiSubtitle: "Chọn mẫu ngữ pháp điền ô trống", description: "Trắc nghiệm chọn ngữ pháp N5", questionsCount: 5, examQuestionsCount: 16, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 2, mondaiName: "問題 6: 文の組み立て (Dựng câu dấu sao ★)", mondaiSubtitle: "Sắp xếp 4 cụm từ & tìm vị trí dấu ★", description: "Dựng câu và chọn cụm từ ở vị trí dấu sao ★", questionsCount: 5, examQuestionsCount: 5, optionsCount: 4, typeFormat: "short" },
    { mondaiNumber: 3, mondaiName: "問題 7: 文章の文法 (Ngữ pháp đoạn văn)", mondaiSubtitle: "Chọn liên từ & kết thúc câu cho đoạn văn", description: "Đọc đoạn văn và chọn ngữ pháp điền chỗ trống", questionsCount: 4, examQuestionsCount: 5, optionsCount: 4, typeFormat: "medium" },
  ],
};

export function getReadingMondaisForLevel(level: string): JLPTMondaiInfo[] {
  const norm = level.toUpperCase();
  return JLPT_READING_MONDAIS[norm] || JLPT_READING_MONDAIS.N2;
}

export function getListeningMondaisForLevel(level: string): JLPTMondaiInfo[] {
  const norm = level.toUpperCase();
  return JLPT_LISTENING_MONDAIS[norm] || JLPT_LISTENING_MONDAIS.N2;
}

export function getVocabMondaisForLevel(level: string): JLPTMondaiInfo[] {
  const norm = level.toUpperCase();
  return JLPT_VOCAB_MONDAIS[norm] || JLPT_VOCAB_MONDAIS.N2;
}

export function getGrammarMondaisForLevel(level: string): JLPTMondaiInfo[] {
  const norm = level.toUpperCase();
  return JLPT_GRAMMAR_MONDAIS[norm] || JLPT_GRAMMAR_MONDAIS.N2;
}

export function getReadingMondaiConfig(level: string, mondaiNumber: number): JLPTMondaiInfo | undefined {
  const list = getReadingMondaisForLevel(level);
  return list.find((m) => m.mondaiNumber === mondaiNumber);
}

export function getListeningMondaiConfig(level: string, mondaiNumber: number): JLPTMondaiInfo | undefined {
  const list = getListeningMondaisForLevel(level);
  return list.find((m) => m.mondaiNumber === mondaiNumber);
}

export function getVocabMondaiConfig(level: string, mondaiNumber: number): JLPTMondaiInfo | undefined {
  const list = getVocabMondaisForLevel(level);
  return list.find((m) => m.mondaiNumber === mondaiNumber);
}

export function getGrammarMondaiConfig(level: string, mondaiNumber: number): JLPTMondaiInfo | undefined {
  const list = getGrammarMondaisForLevel(level);
  return list.find((m) => m.mondaiNumber === mondaiNumber);
}

export function getMondaiOfficialCount(
  type: "jlpt_vocab" | "jlpt_grammar" | "listening" | "reading",
  level: string,
  mondaiNumber: number
): number {
  const norm = level.toUpperCase();
  let list: JLPTMondaiInfo[] = [];
  if (type === "jlpt_vocab") list = getVocabMondaisForLevel(norm);
  else if (type === "jlpt_grammar") list = getGrammarMondaisForLevel(norm);
  else if (type === "listening") list = getListeningMondaisForLevel(norm);
  else if (type === "reading") list = getReadingMondaisForLevel(norm);

  const found = list.find((m) => m.mondaiNumber === mondaiNumber);
  return found?.examQuestionsCount || found?.questionsCount || 5;
}
