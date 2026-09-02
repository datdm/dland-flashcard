export interface JLPTListeningQuestion {
  id: string;
  level: "N1" | "N2" | "N3" | "N4" | "N5";
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  title: string;
  situation: string;
  audioScript: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  vietnameseTranslation: string;
}

export const JLPT_LISTENING_QUESTIONS: JLPTListeningQuestion[] = [
  {
    id: "lis-n2-m1-01",
    level: "N2",
    mondaiNumber: 1,
    mondaiName: "問題 1: 課題理解",
    mondaiSubtitle: "Hiểu nhiệm vụ hành động tiếp theo",
    title: "Công ty: Chuẩn bị tài liệu hội thảo",
    situation: "会社で女の人と男の人が話しています。男の人はこのあと、まず何をしますか。",
    audioScript: "女：佐藤さん、明日の新製品発表会の準備なんだけど、資料の印刷はもう終わった？\n男：あ、会場の設営は終わったんですが、資料の印刷はまだです。最終版の原稿が先ほど届いたところなので。\n女：そうなのね。じゃあ、まず何より先に資料を印刷して、ホチキス留めをお願いできる？50部ね。\n男：わかりました。すぐやります。あ、プロジェクターの動作確認も必要ですよね？\n女：それは私が後でやっておくから、佐藤さんはとにかく資料を仕上げてちょうだい。\n男：了解しました！",
    question: "男の人はこのあと、まず何をしますか。",
    options: [
      "会場の設営をする",
      "発表会の資料を印刷する",
      "プロジェクターの動作確認をする",
      "原稿の修正をする"
    ],
    correctAnswer: 1,
    explanation: "Người phụ nữ nhấn mạnh: Trước hết hãy in tài liệu và dập ghim 50 bộ giúp tôi (まず何より先に資料を印刷して、ホチキス留めをお願いできる？). Việc kiểm tra máy chiếu người phụ nữ sẽ làm sau.",
    vietnameseTranslation: "Nữ: Anh Sato, chuẩn bị tài liệu xong chưa?\nNam: Em bố trí hội trường rồi, in tài liệu thì chưa ạ.\nNữ: Vậy trước hết in 50 bộ và dập ghim giúp tôi nhé.\nNam: Vâng ạ!"
  },
  {
    id: "lis-n2-m2-01",
    level: "N2",
    mondaiNumber: 2,
    mondaiName: "問題 2: ポイント理解",
    mondaiSubtitle: "Nắm bắt điểm mấu chốt & lý do",
    title: "Phỏng vấn tác giả viết tiểu thuyết lịch sử",
    situation: "ラジオで作家が自分の小説について話しています。作家がこの小説を書くときに最も苦労したのは何ですか。",
    audioScript: "男：今回の小説『青い風の街』、大好評ですね。執筆にあたって、何が一番大変でしたか。\n女：そうですね。時代設定が江戸時代なので、当時の生活習慣を調べるのにはかなり時間を費やしました。でも、一番頭を悩ませたのは、登場人物たちの言葉遣いです。現代の読者に違和感なく伝わりつつ、当時の雰囲気も壊さないようなバランスを見つけるのに本当に苦労しました。",
    question: "作家がこの小説を書くときに最も苦労したのは何ですか。",
    options: [
      "江戸時代の生活習慣の調査",
      "登場人物たちの言葉遣いのバランス",
      "ストーリー展開の構成",
      "読者からの評価を集めること"
    ],
    correctAnswer: 1,
    explanation: "Tác giả chia sẻ điều đau đầu nhất (一番頭を悩ませたのは) là cách dùng từ ngữ của nhân vật sao cho cân bằng giữa độc giả hiện đại và không khí thời Edo.",
    vietnameseTranslation: "Tác giả trăn trở nhất về cách ăn nói của nhân vật để giữ được hồn thời Edo mà người đọc ngày nay vẫn dễ tiếp nhận."
  },
  {
    id: "lis-n2-m3-01",
    level: "N2",
    mondaiNumber: 3,
    mondaiName: "問題 3: 概要理解",
    mondaiSubtitle: "Hiểu chủ đề bao quát & quan điểm",
    title: "Chuyên gia bàn về Telework (Làm việc từ xa)",
    situation: "テレビで専門家がテレワークの普及について話しています。専門家は何について話していますか。",
    audioScript: "男：近年、テレワークを導入する企業が急速に増えました。通勤ストレスがなくなり育児や介護と両立しやすいなど多くのメリットがあります。しかし一方で、雑談が減って新たなアイデアが生まれにくくなったり、業務の進捗が見えにくくなったりする課題もあります。これからの企業には双方の良さを生かした柔軟な働き方が求められています。",
    question: "専門家は何について話していますか。",
    options: [
      "テレワークのメリットとデメリットの両面",
      "通勤時間を有効に活用する方法",
      "育児と介護のための新しい法律",
      "社内アイデアを生み出すための設備投資"
    ],
    correctAnswer: 0,
    explanation: "Chuyên gia vừa nêu các ưu điểm (lợi ích) vừa nêu các nhược điểm (thách thức) của làm việc từ xa.",
    vietnameseTranslation: "Chuyên gia phân tích cả hai mặt lợi ích và bất cập của mô hình làm việc từ xa."
  },
  {
    id: "lis-n2-m4-01",
    level: "N2",
    mondaiNumber: 4,
    mondaiName: "問題 4: 即時応答",
    mondaiSubtitle: "Phản xạ câu ứng đáp tức thì",
    title: "Ứng đáp nơi công sở 1",
    situation: "先輩から声をかけられました。何と答えますか。",
    audioScript: "女：田中くん、明日の会議の資料、まだ手元に届いてないんだけど。",
    question: "最もよい返答を選びなさい。",
    options: [
      "ええ、もうお送りしてあるはずですが。",
      "大変申し訳ありません、すぐにお持ちします。",
      "いえ、手元に置く必要はありませんよ。"
    ],
    correctAnswer: 1,
    explanation: "Khi cấp trên nhắc chưa nhận được tài liệu, câu đáp lễ phép chuẩn mực là xin lỗi và mang sang ngay.",
    vietnameseTranslation: "Em xin lỗi chị, em mang sang ngay đây ạ."
  },
  {
    id: "lis-n2-m5-01",
    level: "N2",
    mondaiNumber: 5,
    mondaiName: "問題 5: 統合理解",
    mondaiSubtitle: "Nghe hiểu tổng hợp đối thoại dài",
    title: "Chọn khóa đào tạo tiếng Nhật doanh nghiệp",
    situation: "社員2人が語学研修コースについて相談しています。",
    audioScript: "担当者：コースは4つあります。1番はメール・文書作成、2番は商談・プレゼン、3番は総合基礎、4番は週末集中です。\n女：私は取引先へのメール作成を直したいな。\n男：僕は営業部に異動するから、クライアント向けプレゼンを鍛えたい。平日週2回の2番にするよ。\n女：私は予定通り1番の文書コースに申し込むね。",
    question: "女の人と男の人はそれぞれどのコースを選びますか。",
    options: [
      "女の人：1番、男の人：2番",
      "女の人：1番、男の人：4番",
      "女の人：2番、男の人：3番",
      "女の人：4番、男の人：2番"
    ],
    correctAnswer: 0,
    explanation: "Nữ chọn khóa 1 (viết mail & văn bản), Nam chọn khóa 2 (đàm phán & thuyết trình).",
    vietnameseTranslation: "Người phụ nữ chọn khóa 1, người nam chọn khóa 2."
  },
  {
    id: "lis-n3-m1-01",
    level: "N3",
    mondaiNumber: 1,
    mondaiName: "問題 1: 課題理解",
    mondaiSubtitle: "Hiểu nhiệm vụ hành động tiếp theo",
    title: "Đi mua đồ tại siêu thị",
    situation: "スーパーで夫婦が買い物をしています。夫はこのあと何を買いに行きますか。",
    audioScript: "女：夕飯はカレーにしようと思うんだけど、じゃがいもを切らしちゃったわ。カレールーも買ってこなきゃ。\n男：僕がルーを取ってくるよ。\n女：ルーは銘柄を選びたいから、あなたは野菜売り場でじゃがいもを3つ取ってきてくれる？\n男：わかった、じゃがいもだね。",
    question: "夫はこのあと何を買いに行きますか。",
    options: [
      "玉ねぎ",
      "カレールー",
      "人参",
      "じゃがいも"
    ],
    correctAnswer: 3,
    explanation: "Người vợ nhờ chồng ra quầy rau lấy khoai tây (じゃがいも).",
    vietnameseTranslation: "Người chồng đi lấy khoai tây ở quầy rau."
  },
  {
    id: "lis-n3-m2-01",
    level: "N3",
    mondaiNumber: 2,
    mondaiName: "問題 2: ポイント理解",
    mondaiSubtitle: "Nắm bắt trọng điểm & lý do",
    title: "Chọn khách sạn suối nước nóng",
    situation: "2 người đang chọn khách sạn đi du lịch.",
    audioScript: "男：この温泉ホテル、どう？駅から遠いけど。\n女：送迎バスがあるし景色も良さそう！でも一番気に入ったのはチェックアウトが12時でゆっくりできるところかな。\n男：確かに！ここにしよう。",
    question: "女の人がこのホテルを最も気に入った理由は何ですか。",
    options: [
      "駅から近くて便利なこと",
      "温泉からの景色が綺麗なこと",
      "チェックアウトが遅くてゆっくりできること",
      "料理が豪華なバイキングであること"
    ],
    correctAnswer: 2,
    explanation: "Người phụ nữ thích nhất là được trả phòng muộn lúc 12h (チェックアウトが12時でゆっくりできる).",
    vietnameseTranslation: "Điểm thích nhất là trả phòng muộn lúc 12 giờ."
  },
  {
    id: "lis-n5-m1-01",
    level: "N5",
    mondaiNumber: 1,
    mondaiName: "問題 1: 課題理解",
    mondaiSubtitle: "Hiểu thông tin nhiệm vụ",
    title: "Chuẩn bị đồ dùng cho bài kiểm tra",
    situation: "教室で先生が生徒に話しています。生徒は明日何を持ってきますか。",
    audioScript: "先生：皆さん、明日は漢字のテストをします。ノートと教科書は使いません。鉛筆と消しゴムだけを持ってきてください。辞書もいりませんよ。\n生徒：はい、わかりました。",
    question: "生徒は明日何を持ってきますか。",
    options: [
      "ノートと教科書",
      "鉛筆と消しゴム",
      "辞書とノート",
      "教科書と辞書"
    ],
    correctAnswer: 1,
    explanation: "Giáo viên dặn chỉ mang bút chì và cục tẩy (鉛筆と消しゴムだけを持ってきてください).",
    vietnameseTranslation: "Học sinh chỉ mang bút chì và cục tẩy."
  }
];
