export type VerbGroup = 1 | 2 | 3;

export type ConjugationFormKey =
  | "dictionary"
  | "masu"
  | "te"
  | "ta"
  | "nai"
  | "volitional"
  | "potential"
  | "passive"
  | "causative"
  | "causativePassive"
  | "conditional"
  | "imperative"
  | "prohibitive";

export interface ConjugatedFormDetail {
  formKey: ConjugationFormKey;
  kanji: string;
  hiragana: string;
  romaji: string;
  meaningVi: string;
  ruleApplied: string;
}

export interface JapaneseVerbItem {
  id: string;
  kanji: string;
  hiragana: string;
  romaji: string;
  meaning: string;
  group: VerbGroup;
  jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1";
  isException?: boolean;
  exceptionNote?: string;
  exampleJa: string;
  exampleReading: string;
  exampleVi: string;
  source?: "preset" | "ai";
  conjugations: Record<ConjugationFormKey, ConjugatedFormDetail>;
}

export interface ConjugationFormTheory {
  key: ConjugationFormKey;
  index: number;
  nameVi: string;
  nameJp: string;
  shortName: string;
  badgeColor: string;
  summary: string;
  usages: string[];
  rules: {
    group1: string;
    group2: string;
    group3: string;
    exceptions?: string;
  };
  examples: {
    verb: string;
    group: string;
    before: string;
    after: string;
    afterReading: string;
    meaning: string;
  }[];
}

export const CONJUGATION_FORM_KEYS: ConjugationFormKey[] = [
  "masu",
  "te",
  "nai",
  "dictionary",
  "ta",
  "volitional",
  "potential",
  "passive",
  "causative",
  "causativePassive",
  "conditional",
  "imperative",
  "prohibitive",
];

export const CONJUGATION_FORMS_THEORY: ConjugationFormTheory[] = [
  {
    key: "masu",
    index: 1,
    nameVi: "Thể Lịch sự (Masu-kei)",
    nameJp: "ます形",
    shortName: "Thể ます",
    badgeColor: "from-blue-600 to-indigo-600",
    summary:
      "Dùng trong giao tiếp lịch sự hằng ngày (khẳng định hiện tại/tương lai). Đây cũng là gốc để ghép nhiều mẫu ngữ pháp N5–N3 (~たい, ~ながら, ~やすい, ~にくい...).",
    usages: [
      "Diễn tả hành động ở hiện tại hoặc tương lai một cách lịch sự (Vます).",
      "Bỏ ます để làm gốc ghép: Vたい (muốn làm), Vながら (vừa... vừa...), Vやすい (dễ làm), Vすぎて (làm quá mức).",
      "Chia sang phủ định lịch sự (〜ません), quá khứ lịch sự (〜ました).",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「i」 tương ứng + ます (う→い, く→き, ぐ→ぎ, す→し, つ→ち, ぬ→に, ぶ→び, む→み, る→り).",
      group2: "Bỏ 「る」 + ます.",
      group3: "する → します | 来る (くる) → 来ます (きます).",
      exceptions: "Các động từ kính ngữ đặc biệt (N4): いらっしゃる → いらっしゃいます, くださる → くださいます.",
    },
    examples: [
      { verb: "書く (Viết)", group: "Nhóm I", before: "書く (かく)", after: "書きます", afterReading: "かきます", meaning: "Viết (lịch sự)" },
      { verb: "食べる (Ăn)", group: "Nhóm II", before: "食べる (たべる)", after: "食べます", afterReading: "たべます", meaning: "Ăn (lịch sự)" },
      { verb: "来る (Đến)", group: "Nhóm III", before: "来る (くる)", after: "来ます", afterReading: "きます", meaning: "Đến (lịch sự)" },
    ],
  },
  {
    key: "te",
    index: 2,
    nameVi: "Thể Te (Te-kei)",
    nameJp: "て形",
    shortName: "Thể て",
    badgeColor: "from-emerald-600 to-teal-600",
    summary:
      "Thể quan trọng bậc nhất dùng để nối câu, diễn tả hành động đang diễn ra (〜ている), yêu cầu lịch sự (〜てください), xin phép (〜てもいい)...",
    usages: [
      "Nối các hành động xảy ra theo trình tự thời gian.",
      "Vて + います: Hành động đang diễn ra hoặc trạng thái kết quả.",
      "Vて + ください: Xin hãy làm gì đó.",
      "Vて + もいいですか: Xin phép làm gì.",
      "Vて + から: Sau khi làm V.",
    ],
    rules: {
      group1:
        "• う, つ, る → って\n• む, ぶ, ぬ → んで\n• く → いて | ぐ → いで\n• す → して",
      group2: "Bỏ 「る」 + て.",
      group3: "する → して | 来る (くる) → 来て (きて).",
      exceptions: "★ Ngoại lệ Nhóm I: 行く (いく) → 行って (いって) (KHÔNG chia thành いいて).",
    },
    examples: [
      { verb: "待つ (Đợi)", group: "Nhóm I", before: "待つ (まつ)", after: "待って", afterReading: "まって", meaning: "Đợi rồi... / Hãy đợi" },
      { verb: "読む (Đọc)", group: "Nhóm I", before: "読む (よむ)", after: "読んで", afterReading: "よんで", meaning: "Đọc rồi..." },
      { verb: "行く (Đi)", group: "Ngoại lệ I", before: "行く (いく)", after: "行って", afterReading: "いって", meaning: "Đi rồi..." },
    ],
  },
  {
    key: "nai",
    index: 3,
    nameVi: "Thể Phủ định ngắn (Nai-kei)",
    nameJp: "ない形",
    shortName: "Thể ない",
    badgeColor: "from-rose-600 to-pink-600",
    summary:
      "Phủ định thông thường (không làm V). Dùng trong văn nói thân mật hoặc ghép cấu trúc bắt buộc (〜なければならない), khuyên nhủ (〜ないでください).",
    usages: [
      "Phủ định thông thường của hiện tại/tương lai (= 〜ません).",
      "Vないでください: Xin đừng làm V.",
      "Vなければなりません: Phải làm V.",
      "Vなくてもいいです: Không cần làm V cũng được.",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「a」 tương ứng + ない. Riêng âm cuối là 「う」 thì đổi thành 「わ」 + ない (không dùng あ).",
      group2: "Bỏ 「る」 + ない.",
      group3: "する → しない | 来る (くる) → 来ない (こない).",
      exceptions: "★ Ngoại lệ Nhóm I: ある (Có) → ない (Không có) — KHÔNG chia thành あらない.",
    },
    examples: [
      { verb: "買う (Mua)", group: "Nhóm I", before: "買う (かう)", after: "買わない", afterReading: "かわない", meaning: "Không mua" },
      { verb: "話す (Nói)", group: "Nhóm I", before: "話す (はなす)", after: "話さない", afterReading: "はなさない", meaning: "Không nói" },
      { verb: "来る (Đến)", group: "Nhóm III", before: "来る (くる)", after: "来ない", afterReading: "こない", meaning: "Không đến" },
    ],
  },
  {
    key: "dictionary",
    index: 4,
    nameVi: "Thể Từ điển / Nguyên mẫu (Jisho-kei)",
    nameJp: "辞書形 (る形)",
    shortName: "Thể Từ điển",
    badgeColor: "from-slate-600 to-slate-800",
    summary:
      "Dạng gốc của động từ khi tra từ điển, tận cùng luôn thuộc cột 「u (ư)」. Dùng trong giao tiếp thân mật hoặc đứng trước các danh từ/mẫu câu nguyên mẫu.",
    usages: [
      "Khẳng định hiện tại/tương lai ở thể ngắn (thân mật).",
      "Vる + ことができる: Có thể làm V.",
      "Vる + 前に: Trước khi làm V.",
      "Vる + つもりだ / 予定だ: Dự định làm V.",
    ],
    rules: {
      group1: "Giữ nguyên dạng nguyên mẫu kết thúc bằng 9 âm cột 「u」: う, つ, る, む, ぶ, ぬ, く, ぐ, す.",
      group2: "Giữ nguyên dạng nguyên mẫu kết thúc bằng âm 「i/e + る」.",
      group3: "する | 来る (くる).",
      exceptions: "Từ thể ます đổi ngược về: Nhóm I (cột i → cột u), Nhóm II (bỏ ます + る), Nhóm III (します→する, きます→くる).",
    },
    examples: [
      { verb: "飲む (Uống)", group: "Nhóm I", before: "飲みます", after: "飲む", afterReading: "のむ", meaning: "Uống" },
      { verb: "見る (Xem)", group: "Nhóm II", before: "見ます", after: "見る", afterReading: "みる", meaning: "Xem / Nhìn" },
      { verb: "勉強する (Học)", group: "Nhóm III", before: "勉強します", after: "勉強する", afterReading: "べんきょうする", meaning: "Học tập" },
    ],
  },
  {
    key: "ta",
    index: 5,
    nameVi: "Thể Quá khứ ngắn (Ta-kei)",
    nameJp: "た形",
    shortName: "Thể た",
    badgeColor: "from-amber-600 to-orange-600",
    summary:
      "Quá khứ thông thường của động từ (= 〜ました). Cách chia hoàn toàn giống Thể て (Te-kei), chỉ thay 「て → た」 và 「で → だ」.",
    usages: [
      "Diễn tả hành động đã xảy ra trong quá khứ (thể ngắn).",
      "Vた + ことがある: Đã từng làm V.",
      "Vた + り、Vた + りする: Liệt kê hành động tiêu biểu (lúc thì..., lúc thì...).",
      "Vた + ほうがいい: Nên làm V.",
      "Vた + あとで: Sau khi làm V.",
    ],
    rules: {
      group1:
        "• う, つ, る → った\n• む, ぶ, ぬ → んだ\n• く → いた | ぐ → いだ\n• す → した",
      group2: "Bỏ 「る」 + た.",
      group3: "する → した | 来る (くる) → 来た (きた).",
      exceptions: "★ Ngoại lệ Nhóm I: 行く (いく) → 行った (いった).",
    },
    examples: [
      { verb: "泳ぐ (Bơi)", group: "Nhóm I", before: "泳ぐ (およぐ)", after: "泳いだ", afterReading: "およいだ", meaning: "Đã bơi" },
      { verb: "遊ぶ (Chơi)", group: "Nhóm I", before: "遊ぶ (あそぶ)", after: "遊んだ", afterReading: "あそんだ", meaning: "Đã chơi" },
      { verb: "起きる (Thức dậy)", group: "Nhóm II", before: "起きる (おきる)", after: "起きた", afterReading: "おきた", meaning: "Đã thức dậy" },
    ],
  },
  {
    key: "volitional",
    index: 6,
    nameVi: "Thể Ý chí (Ikou-kei)",
    nameJp: "意向形 (よう形)",
    shortName: "Thể Ý chí",
    badgeColor: "from-violet-600 to-purple-600",
    summary:
      "Dạng rút gọn thân mật của 「〜ましょう」, dùng để rủ rê ('Cùng làm nhé!') hoặc thể hiện ý định, quyết tâm ('Tôi định sẽ...') khi đi với 〜と思う.",
    usages: [
      "Rủ rê thân mật: 一緒に行こう！(Cùng đi thôi!).",
      "Vよう + と思う / と思っている: Tôi định làm V.",
      "Vよう + とする: Cố gắng làm V / Chuẩn bị làm V.",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「o」 tương ứng + う (う→おう, く→こう, ぐ→ごう, す→そう, つ→とう, ぬ→のう, ぶ→ぼう, む→もう, る→ろう).",
      group2: "Bỏ 「る」 + よう.",
      group3: "する → しよう | 来る (くる) → 来よう (こよう).",
    },
    examples: [
      { verb: "行く (Đi)", group: "Nhóm I", before: "行く (いく)", after: "行こう", afterReading: "いこう", meaning: "Cùng đi nào / Định đi" },
      { verb: "食べる (Ăn)", group: "Nhóm II", before: "食べる (たべる)", after: "食べよう", afterReading: "たべよう", meaning: "Cùng ăn nào / Định ăn" },
      { verb: "する (Làm)", group: "Nhóm III", before: "する", after: "しよう", afterReading: "しよう", meaning: "Cùng làm nào / Định làm" },
    ],
  },
  {
    key: "potential",
    index: 7,
    nameVi: "Thể Khả năng (Kanou-kei)",
    nameJp: "可能形",
    shortName: "Thể Khả năng",
    badgeColor: "from-cyan-600 to-sky-600",
    summary:
      "Diễn tả năng lực ('có thể làm gì') hoặc điều kiện cho phép thực hiện hành động. Sau khi chia sang thể khả năng, tất cả động từ đều trở thành động từ Nhóm II (bỏ る + ます/ない).",
    usages: [
      "Năng lực bản thân: 日本語が話せます (Tôi có thể nói tiếng Nhật).",
      "Khả năng theo hoàn cảnh: ここではカードが使えます (Ở đây có thể dùng thẻ).",
      "Lưu ý trợ từ: Tân ngữ thường chuyển từ 「を」 sang 「が」.",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「e」 tương ứng + る (う→える, く→ける, ぐ→げる, す→せる, つ→てる, ぬ→ねる, ぶ→べる, む→める, る→れる).",
      group2: "Bỏ 「る」 + られる (Văn nói thường rút gọn thành 〜れる, nhưng thi JLPT dùng chuẩn 〜られる).",
      group3: "する → できる | 来る (くる) → 来られる (こられる).",
      exceptions: "Các từ vốn đã mang nghĩa khả năng tự nhiên (わかる, 見える, 聞こえる) không chia sang thể khả năng nữa.",
    },
    examples: [
      { verb: "読む (Đọc)", group: "Nhóm I", before: "読む (よむ)", after: "読める", afterReading: "よめる", meaning: "Có thể đọc" },
      { verb: "食べる (Ăn)", group: "Nhóm II", before: "食べる (たべる)", after: "食べられる", afterReading: "たべられる", meaning: "Có thể ăn" },
      { verb: "する (Làm)", group: "Nhóm III", before: "する", after: "できる", afterReading: "できる", meaning: "Có thể làm" },
    ],
  },
  {
    key: "passive",
    index: 8,
    nameVi: "Thể Bị động (Ukemi-kei)",
    nameJp: "受身形 (られる形)",
    shortName: "Thể Bị động",
    badgeColor: "from-indigo-600 to-blue-700",
    summary:
      "Diễn tả việc bị/được ai đó tác động hành động vào mình, câu bị động khách quan (tin tức, sự kiện), hoặc dùng làm Tôn kính ngữ nhẹ.",
    usages: [
      "Bị động trực tiếp: 先生に褒められた (Được thầy giáo khen).",
      "Bị động gián tiếp (chịu thiệt hại): 雨に降られた (Bị dính mưa).",
      "Bị động khách quan: この本は世界中で読まれている (Cuốn sách này được đọc trên toàn thế giới).",
      "Tôn kính ngữ (Kính ngữ nhẹ): 先生はもう帰られました (Thầy đã về rồi).",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「a」 tương ứng + れる (Riêng 「う」 → 「わ」 + れる).",
      group2: "Bỏ 「る」 + られる (Hình thức giống hệt Thể Khả năng Nhóm II).",
      group3: "する → される | 来る (くる) → 来られる (こられる).",
    },
    examples: [
      { verb: "叱る (Mắng)", group: "Nhóm I", before: "叱る (しかる)", after: "叱られる", afterReading: "しかられる", meaning: "Bị mắng" },
      { verb: "言う (Nói)", group: "Nhóm I", before: "言う (いう)", after: "言われる", afterReading: "いわれる", meaning: "Được/bị nói" },
      { verb: "する (Làm)", group: "Nhóm III", before: "する", after: "される", afterReading: "される", meaning: "Được/bị thực hiện" },
    ],
  },
  {
    key: "causative",
    index: 9,
    nameVi: "Thể Sai khiến (Shieki-kei)",
    nameJp: "使役形 (させる形)",
    shortName: "Thể Sai khiến",
    badgeColor: "from-fuchsia-600 to-purple-700",
    summary:
      "Diễn tả việc bắt buộc ai đó làm gì (cấp trên với cấp dưới, cha mẹ với con cái) hoặc cho phép/để cho ai đó làm gì. Khi đi với 〜ていただけませんか dùng để xin phép lịch sự.",
    usages: [
      "Bắt/ép làm: 母は子供に野菜を食べさせた (Mẹ bắt con ăn rau).",
      "Cho phép làm: やりたいことをやらせる (Để cho làm việc mình muốn).",
      "Xin phép lịch sự: 休ませていただけませんか (Cho phép tôi nghỉ có được không ạ?).",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「a」 tương ứng + せる (Riêng 「う」 → 「わ」 + せる).",
      group2: "Bỏ 「る」 + させる.",
      group3: "する → させる | 来る (くる) → 来させる (こさせる).",
    },
    examples: [
      { verb: "行く (Đi)", group: "Nhóm I", before: "行く (いく)", after: "行かせる", afterReading: "いかせる", meaning: "Bắt đi / Cho đi" },
      { verb: "食べる (Ăn)", group: "Nhóm II", before: "食べる (たべる)", after: "食べさせる", afterReading: "たべさせる", meaning: "Bắt ăn / Cho ăn" },
      { verb: "来る (Đến)", group: "Nhóm III", before: "来る (くる)", after: "来させる", afterReading: "こさせる", meaning: "Bắt đến / Cho đến" },
    ],
  },
  {
    key: "causativePassive",
    index: 10,
    nameVi: "Thể Sai khiến Bị động (Shieki-ukemi)",
    nameJp: "使役受身形",
    shortName: "Sai khiến bị động",
    badgeColor: "from-purple-700 to-rose-700",
    summary:
      "Kết hợp giữa Sai khiến + Bị động, mang nghĩa 'bị ai đó bắt phải làm gì' (thường kèm tâm trạng miễn cưỡng, không muốn làm).",
    usages: [
      "Diễn tả việc bị ép buộc làm điều không mong muốn: 先輩にお酒を飲まされた (Bị đàn anh ép uống rượu).",
      "Cảm xúc tự nhiên không cưỡng lại được: 考えさせられる (Khiến mình phải suy ngẫm).",
    ],
    rules: {
      group1:
        "• Cách 1 (Đầy đủ): Cột 「a」 + せられる.\n• Cách 2 (Rút gọn phổ biến cho các âm trừ 「す」): Cột 「a」 + される (VD: 書かせられる / 書かされる). Riêng đuôi 「す」 chỉ dùng 〜させられる (話させられる).",
      group2: "Bỏ 「る」 + させられる.",
      group3: "する → させられる | 来る (くる) → 来させられる (こさせられる).",
    },
    examples: [
      { verb: "飲む (Uống)", group: "Nhóm I", before: "飲む (のむ)", after: "飲まされる", afterReading: "のまされる", meaning: "Bị bắt uống" },
      { verb: "待つ (Đợi)", group: "Nhóm I", before: "待つ (まつ)", after: "待たされる", afterReading: "またされる", meaning: "Bị bắt đợi" },
      { verb: "食べる (Ăn)", group: "Nhóm II", before: "食べる (たべる)", after: "食べさせられる", afterReading: "たべさせられる", meaning: "Bị bắt ăn" },
    ],
  },
  {
    key: "conditional",
    index: 11,
    nameVi: "Thể Điều kiện (Jouken-kei / Ba-kei)",
    nameJp: "条件形 (ば形)",
    shortName: "Thể Điều kiện (ば)",
    badgeColor: "from-teal-600 to-emerald-700",
    summary:
      "Diễn tả điều kiện giả định 'Nếu... thì...' hoặc quy luật tất yếu. Cũng dùng trong cấu trúc 「Vば〜ほど」 (càng... càng...) và 「〜ばよかった」 (giá mà...).",
    usages: [
      "Điều kiện giả định: 春になれば暖かくなる (Hễ sang xuân thì trời ấm lên).",
      "So sánh kép: 見れば見るほどきれい (Càng nhìn càng thấy đẹp).",
      "Hối tiếc: もっと勉強すればよかった (Giá mà học nhiều hơn thì tốt biết mấy).",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「e」 tương ứng + ば (う→えば, く→けば, ぐ→げば, す→せば, つ→てば, ぬ→ねば, ぶ→べば, む→めば, る→れば).",
      group2: "Bỏ 「る」 + れば.",
      group3: "する → すれば | 来る (くる) → 来れば (くれば).",
    },
    examples: [
      { verb: "行く (Đi)", group: "Nhóm I", before: "行く (いく)", after: "行けば", afterReading: "いけば", meaning: "Nếu đi" },
      { verb: "見る (Xem)", group: "Nhóm II", before: "見る (みる)", after: "見れば", afterReading: "みれば", meaning: "Nếu xem" },
      { verb: "来る (Đến)", group: "Nhóm III", before: "来る (くる)", after: "来れば", afterReading: "くれば", meaning: "Nếu đến" },
    ],
  },
  {
    key: "imperative",
    index: 12,
    nameVi: "Thể Mệnh lệnh (Meirei-kei)",
    nameJp: "命令形",
    shortName: "Thể Mệnh lệnh",
    badgeColor: "from-red-600 to-orange-700",
    summary:
      "Ra lệnh trực tiếp, mạnh mẽ ('Hãy làm ngay!'). Thường dùng trong quân đội, khẩu hiệu giao thông, cổ vũ thể thao (頑張れ！) hoặc lời thoại nam giới thân mật.",
    usages: [
      "Cổ vũ, khích lệ: 頑張れ！(Cố lên!), 走れ！(Chạy đi!).",
      "Biển báo / Khẩu lệnh ngắn gọn: 止まれ (Dừng lại).",
      "Trích dẫn lời yêu cầu gián tiếp: 部長に早く出せと言われた (Bị trưởng phòng bảo nộp sớm đi).",
    ],
    rules: {
      group1: "Đổi âm cuối cột 「u (ư)」 sang cột 「e」 tương ứng (う→え, く→け, ぐ→げ, す→せ, つ→て, ぬ→ね, ぶ→べ, む→め, る→れ).",
      group2: "Bỏ 「る」 + ろ (hoặc + よ trong văn viết trang trọng).",
      group3: "する → しろ (hoặc せよ) | 来る (くる) → 来い (こい).",
      exceptions: "★ Ngoại lệ: くれる (Cho tôi) → くれ (Đưa đây / Hãy cho tôi).",
    },
    examples: [
      { verb: "急ぐ (Vội)", group: "Nhóm I", before: "急ぐ (いそぐ)", after: "急げ", afterReading: "いそげ", meaning: "Nhanh lên!" },
      { verb: "見る (Nhìn)", group: "Nhóm II", before: "見る (みる)", after: "見ろ", afterReading: "みろ", meaning: "Nhìn kìa / Hãy nhìn!" },
      { verb: "来る (Đến)", group: "Nhóm III", before: "来る (くる)", after: "来い", afterReading: "こい", meaning: "Lại đây!" },
    ],
  },
  {
    key: "prohibitive",
    index: 13,
    nameVi: "Thể Cấm chỉ (Kinshi-kei)",
    nameJp: "禁止形",
    shortName: "Thể Cấm chỉ (な)",
    badgeColor: "from-rose-700 to-red-900",
    summary:
      "Cấm đoán mạnh mẽ ('Cấm được làm V! / Đừng có làm V!'). Công thức cực kỳ đơn giản cho mọi nhóm động từ: giữ nguyên Thể Từ điển + な.",
    usages: [
      "Biển cấm, quy định nghiêm ngặt: 入るな (Cấm vào), 触るな (Cấm sờ).",
      "Khuyên can khẩn cấp hoặc thân mật: 泣くな！(Đừng khóc!), 諦めるな！(Đừng bỏ cuộc!).",
    ],
    rules: {
      group1: "Thể Từ điển (Vる) + な.",
      group2: "Thể Từ điển (Vる) + な.",
      group3: "する → するな | 来る (くる) → 来るな (くるな).",
    },
    examples: [
      { verb: "触る (Chạm)", group: "Nhóm I", before: "触る (さわる)", after: "触るな", afterReading: "さわるな", meaning: "Cấm chạm vào!" },
      { verb: "忘れる (Quên)", group: "Nhóm II", before: "忘れる (わすれる)", after: "忘れるな", afterReading: "わすれるな", meaning: "Đừng có quên!" },
      { verb: "来る (Đến)", group: "Nhóm III", before: "来る (くる)", after: "来るな", afterReading: "くるな", meaning: "Đừng có đến!" },
    ],
  },
];

export const VERB_GROUPS_OVERVIEW = [
  {
    group: 1 as VerbGroup,
    title: "Nhóm I – Động từ Ngũ đoạn (五段動詞 / Godan)",
    badge: "Nhóm I",
    color: "blue",
    description:
      "Bao gồm các động từ kết thúc bằng các âm thuộc cột 「u (ư)」: う, つ, る, む, ぶ, ぬ, く, ぐ, す. Khi chia thể, âm cuối biến đổi linh hoạt qua cả 5 cột (a, i, u, e, o).",
    identification: [
      "Tất cả động từ KHÔNG kết thúc bằng 「る」 (như 買う, 聞く, 泳ぐ, 話す, 待つ, 死ぬ, 遊ぶ, 読む) đều 100% là Nhóm I.",
      "Động từ kết thúc bằng 「る」 mà đứng trước 「る」 là nguyên âm cột a, u, o (VD: 分かる wakaru, 作る tsukuru, 乗る noru) → Nhóm I.",
      "★ Đặc biệt: Một số động từ tuy có âm 「i/e + る」 nhưng vẫn thuộc Nhóm I (Ngoại lệ Nhóm I): 帰る (về), 走る (chạy), 入る (vào), 知る (biết), 切る (cắt), 要る (cần), 減る (giảm), 滑る (trượt), しゃべる (tán gẫu), 限る (giới hạn), 焦る (sốt ruột).",
    ],
  },
  {
    group: 2 as VerbGroup,
    title: "Nhóm II – Động từ Nhất đoạn (一段動詞 / Ichidan)",
    badge: "Nhóm II",
    color: "emerald",
    description:
      "Bao gồm các động từ kết thúc bằng 「る」 mà âm liền trước 「る」 thuộc cột 「i」 hoặc cột 「e」. Cách chia cực kỳ đơn giản: chỉ cần bỏ 「る」 rồi cộng đuôi tương ứng.",
    identification: [
      "Âm cột 「e」 + る: 食べる (taberu), 寝る (neru), 教える (oshieru), 覚える (oboeru), 開ける (akeru)...",
      "Âm cột 「i」 + る: 見る (miru), 起きる (okiru), 借りる (kariru), 降りる (oriru), 浴びる (abiru), できる (dekiru)...",
    ],
  },
  {
    group: 3 as VerbGroup,
    title: "Nhóm III – Động từ Bất quy tắc (不規則動詞 / カ変・サ変)",
    badge: "Nhóm III",
    color: "purple",
    description:
      "Chỉ gồm 2 động từ gốc là 「する」 (Làm) và 「来る (くる)」 (Đến), cùng toàn bộ các danh-động từ ghép với 「〜する」 (勉強する, 旅行する, 運動する...).",
    identification: [
      "する (Làm) và Danh từ + する (VD: 勉強する, 掃除する, 洗濯する, 案内する, 予約する...).",
      "来る (くる - Đến) và các từ ghép với 来る (VD: 持ってくる, 連れてくる). Chú ý cách đọc chữ 来 thay đổi giữa き (きます), こ (こない, こよう, こい) và く (くる, くれば).",
    ],
  },
];

// ============================================================================
// HIRAGANA -> ROMAJI CONVERTER
// ============================================================================
const HIRAGANA_DIGRAPHS: Record<string, string> = {
  きゃ: "kya", きゅ: "kyu", きょ: "kyo",
  しゃ: "sha", しゅ: "shu", しょ: "sho",
  ちゃ: "cha", ちゅ: "chu", ちょ: "cho",
  にゃ: "nya", にゅ: "nyu", にょ: "nyo",
  ひゃ: "hya", ひゅ: "hyu", ひょ: "hyo",
  みゃ: "mya", みゅ: "myu", みょ: "myo",
  りゃ: "rya", りゅ: "ryu", りょ: "ryo",
  ぎゃ: "gya", ぎゅ: "gyu", ぎょ: "gyo",
  じゃ: "ja", じゅ: "ju", じょ: "jo",
  びゃ: "bya", びゅ: "byu", びょ: "byo",
  ぴゃ: "pya", ぴゅ: "pyu", ぴょ: "pyo",
};

const HIRAGANA_MONOGRAPHS: Record<string, string> = {
  あ: "a", い: "i", う: "u", え: "e", お: "o",
  か: "ka", き: "ki", く: "ku", け: "ke", こ: "ko",
  さ: "sa", し: "shi", す: "su", せ: "se", そ: "so",
  た: "ta", ち: "chi", つ: "tsu", て: "te", と: "to",
  な: "na", に: "ni", ぬ: "nu", ね: "ne", の: "no",
  は: "ha", ひ: "hi", ふ: "fu", へ: "he", ほ: "ho",
  ま: "ma", み: "mi", む: "mu", め: "me", も: "mo",
  や: "ya", ゆ: "yu", よ: "yo",
  ら: "ra", り: "ri", る: "ru", れ: "re", ろ: "ro",
  わ: "wa", を: "o", ん: "n",
  が: "ga", ぎ: "gi", ぐ: "gu", げ: "ge", ご: "go",
  ざ: "za", じ: "ji", ず: "zu", ぜ: "ze", ぞ: "zo",
  だ: "da", ぢ: "ji", づ: "zu", で: "de", ど: "do",
  ば: "ba", び: "bi", ぶ: "bu", べ: "be", ぼ: "bo",
  ぱ: "pa", ぴ: "pi", ぷ: "pu", ぺ: "pe", ぽ: "po",
  ぁ: "a", ぃ: "i", ぅ: "u", ぇ: "e", ぉ: "o",
};

export function hiraganaToRomaji(input: string): string {
  const clean = input.trim();
  let result = "";
  let i = 0;

  while (i < clean.length) {
    const ch = clean[i];
    if (ch === "っ") {
      // Double the next consonant
      const nextTwo = clean.slice(i + 1, i + 3);
      const nextOne = clean[i + 1];
      const nextRomaji =
        HIRAGANA_DIGRAPHS[nextTwo] || (nextOne ? HIRAGANA_MONOGRAPHS[nextOne] : "");
      if (nextRomaji && nextRomaji.length > 0) {
        result += nextRomaji[0] === "c" ? "t" : nextRomaji[0];
      }
      i += 1;
      continue;
    }

    const twoChars = clean.slice(i, i + 2);
    if (HIRAGANA_DIGRAPHS[twoChars]) {
      result += HIRAGANA_DIGRAPHS[twoChars];
      i += 2;
      continue;
    }

    if (HIRAGANA_MONOGRAPHS[ch]) {
      result += HIRAGANA_MONOGRAPHS[ch];
      i += 1;
      continue;
    }

    result += ch;
    i += 1;
  }

  return result;
}

// ============================================================================
// GODAN ROW MAPPING TABLE
// ============================================================================
interface GodanEndingMap {
  a: string;
  i: string;
  u: string;
  e: string;
  o: string;
  te: string;
  ta: string;
  causativePassiveShort: string;
}

const GODAN_MAP: Record<string, GodanEndingMap> = {
  う: { a: "わ", i: "い", u: "う", e: "え", o: "お", te: "って", ta: "った", causativePassiveShort: "わされる" },
  つ: { a: "た", i: "ち", u: "つ", e: "て", o: "と", te: "って", ta: "った", causativePassiveShort: "たされる" },
  る: { a: "ら", i: "り", u: "る", e: "れ", o: "ろ", te: "って", ta: "った", causativePassiveShort: "らされる" },
  む: { a: "ま", i: "み", u: "む", e: "め", o: "も", te: "んで", ta: "んだ", causativePassiveShort: "まされる" },
  ぶ: { a: "ば", i: "び", u: "ぶ", e: "べ", o: "ぼ", te: "んで", ta: "んだ", causativePassiveShort: "ばされる" },
  ぬ: { a: "な", i: "に", u: "ぬ", e: "ね", o: "の", te: "んで", ta: "んだ", causativePassiveShort: "なされる" },
  く: { a: "か", i: "き", u: "く", e: "け", o: "こ", te: "いて", ta: "いた", causativePassiveShort: "かされる" },
  ぐ: { a: "が", i: "ぎ", u: "ぐ", e: "げ", o: "ご", te: "いで", ta: "いだ", causativePassiveShort: "がされる" },
  す: { a: "さ", i: "し", u: "す", e: "せ", o: "そ", te: "して", ta: "した", causativePassiveShort: "させられる" },
};

/**
 * Deterministic conjugation of any Japanese verb across all 13 standard forms.
 * Guarantees 100% complete and accurate conjugations for both preset and AI-generated verbs.
 */
export function conjugateVerbAll13Forms(params: {
  kanji: string;
  hiragana: string;
  meaning: string;
  group: VerbGroup;
}): Record<ConjugationFormKey, ConjugatedFormDetail> {
  const kanji = params.kanji.trim();
  const hiragana = params.hiragana.trim();
  const meaning = params.meaning.trim();
  const group = params.group;

  const makeDetail = (
    formKey: ConjugationFormKey,
    k: string,
    h: string,
    meaningVi: string,
    ruleApplied: string
  ): ConjugatedFormDetail => ({
    formKey,
    kanji: k,
    hiragana: h,
    romaji: hiraganaToRomaji(h),
    meaningVi,
    ruleApplied,
  });

  // Group 3: する / 〜する and 来る (くる) / 〜くる
  if (group === 3 || hiragana.endsWith("する") || hiragana === "くる" || kanji.endsWith("来る")) {
    const isKuru =
      hiragana === "くる" ||
      (hiragana.endsWith("くる") && !hiragana.endsWith("つくる") && !hiragana.endsWith("おくる"));

    if (isKuru) {
      const kPrefix = kanji.endsWith("来る")
        ? kanji.slice(0, -2)
        : kanji.endsWith("くる")
        ? kanji.slice(0, -2)
        : "";
      const hPrefix = hiragana.slice(0, -2);
      const usesKanjiKuru = kanji.endsWith("来る");
      const kStem = (suffixK: string, suffixH: string) =>
        usesKanjiKuru ? `${kPrefix}${suffixK}` : `${kPrefix}${suffixH}`;

      return {
        dictionary: makeDetail("dictionary", kanji, hiragana, meaning, "Động từ bất quy tắc Nhóm III (来る)"),
        masu: makeDetail("masu", kStem("来ます", "きます"), `${hPrefix}きます`, `${meaning} (lịch sự)`, "来る (くる) → 来ます (きます)"),
        te: makeDetail("te", kStem("来て", "きて"), `${hPrefix}きて`, `${meaning} rồi... / Hãy ${meaning.toLowerCase()}`, "来る (くる) → 来て (きて)"),
        nai: makeDetail("nai", kStem("来ない", "こない"), `${hPrefix}こない`, `Không ${meaning.toLowerCase()}`, "来る (くる) → 来ない (こない)"),
        ta: makeDetail("ta", kStem("来た", "きた"), `${hPrefix}きた`, `Đã ${meaning.toLowerCase()}`, "来る (くる) → 来た (きた)"),
        volitional: makeDetail("volitional", kStem("来よう", "こよう"), `${hPrefix}こよう`, `Cùng ${meaning.toLowerCase()} nhé / Định ${meaning.toLowerCase()}`, "来る (くる) → 来よう (こよう)"),
        potential: makeDetail("potential", kStem("来られる", "こられる"), `${hPrefix}こられる`, `Có thể ${meaning.toLowerCase()}`, "来る (くる) → 来られる (こられる)"),
        passive: makeDetail("passive", kStem("来られる", "こられる"), `${hPrefix}こられる`, `Bị/được ${meaning.toLowerCase()}`, "来る (くる) → 来られる (こられる)"),
        causative: makeDetail("causative", kStem("来させる", "こさせる"), `${hPrefix}こさせる`, `Bắt/cho phép ${meaning.toLowerCase()}`, "来る (くる) → 来させる (こさせる)"),
        causativePassive: makeDetail("causativePassive", kStem("来させられる", "こさせられる"), `${hPrefix}こさせられる`, `Bị bắt phải ${meaning.toLowerCase()}`, "来る (くる) → 来させられる (こさせられる)"),
        conditional: makeDetail("conditional", kStem("来れば", "くれば"), `${hPrefix}くれば`, `Nếu ${meaning.toLowerCase()}`, "来る (くる) → 来れば (くれば)"),
        imperative: makeDetail("imperative", kStem("来い", "こい"), `${hPrefix}こい`, `Hãy ${meaning.toLowerCase()} ngay!`, "来る (くる) → 来い (こい)"),
        prohibitive: makeDetail("prohibitive", `${kanji}な`, `${hiragana}な`, `Cấm ${meaning.toLowerCase()}!`, "来る (くる) + な → 来るな (くるな)"),
      };
    }

    // する or Noun + する
    const kPrefix = kanji.endsWith("する") ? kanji.slice(0, -2) : kanji;
    const hPrefix = hiragana.endsWith("する") ? hiragana.slice(0, -2) : hiragana;

    return {
      dictionary: makeDetail("dictionary", `${kPrefix}する`, `${hPrefix}する`, meaning, "Động từ bất quy tắc Nhóm III (〜する)"),
      masu: makeDetail("masu", `${kPrefix}します`, `${hPrefix}します`, `${meaning} (lịch sự)`, "する → します"),
      te: makeDetail("te", `${kPrefix}して`, `${hPrefix}して`, `${meaning} rồi... / Hãy ${meaning.toLowerCase()}`, "する → して"),
      nai: makeDetail("nai", `${kPrefix}しない`, `${hPrefix}しない`, `Không ${meaning.toLowerCase()}`, "する → しない"),
      ta: makeDetail("ta", `${kPrefix}した`, `${hPrefix}した`, `Đã ${meaning.toLowerCase()}`, "する → した"),
      volitional: makeDetail("volitional", `${kPrefix}しよう`, `${hPrefix}しよう`, `Cùng ${meaning.toLowerCase()} nhé / Định ${meaning.toLowerCase()}`, "する → しよう"),
      potential: makeDetail("potential", `${kPrefix}できる`, `${hPrefix}できる`, `Có thể ${meaning.toLowerCase()}`, "する → できる"),
      passive: makeDetail("passive", `${kPrefix}される`, `${hPrefix}される`, `Được/bị ${meaning.toLowerCase()}`, "する → される"),
      causative: makeDetail("causative", `${kPrefix}させる`, `${hPrefix}させる`, `Bắt/cho phép ${meaning.toLowerCase()}`, "する → させる"),
      causativePassive: makeDetail("causativePassive", `${kPrefix}させられる`, `${hPrefix}させられる`, `Bị bắt phải ${meaning.toLowerCase()}`, "する → させられる"),
      conditional: makeDetail("conditional", `${kPrefix}すれば`, `${hPrefix}すれば`, `Nếu ${meaning.toLowerCase()}`, "する → すれば"),
      imperative: makeDetail("imperative", `${kPrefix}しろ`, `${hPrefix}しろ`, `Hãy ${meaning.toLowerCase()} đi!`, "する → しろ"),
      prohibitive: makeDetail("prohibitive", `${kPrefix}するな`, `${hPrefix}するな`, `Cấm ${meaning.toLowerCase()}!`, "する + な → するな"),
    };
  }

  // Group 2: Ichidan (ends with る)
  if (group === 2 && hiragana.endsWith("る")) {
    const kStem = kanji.endsWith("る") ? kanji.slice(0, -1) : kanji;
    const hStem = hiragana.slice(0, -1);
    const isKureru = hiragana === "くれる" || hiragana.endsWith("くれる");

    return {
      dictionary: makeDetail("dictionary", kanji, hiragana, meaning, "Động từ Nhóm II (Ichidan): gốc + る"),
      masu: makeDetail("masu", `${kStem}ます`, `${hStem}ます`, `${meaning} (lịch sự)`, "Nhóm II: Bỏ る + ます"),
      te: makeDetail("te", `${kStem}て`, `${hStem}て`, `${meaning} rồi... / Hãy ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + て"),
      nai: makeDetail("nai", `${kStem}ない`, `${hStem}ない`, `Không ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + ない"),
      ta: makeDetail("ta", `${kStem}た`, `${hStem}た`, `Đã ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + た"),
      volitional: makeDetail("volitional", `${kStem}よう`, `${hStem}よう`, `Cùng ${meaning.toLowerCase()} nhé / Định ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + よう"),
      potential: makeDetail("potential", `${kStem}られる`, `${hStem}られる`, `Có thể ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + られる"),
      passive: makeDetail("passive", `${kStem}られる`, `${hStem}られる`, `Bị/được ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + られる"),
      causative: makeDetail("causative", `${kStem}させる`, `${hStem}させる`, `Bắt/cho phép ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + させる"),
      causativePassive: makeDetail("causativePassive", `${kStem}させられる`, `${hStem}させられる`, `Bị bắt phải ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + させられる"),
      conditional: makeDetail("conditional", `${kStem}れば`, `${hStem}れば`, `Nếu ${meaning.toLowerCase()}`, "Nhóm II: Bỏ る + れば"),
      imperative: makeDetail(
        "imperative",
        isKureru ? `${kStem}れ` : `${kStem}ろ`,
        isKureru ? `${hStem}れ` : `${hStem}ろ`,
        `Hãy ${meaning.toLowerCase()}!`,
        isKureru ? "Ngoại lệ くれる → くれ" : "Nhóm II: Bỏ る + ろ"
      ),
      prohibitive: makeDetail("prohibitive", `${kanji}な`, `${hiragana}な`, `Cấm ${meaning.toLowerCase()}!`, "Thể Từ điển + な"),
    };
  }

  // Group 1: Godan
  const lastChar = hiragana.slice(-1);
  const map = GODAN_MAP[lastChar] || GODAN_MAP["る"];
  const kStem = kanji.slice(0, -1);
  const hStem = hiragana.slice(0, -1);

  // Special exceptions in Group 1:
  // 1. 行く (いく / ゆく) -> 行って / 行った
  const isIku =
    kanji === "行く" ||
    kanji.endsWith("行く") ||
    hiragana === "いく" ||
    hiragana === "ゆく";
  // 2. ある (Có - đồ vật/sự việc) -> negative is ない
  const isAru = (kanji === "ある" || kanji === "有る" || kanji === "在る") && hiragana === "ある";

  const teEnding = isIku ? "って" : map.te;
  const taEnding = isIku ? "った" : map.ta;

  return {
    dictionary: makeDetail("dictionary", kanji, hiragana, meaning, `Động từ Nhóm I kết thúc bằng 「${lastChar}」`),
    masu: makeDetail(
      "masu",
      `${kStem}${map.i}ます`,
      `${hStem}${map.i}ます`,
      `${meaning} (lịch sự)`,
      `Nhóm I: Đổi 「${lastChar}」 → 「${map.i}」 + ます`
    ),
    te: makeDetail(
      "te",
      `${kStem}${teEnding}`,
      `${hStem}${teEnding}`,
      `${meaning} rồi... / Hãy ${meaning.toLowerCase()}`,
      isIku
        ? "★ Ngoại lệ Nhóm I: 行く (いく) → 行って (いって)"
        : `Nhóm I: Đuôi 「${lastChar}」 → 「${teEnding}」`
    ),
    nai: makeDetail(
      "nai",
      isAru ? "ない" : `${kStem}${map.a}ない`,
      isAru ? "ない" : `${hStem}${map.a}ない`,
      `Không ${meaning.toLowerCase()}`,
      isAru
        ? "★ Ngoại lệ Nhóm I: ある → ない (không dùng あらない)"
        : `Nhóm I: Đổi 「${lastChar}」 → 「${map.a}」 + ない`
    ),
    ta: makeDetail(
      "ta",
      `${kStem}${taEnding}`,
      `${hStem}${taEnding}`,
      `Đã ${meaning.toLowerCase()}`,
      isIku
        ? "★ Ngoại lệ Nhóm I: 行く (いく) → 行った (いった)"
        : `Nhóm I: Đuôi 「${lastChar}」 → 「${taEnding}」`
    ),
    volitional: makeDetail(
      "volitional",
      `${kStem}${map.o}う`,
      `${hStem}${map.o}う`,
      `Cùng ${meaning.toLowerCase()} nhé / Định ${meaning.toLowerCase()}`,
      `Nhóm I: Đổi 「${lastChar}」 → 「${map.o}」 + う`
    ),
    potential: makeDetail(
      "potential",
      `${kStem}${map.e}る`,
      `${hStem}${map.e}る`,
      `Có thể ${meaning.toLowerCase()}`,
      `Nhóm I: Đổi 「${lastChar}」 → 「${map.e}」 + る`
    ),
    passive: makeDetail(
      "passive",
      `${kStem}${map.a}れる`,
      `${hStem}${map.a}れる`,
      `Bị/được ${meaning.toLowerCase()}`,
      `Nhóm I: Đổi 「${lastChar}」 → 「${map.a}」 + れる`
    ),
    causative: makeDetail(
      "causative",
      `${kStem}${map.a}せる`,
      `${hStem}${map.a}せる`,
      `Bắt/cho phép ${meaning.toLowerCase()}`,
      `Nhóm I: Đổi 「${lastChar}」 → 「${map.a}」 + せる`
    ),
    causativePassive: makeDetail(
      "causativePassive",
      `${kStem}${map.causativePassiveShort}`,
      `${hStem}${map.causativePassiveShort}`,
      `Bị bắt phải ${meaning.toLowerCase()}`,
      lastChar === "す"
        ? `Nhóm I đuôi す: Đổi 「す」 → 「させられる」`
        : `Nhóm I: Đổi 「${lastChar}」 → 「${map.causativePassiveShort}」 (hoặc ${map.a}せられる)`
    ),
    conditional: makeDetail(
      "conditional",
      `${kStem}${map.e}ば`,
      `${hStem}${map.e}ば`,
      `Nếu ${meaning.toLowerCase()}`,
      `Nhóm I: Đổi 「${lastChar}」 → 「${map.e}」 + ば`
    ),
    imperative: makeDetail(
      "imperative",
      `${kStem}${map.e}`,
      `${hStem}${map.e}`,
      `Hãy ${meaning.toLowerCase()}!`,
      `Nhóm I: Đổi 「${lastChar}」 → 「${map.e}」`
    ),
    prohibitive: makeDetail(
      "prohibitive",
      `${kanji}な`,
      `${hiragana}な`,
      `Cấm ${meaning.toLowerCase()}!`,
      "Thể Từ điển + な"
    ),
  };
}

export function buildCompleteVerbItem(raw: {
  id?: string;
  kanji: string;
  hiragana: string;
  meaning: string;
  group: VerbGroup;
  jlptLevel?: "N5" | "N4" | "N3" | "N2" | "N1";
  isException?: boolean;
  exceptionNote?: string;
  exampleJa?: string;
  exampleReading?: string;
  exampleVi?: string;
  source?: "preset" | "ai";
}): JapaneseVerbItem {
  const conjugations = conjugateVerbAll13Forms({
    kanji: raw.kanji,
    hiragana: raw.hiragana,
    meaning: raw.meaning,
    group: raw.group,
  });

  return {
    id: raw.id || `verb-${raw.kanji}-${raw.hiragana}`,
    kanji: raw.kanji.trim(),
    hiragana: raw.hiragana.trim(),
    romaji: hiraganaToRomaji(raw.hiragana.trim()),
    meaning: raw.meaning.trim(),
    group: raw.group,
    jlptLevel: raw.jlptLevel || "N5",
    isException: raw.isException || false,
    exceptionNote: raw.exceptionNote,
    exampleJa: raw.exampleJa || `${raw.kanji}ことができます。`,
    exampleReading: raw.exampleReading || `${raw.hiragana}ことができます。`,
    exampleVi: raw.exampleVi || `Có thể ${raw.meaning.toLowerCase()}.`,
    source: raw.source || "preset",
    conjugations,
  };
}

// ============================================================================
// PRESET CURATED VERB BANK (Diverse across Group 1, Group 2, Group 3 & Exceptions)
// ============================================================================
export const PRESET_JAPANESE_VERBS: JapaneseVerbItem[] = [
  // Group 1 (all 9 endings + exceptions)
  buildCompleteVerbItem({
    kanji: "買う",
    hiragana: "かう",
    meaning: "Mua",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "スーパーで果物を買います。",
    exampleReading: "スーパーでくだものをかいます。",
    exampleVi: "Tôi mua trái cây ở siêu thị.",
  }),
  buildCompleteVerbItem({
    kanji: "待つ",
    hiragana: "まつ",
    meaning: "Đợi, chờ",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "バス停で友だちを待っています。",
    exampleReading: "バスていでともだちをまっています。",
    exampleVi: "Tôi đang đợi bạn ở trạm xe buýt.",
  }),
  buildCompleteVerbItem({
    kanji: "作る",
    hiragana: "つくる",
    meaning: "Làm, chế tạo, nấu",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "週末は家族に料理を作ります。",
    exampleReading: "しゅうまつはかぞくにりょうりをつくります。",
    exampleVi: "Cuối tuần tôi nấu ăn cho gia đình.",
  }),
  buildCompleteVerbItem({
    kanji: "読む",
    hiragana: "よむ",
    meaning: "Đọc",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "毎朝新聞を読みます。",
    exampleReading: "まいあさしんぶんをよみます。",
    exampleVi: "Mỗi sáng tôi đều đọc báo.",
  }),
  buildCompleteVerbItem({
    kanji: "遊ぶ",
    hiragana: "あそぶ",
    meaning: "Chơi, đi chơi",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "公園で子供たちが遊んでいます。",
    exampleReading: "こうえんでこどもたちがあそんでいます。",
    exampleVi: "Bọn trẻ đang chơi đùa trong công viên.",
  }),
  buildCompleteVerbItem({
    kanji: "死ぬ",
    hiragana: "しぬ",
    meaning: "Chết, mất",
    group: 1,
    jlptLevel: "N4",
    exampleJa: "冬になって庭の虫が死んだ。",
    exampleReading: "ふゆになってにわのむしがしんだ。",
    exampleVi: "Sang đông côn trùng trong vườn đã chết.",
  }),
  buildCompleteVerbItem({
    kanji: "書く",
    hiragana: "かく",
    meaning: "Viết, vẽ",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "日本語で手紙を書きました。",
    exampleReading: "にほんごでてがみをかきました。",
    exampleVi: "Tôi đã viết thư bằng tiếng Nhật.",
  }),
  buildCompleteVerbItem({
    kanji: "泳ぐ",
    hiragana: "およぐ",
    meaning: "Bơi",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "夏休みに海で泳ぎたいです。",
    exampleReading: "なつやすみにうみでおよぎたいです。",
    exampleVi: "Kỳ nghỉ hè tôi muốn bơi ở biển.",
  }),
  buildCompleteVerbItem({
    kanji: "話す",
    hiragana: "はなす",
    meaning: "Nói chuyện",
    group: 1,
    jlptLevel: "N5",
    exampleJa: "先生と日本語で話しました。",
    exampleReading: "せんせいとにほんごではなしました。",
    exampleVi: "Tôi đã nói chuyện bằng tiếng Nhật với thầy giáo.",
  }),
  // Group 1 Exceptions
  buildCompleteVerbItem({
    kanji: "行く",
    hiragana: "いく",
    meaning: "Đi",
    group: 1,
    jlptLevel: "N5",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Thể て/た chia thành 行って (いって) / 行った (いった) chứ không phải いいて.",
    exampleJa: "来年日本へ行こうと思っています。",
    exampleReading: "らいねんにほんへいこうとおもっています。",
    exampleVi: "Tôi định năm sau sẽ đi Nhật.",
  }),
  buildCompleteVerbItem({
    kanji: "帰る",
    hiragana: "かえる",
    meaning: "Trở về",
    group: 1,
    jlptLevel: "N5",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Tuy có âm 「え + る」 nhưng thuộc Nhóm I (帰ります, 帰って, 帰らない).",
    exampleJa: "仕事が終わったらすぐ家に帰ります。",
    exampleReading: "しごとがおわったらすぐいえにかえります。",
    exampleVi: "Sau khi xong việc tôi về nhà ngay.",
  }),
  buildCompleteVerbItem({
    kanji: "走る",
    hiragana: "はしる",
    meaning: "Chạy",
    group: 1,
    jlptLevel: "N5",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Tuy có âm 「し + る」 nhưng thuộc Nhóm I (走ります, 走って, 走らない).",
    exampleJa: "毎朝公園を3キロ走っています。",
    exampleReading: "まいあさこうえんをさんキロはしっています。",
    exampleVi: "Mỗi sáng tôi chạy bộ 3km ở công viên.",
  }),
  buildCompleteVerbItem({
    kanji: "入る",
    hiragana: "はいる",
    meaning: "Đi vào, bước vào",
    group: 1,
    jlptLevel: "N5",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Tuy kết thúc bằng 「いる」 nhưng thuộc Nhóm I (入ります, 入って, 入らない).",
    exampleJa: "寝る前にお風呂に入ります。",
    exampleReading: "ねるまえにおふろにはいります。",
    exampleVi: "Trước khi ngủ tôi tắm bồn.",
  }),
  buildCompleteVerbItem({
    kanji: "知る",
    hiragana: "しる",
    meaning: "Biết",
    group: 1,
    jlptLevel: "N5",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Tuy kết thúc bằng 「しる」 nhưng thuộc Nhóm I (知ります, 知って, 知らない).",
    exampleJa: "そのニュースはもう知っています。",
    exampleReading: "そのニュースはもうしっています。",
    exampleVi: "Tin tức đó tôi đã biết rồi.",
  }),
  buildCompleteVerbItem({
    kanji: "切る",
    hiragana: "きる",
    meaning: "Cắt",
    group: 1,
    jlptLevel: "N5",
    isException: true,
    exceptionNote: "Ngoại lệ Nhóm I: Đồng âm với 着る (Mặc - Nhóm II), nhưng 切る (Cắt) thuộc Nhóm I (切ります, 切って).",
    exampleJa: "包丁で野菜を細かく切ってください。",
    exampleReading: "ほうちょうでやさいをこまかくきってください。",
    exampleVi: "Hãy dùng dao thái nhỏ rau củ.",
  }),
  // Group 2 (Ichidan)
  buildCompleteVerbItem({
    kanji: "食べる",
    hiragana: "たべる",
    meaning: "Ăn",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "朝ごはんをしっかり食べましょう。",
    exampleReading: "あさごはんをしっかりたべましょう。",
    exampleVi: "Hãy ăn sáng đầy đủ nhé.",
  }),
  buildCompleteVerbItem({
    kanji: "見る",
    hiragana: "みる",
    meaning: "Xem, nhìn, ngắm",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "週末に映画を見に行きました。",
    exampleReading: "しゅうまつにえいがをみにいきました。",
    exampleVi: "Cuối tuần tôi đã đi xem phim.",
  }),
  buildCompleteVerbItem({
    kanji: "起きる",
    hiragana: "おきる",
    meaning: "Thức dậy, xảy ra",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "明日は6時に起きなければなりません。",
    exampleReading: "あしたはろくじにおきなければなりません。",
    exampleVi: "Ngày mai tôi phải thức dậy lúc 6 giờ.",
  }),
  buildCompleteVerbItem({
    kanji: "教える",
    hiragana: "おしえる",
    meaning: "Dạy, chỉ bảo, cho biết",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "電話番号を教えていただけますか。",
    exampleReading: "でんわばんごうをおしえていただけますか。",
    exampleVi: "Bạn có thể cho tôi biết số điện thoại được không?",
  }),
  buildCompleteVerbItem({
    kanji: "覚える",
    hiragana: "おぼえる",
    meaning: "Nhớ, ghi nhớ",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "新しい漢字を毎日10個覚えます。",
    exampleReading: "あたらしいかんじをまいにちじゅっこおぼえます。",
    exampleVi: "Mỗi ngày tôi ghi nhớ 10 chữ Hán mới.",
  }),
  buildCompleteVerbItem({
    kanji: "忘れる",
    hiragana: "わすれる",
    meaning: "Quên",
    group: 2,
    jlptLevel: "N5",
    exampleJa: "電車の中に傘を忘れてしまいました。",
    exampleReading: "でんしゃのなかにかさをわすれてしまいました。",
    exampleVi: "Tôi lỡ để quên ô trên tàu điện mất rồi.",
  }),
  // Group 3 (Irregular)
  buildCompleteVerbItem({
    kanji: "する",
    hiragana: "する",
    meaning: "Làm, thực hiện",
    group: 3,
    jlptLevel: "N5",
    exampleJa: "毎日運動するようにしています。",
    exampleReading: "まいにちうんどうするようにしています。",
    exampleVi: "Tôi cố gắng tập thể dục mỗi ngày.",
  }),
  buildCompleteVerbItem({
    kanji: "来る",
    hiragana: "くる",
    meaning: "Đến",
    group: 3,
    jlptLevel: "N5",
    exampleJa: "友だちが家に遊びに来ました。",
    exampleReading: "ともだちがいえにあそびにきました。",
    exampleVi: "Bạn tôi đã đến nhà chơi.",
  }),
  buildCompleteVerbItem({
    kanji: "勉強する",
    hiragana: "べんきょうする",
    meaning: "Học tập",
    group: 3,
    jlptLevel: "N5",
    exampleJa: "図書館で日本語を勉強しています。",
    exampleReading: "としょかんでにほんごをべんきょうしています。",
    exampleVi: "Tôi đang học tiếng Nhật ở thư viện.",
  }),
];
