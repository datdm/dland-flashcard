export interface JLPTMondaiStructure {
  mondaiNumber: number;
  title: string;
  subTitle: string;
  japaneseTitle: string;
  questionCount: number;
  suggestedTimeMinutes?: number;
  targetDescription: string;
}

export interface JLPTMajorSectionStructure {
  id: "vocab" | "grammar" | "reading" | "listening";
  name: string;
  japaneseName: string;
  icon: string;
  totalTimeMinutes?: number;
  mondais: JLPTMondaiStructure[];
}

export interface JLPTLevelStructure {
  level: "N1" | "N2" | "N3" | "N4" | "N5";
  totalExamTimeMinutes: number;
  sections: {
    name: string;
    timeMinutes: number;
    majorSections: JLPTMajorSectionStructure[];
  }[];
}

export const JLPT_STRUCTURES: Record<string, JLPTLevelStructure> = {
  N2: {
    level: "N2",
    totalExamTimeMinutes: 155, // 105 mins knowledge & reading + 50 mins listening
    sections: [
      {
        name: "言語知識・読解 (Kiến thức ngôn ngữ & Đọc hiểu)",
        timeMinutes: 105,
        majorSections: [
          {
            id: "vocab",
            name: "文字・語彙 (Chữ Hán & Từ vựng)",
            japaneseName: "言語知識（文字・語彙）",
            icon: "🔤",
            totalTimeMinutes: 15,
            mondais: [
              {
                mondaiNumber: 1,
                title: "問題 1: 漢字読み",
                subTitle: "Cách đọc chữ Hán",
                japaneseTitle: "漢字読み",
                questionCount: 5,
                suggestedTimeMinutes: 2,
                targetDescription: "Cách đọc những từ được viết bằng Hán tự (Kanji).",
              },
              {
                mondaiNumber: 2,
                title: "問題 2: 表記",
                subTitle: "Cách viết chữ Hán",
                japaneseTitle: "表記",
                questionCount: 5,
                suggestedTimeMinutes: 2,
                targetDescription: "Những từ được viết bằng Hiragana sẽ được viết sang Hán tự hoặc Katakana như thế nào.",
              },
              {
                mondaiNumber: 3,
                title: "問題 3: 語形成",
                subTitle: "Cấu tạo từ",
                japaneseTitle: "語形成",
                questionCount: 3,
                suggestedTimeMinutes: 2,
                targetDescription: "Biết các từ ghép, các từ phát sinh (tiền tố, hậu tố: 無, 非, 不, 未, 低, 高...).",
              },
              {
                mondaiNumber: 4,
                title: "問題 4: 文脈規定",
                subTitle: "Điền từ theo mạch văn",
                japaneseTitle: "文脈規定",
                questionCount: 7,
                suggestedTimeMinutes: 4,
                targetDescription: "Tùy theo mạch văn tìm những từ được quy định phù hợp về mặt ngữ nghĩa là từ nào.",
              },
              {
                mondaiNumber: 5,
                title: "問題 5: 言い換え類義",
                subTitle: "Từ đồng nghĩa",
                japaneseTitle: "言い換え類義",
                questionCount: 5,
                suggestedTimeMinutes: 2.5,
                targetDescription: "Tìm những cách diễn đạt, từ gần nghĩa với các từ đã cho.",
              },
              {
                mondaiNumber: 6,
                title: "問題 6: 用法",
                subTitle: "Cách dùng từ",
                japaneseTitle: "用法",
                questionCount: 5,
                suggestedTimeMinutes: 2.5,
                targetDescription: "Biết được từ đó sử dụng thế nào trong các câu được đưa ra (cách kết hợp tự nhiên).",
              },
            ],
          },
          {
            id: "grammar",
            name: "文法 (Ngữ pháp & Dựng câu)",
            japaneseName: "言語知識（文法）",
            icon: "📖",
            totalTimeMinutes: 15,
            mondais: [
              {
                mondaiNumber: 7,
                title: "問題 7: 文の文法1（文法形式の判断）",
                subTitle: "Phán đoán dạng ngữ pháp",
                japaneseTitle: "文法形式の判断",
                questionCount: 12,
                suggestedTimeMinutes: 7,
                targetDescription: "Có thể phán đoán được hình thức ngữ pháp nào phù hợp với nội dung câu văn.",
              },
              {
                mondaiNumber: 8,
                title: "問題 8: 文の文法2（文の組み立て・星問題 ★）",
                subTitle: "Sắp xếp câu tìm vị trí ngôi sao ★",
                japaneseTitle: "文の組み立て",
                questionCount: 5,
                suggestedTimeMinutes: 5,
                targetDescription: "Có thể tạo được câu văn mạch lạc về mặt ý nghĩa và đúng cú pháp ngữ pháp.",
              },
              {
                mondaiNumber: 9,
                title: "問題 9: 文章の文法",
                subTitle: "Ngữ pháp trong đoạn văn",
                japaneseTitle: "文章の文法",
                questionCount: 4,
                suggestedTimeMinutes: 3,
                targetDescription: "Có thể phán đoán được câu/từ nối nào phù hợp với dòng chảy của đoạn văn.",
              },
            ],
          },
          {
            id: "reading",
            name: "読解 (Đọc hiểu Đoạn văn)",
            japaneseName: "読解",
            icon: "📄",
            totalTimeMinutes: 73,
            mondais: [
              {
                mondaiNumber: 10,
                title: "問題 10: 内容理解（短文）",
                subTitle: "Đọc hiểu đoạn văn ngắn (~200 chữ)",
                japaneseTitle: "内容理解（短文）",
                questionCount: 5,
                suggestedTimeMinutes: 15,
                targetDescription: "Đọc và hiểu được nội dung của văn bản khoảng 200 Hán tự, thể loại văn giải thích, chỉ thị... liên quan đến công việc và cuộc sống.",
              },
              {
                mondaiNumber: 11,
                title: "問題 11: 内容理解（中文）",
                subTitle: "Đọc hiểu đoạn văn vừa (~500 chữ)",
                japaneseTitle: "内容理解（中文）",
                questionCount: 8,
                suggestedTimeMinutes: 25,
                targetDescription: "Đọc nội dung văn bản khoảng 500 Hán tự (văn giải thích, tự luận, bình phẩm...). Hiểu được lí do, mối quan hệ nhân quả.",
              },
              {
                mondaiNumber: 12,
                title: "問題 12: 統合理解",
                subTitle: "Đọc hiểu tổng hợp & so sánh (~600 chữ)",
                japaneseTitle: "統合理解",
                questionCount: 2,
                suggestedTimeMinutes: 9,
                targetDescription: "Đọc nội dung của một số văn bản (khoảng 600 Hán tự). Biết cách vừa tổng hợp vừa so sánh đối chiếu quan điểm.",
              },
              {
                mondaiNumber: 13,
                title: "問題 13: 主張理解（長文）",
                subTitle: "Nắm bắt chủ trương tác giả (~900 chữ)",
                japaneseTitle: "主張理解（長文）",
                questionCount: 3,
                suggestedTimeMinutes: 15,
                targetDescription: "Đọc văn bản khoảng 900 Hán tự mang tính lí luận, trừu tượng như bình phẩm, xã luận... Nắm bắt được ý kiến, chủ trương của tác giả.",
              },
              {
                mondaiNumber: 14,
                title: "問題 14: 情報検索",
                subTitle: "Tìm kiếm thông tin (~700 chữ)",
                japaneseTitle: "情報検索",
                questionCount: 2,
                suggestedTimeMinutes: 9,
                targetDescription: "Có thể tìm ra thông tin cần thiết trong quảng cáo, tờ rơi, bảng biểu thương mại có khoảng 700 Hán tự cơ bản.",
              },
            ],
          },
        ],
      },
      {
        name: "聴解 (Nghe hiểu)",
        timeMinutes: 50,
        majorSections: [
          {
            id: "listening",
            name: "聴解 (Nghe hiểu)",
            japaneseName: "聴解",
            icon: "🎧",
            totalTimeMinutes: 50,
            mondais: [
              {
                mondaiNumber: 1,
                title: "問題 1: 課題理解",
                subTitle: "Hiểu nhiệm vụ cần làm",
                japaneseTitle: "課題理解",
                questionCount: 5,
                targetDescription: "Nghe và nắm bắt những thông tin cần thiết, giải quyết những chủ đề cụ thể và biết hành động tiếp theo là gì.",
              },
              {
                mondaiNumber: 2,
                title: "問題 2: ポイント理解",
                subTitle: "Nắm bắt trọng điểm",
                japaneseTitle: "ポイント理解",
                questionCount: 6,
                targetDescription: "Nghe có định hướng từ trước, có khả năng nghe và lược ra những điểm chính cần thiết.",
              },
              {
                mondaiNumber: 3,
                title: "問題 3: 概要理解",
                subTitle: "Hiểu ý đồ người nói",
                japaneseTitle: "概要理解",
                questionCount: 5,
                targetDescription: "Từ đoạn hội thoại có thể hiểu được chủ trương, ý đồ, cảm xúc bao quát của người nói.",
              },
              {
                mondaiNumber: 4,
                title: "問題 4: 発話表現・即時応答",
                subTitle: "Phản xạ câu ứng đáp tức thì",
                japaneseTitle: "即時応答",
                questionCount: 11,
                targetDescription: "Nghe câu thoại ngắn chẳng hạn như một câu hỏi rồi chọn câu ứng đáp thích hợp tức thì.",
              },
              {
                mondaiNumber: 5,
                title: "問題 5: 統合理解",
                subTitle: "Nghe hiểu tổng hợp",
                japaneseTitle: "統合理解",
                questionCount: 3,
                targetDescription: "Nghe một đoạn hội thoại dài, vừa hiểu nội dung vừa tổng hợp, so sánh các nguồn thông tin.",
              },
            ],
          },
        ],
      },
    ],
  },
  N1: {
    level: "N1",
    totalExamTimeMinutes: 170,
    sections: [
      {
        name: "言語知識・読解 (110分)",
        timeMinutes: 110,
        majorSections: [
          {
            id: "vocab",
            name: "文字・語彙 (Chữ Hán & Từ vựng)",
            japaneseName: "言語知識（文字・語彙）",
            icon: "🔤",
            totalTimeMinutes: 18,
            mondais: [
              { mondaiNumber: 1, title: "問題 1: 漢字読み", subTitle: "Cách đọc Hán tự", japaneseTitle: "漢字読み", questionCount: 6, targetDescription: "Đọc Hán tự N1 nâng cao." },
              { mondaiNumber: 2, title: "問題 2: 文脈規定", subTitle: "Điền từ theo mạch văn", japaneseTitle: "文脈規定", questionCount: 7, targetDescription: "Điền từ vựng chuẩn xác theo ngữ cảnh." },
              { mondaiNumber: 3, title: "問題 3: 言い換え類義", subTitle: "Từ đồng nghĩa", japaneseTitle: "言い換え類義", questionCount: 6, targetDescription: "Tìm cách diễn đạt tương đương." },
              { mondaiNumber: 4, title: "問題 4: 用法", subTitle: "Cách dùng từ", japaneseTitle: "用法", questionCount: 6, targetDescription: "Cách dùng từ chính xác trong văn cảnh." },
            ],
          },
          {
            id: "grammar",
            name: "文法 (Ngữ pháp & Dựng câu)",
            japaneseName: "言語知識（文法）",
            icon: "📖",
            totalTimeMinutes: 17,
            mondais: [
              { mondaiNumber: 5, title: "問題 5: 文法形式の判断", subTitle: "Chọn hình thức ngữ pháp", japaneseTitle: "文法形式の判断", questionCount: 10, targetDescription: "Phán đoán mẫu ngữ pháp phù hợp." },
              { mondaiNumber: 6, title: "問題 6: 文の組み立て（★星問題）", subTitle: "Sắp xếp câu tìm vị trí ★", japaneseTitle: "文の組み立て", questionCount: 5, targetDescription: "Sắp xếp 4 vế câu tạo câu hoàn chỉnh." },
              { mondaiNumber: 7, title: "問題 7: 文章の文法", subTitle: "Ngữ pháp trong đoạn văn", japaneseTitle: "文章の文法", questionCount: 5, targetDescription: "Điền liên từ và ngữ pháp mạch lạc trong bài." },
            ],
          },
          {
            id: "reading",
            name: "読解 (Đọc hiểu)",
            japaneseName: "読解",
            icon: "📄",
            totalTimeMinutes: 75,
            mondais: [
              { mondaiNumber: 8, title: "問題 8: 短文読解", subTitle: "Đoạn văn ngắn (~200 chữ)", japaneseTitle: "内容理解（短文）", questionCount: 4, targetDescription: "Đọc hiểu nhanh thông báo, chỉ thị." },
              { mondaiNumber: 9, title: "問題 9: 中文読解", subTitle: "Đoạn văn vừa (~500 chữ)", japaneseTitle: "内容理解（中文）", questionCount: 9, targetDescription: "Nắm bắt logic, giải thích, quan điểm." },
              { mondaiNumber: 10, title: "問題 10: 長文読解", subTitle: "Đoạn văn dài (~1000 chữ)", japaneseTitle: "内容理解（長文）", questionCount: 4, targetDescription: "Hiểu diễn biến nội dung và thông điệp." },
              { mondaiNumber: 11, title: "問題 11: 統合理解", subTitle: "Đọc hiểu so sánh", japaneseTitle: "統合理解", questionCount: 3, targetDescription: "So sánh 2 văn bản khác nhau về cùng chủ đề." },
              { mondaiNumber: 12, title: "問題 12: 主張理解", subTitle: "Nắm bắt chủ trương (~1200 chữ)", japaneseTitle: "主張理解（長文）", questionCount: 4, targetDescription: "Phân tích bài bình luận, xã luận trừu tượng." },
              { mondaiNumber: 13, title: "問題 13: 情報検索", subTitle: "Tra cứu thông tin", japaneseTitle: "情報検索", questionCount: 2, targetDescription: "Tìm thông tin tờ rơi, hướng dẫn." },
            ],
          },
        ],
      },
    ],
  },
  N3: {
    level: "N3",
    totalExamTimeMinutes: 140,
    sections: [
      {
        name: "言語知識（文字・語彙）(30分)",
        timeMinutes: 30,
        majorSections: [
          {
            id: "vocab",
            name: "文字・語彙 (Chữ Hán & Từ vựng)",
            japaneseName: "言語知識（文字・語彙）",
            icon: "🔤",
            totalTimeMinutes: 30,
            mondais: [
              { mondaiNumber: 1, title: "問題 1: 漢字読み", subTitle: "Cách đọc Hán tự", japaneseTitle: "漢字読み", questionCount: 8, targetDescription: "Cách đọc chữ Hán N3." },
              { mondaiNumber: 2, title: "問題 2: 表記", subTitle: "Cách viết Hán tự", japaneseTitle: "表記", questionCount: 6, targetDescription: "Hiragana sang Hán tự." },
              { mondaiNumber: 3, title: "問題 3: 文脈規定", subTitle: "Điền từ ngữ cảnh", japaneseTitle: "文脈規定", questionCount: 11, targetDescription: "Tìm từ vựng phù hợp ý nghĩa câu." },
              { mondaiNumber: 4, title: "問題 4: 言い換え類義", subTitle: "Từ đồng nghĩa", japaneseTitle: "言い換え類義", questionCount: 5, targetDescription: "Tìm cách nói tương đương." },
              { mondaiNumber: 5, title: "問題 5: 用法", subTitle: "Cách dùng từ", japaneseTitle: "用法", questionCount: 5, targetDescription: "Vận dụng từ vào câu đúng văn cảnh." },
            ],
          },
        ],
      },
      {
        name: "言語知識（文法）・読解 (70分)",
        timeMinutes: 70,
        majorSections: [
          {
            id: "grammar",
            name: "文法 (Ngữ pháp & Dựng câu)",
            japaneseName: "言語知識（文法）",
            icon: "📖",
            totalTimeMinutes: 25,
            mondais: [
              { mondaiNumber: 6, title: "問題 1: 文法形式の判断", subTitle: "Dạng ngữ pháp", japaneseTitle: "文法形式の判断", questionCount: 13, targetDescription: "Chọn cấu trúc ngữ pháp N3." },
              { mondaiNumber: 7, title: "問題 2: 文の組み立て（★星問題）", subTitle: "Sắp xếp câu tìm ★", japaneseTitle: "文の組み立て", questionCount: 5, targetDescription: "Sắp xếp thứ tự tạo câu hoàn chỉnh." },
              { mondaiNumber: 8, title: "問題 3: 文章の文法", subTitle: "Ngữ pháp đoạn văn", japaneseTitle: "文章の文法", questionCount: 4, targetDescription: "Chọn liên từ và từ nối phù hợp." },
            ],
          },
          {
            id: "reading",
            name: "読解 (Đọc hiểu)",
            japaneseName: "読解",
            icon: "📄",
            totalTimeMinutes: 45,
            mondais: [
              { mondaiNumber: 9, title: "問題 4: 短文読解", subTitle: "Đoạn văn ngắn (~150-200 chữ)", japaneseTitle: "内容理解（短文）", questionCount: 4, targetDescription: "Hiểu nội dung cơ bản đời sống." },
              { mondaiNumber: 10, title: "問題 5: 中文読解", subTitle: "Đoạn văn vừa (~350 chữ)", japaneseTitle: "内容理解（中文）", questionCount: 6, targetDescription: "Hiểu quan điểm, giải thích." },
              { mondaiNumber: 11, title: "問題 6: 長文読解", subTitle: "Đoạn văn dài (~600 chữ)", japaneseTitle: "内容理解（長文）", questionCount: 4, targetDescription: "Hiểu mạch bài và ý đồ tác giả." },
              { mondaiNumber: 12, title: "問題 7: 情報検索", subTitle: "Tìm kiếm thông tin", japaneseTitle: "情報検索", questionCount: 2, targetDescription: "Tra cứu thông báo, quảng cáo." },
            ],
          },
        ],
      },
    ],
  },
  N4: {
    level: "N4",
    totalExamTimeMinutes: 115,
    sections: [
      {
        name: "言語知識（文字・語彙）(25分)",
        timeMinutes: 25,
        majorSections: [
          {
            id: "vocab",
            name: "文字・語彙 (Chữ Hán & Từ vựng)",
            japaneseName: "言語知識（文字・語彙）",
            icon: "🔤",
            totalTimeMinutes: 25,
            mondais: [
              { mondaiNumber: 1, title: "問題 1: 漢字読み", subTitle: "Cách đọc Hán tự", japaneseTitle: "漢字読み", questionCount: 9, targetDescription: "Đọc Kanji N4." },
              { mondaiNumber: 2, title: "問題 2: 表記", subTitle: "Cách viết Hán tự", japaneseTitle: "表記", questionCount: 6, targetDescription: "Viết sang Hán tự/Hiragana." },
              { mondaiNumber: 3, title: "問題 3: 文脈規定", subTitle: "Điền từ ngữ cảnh", japaneseTitle: "文脈規定", questionCount: 9, targetDescription: "Chọn từ điền vào chỗ trống." },
              { mondaiNumber: 4, title: "問題 4: 言い換え類義", subTitle: "Từ đồng nghĩa", japaneseTitle: "言い換え類義", questionCount: 5, targetDescription: "Cách nói tương đương." },
              { mondaiNumber: 5, title: "問題 5: 用法", subTitle: "Cách dùng từ", japaneseTitle: "用法", questionCount: 5, targetDescription: "Dùng từ trong câu." },
            ],
          },
        ],
      },
      {
        name: "言語知識（文法）・読解 (55分)",
        timeMinutes: 55,
        majorSections: [
          {
            id: "grammar",
            name: "文法 (Ngữ pháp)",
            japaneseName: "言語知識（文法）",
            icon: "📖",
            totalTimeMinutes: 25,
            mondais: [
              { mondaiNumber: 6, title: "問題 1: 文法形式の判断", subTitle: "Ngữ pháp N4", japaneseTitle: "文法形式の判断", questionCount: 13, targetDescription: "Chọn dạng ngữ pháp và trợ từ." },
              { mondaiNumber: 7, title: "問題 2: 文の組み立て（★星問題）", subTitle: "Sắp xếp câu tìm ★", japaneseTitle: "文の組み立て", questionCount: 5, targetDescription: "Sắp xếp câu." },
              { mondaiNumber: 8, title: "問題 3: 文章の文法", subTitle: "Ngữ pháp đoạn văn", japaneseTitle: "文章の文法", questionCount: 5, targetDescription: "Điền từ vào bài văn ngắn." },
            ],
          },
          {
            id: "reading",
            name: "読解 (Đọc hiểu)",
            japaneseName: "読解",
            icon: "📄",
            totalTimeMinutes: 30,
            mondais: [
              { mondaiNumber: 9, title: "問題 4: 短文読解", subTitle: "Đoạn văn ngắn", japaneseTitle: "内容理解（短文）", questionCount: 4, targetDescription: "Đọc hiểu thư từ, hướng dẫn ngắn." },
              { mondaiNumber: 10, title: "問題 5: 中文読解", subTitle: "Đoạn văn vừa", japaneseTitle: "内容理解（中文）", questionCount: 4, targetDescription: "Đọc hiểu sinh hoạt hàng ngày." },
              { mondaiNumber: 11, title: "問題 6: 情報検索", subTitle: "Tìm kiếm thông tin", japaneseTitle: "情報検索", questionCount: 2, targetDescription: "Tra cứu thông báo." },
            ],
          },
        ],
      },
    ],
  },
  N5: {
    level: "N5",
    totalExamTimeMinutes: 90,
    sections: [
      {
        name: "言語知識（文字・語彙）(20分)",
        timeMinutes: 20,
        majorSections: [
          {
            id: "vocab",
            name: "文字・語彙 (Chữ Hán & Từ vựng)",
            japaneseName: "言語知識（文字・語彙）",
            icon: "🔤",
            totalTimeMinutes: 20,
            mondais: [
              { mondaiNumber: 1, title: "問題 1: 漢字読み", subTitle: "Cách đọc Hán tự", japaneseTitle: "漢字読み", questionCount: 12, targetDescription: "Cách đọc Kanji cơ bản N5." },
              { mondaiNumber: 2, title: "問題 2: 表記", subTitle: "Cách viết Hán tự", japaneseTitle: "表記", questionCount: 8, targetDescription: "Chuyển Hiragana sang Kanji." },
              { mondaiNumber: 3, title: "問題 3: 文脈規定", subTitle: "Điền từ vào câu", japaneseTitle: "文脈規定", questionCount: 10, targetDescription: "Điền từ vựng cơ bản vào chỗ trống." },
              { mondaiNumber: 4, title: "問題 4: 言い換え類義", subTitle: "Cách nói tương đương", japaneseTitle: "言い換え類義", questionCount: 5, targetDescription: "Tìm câu có nghĩa tương đương." },
            ],
          },
        ],
      },
      {
        name: "言語知識（文法）・読解 (40分)",
        timeMinutes: 40,
        majorSections: [
          {
            id: "grammar",
            name: "文法 (Ngữ pháp)",
            japaneseName: "言語知識（文法）",
            icon: "📖",
            totalTimeMinutes: 20,
            mondais: [
              { mondaiNumber: 5, title: "問題 1: 文法形式の判断", subTitle: "Trợ từ & Ngữ pháp N5", japaneseTitle: "文法形式の判断", questionCount: 16, targetDescription: "Phán đoán trợ từ và dạng ngữ pháp Minna." },
              { mondaiNumber: 6, title: "問題 2: 文の組み立て（★星問題）", subTitle: "Sắp xếp câu tìm ★", japaneseTitle: "文の組み立て", questionCount: 5, targetDescription: "Sắp xếp 4 từ tạo câu đúng ngữ pháp." },
              { mondaiNumber: 7, title: "問題 3: 文章の文法", subTitle: "Ngữ pháp đoạn văn", japaneseTitle: "文章の文法", questionCount: 5, targetDescription: "Điền từ vào bài văn ngắn." },
            ],
          },
          {
            id: "reading",
            name: "読解 (Đọc hiểu)",
            japaneseName: "読解",
            icon: "📄",
            totalTimeMinutes: 20,
            mondais: [
              { mondaiNumber: 8, title: "問題 4: 短文読解", subTitle: "Đoạn văn ngắn (~80 chữ)", japaneseTitle: "内容理解（短文）", questionCount: 3, targetDescription: "Đọc hiểu câu chuyện, tin nhắn ngắn." },
              { mondaiNumber: 9, title: "問題 5: 中文読解", subTitle: "Đoạn văn vừa (~250 chữ)", japaneseTitle: "内容理解（中文）", questionCount: 2, targetDescription: "Đọc hiểu nhật ký, trải nghiệm." },
              { mondaiNumber: 10, title: "問題 6: 情報検索", subTitle: "Tìm kiếm thông tin", japaneseTitle: "情報検索", questionCount: 1, targetDescription: "Đọc tờ rơi, thời khóa biểu đơn giản." },
            ],
          },
        ],
      },
    ],
  },
};

export function getJLPTLevelStructure(level: string): JLPTLevelStructure {
  const norm = level.toUpperCase();
  return JLPT_STRUCTURES[norm] || JLPT_STRUCTURES.N2;
}
