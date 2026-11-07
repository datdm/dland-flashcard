import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildCompleteVerbItem,
  JapaneseVerbItem,
  PRESET_JAPANESE_VERBS,
  VerbGroup,
} from "@/lib/japaneseConjugation";

// Known Group 1 exceptions that end with -iru / -eru in hiragana
const GROUP_1_IRU_ERU_EXCEPTIONS = new Set([
  "かえる", // 帰る
  "はしる", // 走る
  "はいる", // 入る
  "しる",   // 知る
  "きる",   // 切る (when kanji is 切る)
  "いる",   // 要る (when kanji is 要る)
  "へる",   // 減る
  "すべる", // 滑る
  "しゃべる", // 喋る
  "かぎる", // 限る
  "あせる", // 焦る
  "まじる", // 混じる
  "にぎる", // 握る
  "ちる",   // 散る
  "てる",   // 照る
  "ける",   // 蹴る
  "ねじる", // 捻る
  "かじる", // 齧る
  "ومる",
]);

const I_E_ROW_CHARS = new Set([
  "い", "き", "ぎ", "し", "じ", "ち", "ぢ", "に", "ひ", "び", "ぴ", "み", "り",
  "え", "け", "げ", "せ", "ぜ", "て", "で", "ね", "へ", "べ", "ぺ", "め", "れ",
]);

function normalizeAndVerifyGroup(
  kanji: string,
  hiragana: string,
  rawGroup: number
): { group: VerbGroup; isException: boolean; exceptionNote?: string } {
  const k = kanji.trim();
  const h = hiragana.trim();

  // Group 3 check
  if (
    h === "する" ||
    h.endsWith("する") ||
    h === "くる" ||
    k === "来る" ||
    (k.endsWith("来る") && h.endsWith("くる"))
  ) {
    return { group: 3, isException: false };
  }

  if (k === "行く" || h === "いく" || h === "ゆく") {
    return {
      group: 1,
      isException: true,
      exceptionNote:
        "Ngoại lệ Nhóm I: Thể て/た chia thành 行って (いって) / 行った (いった).",
    };
  }

  // If it doesn't end in る, it MUST be Group 1
  if (!h.endsWith("る")) {
    return { group: 1, isException: false };
  }

  // Ends with る: check known exceptions
  const isKiruCut = k === "切る" && h === "きる";
  const isIruNeed = k === "要る" && h === "いる";
  const isKaeruReturn = k === "帰る" && h === "かえる";

  if (
    isKiruCut ||
    isIruNeed ||
    isKaeruReturn ||
    (GROUP_1_IRU_ERU_EXCEPTIONS.has(h) &&
      k !== "着る" &&
      k !== "居る" &&
      k !== "いる" &&
      k !== "変える" &&
      k !== "代える" &&
      k !== "換える")
  ) {
    return {
      group: 1,
      isException: true,
      exceptionNote: `Ngoại lệ Nhóm I: Tuy có âm i/e + る (${h}) nhưng chia theo quy tắc Nhóm I.`,
    };
  }

  // Check vowel before る
  const beforeRu = h.slice(-2, -1);
  if (!I_E_ROW_CHARS.has(beforeRu)) {
    // e.g. わかる, つくる, のる, おわる -> Group 1
    return { group: 1, isException: false };
  }

  // Otherwise trust AI group if 1 or 2, defaulting to 2 for i/e + ru
  const validGroup: VerbGroup = rawGroup === 1 ? 1 : 2;
  return {
    group: validGroup,
    isException: validGroup === 1,
    exceptionNote:
      validGroup === 1
        ? `Ngoại lệ Nhóm I: Kết thúc bằng âm i/e + る nhưng thuộc Nhóm I.`
        : undefined,
  };
}

// Extended backup pool of unique verbs so generation never runs dry or repeats
const EXTENDED_BACKUP_VERBS: Array<{
  kanji: string;
  hiragana: string;
  meaning: string;
  group: VerbGroup;
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  isException?: boolean;
  exceptionNote?: string;
  exampleJa: string;
  exampleReading: string;
  exampleVi: string;
}> = [
  {
    kanji: "飲む",
    hiragana: "のむ",
    meaning: "Uống",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "毎朝コーヒーを飲みます。",
    exampleReading: "まいあさコーヒーをのみます。",
    exampleVi: "Mỗi sáng tôi đều uống cà phê.",
  },
  {
    kanji: "聞く",
    hiragana: "きく",
    meaning: "Nghe, hỏi",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "音楽を聞きながら勉強します。",
    exampleReading: "おんがくをききながらべんきょうします。",
    exampleVi: "Tôi vừa nghe nhạc vừa học bài.",
  },
  {
    kanji: "働く",
    hiragana: "はたらく",
    meaning: "Làm việc, lao động",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "兄は日本の会社で働いています。",
    exampleReading: "あにはにほんのかいしゃではたらいています。",
    exampleVi: "Anh trai tôi đang làm việc tại một công ty Nhật Bản.",
  },
  {
    kanji: "休む",
    hiragana: "やすむ",
    meaning: "Nghỉ ngơi, xin nghỉ",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "熱があるので学校を休みました。",
    exampleReading: "ねつがあるのでがっこうをやすみました。",
    exampleVi: "Vì bị sốt nên tôi đã nghỉ học.",
  },
  {
    kanji: "乗る",
    hiragana: "のる",
    meaning: "Lên tàu/xe",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "毎朝電車に乗って会社へ行きます。",
    exampleReading: "まいあさでんしゃにのってかいしゃへいきます。",
    exampleVi: "Mỗi sáng tôi lên tàu điện đi đến công ty.",
  },
  {
    kanji: "貸す",
    hiragana: "かす",
    meaning: "Cho mượn, cho vay",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "友だちに辞書を貸しました。",
    exampleReading: "ともだちにじしょをかしました。",
    exampleVi: "Tôi đã cho bạn mượn cuốn từ điển.",
  },
  {
    kanji: "借りる",
    hiragana: "かりる",
    meaning: "Mượn, vay",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "図書館で本を3冊借りました。",
    exampleReading: "としょかんでほんをさんさつかりました。",
    exampleVi: "Tôi đã mượn 3 cuốn sách ở thư viện.",
  },
  {
    kanji: "開ける",
    hiragana: "あける",
    meaning: "Mở (cửa, hộp...)",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "暑いので窓を開けてください。",
    exampleReading: "あついのでまどをあけてください。",
    exampleVi: "Vì trời nóng nên xin hãy mở cửa sổ.",
  },
  {
    kanji: "閉める",
    hiragana: "しめる",
    meaning: "Đóng (cửa...)",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "出かける前にドアを閉めました。",
    exampleReading: "でかけるまえにドアをしめました。",
    exampleVi: "Tôi đã đóng cửa trước khi ra ngoài.",
  },
  {
    kanji: "急ぐ",
    hiragana: "いそぐ",
    meaning: "Vội vàng, gấp rút",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "時間がないから急ぎましょう。",
    exampleReading: "じかんがないからいそぎましょう。",
    exampleVi: "Vì không còn thời gian nên chúng ta nhanh lên nào.",
  },
  {
    kanji: "呼ぶ",
    hiragana: "よぶ",
    meaning: "Gọi, mời",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "タクシーを呼んでもらえませんか。",
    exampleReading: "タクシーをよんでもらえませんか。",
    exampleVi: "Bạn gọi giúp tôi chiếc taxi được không?",
  },
  {
    kanji: "運ぶ",
    hiragana: "はこぶ",
    meaning: "Vận chuyển, mang vác",
    group: 1,
    jlptLevel: "N4",
    exampleJa: "重い荷物を部屋まで運びました。",
    exampleReading: "おもいにもつをへやまではこびました。",
    exampleVi: "Tôi đã khiêng hành lý nặng lên tận phòng.",
  },
  {
    kanji: "選ぶ",
    hiragana: "えらぶ",
    meaning: "Lựa chọn",
    group: 1,
    jlptLevel: "N4",
    exampleJa: "好きな色を一つ選んでください。",
    exampleReading: "すきないろをひとつえらんでください。",
    exampleVi: "Hãy chọn một màu mà bạn thích.",
  },
  {
    kanji: "直す",
    hiragana: "なおす",
    meaning: "Sửa chữa, chỉnh sửa",
    group: 1,
    jlptLevel: "N4",
    exampleJa: "壊れた自転車を自分で直しました。",
    exampleReading: "こわれたじてんしゃをじぶんでなおしました。",
    exampleVi: "Tôi đã tự sửa chiếc xe đạp bị hỏng.",
  },
  {
    kanji: "探す",
    hiragana: "さがす",
    meaning: "Tìm kiếm",
    group: 1,
    jlptLevel: "N4",
    exampleJa: "新しいアパートを探しています。",
    exampleReading: "あたらしいアパートをさがしています。",
    exampleVi: "Tôi đang tìm một căn hộ mới.",
  },
  {
    kanji: "調べる",
    hiragana: "しらべる",
    meaning: "Tra cứu, điều tra, kiểm tra",
    group: 2,
    jlptLevel: "N4",
    exampleJa: "わからない言葉を辞書で調べます。",
    exampleReading: "わからないことばをじしょでしらべます。",
    exampleVi: "Tôi tra cứu những từ chưa biết bằng từ điển.",
  },
  {
    kanji: "集める",
    hiragana: "あつめる",
    meaning: "Sưu tầm, tập hợp, thu thập",
    group: 2,
    jlptLevel: "N4",
    exampleJa: "世界中の切手を集めています。",
    exampleReading: "せかいじゅうのきってをあつめています。",
    exampleVi: "Tôi đang sưu tầm tem từ khắp nơi trên thế giới.",
  },
  {
    kanji: "決める",
    hiragana: "きめる",
    meaning: "Quyết định",
    group: 2,
    jlptLevel: "N4",
    exampleJa: "将来の目標を決めました。",
    exampleReading: "しょうらいのもくひょうをきめました。",
    exampleVi: "Tôi đã quyết định mục tiêu tương lai.",
  },
  {
    kanji: "続ける",
    hiragana: "つづける",
    meaning: "Tiếp tục, duy trì",
    group: 2,
    jlptLevel: "N4",
    exampleJa: "毎日少しずつ練習を続けています。",
    exampleReading: "まいにちすこしずつれんしゅうをつづけています。",
    exampleVi: "Tôi vẫn tiếp tục luyện tập từng chút một mỗi ngày.",
  },
  {
    kanji: "予約する",
    hiragana: "よやくする",
    meaning: "Đặt chỗ, đặt trước",
    group: 3,
    jlptLevel: "N4",
    exampleJa: "ホテルをインターネットで予約しました。",
    exampleReading: "ホテルをインターネットでよやくしました。",
    exampleVi: "Tôi đã đặt khách sạn qua mạng Internet.",
  },
  {
    kanji: "案内する",
    hiragana: "あんないする",
    meaning: "Hướng dẫn, dẫn đường",
    group: 3,
    jlptLevel: "N4",
    exampleJa: "京都のお寺を案内してあげます。",
    exampleReading: "きょうとのおてらをあんないしてあげます。",
    exampleVi: "Tôi sẽ dẫn bạn đi tham quan các ngôi chùa ở Kyoto.",
  },
  {
    kanji: "準備する",
    hiragana: "じゅんびする",
    meaning: "Chuẩn bị",
    group: 3,
    jlptLevel: "N4",
    exampleJa: "会議の資料を準備しています。",
    exampleReading: "かいぎのしりょうをじゅんびしています。",
    exampleVi: "Tôi đang chuẩn bị tài liệu cho cuộc họp.",
  },
  {
    kanji: "相談する",
    hiragana: "そうだんする",
    meaning: "Trao đổi, bàn bạc,ปรึกษา",
    group: 3,
    jlptLevel: "N4",
    exampleJa: "両親と相談してから決めます。",
    exampleReading: "りょうしんとそうだんしてからきめます。",
    exampleVi: "Tôi sẽ quyết định sau khi bàn bạc với bố mẹ.",
  },
  {
    kanji: "減る",
    hiragana: "へる",
    meaning: "Giảm xuống, vơi đi",
    group: 1,
    jlptLevel: "N4",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Tuy có âm 「え + る」 (へる) nhưng chia theo Nhóm I (減ります, 減って, 減らない).",
    exampleJa: "最近この町の人口が減っています。",
    exampleReading: "さいきんこのまちのじんこうがへっています。",
    exampleVi: "Dạo gần đây dân số thị trấn này đang giảm.",
  },
  {
    kanji: "滑る",
    hiragana: "すべる",
    meaning: "Trượt (tuyết, chân...)",
    group: 1,
    jlptLevel: "N4",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Tuy có âm 「べ + る」 (すべる) nhưng chia theo Nhóm I (滑ります, 滑って, 滑らない).",
    exampleJa: "雪の日は道が滑りやすいです。",
    exampleReading: "ゆきのひはみちがすべりやすいです。",
    exampleVi: "Vào ngày có tuyết đường rất dễ trơn trượt.",
  },
  {
    kanji: "守る",
    hiragana: "まもる",
    meaning: "Bảo vệ, tuân thủ",
    group: 1,
    jlptLevel: "N3",
    exampleJa: "約束は必ず守らなければなりません。",
    exampleReading: "やくそくはかならずまもらなければなりません。",
    exampleVi: "Nhất định phải giữ lời hứa.",
  },
  {
    kanji: "届く",
    hiragana: "とどく",
    meaning: "Được gửi đến, chạm tới",
    group: 1,
    jlptLevel: "N4",
    exampleJa: "母から荷物が届きました。",
    exampleReading: "ははからにもつがとどきました。",
    exampleVi: "Bưu kiện từ mẹ gửi đã tới nơi.",
  },
  {
    kanji: "比べる",
    hiragana: "くらべる",
    meaning: "So sánh",
    group: 2,
    jlptLevel: "N4",
    exampleJa: "二つのプランを比べてみましょう。",
    exampleReading: "ふたつのプランをくらべてみましょう。",
    exampleVi: "Hãy thử so sánh hai phương án này xem.",
  },
  {
    kanji: "諦める",
    hiragana: "あきらめる",
    meaning: "Từ bỏ, bỏ cuộc",
    group: 2,
    jlptLevel: "N3",
    exampleJa: "最後まで諦めないで頑張ろう。",
    exampleReading: "さいごまであきらめないでがんばろう。",
    exampleVi: "Đừng bỏ cuộc cho đến phút cuối, cùng cố lên nào.",
  },
  {
    kanji: "連絡する",
    hiragana: "れんらくする",
    meaning: "Liên lạc",
    group: 3,
    jlptLevel: "N4",
    exampleJa: "駅に着いたら連絡してください。",
    exampleReading: "えきについたられんらくしてください。",
    exampleVi: "Khi nào tới nhà ga hãy liên lạc với tôi nhé.",
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      count = 6,
      jlptLevel = "ALL",
      groupFilter = "ALL",
      excludeWords = [],
      topic = "",
    } = body;

    const requestedCount = Math.min(Math.max(Number(count) || 6, 1), 15);
    const excludedSet = new Set<string>(
      Array.isArray(excludeWords)
        ? excludeWords.map((w: string) => String(w).trim().toLowerCase())
        : []
    );

    const apiKey = process.env.GEMINI_API_KEY;
    const generatedItems: JapaneseVerbItem[] = [];

    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const excludePreview = Array.from(excludedSet).slice(-120).join(", ");

      const groupInstruction =
        groupFilter === "1"
          ? "CHỈ tạo động từ Nhóm I (五段動詞 - Godan), đa dạng các đuôi う, つ, る, む, ぶ, ぬ, く, ぐ, す và các từ ngoại lệ Nhóm I (-iru/-eru)."
          : groupFilter === "2"
          ? "CHỈ tạo động từ Nhóm II (一段動詞 - Ichidan) kết thúc bằng âm cột i/e + る."
          : groupFilter === "3"
          ? "CHỈ tạo động từ Nhóm III (Bất quy tắc: Danh động từ + する hoặc động từ ghép với 来る)."
          : "Phân bổ đa dạng cả 3 nhóm động từ: Nhóm I (Godan), Nhóm II (Ichidan) và Nhóm III (〜する / 来る).";

      const levelInstruction =
        jlptLevel && jlptLevel !== "ALL"
          ? `Trình độ JLPT ưu tiên: ${jlptLevel}.`
          : "Trình độ JLPT đa dạng từ N5 đến N2.";

      const topicInstruction = topic?.trim()
        ? `Chủ đề ưu tiên: "${topic.trim()}".`
        : "Chủ đề đời sống, công việc, học tập, du lịch, giao tiếp hàng ngày.";

      const randomSeed = Math.floor(Math.random() * 1000000);

      const prompt = `Bạn là chuyên gia ngôn ngữ học và giáo viên luyện thi JLPT tiếng Nhật.
Hãy tạo danh sách ĐÚNG ${requestedCount} động từ tiếng Nhật ở dạng nguyên mẫu (Thể từ điển - 辞書形) để học viên luyện chia 13 thể động từ.
Mã ngẫu nhiên phiên: #${randomSeed}.

YÊU CẦU BẮT BUỘC:
1. ${groupInstruction}
2. ${levelInstruction}
3. ${topicInstruction}
4. TUYỆT ĐỐI KHÔNG TRÙNG LẶP nhau và KHÔNG ĐƯỢC TRÙNG với bất kỳ động từ nào trong danh sách đã xuất hiện sau đây: [${excludePreview || "Chưa có"}].
5. Mỗi động từ phải có đầy đủ:
   - "kanji": Chữ Hán chuẩn ở thể từ điển (VD: " 읽다" -> sai, phải là tiếng Nhật như "選ぶ", "調べる", "約束する").
   - "hiragana": Cách đọc Hiragana đầy đủ ở thể từ điển (VD: "えらぶ", "しらべる", "やくそくする").
   - "meaning": Nghĩa tiếng Việt ngắn gọn, chuẩn xác (VD: "Lựa chọn", "Tra cứu").
   - "group": Số nguyên 1, 2 hoặc 3 (1 = Nhóm I Godan, 2 = Nhóm II Ichidan, 3 = Nhóm III Bất quy tắc). Phân loại nhóm phải chính xác 100%!
   - "jlptLevel": Một trong "N5", "N4", "N3", "N2", "N1".
   - "exampleJa": 1 câu ví dụ tiếng Nhật tự nhiên có sử dụng động từ đó.
   - "exampleReading": Cách đọc câu ví dụ bằng Hiragana.
   - "exampleVi": Nghĩa tiếng Việt của câu ví dụ.

Chỉ trả về JSON hợp lệ theo đúng cấu trúc mảng (không kèm markdown):
[
  {
    "kanji": "選ぶ",
    "hiragana": "えらぶ",
    "meaning": "Lựa chọn",
    "group": 1,
    "jlptLevel": "N4",
    "exampleJa": "好きな色を一つ選んでください。",
    "exampleReading": "すきないろをひとつえらんでください。",
    "exampleVi": "Hãy chọn một màu mà bạn thích."
  }
]`;

      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-3-flash-preview",
        "gemini-3.7-flash",
        "gemini-flash-lite-latest",
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
      ];

      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.85,
            },
          });

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const cleaned = responseText
            .replace(/```json\n?/gi, "")
            .replace(/```\n?/g, "")
            .trim();
          const parsed = JSON.parse(cleaned);
          const rawList = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.verbs)
            ? parsed.verbs
            : [];

          for (const raw of rawList) {
            if (!raw?.kanji || !raw?.hiragana || !raw?.meaning) continue;
            const k = String(raw.kanji).trim();
            const h = String(raw.hiragana).trim();
            const keyK = k.toLowerCase();
            const keyH = h.toLowerCase();
            const comboKey = `${keyK}|${keyH}`;

            if (
              excludedSet.has(keyK) ||
              excludedSet.has(keyH) ||
              excludedSet.has(comboKey)
            ) {
              continue;
            }

            const { group, isException, exceptionNote } = normalizeAndVerifyGroup(
              k,
              h,
              Number(raw.group) || 1
            );

            if (
              groupFilter !== "ALL" &&
              String(group) !== String(groupFilter)
            ) {
              continue;
            }

            const validLevel = ["N5", "N4", "N3", "N2", "N1"].includes(
              String(raw.jlptLevel).toUpperCase()
            )
              ? (String(raw.jlptLevel).toUpperCase() as
                  | "N5"
                  | "N4"
                  | "N3"
                  | "N2"
                  | "N1")
              : "N4";

            const completeVerb = buildCompleteVerbItem({
              id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              kanji: k,
              hiragana: h,
              meaning: String(raw.meaning).trim(),
              group,
              jlptLevel: validLevel,
              isException,
              exceptionNote,
              exampleJa: raw.exampleJa ? String(raw.exampleJa).trim() : undefined,
              exampleReading: raw.exampleReading
                ? String(raw.exampleReading).trim()
                : undefined,
              exampleVi: raw.exampleVi ? String(raw.exampleVi).trim() : undefined,
              source: "ai",
            });

            generatedItems.push(completeVerb);
            excludedSet.add(keyK);
            excludedSet.add(keyH);
            excludedSet.add(comboKey);

            if (generatedItems.length >= requestedCount) break;
          }

          if (generatedItems.length > 0) {
            break;
          }
        } catch (modelErr: any) {
          console.warn(
            `[Conjugation AI] Model ${modelName} failed:`,
            modelErr?.message || modelErr
          );
        }
      }
    }

    // Fill any remaining slots from the extended backup pool (non-duplicate) so the user always gets the full requested count
    if (generatedItems.length < requestedCount) {
      const combinedPool = [
        ...EXTENDED_BACKUP_VERBS,
        ...PRESET_JAPANESE_VERBS.map((v) => ({
          kanji: v.kanji,
          hiragana: v.hiragana,
          meaning: v.meaning,
          group: v.group,
          jlptLevel: v.jlptLevel,
          isException: v.isException,
          exceptionNote: v.exceptionNote,
          exampleJa: v.exampleJa,
          exampleReading: v.exampleReading,
          exampleVi: v.exampleVi,
        })),
      ];

      // Shuffle pool
      const shuffled = [...combinedPool].sort(() => Math.random() - 0.5);

      for (const candidate of shuffled) {
        if (generatedItems.length >= requestedCount) break;

        const keyK = candidate.kanji.toLowerCase();
        const keyH = candidate.hiragana.toLowerCase();
        const comboKey = `${keyK}|${keyH}`;

        if (
          excludedSet.has(keyK) ||
          excludedSet.has(keyH) ||
          excludedSet.has(comboKey)
        ) {
          continue;
        }

        if (
          groupFilter !== "ALL" &&
          String(candidate.group) !== String(groupFilter)
        ) {
          continue;
        }

        if (
          jlptLevel !== "ALL" &&
          candidate.jlptLevel !== jlptLevel &&
          generatedItems.length + 2 < requestedCount
        ) {
          continue;
        }

        const completeVerb = buildCompleteVerbItem({
          id: `ai-backup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          ...candidate,
          source: "ai",
        });

        generatedItems.push(completeVerb);
        excludedSet.add(keyK);
        excludedSet.add(keyH);
        excludedSet.add(comboKey);
      }
    }

    return NextResponse.json({
      verbs: generatedItems,
      totalGenerated: generatedItems.length,
    });
  } catch (error: any) {
    console.error("[Conjugation Generate API Error]:", error);
    return NextResponse.json(
      { error: "Không thể tạo động từ lúc này. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
