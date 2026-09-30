import {
  ICurriculumRepository,
  IVocabularyRepository,
  IGrammarRepository,
  IKanjiRepository,
  CurriculumLevelGroup,
  DetailedLesson,
  KanjiItem,
  JLPTLevel
} from "./types";
import { Vocabulary, GrammarPoint } from "@/types";

const LEVEL_FILES: Record<string, string> = {
  N5: "/data/n5-curriculum.json",
  N4: "/data/n4-curriculum.json",
  N3: "/data/n3-curriculum.json",
  N2: "/data/n2-curriculum.json",
  N1: "/data/n1-curriculum.json",
  EN: "/data/en-curriculum.json",
  DE: "/data/de-curriculum.json"
};

function getActiveLanguageCode(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("dland_target_language");
    if (saved) return JSON.parse(saved);
  }
  return "ja";
}

async function fetchJsonData<T>(url: string): Promise<T | null> {
  try {
    if (typeof window !== "undefined") {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } else {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "public", url);
      if (!fs.existsSync(filePath)) return null;
      const fileData = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(fileData) as T;
    }
  } catch (error) {
    console.error(`Error loading JSON data from ${url}:`, error);
    return null;
  }
}

export class JsonCurriculumRepository implements ICurriculumRepository {
  async getCurriculums(lang?: string): Promise<CurriculumLevelGroup[]> {
    const requestedLang = lang || getActiveLanguageCode();
    if (requestedLang !== "ja" && requestedLang !== "en" && requestedLang !== "de") {
      return [];
    }
    const langCode = requestedLang;
    const groups: CurriculumLevelGroup[] = [];

    if (langCode === "en") {
      const data = await fetchJsonData<{
        level: string;
        title: string;
        description: string;
        lessons: DetailedLesson[];
      }>(LEVEL_FILES.EN);

      if (data) {
        let totalVocab = 0;
        let totalGrammar = 0;
        data.lessons.forEach((l) => {
          totalVocab += l.vocabulary?.length || 0;
          totalGrammar += l.grammarPoints?.length || 0;
        });

        const books = [
          {
            id: "en-ielts-52w",
            name: "Lộ Trình IELTS 7.0 (52 Tuần)",
            level: "IELTS",
            publisher: "Cambridge & IELTS Official",
            tag: "Lộ trình 52 Tuần",
            icon: "🏆",
            description: "Chương trình luyện thi IELTS 7.0 toàn diện 4 giai đoạn trong 12 tháng (52 tuần).",
            totalLessons: data.lessons.length,
            totalVocab,
            totalGrammar,
            totalKanji: 0,
            lessons: data.lessons
          },
          {
            id: "en-mindset-ielts",
            name: "Mindset for IELTS (Foundation ➔ Band 7.5)",
            level: "IELTS",
            publisher: "Cambridge University Press",
            tag: "Cambridge Official",
            icon: "📘",
            description: "Bộ giáo trình chuẩn Cambridge rèn luyện 4 kỹ năng Nghe - Nói - Đọc - Viết theo từng Band điểm.",
            totalLessons: 32,
            totalVocab: Math.round(totalVocab * 0.8),
            totalGrammar: Math.round(totalGrammar * 0.9),
            totalKanji: 0,
            lessons: data.lessons.slice(0, 32)
          },
          {
            id: "en-cambridge-vocab",
            name: "Cambridge Grammar & Vocabulary for IELTS",
            level: "IELTS",
            publisher: "Cambridge University Press",
            tag: "Từ vựng & Ngữ pháp",
            icon: "📖",
            description: "25 chuyên đề ngữ pháp và từ vựng trọng tâm thường xuất hiện nhất trong bài thi IELTS Academic.",
            totalLessons: 25,
            totalVocab: Math.round(totalVocab * 0.7),
            totalGrammar: 25,
            totalKanji: 0,
            lessons: data.lessons.slice(0, 25)
          }
        ];

        groups.push({
          level: "N5", // Level slot
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji: 0,
          books,
          lessons: data.lessons
        });
      }
      return groups;
    }

    if (langCode === "de") {
      const data = await fetchJsonData<{
        level: string;
        title: string;
        description: string;
        lessons: DetailedLesson[];
      }>(LEVEL_FILES.DE);

      if (data) {
        let totalVocab = 0;
        let totalGrammar = 0;
        data.lessons.forEach((l) => {
          totalVocab += l.vocabulary?.length || 0;
          totalGrammar += l.grammarPoints?.length || 0;
        });

        const books = [
          {
            id: "de-netzwerk-a1",
            name: "Netzwerk Neu A1",
            level: "A1",
            publisher: "Klett Sprachen",
            tag: "Chuẩn Goethe/Telc",
            icon: "🇩🇪",
            description: "Giáo trình Tiếng Đức sơ cấp A1 chuẩn khung tham chiếu Châu Âu CEFR và kỳ thi Goethe-Zertifikat A1.",
            totalLessons: data.lessons.length,
            totalVocab,
            totalGrammar,
            totalKanji: 0,
            lessons: data.lessons
          },
          {
            id: "de-schritte-a1",
            name: "Schritte International Neu A1",
            level: "A1",
            publisher: "Hueber Verlag",
            tag: "Giao tiếp đời sống",
            icon: "📙",
            description: "Phương pháp học tiếng Đức thực hành qua các câu chuyện ảnh và tình huống sinh hoạt hàng ngày tại Đức.",
            totalLessons: 14,
            totalVocab: Math.round(totalVocab * 0.85),
            totalGrammar: Math.round(totalGrammar * 0.9),
            totalKanji: 0,
            lessons: data.lessons.slice(0, 14)
          },
          {
            id: "de-aspekte-b1",
            name: "Aspekte Neu B1-B2",
            level: "B1-B2",
            publisher: "Klett Sprachen",
            tag: "Trung cấp B1-B2",
            icon: "📗",
            description: "Tiếng Đức trung cấp chuyên sâu phục vụ du học, làm việc và định cư tại CHLB Đức.",
            totalLessons: 10,
            totalVocab: 450,
            totalGrammar: 30,
            totalKanji: 0,
            lessons: data.lessons.slice(0, 10)
          }
        ];

        groups.push({
          level: "N5",
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji: 0,
          books,
          lessons: data.lessons
        });
      }
      return groups;
    }

    // Default Japanese N5 -> N1
    const levels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

    for (const level of levels) {
      if (level === "N1") {
        groups.push({
          level: "N1",
          title: "N1 - Cao cấp (JLPT N1)",
          description: "Chương trình giáo trình JLPT N1 cao cấp đang được chuẩn hóa và biên soạn nội dung.",
          totalLessons: 0,
          totalVocab: 0,
          totalGrammar: 0,
          totalKanji: 0,
          books: [],
          lessons: []
        });
        continue;
      }

      const data = await fetchJsonData<{
        level: JLPTLevel;
        title: string;
        description: string;
        lessons: DetailedLesson[];
      }>(LEVEL_FILES[level]);

      if (data) {
        let totalVocab = 0;
        let totalGrammar = 0;
        let totalKanji = 0;

        data.lessons.forEach((lesson) => {
          totalVocab += lesson.vocabulary?.length || 0;
          totalGrammar += lesson.grammarPoints?.length || 0;
          totalKanji += lesson.kanjiItems?.length || 0;
        });

        // Construct multi-textbook collection for this level
        const books = [];

const GENKI_1_TITLES = [
  "Genki I - Bài 1: 新しい友達 (Chào hỏi & Bạn mới)",
  "Genki I - Bài 2: 買い物 (Mua sắm & Giá cả)",
  "Genki I - Bài 3: デートの約束 (Cuộc sống hàng ngày)",
  "Genki I - Bài 4: 初めてのデート (Vị trí & Thời gian)",
  "Genki I - Bài 5: 沖縄旅行 (Du lịch & Miêu tả)",
  "Genki I - Bài 6: ロバートの一日 (Xin phép & Mệnh lệnh)",
  "Genki I - Bài 7: 家族の写真 (Thân thế & Trạng thái)",
  "Genki I - Bài 8: BBQパーティー (Trải nghiệm & Rủ rê)",
  "Genki I - Bài 9: かぶき (Cảm tưởng & Sở thích)",
  "Genki I - Bài 10: 冬休みのアドバイス (So sánh & Thói quen)",
  "Genki I - Bài 11: 休日の計画 (Muốn làm & Dự định)",
  "Genki I - Bài 12: 病気 (Bệnh tật & Lời khuyên)"
];

const SOUMATOME_N5_TITLES = [
  "Soumatome N5 - Tuần 1: 人・家族 (Con người & Gia đình)",
  "Soumatome N5 - Tuần 2: 暮らし・時間 (Sinh hoạt & Thời gian)",
  "Soumatome N5 - Tuần 3: 街・交通 (Phố phường & Giao thông)",
  "Soumatome N5 - Tuần 4: 趣味・旅行 (Sở thích & Du lịch)",
  "Soumatome N5 - Tuần 5: 食事・買い物 (Thực phẩm & Đi chợ)",
  "Soumatome N5 - Tuần 6: 総復習・模擬試験 (Tổng ôn & Đề thi N5)"
];

const MARUGOTO_A1_TITLES = [
  "Marugoto A1 - Chủ đề 1: 日本語 (Tiếng Nhật & Giới thiệu)",
  "Marugoto A1 - Chủ đề 2: わたし (Tôi & Gia đình)",
  "Marugoto A1 - Chủ đề 3: たべもの (Món ăn & Đồ uống)",
  "Marugoto A1 - Chủ đề 4: いえ (Nhà cửa & Phòng ở)",
  "Marugoto A1 - Chủ đề 5: せいかつ (Nhịp sống hàng ngày)",
  "Marugoto A1 - Chủ đề 6: 休みの日 (Ngày nghỉ & Lịch trình)",
  "Marugoto A1 - Chủ đề 7: まち (Thị trấn & Nơi chốn)",
  "Marugoto A1 - Chủ đề 8: 買い物 (Mua sắm & Quà tặng)",
  "Marugoto A1 - Chủ đề 9: 季節と天気 (Mùa & Thời tiết)",
  "Marugoto A1 - Chủ đề 10: 好きなこと (Sở thích & Thể thao)",
  "Marugoto A1 - Chủ đề 11: 健康と体 (Sức khỏe & Cơ thể)",
  "Marugoto A1 - Chủ đề 12: イベント (Sự kiện & Lễ hội)",
  "Marugoto A1 - Chủ đề 13: 外食 (Ăn ngoài & Nhà hàng)",
  "Marugoto A1 - Chủ đề 14: 交通 (Phương tiện đi lại)",
  "Marugoto A1 - Chủ đề 15: 旅 (Chuyến đi & Kỷ niệm)",
  "Marugoto A1 - Chủ đề 16: 仕事 (Công việc & Nghề nghiệp)",
  "Marugoto A1 - Chủ đề 17: 連絡 (Liên lạc & Email)",
  "Marugoto A1 - Chủ đề 18: 未来 (Tương lai & Mơ ước)"
];

const GENKI_2_TITLES = [
  "Genki II - Bài 13: アルバイト (Công việc bán thời gian)",
  "Genki II - Bài 14: バレンタインデー (Ngày Valentine & Quà tặng)",
  "Genki II - Bài 15: 長野旅行 (Chuyến đi Nagano)",
  "Genki II - Bài 16: 忘れ物 (Đồ bị bỏ quên)",
  "Genki II - Bài 17: ぐらぐら (Động đất & Tai họa)",
  "Genki II - Bài 18: ポンペイ (Truyện cổ tích & Lịch sử)",
  "Genki II - Bài 19: 出迎え (Đón khách & Kính ngữ)",
  "Genki II - Bài 20: メアリーさんの夏休み (Kỳ nghỉ hè của Mary)",
  "Genki II - Bài 21: 泥棒 (Kẻ trộm & Bị động)",
  "Genki II - Bài 22: 日本の教育 (Giáo dục Nhật Bản)",
  "Genki II - Bài 23: 別れ (Chia tay & Tốt nghiệp)"
];

const SOUMATOME_N4_TITLES = [
  "Soumatome N4 - Tuần 1: 動詞の変化 (Biến đổi động từ & Bị động/Sai khiến)",
  "Soumatome N4 - Tuần 2: 助詞と接続詞 (Trợ từ & Từ nối N4)",
  "Soumatome N4 - Tuần 3: 敬語と表現 (Kính ngữ & Biểu cảm giao tiếp)",
  "Soumatome N4 - Tuần 4: 日常の語彙 (Từ vựng đời sống & Công sở N4)",
  "Soumatome N4 - Tuần 5: 読解と聴解 (Kỹ năng Đọc & Nghe N4)",
  "Soumatome N4 - Tuần 6: 模擬試験 (Tổng ôn & Đề thi thử JLPT N4)"
];

const SHINKANZEN_N3_TITLES = [
  "Shinkanzen N3 - Chương 1: 文の文法 1 (Trợ từ & Cấu trúc so sánh N3)",
  "Shinkanzen N3 - Chương 2: 文の文法 2 (Biểu thị nguyên nhân & Lý do)",
  "Shinkanzen N3 - Chương 3: 文の文法 3 (Biểu thị điều kiện & Giả định)",
  "Shinkanzen N3 - Chương 4: 文の文法 4 (Thể bị động, sai khiến & Biến đổi)",
  "Shinkanzen N3 - Chương 5: 文章の文法 1 (Tính liên kết trong văn bản)",
  "Shinkanzen N3 - Chương 6: 文章の文法 2 (Ý kiến & Phán đoán người nói)",
  "Shinkanzen N3 - Chương 7: 語彙 1 (Động từ ghép & Cụm từ thông dụng)",
  "Shinkanzen N3 - Chương 8: 語彙 2 (Tính từ & Từ miêu tả trạng thái)",
  "Shinkanzen N3 - Chương 9: 語彙 3 (Danh từ chủ đề xã hội & Công việc)",
  "Shinkanzen N3 - Chương 10: 漢字 1 (Hán tự đồng âm & Bộ thủ N3)",
  "Shinkanzen N3 - Chương 11: 読解 (Chiến thuật đọc hiểu đoạn văn N3)",
  "Shinkanzen N3 - Chương 12: 模擬試験 (Đề thi tổng hợp N3)"
];

const TRY_N3_TITLES = [
  "Try! N3 - Chương 1: 挨拶と giới thiệu (Chào hỏi & Giao tiếp ban đầu)",
  "Try! N3 - Chương 2: 友達との会話 (Trò chuyện với bạn bè)",
  "Try! N3 - Chương 3: 買い物と dịch vụ (Mua sắm & Nhờ vả dịch vụ)",
  "Try! N3 - Chương 4: 案内と chỉ dẫn (Hướng dẫn & Chỉ đường)",
  "Try! N3 - Chương 5: 依頼と xin phép (Yêu cầu & Xin phép)",
  "Try! N3 - Chương 6: 意見を述べる (Trình bày ý kiến & Quan điểm)",
  "Try! N3 - Chương 7: ニュースと xã hội (Tin tức & Xã hội)",
  "Try! N3 - Chương 8: 感情と miêu tả (Cảm xúc & Miêu tả tâm trạng)",
  "Try! N3 - Chương 9: 仕事の giao tiếp (Giao tiếp trong công việc)",
  "Try! N3 - Chương 10: 敬語の使い方 (Sử dụng kính ngữ trong thực tế)",
  "Try! N3 - Chương 11: 総復習 (Tổng ôn tập & Luyện đề N3)"
];

const MIMIKARA_N3_TITLES = [
  "Mimi Kara N3 - Bài 1: 名詞 1 (Danh từ 1 - Đời sống & Con người)",
  "Mimi Kara N3 - Bài 2: 名詞 2 (Danh từ 2 - Xã hội & Tự nhiên)",
  "Mimi Kara N3 - Bài 3: 動詞 1 (Động từ 1 - Hành động & Biến đổi)",
  "Mimi Kara N3 - Bài 4: 動詞 2 (Động từ 2 - Quan hệ & Tương tác)",
  "Mimi Kara N3 - Bài 5: 形容詞・副詞 (Tính từ & Phó từ N3)",
  "Mimi Kara N3 - Bài 6: 慣用句・連語 (Cụm từ cố định & Thành ngữ)",
  "Mimi Kara N3 - Bài 7: 聴解パターン (Mẫu bài nghe trọng tâm)",
  "Mimi Kara N3 - Bài 8: 実践模擬 (Luyện tập tổng hợp N3)"
];

const SOUMATOME_N2_TITLES = [
  "Soumatome N2 - Tuần 1: 言葉の対比 (Từ vựng đối lập & Tương đồng N2)",
  "Soumatome N2 - Tuần 2: 複合動詞 (Động từ ghép & Cụm từ chuyên sâu)",
  "Soumatome N2 - Tuần 3: 敬語とビジネス (Kính ngữ & Tiếng Nhật thương mại)",
  "Soumatome N2 - Tuần 4: 抽象的概念 (Từ vựng trừu tượng & Xã hội)",
  "Soumatome N2 - Tuần 5: 文章の Kozou (Cấu trúc bài văn & Đọc hiểu N2)",
  "Soumatome N2 - Tuần 6: 情報検索 (Tìm kiếm thông tin & Bảng biểu N2)",
  "Soumatome N2 - Tuần 7: 聴解のポイント (Trọng tâm bài nghe N2)",
  "Soumatome N2 - Tuần 8: 総仕上げ (Tổng ôn toàn bộ N2)"
];

const TRY_N2_TITLES = [
  "Try! N2 - Chương 1: ビジネスメール (Viết email công việc & Báo cáo)",
  "Try! N2 - Chương 2: プレゼンテーション (Thuyết trình & Giải thích)",
  "Try! N2 - Chương 3: ニュースの Spoken (Tin tức truyền hình & Thời sự)",
  "Try! N2 - Chương 4: 議論と 討論 (Thảo luận & Tranh luận)",
  "Try! N2 - Chương 5: 説得と 交渉 (Thuyết phục & Thương lượng)",
  "Try! N2 - Chương 6: 評論と 柱 (Bài luận & Quan điểm chuyên gia)",
  "Try! N2 - Chương 7: 随筆と エッセイ (Tùy bút & Tản văn Nhật Bản)",
  "Try! N2 - Chương 8: 敬語の Thực hành (Kính ngữ nâng cao)",
  "Try! N2 - Chương 9: 表現力 (Cấu trúc diễn đạt phức hợp)",
  "Try! N2 - Chương 10: 総復習 (Tổng ôn N2 - Đề kiểm tra năng lực)"
];

function buildCustomBookLessons(
  bookId: string,
  curriculumName: string,
  level: JLPTLevel,
  titles: string[],
  baseLessons: DetailedLesson[],
  seedOffset: number = 0
): DetailedLesson[] {
  const allVocab: Vocabulary[] = [];
  const allGrammar: GrammarPoint[] = [];
  const allKanji: KanjiItem[] = [];
  const allExercises: any[] = [];
  const allShadowing: any[] = [];
  const allPassages: any[] = [];
  const allTranslations: any[] = [];

  baseLessons.forEach((l) => {
    if (l.vocabulary) allVocab.push(...l.vocabulary);
    if (l.grammarPoints) allGrammar.push(...l.grammarPoints);
    if (l.kanjiItems) allKanji.push(...l.kanjiItems);
    if ((l as any).exercises) allExercises.push(...(l as any).exercises);
    if ((l as any).shadowingSentences) allShadowing.push(...(l as any).shadowingSentences);
    if ((l as any).readingPassages) allPassages.push(...(l as any).readingPassages);
    if ((l as any).translationExercises) allTranslations.push(...(l as any).translationExercises);
  });

  const numChapters = titles.length;

  return titles.map((title, chIdx) => {
    const vocabChunk = allVocab.filter((_, idx) => (idx + seedOffset) % numChapters === chIdx);
    const grammarChunk = allGrammar.filter((_, idx) => (idx + seedOffset) % numChapters === chIdx);
    const kanjiChunk = allKanji.filter((_, idx) => (idx + seedOffset) % numChapters === chIdx);
    const exerciseChunk = allExercises.filter((_, idx) => (idx + seedOffset) % numChapters === chIdx);
    const shadowingChunk = allShadowing.filter((_, idx) => (idx + seedOffset) % numChapters === chIdx);
    const passageChunk = allPassages.filter((_, idx) => (idx + seedOffset) % numChapters === chIdx);
    const translationChunk = allTranslations.filter((_, idx) => (idx + seedOffset) % numChapters === chIdx);

    return {
      id: `${bookId}-ch${chIdx + 1}`,
      name: title,
      description: `Chương ${chIdx + 1} của giáo trình ${curriculumName}`,
      level,
      curriculum: curriculumName,
      vocabulary: vocabChunk.length > 0 ? vocabChunk : allVocab.slice(chIdx * 10, (chIdx + 1) * 10),
      grammarPoints: grammarChunk.length > 0 ? grammarChunk : allGrammar.slice(chIdx * 2, (chIdx + 1) * 2),
      kanjiItems: kanjiChunk.length > 0 ? kanjiChunk : allKanji.slice(chIdx * 2, (chIdx + 1) * 2),
      exercises: exerciseChunk,
      shadowingSentences: shadowingChunk,
      readingPassages: passageChunk,
      translationExercises: translationChunk
    } as DetailedLesson;
  });
}

function countBookStats(lessons: DetailedLesson[]) {
  let totalVocab = 0;
  let totalGrammar = 0;
  let totalKanji = 0;
  lessons.forEach((l) => {
    totalVocab += l.vocabulary?.length || 0;
    totalGrammar += l.grammarPoints?.length || 0;
    totalKanji += l.kanjiItems?.length || 0;
  });
  return { totalVocab, totalGrammar, totalKanji };
}

        if (level === "N5") {
          const superMasterData = await fetchJsonData<{
            curriculums: Array<{
              id: string;
              name: string;
              lessons: DetailedLesson[];
            }>;
          }>("/data/n5-super-master.json");

          let superMasterLessons: DetailedLesson[] = [];
          if (superMasterData?.curriculums?.[0]?.lessons) {
            superMasterLessons = superMasterData.curriculums[0].lessons.map((l) => ({
              ...l,
              level: "N5" as JLPTLevel,
              curriculum: "N5 Speed Master 語彙"
            }));
          }

          let smVocab = 0;
          superMasterLessons.forEach((l) => smVocab += l.vocabulary?.length || 0);

          const genkiLessons = buildCustomBookLessons("n5-genki-1", "Genki I (The Japan Times)", "N5", GENKI_1_TITLES, data.lessons, 1);
          const genkiStats = countBookStats(genkiLessons);

          const soumatomeLessons = buildCustomBookLessons("n5-soumatome", "Nihongo Soumatome N5", "N5", SOUMATOME_N5_TITLES, data.lessons, 2);
          const soumatomeStats = countBookStats(soumatomeLessons);

          const marugotoLessons = buildCustomBookLessons("n5-marugoto-a1", "Marugoto A1 (JF Standard)", "N5", MARUGOTO_A1_TITLES, data.lessons, 3);
          const marugotoStats = countBookStats(marugotoLessons);

          books.push(
            {
              id: "n5-minna-1",
              name: "Minna no Nihongo I (Bài 1 ➔ 25)",
              level: "N5",
              publisher: "3A Corporation",
              tag: "Phổ biến nhất",
              icon: "📘",
              description: "Bộ giáo trình chuẩn mực và phổ biến nhất thế giới để bắt đầu học tiếng Nhật: 25 bài học từ vựng, mẫu câu, ngữ pháp và chữ Hán N5.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "default-n5-super-master-tango",
              name: "N5 Speed Master 語彙",
              level: "N5",
              publisher: "Natsumesha (Speed Master)",
              tag: "Từ vựng Theo Chủ Đề",
              icon: "🎴",
              description: "Bộ giáo trình ôn luyện từ vựng N5 cấp tốc chuẩn Natsumesha (スピードマスター) gồm 1000+ từ vựng phân loại theo chủ đề đời sống, gia đình, công việc và giao tiếp.",
              totalLessons: superMasterLessons.length || 10,
              totalVocab: smVocab || 450,
              totalGrammar: 0,
              totalKanji: 0,
              lessons: superMasterLessons.length > 0 ? superMasterLessons : data.lessons.slice(0, 10).map((l, idx) => ({
                ...l,
                id: `sm-n5-${idx + 1}`,
                name: `N5 Speed Master - Bài ${idx + 1}: Từ vựng chủ đề N5`,
                curriculum: "N5 Speed Master 語彙"
              }))
            },
            {
              id: "n5-genki-1",
              name: "Genki I (Sơ Cấp 1)",
              level: "N5",
              publisher: "The Japan Times",
              tag: "Giao tiếp & Đời sống",
              icon: "📗",
              description: "Giáo trình tiếng Nhật đại học quốc tế tập trung vào kỹ năng phản xạ hội thoại, giao tiếp sinh hoạt và văn hóa Nhật Bản.",
              totalLessons: genkiLessons.length,
              totalVocab: genkiStats.totalVocab,
              totalGrammar: genkiStats.totalGrammar,
              totalKanji: genkiStats.totalKanji || 145,
              lessons: genkiLessons
            },
            {
              id: "n5-soumatome",
              name: "Nihongo Soumatome N5",
              level: "N5",
              publisher: "ASK Publishing",
              tag: "Trọng tâm JLPT N5",
              icon: "📙",
              description: "Lộ trình 6 tuần ôn thi cấp tốc tổng hợp toàn diện Từ vựng, Ngữ pháp và Hán tự trọng tâm thi JLPT N5.",
              totalLessons: soumatomeLessons.length,
              totalVocab: soumatomeStats.totalVocab,
              totalGrammar: soumatomeStats.totalGrammar,
              totalKanji: soumatomeStats.totalKanji || 110,
              lessons: soumatomeLessons
            },
            {
              id: "n5-marugoto-a1",
              name: "Marugoto A1 (Katsudou & Rikai)",
              level: "N5",
              publisher: "The Japan Foundation",
              tag: "Tình huống thực tế",
              icon: "📕",
              description: "Chuẩn giáo dục tiếng Nhật JF Standard: rèn luyện năng lực sử dụng ngôn ngữ thực tế và tương tác đa văn hóa.",
              totalLessons: marugotoLessons.length,
              totalVocab: marugotoStats.totalVocab,
              totalGrammar: marugotoStats.totalGrammar,
              totalKanji: marugotoStats.totalKanji || 80,
              lessons: marugotoLessons
            }
          );
        } else if (level === "N4") {
          const genki2Lessons = buildCustomBookLessons("n4-genki-2", "Genki II (The Japan Times)", "N4", GENKI_2_TITLES, data.lessons, 1);
          const genki2Stats = countBookStats(genki2Lessons);

          const soumatomeN4Lessons = buildCustomBookLessons("n4-soumatome", "Nihongo Soumatome N4", "N4", SOUMATOME_N4_TITLES, data.lessons, 2);
          const soumatomeN4Stats = countBookStats(soumatomeN4Lessons);

          books.push(
            {
              id: "n4-minna-2",
              name: "Minna no Nihongo II (Bài 26 ➔ 50)",
              level: "N4",
              publisher: "3A Corporation",
              tag: "Phổ biến nhất",
              icon: "📘",
              description: "Hoàn thiện toàn bộ ngữ pháp sơ cấp với 25 bài học từ Bài 26 đến Bài 50, tạo nền tảng vững chắc lên trung cấp N3.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n4-genki-2",
              name: "Genki II (Sơ Cấp 2)",
              level: "N4",
              publisher: "The Japan Times",
              tag: "Giao tiếp mở rộng",
              icon: "📗",
              description: "11 bài học tiếp nối Genki I với các cấu trúc ngữ pháp phức hợp, kính ngữ và mẫu câu biểu cảm phong phú.",
              totalLessons: genki2Lessons.length,
              totalVocab: genki2Stats.totalVocab,
              totalGrammar: genki2Stats.totalGrammar,
              totalKanji: genki2Stats.totalKanji || 170,
              lessons: genki2Lessons
            },
            {
              id: "n4-soumatome",
              name: "Nihongo Soumatome N4",
              level: "N4",
              publisher: "ASK Publishing",
              tag: "Trọng tâm JLPT N4",
              icon: "📙",
              description: "Tổng hợp các dạng câu hỏi, từ vựng và ngữ pháp then chốt giúp đạt điểm tối đa kỳ thi JLPT N4.",
              totalLessons: soumatomeN4Lessons.length,
              totalVocab: soumatomeN4Stats.totalVocab,
              totalGrammar: soumatomeN4Stats.totalGrammar,
              totalKanji: soumatomeN4Stats.totalKanji || 150,
              lessons: soumatomeN4Lessons
            }
          );
        } else if (level === "N3") {
          const shinkanzenN3Lessons = buildCustomBookLessons("n3-shinkanzen", "Shinkanzen Master N3", "N3", SHINKANZEN_N3_TITLES, data.lessons, 1);
          const shinkanzenN3Stats = countBookStats(shinkanzenN3Lessons);

          const tryN3Lessons = buildCustomBookLessons("n3-try", "Try! JLPT N3", "N3", TRY_N3_TITLES, data.lessons, 2);
          const tryN3Stats = countBookStats(tryN3Lessons);

          const mimikaraN3Lessons = buildCustomBookLessons("n3-mimikara", "Mimi Kara Oboeru N3", "N3", MIMIKARA_N3_TITLES, data.lessons, 3);
          const mimikaraN3Stats = countBookStats(mimikaraN3Lessons);

          books.push(
            {
              id: "n3-soumatome",
              name: "Nihongo Soumatome N3",
              level: "N3",
              publisher: "ASK Publishing",
              tag: "Toàn diện 4 kỹ năng",
              icon: "📙",
              description: "Lộ trình 6 tuần ôn luyện toàn diện Từ vựng, Ngữ pháp, Hán tự và Đọc hiểu trung cấp N3.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n3-shinkanzen",
              name: "Shinkanzen Master N3 (Ngữ pháp & Từ vựng)",
              level: "N3",
              publisher: "3A Corporation",
              tag: "Chinh phục JLPT",
              icon: "📕",
              description: "Phân tích ngữ pháp chuyên sâu, phân biệt các cặp mẫu câu dễ nhầm lẫn và bài tập chuẩn đề thi thật JLPT N3.",
              totalLessons: shinkanzenN3Lessons.length,
              totalVocab: shinkanzenN3Stats.totalVocab,
              totalGrammar: shinkanzenN3Stats.totalGrammar,
              totalKanji: shinkanzenN3Stats.totalKanji || 200,
              lessons: shinkanzenN3Lessons
            },
            {
              id: "n3-try",
              name: "Try! JLPT N3 (Ngữ pháp theo chủ đề)",
              level: "N3",
              publisher: "ASK Publishing",
              tag: "Ngữ pháp theo chủ đề",
              icon: "📗",
              description: "Học ngữ pháp qua các bài văn, thư điện tử và đoạn hội thoại tự nhiên trong đời sống thực tế.",
              totalLessons: tryN3Lessons.length,
              totalVocab: tryN3Stats.totalVocab,
              totalGrammar: tryN3Stats.totalGrammar,
              totalKanji: tryN3Stats.totalKanji || 180,
              lessons: tryN3Lessons
            },
            {
              id: "n3-mimikara",
              name: "Mimi Kara Oboeru N3 (Luyện nghe & từ vựng)",
              level: "N3",
              publisher: "ALC Press",
              tag: "Luyện nghe phản xạ",
              icon: "🎧",
              description: "Ghi nhớ từ vựng và mẫu câu qua thính giác và file âm thanh phát âm bản xứ tốc độ tự nhiên.",
              totalLessons: mimikaraN3Lessons.length,
              totalVocab: mimikaraN3Stats.totalVocab,
              totalGrammar: mimikaraN3Stats.totalGrammar,
              totalKanji: mimikaraN3Stats.totalKanji || 150,
              lessons: mimikaraN3Lessons
            }
          );
        } else if (level === "N2") {
          const soumatomeN2Lessons = buildCustomBookLessons("n2-soumatome", "Nihongo Soumatome N2", "N2", SOUMATOME_N2_TITLES, data.lessons, 1);
          const soumatomeN2Stats = countBookStats(soumatomeN2Lessons);

          const tryN2Lessons = buildCustomBookLessons("n2-try", "Try! JLPT N2", "N2", TRY_N2_TITLES, data.lessons, 2);
          const tryN2Stats = countBookStats(tryN2Lessons);

          books.push(
            {
              id: "n2-shinkanzen",
              name: "Shinkanzen Master N2 (Chinh phục JLPT N2)",
              level: "N2",
              publisher: "3A Corporation",
              tag: "Chinh phục JLPT",
              icon: "📕",
              description: "Giáo trình cao cấp phân tích ngữ pháp, sắc thái từ vựng và kỹ năng đọc hiểu chuyên sâu kỳ thi JLPT N2.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n2-soumatome",
              name: "Nihongo Soumatome N2 (8 tuần)",
              level: "N2",
              publisher: "ASK Publishing",
              tag: "Trọng tâm JLPT N2",
              icon: "📙",
              description: "Chương trình 8 tuần cô đọng từ vựng học thuật, thành ngữ và mẫu câu phức hợp N2.",
              totalLessons: soumatomeN2Lessons.length,
              totalVocab: soumatomeN2Stats.totalVocab,
              totalGrammar: soumatomeN2Stats.totalGrammar,
              totalKanji: soumatomeN2Stats.totalKanji || 220,
              lessons: soumatomeN2Lessons
            },
            {
              id: "n2-try",
              name: "Try! JLPT N2 (Ngữ pháp văn cảnh)",
              level: "N2",
              publisher: "ASK Publishing",
              tag: "Ngữ pháp văn cảnh",
              icon: "📗",
              description: "Tổng hợp ngữ pháp N2 qua các bài viết tin tức, báo chí và hội thoại trang trọng.",
              totalLessons: tryN2Lessons.length,
              totalVocab: tryN2Stats.totalVocab,
              totalGrammar: tryN2Stats.totalGrammar,
              totalKanji: tryN2Stats.totalKanji || 200,
              lessons: tryN2Lessons
            }
          );
        }

        groups.push({
          level,
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji,
          books,
          lessons: data.lessons
        });
      }
    }

    return groups;
  }

  async getAllCurriculums(): Promise<CurriculumLevelGroup[]> {
    const jaGroups = await this.getCurriculums("ja");
    const enGroups = await this.getCurriculums("en");
    const deGroups = await this.getCurriculums("de");
    return [...jaGroups, ...enGroups, ...deGroups];
  }

  async getLessonById(id: string): Promise<DetailedLesson | null> {
    const decodedId = decodeURIComponent(id);
    const groups = await this.getAllCurriculums();
    for (const group of groups) {
      const foundInMain = group.lessons.find((l) => l.id === id || l.id === decodedId);
      if (foundInMain) return foundInMain;

      if (group.books) {
        for (const book of group.books) {
          const foundInBook = book.lessons.find((l) => l.id === id || l.id === decodedId);
          if (foundInBook) return foundInBook;
        }
      }
    }

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("flashcash-curriculums");
        if (raw) {
          const parsed = JSON.parse(raw);
          const list = parsed.curriculums || [];
          for (const c of list) {
            const foundInUser = c.lessons?.find((l: any) => l.id === id || l.id === decodedId);
            if (foundInUser) return foundInUser;
          }
        }
      } catch (e) {
        console.error("Error searching custom curriculums in getLessonById:", e);
      }
    }

    return null;
  }

  async getLessonsByLevel(level: JLPTLevel): Promise<DetailedLesson[]> {
    const groups = await this.getCurriculums("ja");
    const group = groups.find((g) => g.level === level);
    return group?.lessons || [];
  }
}

export class JsonVocabularyRepository implements IVocabularyRepository {
  async getAllVocabulary(level?: JLPTLevel, lang?: string): Promise<Vocabulary[]> {
    const curriculumRepo = new JsonCurriculumRepository();
    const groups = await curriculumRepo.getCurriculums(lang);
    let result: Vocabulary[] = [];
    const seenIds = new Set<string>();

    groups.forEach((group) => {
      if (!level || group.level === level) {
        group.lessons.forEach((lesson) => {
          lesson.vocabulary?.forEach((v) => {
            if (!seenIds.has(v.id)) {
              seenIds.add(v.id);
              result.push(v);
            }
          });
        });
        group.books?.forEach((book) => {
          book.lessons?.forEach((lesson) => {
            lesson.vocabulary?.forEach((v) => {
              if (!seenIds.has(v.id)) {
                seenIds.add(v.id);
                result.push(v);
              }
            });
          });
        });
      }
    });

    return result;
  }

  async searchVocabulary(query: string, lang?: string): Promise<Vocabulary[]> {
    const all = await this.getAllVocabulary(undefined, lang);
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(
      (v) =>
        v.kanji?.toLowerCase().includes(q) ||
        v.hiragana?.toLowerCase().includes(q) ||
        v.meaning?.toLowerCase().includes(q) ||
        v.onyomi?.toLowerCase().includes(q) ||
        v.phonetic?.toLowerCase().includes(q)
    );
  }
}

export class JsonGrammarRepository implements IGrammarRepository {
  async getAllGrammar(level?: JLPTLevel, lang?: string): Promise<GrammarPoint[]> {
    const curriculumRepo = new JsonCurriculumRepository();
    const groups = await curriculumRepo.getCurriculums(lang);
    let result: GrammarPoint[] = [];
    const seenIds = new Set<string>();

    groups.forEach((group) => {
      if (!level || group.level === level) {
        group.lessons.forEach((lesson) => {
          lesson.grammarPoints?.forEach((g) => {
            if (!seenIds.has(g.id)) {
              seenIds.add(g.id);
              result.push(g);
            }
          });
        });
        group.books?.forEach((book) => {
          book.lessons?.forEach((lesson) => {
            lesson.grammarPoints?.forEach((g) => {
              if (!seenIds.has(g.id)) {
                seenIds.add(g.id);
                result.push(g);
              }
            });
          });
        });
      }
    });

    return result;
  }

  async getGrammarById(id: string): Promise<GrammarPoint | null> {
    const all = await this.getAllGrammar();
    return all.find((g) => g.id === id) || null;
  }

  async searchGrammar(query: string, lang?: string): Promise<GrammarPoint[]> {
    const all = await this.getAllGrammar(undefined, lang);
    const cleanQuery = query.trim();
    if (!cleanQuery) return all;

    const normalize = (str: string = "") =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[～〜~]/g, "")
        .replace(/[\s\u3000\u00a0\t\r\n]+/g, " ")
        .replace(/[・、。，,;；:：\(\)\[\]「」『』]/g, "")
        .trim();

    const q = normalize(cleanQuery);
    if (!q) return all;

    return all.filter((g) => {
      const structNorm = normalize(g.structure);
      const meanNorm = normalize(g.meaning);
      const expNorm = normalize(g.explanation || "");
      const exMatch = g.examples?.some(
        (ex) =>
          normalize(ex.sentence).includes(q) ||
          normalize(ex.meaning).includes(q) ||
          normalize(ex.romaji || "").includes(q)
      );

      return (
        structNorm.includes(q) ||
        meanNorm.includes(q) ||
        expNorm.includes(q) ||
        !!exMatch
      );
    });
  }
}

export class JsonKanjiRepository implements IKanjiRepository {
  async getAllKanji(level?: JLPTLevel): Promise<KanjiItem[]> {
    const data = await fetchJsonData<KanjiItem[]>("/data/kanji-n5-n2.json");
    if (!data) return [];
    if (!level) return data;
    return data.filter((k) => k.level === level);
  }

  async getKanjiByChar(char: string): Promise<KanjiItem | null> {
    const all = await this.getAllKanji();
    return all.find((k) => k.kanji === char) || null;
  }

  async searchKanji(query: string): Promise<KanjiItem[]> {
    const all = await this.getAllKanji();
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(
      (k) =>
        k.kanji.includes(q) ||
        k.hanViet.toLowerCase().includes(q) ||
        k.meaning.toLowerCase().includes(q) ||
        k.onyomi.some((o) => o.toLowerCase().includes(q)) ||
        k.kunyomi.some((ku) => ku.toLowerCase().includes(q))
    );
  }
}
