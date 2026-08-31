import { ShadowingVideo } from "@/types/shadowing";

export const BUILTIN_SHADOWING_VIDEOS: ShadowingVideo[] = [
  {
    id: "ai-programming-strong-reason",
    youtubeId: "V_6TzC9R4yI",
    title: "生成AI時代でも「プログラミングを知っている人」が強い理由",
    originalTitle: "生成AI時代でも「プログラミングを知っている人」が強い理由",
    description: "Khám phá lý do tại sao trong thời đại Generative AI phát triển vượt bậc, những người nắm vững tư duy lập trình và bản chất hệ thống vẫn giữ lợi thế cạnh tranh số 1. Bài học thực tế với ngữ điệu chuẩn người bản xứ và từ vựng công nghệ N2-N1.",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    channelTitle: "キノコード / AI・プログラミング学習チャンネル",
    durationSeconds: 120,
    level: "N2",
    languageCode: "ja",
    category: "technology",
    tags: ["AI", "Programming", "JLPT N2", "Business Tech"],
    subtitles: [
      {
        id: 1,
        startTime: 0.5,
        endTime: 4.8,
        japanese: "生成AIがコードを書いてくれるのに、なぜ自分で学ぶ必要があるの？",
        vietnamese: "AI tạo sinh viết code được rồi, sao còn phải tự học nữa?",
        romaji: "Seisei AI ga kōdo o kaite kureru noni, naze jibun de manabu hitsuyō ga aru no?",
        furiganaTokens: [
          { surface: "生成", reading: "せいせい", isKanji: true, meaning: "Tạo sinh (Generative)" },
          { surface: "AI" },
          { surface: "が" },
          { surface: "コード" },
          { surface: "を" },
          { surface: "書", reading: "か", isKanji: true },
          { surface: "いてくれるのに、" },
          { surface: "なぜ" },
          { surface: "自分", reading: "じぶん", isKanji: true },
          { surface: "で" },
          { surface: "学", reading: "まな", isKanji: true },
          { surface: "ぶ" },
          { surface: "必要", reading: "ひつよう", isKanji: true, meaning: "Sự cần thiết" },
          { surface: "が" },
          { surface: "あるの？" }
        ],
        highlightPhrases: [
          { phrase: "学ぶ必要がある", type: "grammar", meaning: "Cần thiết phải học" },
          { phrase: "〜てくれるのに", type: "grammar", meaning: "Mặc dù ... đã làm cho" }
        ]
      },
      {
        id: 2,
        startTime: 5.2,
        endTime: 9.8,
        japanese: "確かに、AIを使えば簡単なプログラムは一瞬で完成します。",
        vietnamese: "Đúng là nếu dùng AI, những chương trình đơn giản có thể hoàn thành trong nháy mắt.",
        romaji: "Tashikani, AI o tsukaeba kantan na puroguramu wa isshun de kansei shimasu.",
        furiganaTokens: [
          { surface: "確", reading: "たし", isKanji: true },
          { surface: "かに、" },
          { surface: "AI" },
          { surface: "を" },
          { surface: "使", reading: "つか", isKanji: true },
          { surface: "えば" },
          { surface: "簡単", reading: "かんたん", isKanji: true },
          { surface: "な" },
          { surface: "プログラム" },
          { surface: "は" },
          { surface: "一瞬", reading: "いっしゅん", isKanji: true, meaning: "Trong chớp mắt" },
          { surface: "で" },
          { surface: "完成", reading: "かんせい", isKanji: true, meaning: "Hoàn thành" },
          { surface: "します。" }
        ],
        highlightPhrases: [
          { phrase: "一瞬で完成する", type: "key", meaning: "Hoàn thành trong nháy mắt" }
        ]
      },
      {
        id: 3,
        startTime: 10.2,
        endTime: 16.5,
        japanese: "しかし、AIが出力したコードが正しいかどうかを判断するには、基礎知識が不可欠です。",
        vietnamese: "Tuy nhiên, để phán đoán xem đoạn code AI xuất ra có đúng hay không, kiến thức nền tảng là điều không thể thiếu.",
        romaji: "Shikashi, AI ga shutsuryoku shita kōdo ga tadashii ka dō ka o handan suru niwa, kiso chishiki ga fukaketsu desu.",
        furiganaTokens: [
          { surface: "しかし、" },
          { surface: "AI" },
          { surface: "が" },
          { surface: "出力", reading: "しゅつりょく", isKanji: true, meaning: "Xuất ra (Output)" },
          { surface: "した" },
          { surface: "コード" },
          { surface: "が" },
          { surface: "正", reading: "ただ", isKanji: true },
          { surface: "しいかどうかを" },
          { surface: "判断", reading: "はんだん", isKanji: true, meaning: "Phán đoán" },
          { surface: "するには、" },
          { surface: "基礎知識", reading: "きそちしき", isKanji: true, meaning: "Kiến thức cơ bản" },
          { surface: "が" },
          { surface: "不可欠", reading: "ふかけつ", isKanji: true, meaning: "Không thể thiếu" },
          { surface: "です。" }
        ],
        highlightPhrases: [
          { phrase: "〜かどうかを判断する", type: "grammar", meaning: "Phán đoán xem liệu có ... hay không" },
          { phrase: "不可欠", type: "vocabulary", meaning: "Thiết yếu, không thể thiếu" }
        ]
      },
      {
        id: 4,
        startTime: 17.0,
        endTime: 22.8,
        japanese: "エラーが発生したときに原因を特定し、修正できるのは人間だけです。",
        vietnamese: "Khi lỗi phát sinh, chỉ có con người mới có thể xác định nguyên nhân và sửa chữa.",
        romaji: "Erā ga hassei shita toki ni gen'in o tokutei shi, shūsei dekiru no wa ningen dake desu.",
        furiganaTokens: [
          { surface: "エラー" },
          { surface: "が" },
          { surface: "発生", reading: "はっせい", isKanji: true, meaning: "Phát sinh" },
          { surface: "したときに" },
          { surface: "原因", reading: "げんいん", isKanji: true, meaning: "Nguyên nhân" },
          { surface: "を" },
          { surface: "特定", reading: "とくてい", isKanji: true, meaning: "Xác định rõ" },
          { surface: "し、" },
          { surface: "修正", reading: "しゅうせい", isKanji: true, meaning: "Chỉnh sửa (Fix bug)" },
          { surface: "できるのは" },
          { surface: "人間", reading: "にんげん", isKanji: true },
          { surface: "だけです。" }
        ],
        highlightPhrases: [
          { phrase: "原因を特定する", type: "key", meaning: "Xác định nguyên nhân" }
        ]
      },
      {
        id: 5,
        startTime: 23.2,
        endTime: 29.5,
        japanese: "プログラミングの仕組みを理解している人ほど、AIに適切な指示を出せるのです。",
        vietnamese: "Càng là người hiểu rõ cơ chế lập trình, họ càng đưa ra được những chỉ thị (prompt) chuẩn xác cho AI.",
        romaji: "Puroguramingu no shikumi o rikai shite iru hito hodo, AI ni tekisetsu na shiji o daseru no desu.",
        furiganaTokens: [
          { surface: "プログラミング" },
          { surface: "の" },
          { surface: "仕組", reading: "しく", isKanji: true },
          { surface: "みを" },
          { surface: "理解", reading: "りかい", isKanji: true },
          { surface: "している" },
          { surface: "人", reading: "ひと", isKanji: true },
          { surface: "ほど、" },
          { surface: "AI" },
          { surface: "に" },
          { surface: "適切", reading: "てきせつ", isKanji: true, meaning: "Thích hợp, chuẩn xác" },
          { surface: "な" },
          { surface: "指示", reading: "しじ", isKanji: true, meaning: "Chỉ thị, mệnh lệnh" },
          { surface: "を" },
          { surface: "出", reading: "だ", isKanji: true },
          { surface: "せるのです。" }
        ],
        highlightPhrases: [
          { phrase: "〜ほど、〜", type: "grammar", meaning: "Càng ... thì càng ..." },
          { phrase: "適切な指示を出す", type: "key", meaning: "Đưa ra chỉ thị thích hợp" }
        ]
      }
    ]
  },
  {
    id: "nhk-tokyo-marathon-news",
    youtubeId: "kJQP7kiw5Fk",
    title: "【NHK Easy News】東京マラソンに約3万8000人が参加",
    originalTitle: "東京マラソンに約3万8000人が参加",
    description: "Bản tin thời sự tiếng Nhật ngắn, dễ nghe về giải chạy Tokyo Marathon với sự tham gia của vận động viên quốc tế. Thích hợp luyện Shadowing sơ trung cấp N3.",
    thumbnailUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=800&q=80",
    channelTitle: "NHK NEWS WEB EASY",
    durationSeconds: 65,
    level: "N3",
    languageCode: "ja",
    category: "news",
    tags: ["NHK News", "Sports", "JLPT N3"],
    subtitles: [
      {
        id: 1,
        startTime: 0.0,
        endTime: 4.5,
        japanese: "東京都内で、大きなマラソン大会「東京マラソン」が開かれました。",
        vietnamese: "Tại thủ đô Tokyo, giải chạy marathon lớn mang tên \"Tokyo Marathon\" đã được tổ chức.",
        romaji: "Tōkyō-tonai de, ōkina marason taikai 'Tōkyō Marason' ga hirakaremashita.",
        furiganaTokens: [
          { surface: "東京都内", reading: "とうきょうとない", isKanji: true },
          { surface: "で、" },
          { surface: "大", reading: "おお", isKanji: true },
          { surface: "きな" },
          { surface: "マラソン" },
          { surface: "大会", reading: "たいかい", isKanji: true },
          { surface: "「東京マラソン」" },
          { surface: "が" },
          { surface: "開", reading: "ひら", isKanji: true },
          { surface: "かれました。" }
        ],
        highlightPhrases: [{ phrase: "大会が開かれる", type: "grammar", meaning: "Đại hội được tổ chức" }]
      },
      {
        id: 2,
        startTime: 4.8,
        endTime: 9.8,
        japanese: "国内外から集まった約3万8000人のランナーが、春の東京を駆け抜けました。",
        vietnamese: "Khoảng 38.000 vận động viên trong và ngoài nước đã cùng chạy qua các nẻo đường mùa xuân Tokyo.",
        romaji: "Kokunaigai kara atsumatta yaku san-man hassen-nin no rannā ga, haru no Tōkyō o kakenukemashita.",
        furiganaTokens: [
          { surface: "国内外", reading: "こくないがい", isKanji: true },
          { surface: "から" },
          { surface: "集", reading: "あつ", isKanji: true },
          { surface: "まった" },
          { surface: "約", reading: "やく", isKanji: true },
          { surface: "3万8000" },
          { surface: "人", reading: "にん", isKanji: true },
          { surface: "の" },
          { surface: "ランナー" },
          { surface: "が、" },
          { surface: "春", reading: "はる", isKanji: true },
          { surface: "の" },
          { surface: "東京", reading: "とうきょう", isKanji: true },
          { surface: "を" },
          { surface: "駆", reading: "か", isKanji: true },
          { surface: "け" },
          { surface: "抜", reading: "ぬ", isKanji: true },
          { surface: "けました。" }
        ],
        highlightPhrases: [{ phrase: "駆け抜ける", type: "vocabulary", meaning: "Chạy băng qua" }]
      }
    ]
  }
];
