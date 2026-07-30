export interface KaiwaPattern {
  structure: string;
  meaning: string;
  explanation: string;
  category: "grammar" | "filler" | "aizuchi";
  examples: {
    japanese: string;
    kana: string;
    vietnamese: string;
  }[];
}

export interface KaiwaVocab {
  word: string;
  kana: string;
  meaning: string;
}

export interface DialogueLine {
  speaker: string;
  japanese: string;
  kana: string;
  vietnamese: string;
}

export interface KaiwaWeek {
  week: number;
  month: number;
  title: string;
  objective: string;
  roleplayPrompt: string;
  patterns: KaiwaPattern[];
  vocabulary: KaiwaVocab[];
  dialogue: DialogueLine[];
}

export const KAIWA_ROADMAP: KaiwaWeek[] = [
  // MONTH 1: BUSINESS COMMUNICATION & ADVANCED KEIGO
  {
    week: 1,
    month: 1,
    title: "Giới thiệu bản thân & Networking cấp cao",
    objective: "Luyện giới thiệu bản thân trong môi trường doanh nghiệp lớn sử dụng Kính ngữ (Keigo) N2, giới thiệu vai trò dự án và cách trao đổi danh thiếp lịch sự.",
    roleplayPrompt: "Hãy đóng vai là một Giám đốc công nghệ (CTO) của một đối tác Nhật Bản trong một buổi tiệc networking xã giao. Hãy bắt chuyện lịch sự bằng kính ngữ N2 với tôi.",
    patterns: [
      {
        structure: "〜にあたって (〜 ni atatte)",
        meaning: "Nhân cơ hội / Khi chuẩn bị làm...",
        explanation: "Dùng trong các dịp trang trọng hoặc sự kiện đặc biệt để diễn tả thời điểm chuẩn bị thực hiện một hành động lớn.",
        category: "grammar",
        examples: [
          { japanese: "本日の懇親会に参加するにあたって、一言ご挨拶申し上げます。", kana: "ほんじつのこんしんかいにさんかするにあたって、ひとことごあいさつもうしあげます。", vietnamese: "Nhân cơ hội tham gia buổi tiệc giao lưu ngày hôm nay, tôi xin phép có đôi lời chào hỏi." }
        ]
      },
      {
        structure: "〜を担当しております (〜 wo tantou shite orimasu)",
        meaning: "Tôi đang chịu trách nhiệm / đảm nhận...",
        explanation: "Cách nói lịch sự (Khiêm nhường ngữ) giới thiệu về công việc, phòng ban hoặc dự án của bản thân trước đối tác.",
        category: "grammar",
        examples: [
          { japanese: "新規事業开发のプロジェクトを担当しております、ナムと申します。", kana: "しんきじぎょうかいはつのプロジェクトをたんとうしております、ナムともうします。", vietnamese: "Tôi tên là Nam, hiện đang chịu trách nhiệm dự án phát triển mảng kinh doanh mới." }
        ]
      },
      {
        structure: "〜から〜にかけて (〜 kara 〜 ni kakete)",
        meaning: "Từ... đến / Trong suốt khoảng...",
        explanation: "Chỉ phạm vi thời gian hoặc không gian một cách đại khái (không chính xác tuyệt đối như から〜まで).",
        category: "grammar",
        examples: [
          { japanese: "先月から今月にかけて、多くの日本企業と商談を行いました。", kana: "せんげつからこんげつにかけて、おおくのにほんきぎょうとしょうだんをおこないました。", vietnamese: "Từ tháng trước đến tháng này, chúng tôi đã tiến hành thương lượng với nhiều doanh nghiệp Nhật Bản." }
        ]
      },
      {
        structure: "〜に関して (〜 ni kanshite)",
        meaning: "Liên quan đến / Về vấn đề...",
        explanation: "Dùng để nêu ra chủ đề thảo luận một cách trang trọng, thay thế cho '〜について'.",
        category: "grammar",
        examples: [
          { japanese: "この件に関して、何かご不明な点はございますか。", kana: "このけんにかんして、なにかごふめいなてんはございますか。", vietnamese: "Liên quan đến vụ việc này, anh/chị có điểm nào chưa rõ không ạ?" }
        ]
      },
      {
        structure: "差し支えなければ (sashitsakae nakereba)",
        meaning: "Nếu không có gì bất tiện / Nếu được...",
        explanation: "Từ đệm đắt giá (Kushon Kotoba) dùng trước khi đưa ra câu hỏi mang tính riêng tư hoặc yêu cầu đối tác làm việc gì đó.",
        category: "filler",
        examples: [
          { japanese: "差し支えなければ、ご連絡先を教えていただけますでしょうか。", kana: "さしつかえなければ、ごれんらくさきをおしえていただけますでしょうか。", vietnamese: "Nếu không có gì bất tiện, ông có thể cho tôi xin thông tin liên lạc được không ạ?" }
        ]
      },
      {
        structure: "恐れ入りますが (osore irimasu ga)",
        meaning: "Tôi xin lỗi vì sự bất tiện này, nhưng...",
        explanation: "Từ đệm dùng lịch sự khi muốn làm phiền, nhờ vả hoặc từ chối đối phương một cách nhã nhặn nhất.",
        category: "filler",
        examples: [
          { japanese: "恐れ入りますが、もう一度お名前を伺ってもよろしいでしょうか。", kana: "おそれいりますが、もういちどおなまえをうかがってもよろしいでしょうか。", vietnamese: "Xin lỗi vì sự bất tiện này, nhưng tôi có thể xin phép hỏi lại tên ông một lần nữa được không ạ?" }
        ]
      },
      {
        structure: "おっしゃる通りです (ossharu toori desu)",
        meaning: "Hoàn toàn đúng như lời anh/chị nói",
        explanation: "Cách thể hiện sự đồng tình ở mức độ kính trọng cao nhất đối với ý kiến của sếp hoặc đối tác.",
        category: "aizuchi",
        examples: [
          { japanese: "おっしゃる通りです。弊社もその課題を認識しております。", kana: "おっしゃるとおりです。へいしゃもそのかだいをにんしきしております。", vietnamese: "Dạ hoàn toàn đúng như ông nói ạ. Công ty chúng tôi cũng đang nhận thức được vấn đề đó." }
        ]
      },
      {
        structure: "確かにそうですね (tashikani sou desu ne)",
        meaning: "Quả thật là đúng như vậy nhỉ",
        explanation: "Aizuchi trung cấp, dùng để bày tỏ sự đồng tình và lắng nghe chân thành câu chuyện của đối phương.",
        category: "aizuchi",
        examples: [
          { japanese: "確かにそうですね。ビジネス環境の変化は本当に早いです。", kana: "たしかにそうですね。ビジネスかんきょうのへんかはほんとうにはやいです。", vietnamese: "Quả thật đúng là như vậy nhỉ. Sự thay đổi của môi trường kinh doanh thực sự rất nhanh." }
        ]
      }
    ],
    vocabulary: [
      { word: "懇親会", kana: "こんしんかい", meaning: "Tiệc giao lưu, kết nối" },
      { word: "担当者", kana: "担当者", meaning: "Người phụ trách" },
      { word: "新規事業", kana: "しんきじぎょう", meaning: "Dự án mới, mảng kinh doanh mới" },
      { word: "拝見する", kana: "はいけんする", meaning: "Xem, nhìn (Khiêm nhường ngữ)" },
      { word: "恐縮", kana: "きょうしゅく", meaning: "Xin lỗi / Rất hân hạnh (dùng khi e ngại)" }
    ],
    dialogue: [
      { speaker: "A (Giám đốc Sato)", japanese: "はじめまして、サトウと申します。本日の懇親会でお会いできて光栄です。", kana: "はじめまして、サトウともうします。ほんじつのこんしんかいでおあいできてこうえいです。", vietnamese: "Rất vui được gặp anh, tôi tên là Sato. Rất vinh hạnh được gặp anh trong buổi tiệc giao lưu hôm nay." },
      { speaker: "B (Nam)", japanese: "はじめまして。Dland社の開発部で新規プロジェクトを担当しておりますナムと申します。", kana: "はじめまして。Dlandしゃのかいはつぶでしんきプロジェクトをたんとうしておりますナムともうします。", vietnamese: "Rất vui được gặp ông. Tôi là Nam, đang đảm nhận dự án mới tại phòng phát triển của công ty Dland." },
      { speaker: "A (Giám đốc Sato)", japanese: "おお、開発部ですか！以前から貴社の技術力には注目しておりました。", kana: "おお、かいかつぶですか！いぜんからきしゃのぎじゅつりょくにはちゅうもくしておりました。", vietnamese: "Ồ, phòng phát triển sao! Từ trước tới giờ tôi luôn chú ý đến năng lực công nghệ của quý công ty." },
      { speaker: "B (Nam)", japanese: "恐縮です。サトウ様の名刺を拝見させていただいてもよろしいでしょうか。", kana: "きょうしゅくです。サトウさまのめいしをはいけんさせていただいてもよろしいでしょうか。", vietnamese: "Ông quá khen rồi ạ. Tôi xin phép được xem danh thiếp của ông Sato có được không ạ?" }
    ]
  },
  {
    week: 2,
    month: 1,
    title: "Phát biểu ý kiến trong cuộc họp",
    objective: "Bày tỏ quan điểm trong cuộc họp nhóm dự án, đưa ra các lập luận so sánh hai mặt của một vấn đề và bày tỏ sự đồng thuận/phản biện lịch sự.",
    roleplayPrompt: "Hãy đóng vai là PM (Quản lý dự án) người Nhật. Hãy hỏi ý kiến của tôi về việc có nên áp dụng AI vào quy trình dịch vụ khách hàng hay không. Hãy phản biện ý kiến của tôi bằng tiếng Nhật N2.",
    patterns: [
      {
        structure: "〜の反面 (〜 no hanmen)",
        meaning: "But ngược lại / Mặt khác...",
        explanation: "Dùng để so sánh hai thuộc tính đối lập nhau của cùng một sự vật, hiện tượng nhằm lập luận đa chiều.",
        category: "grammar",
        examples: [
          { japanese: "コスト削減ができる反面、初期のシステム障害リスクも懸念されます。", kana: "コストさくげんができるはんめん、しょきのシステムしょうがいリスクもけねんされます。", vietnamese: "Mặt khác của việc có thể cắt giảm chi phí là những lo ngại về rủi ro sự cố hệ thống ban đầu." }
        ]
      },
      {
        structure: "〜をはじめ (〜 wo hajime)",
        meaning: "Trước tiên là / Tiêu biểu là...",
        explanation: "Đưa ra một ví dụ đại diện, tiêu biểu nhất để nói về toàn thể nhóm đối tượng.",
        category: "grammar",
        examples: [
          { japanese: "山田さんをはじめ、チームの皆様のご協力に感謝いたします。", kana: "やまださんをはじめ、チームのみなさまのごきょうりょくにかんしゃいたします。", vietnamese: "Trước hết là anh Yamada, tôi xin cảm ơn sự hợp tác của toàn thể thành viên trong đội ngũ." }
        ]
      },
      {
        structure: "〜に基づいて (〜 ni motozuite)",
        meaning: "Dựa trên / Căn cứ vào...",
        explanation: "Dùng khi thực hiện một hành động dựa trên cơ sở dữ liệu, tiêu chuẩn hoặc kinh nghiệm đã có trước.",
        category: "grammar",
        examples: [
          { japanese: "過去のデータに基づいて、来期の販売計画を策定します。", kana: "かこのデータにもとづいて、らいきのはんばいけいかくをさくていします。", vietnamese: "Dựa trên dữ liệu trong quá khứ, chúng tôi xây dựng kế hoạch bán hàng cho kỳ tới." }
        ]
      },
      {
        structure: "〜をめぐって (〜 wo megutte)",
        meaning: "Xoay quanh việc / Tranh chấp về...",
        explanation: "Dùng khi mô tả một chủ đề tranh luận, đấu tranh hoặc đàm phán giữa các bên.",
        category: "grammar",
        examples: [
          { japanese: "新しい仕様設計をめぐって、開発部内で議論が続いています。", kana: "あたらしいしようせっけいをめぐって、かいはつぶないでぎろんがつづいています。", vietnamese: "Xoay quanh việc thiết kế đặc tả mới, cuộc thảo luận vẫn đang tiếp tục trong phòng phát triển." }
        ]
      },
      {
        structure: "要するに (yousuruni)",
        meaning: "Tóm lại là / Nói tóm lại...",
        explanation: "Từ nối dùng để tóm tắt các điểm lập luận dài dòng thành một kết luận ngắn gọn, súc tích.",
        category: "filler",
        examples: [
          { japanese: "要するに、品質ファーストで進めるべきだということです。", kana: "ようするに、ひんしつファーストですすめるべきだということです。", vietnamese: "Nói tóm lại là chúng ta nên tiến hành với tiêu chí chất lượng là hàng đầu." }
        ]
      },
      {
        structure: "というか (to iu ka)",
        meaning: "Mà đúng hơn là / Hay nói cách khác...",
        explanation: "Từ nối biểu đạt phản xạ chỉnh sửa lại lời nói trước đó của mình, hoặc đưa ra góc nhìn chính xác hơn.",
        category: "filler",
        examples: [
          { japanese: "進捗が遅れているというか、仕様が確定していない状況です。", kana: "しんちょくがおくれているというか、しようがかくていしていないじょうきょうです。", vietnamese: "Mà nói đúng hơn là chậm tiến độ là do thông số thiết kế vẫn chưa được chốt ạ." }
        ]
      },
      {
        structure: "おっしゃることは分かりますが (ossharu koto wa wakarimasu ga)",
        meaning: "Tôi hiểu điều anh nói, thế nhưng...",
        explanation: "Kỹ thuật phản biện mềm mại (Yes-But): Xác nhận hiểu lập trường đối phương trước khi đưa ra quan điểm ngược lại.",
        category: "aizuchi",
        examples: [
          { japanese: "おっしゃることは分かりますが、納期との兼ね合いも重要です。", kana: "おっしゃることはわかりますが、のうきとのかねあいもじゅうようです。", vietnamese: "Tôi hiểu điều anh nói, thế nhưng việc cân đối thời hạn bàn giao cũng rất quan trọng." }
        ]
      },
      {
        structure: "確かに一理ありますね (tashikani ichiri arimasu ne)",
        meaning: "Quả thật điều đó cũng có một phần đúng/hợp lý",
        explanation: "Thừa nhận lập luận của đối phương có căn cứ trước khi tiếp tục thảo luận.",
        category: "aizuchi",
        examples: [
          { japanese: "確かに一理ありますね。その観点を見落としておりました。", kana: "たしかにいちりありますね。そのかんてんをみおとしておりました。", vietnamese: "Quả thật điều đó có lý đấy chứ. Tôi đã bỏ sót mất góc nhìn đó." }
        ]
      }
    ],
    vocabulary: [
      { word: "導入する", kana: "どうにゅうする", meaning: "Áp dụng, đưa vào sử dụng" },
      { word: "懸念点", kana: "けねんてん", meaning: "Điểm lo ngại, rủi ro" },
      { word: "効率化", kana: "こうりつか", meaning: "Tối ưu hóa, nâng cao hiệu suất" },
      { word: "一理ある", kana: "いちりある", meaning: "Có lý, có một phần đúng" },
      { word: "代替案", kana: "だいたいあん", meaning: "Phương án thay thế" }
    ],
    dialogue: [
      { speaker: "A (PM Yamada)", japanese: "それでは、新規案件のAIチャット導入に関して、ナムさんの意見はどうですか。", kana: "それでは、しんきあんけんのAIチャットどうにゅうにかんして、ナムさんのいけんはどうですか。", vietnamese: "Sau đây, liên quan đến việc áp dụng chatbot AI cho dự án mới, ý kiến của Nam thế thế nào?" },
      { speaker: "B (Nam)", japanese: "AIチャットは業務を効率化できる反面、誤回答によるクレームのリスク cũng 懸念されます。", kana: "AIチャットはぎょうむをこうりつかできるはんめん、ごかいとうによるクレームのリスクもけねんされます。", vietnamese: "Chatbot AI một mặt giúp tối ưu hiệu suất công việc, nhưng mặt khác cũng đáng lo ngại về rủi ro khiếu nại do trả lời sai sót." },
      { speaker: "A (PM Yamada)", japanese: "確かにその通りですね。ただ、カスタマーサポートの負担軽減は急務です。", kana: "たしかにそのとおりですね。ただ、カスタマーサポートのふたんけいげんはきゅうむです。", vietnamese: "Đúng thật là như vậy. Thế nhưng, việc giảm bớt gánh nặng cho bộ phận hỗ trợ khách hàng là nhiệm vụ khẩn cấp." },
      { speaker: "B (Nam)", japanese: "山田さんのおっしゃることも一理あります。そこで、まずは部分的なテスト運用をご提案いたします。", kana: "やまださんのおっしゃることもいちりあります。そこで、まずはぶぶんてきなテストうんようをごていあんいたします。", vietnamese: "Điều anh Yamada nói cũng rất có lý. Do đó, tôi xin đề xuất chạy thử nghiệm một phần trước tiên." }
    ]
  },
  {
    week: 3,
    month: 1,
    title: "Phỏng vấn tuyển dụng & Định hướng sự nghiệp",
    objective: "Tập trả lời các câu hỏi khó trong phỏng vấn tuyển dụng của doanh nghiệp lớn bằng cách diễn đạt chuyên nghiệp N2, thể hiện sự quyết tâm và kỹ năng ứng biến.",
    roleplayPrompt: "Hãy đóng vai nhà tuyển dụng (HR Manager) tại một công ty công nghệ lớn của Nhật. Hãy hỏi tôi lý do tại sao tôi chuyển việc và điểm mạnh lớn nhất của tôi là gì. Hãy phỏng vấn tôi nghiêm túc bằng tiếng Nhật N2.",
    patterns: [
      {
        structure: "〜わけにはいかない (〜 wake ni wa ikanai)",
        meaning: "Không thể làm... (vì lý do đạo đức, trách nhiệm, xã hội)",
        explanation: "Diễn tả việc muốn làm nhưng lương tâm hoặc quy tắc ứng xử xã hội không cho phép thực hiện.",
        category: "grammar",
        examples: [
          { japanese: "どんな困難があっても, 途中で投げ出すわけにはいきません。", kana: "どんなくんなんがあっても, とちゅうでなげだすわけにはいきません。", vietnamese: "Dù có khó khăn thế nào đi nữa, tôi cũng không thể bỏ dở giữa chừng." }
        ]
      },
      {
        structure: "〜次第で (〜 shidai de)",
        meaning: "Tùy thuộc vào...",
        explanation: "Diễn tả một kết quả sẽ thay đổi hoặc phụ thuộc hoàn toàn vào hành động hoặc tình huống đi trước.",
        category: "grammar",
        examples: [
          { japanese: "本人の努力次第で、どのようなスキルも習得可能です。", kana: "ほんにんのどりょくしだいで、どのようなスキルもしゅうとくかのうです。", vietnamese: "Tùy thuộc vào nỗ lực của bản thân mà bất kỳ kỹ năng nào cũng có thể lĩnh hội được." }
        ]
      },
      {
        structure: "〜ぬく (〜 nuku)",
        meaning: "Làm... đến cùng / Làm triệt để",
        explanation: "Nhấn mạnh tinh thần vượt qua khó khăn để hoàn thành trọn vẹn một hành động nào đó (V-masu + nuku).",
        category: "grammar",
        examples: [
          { japanese: "一度引き受けた仕事は, 最後までやりぬく覚悟です。", kana: "いちどひきうけたしごとは, さいごまでやりぬくかくごです。", vietnamese: "Công việc một khi đã nhận, tôi quyết tâm sẽ làm đến cùng." }
        ]
      },
      {
        structure: "〜つつある (〜 tsutsu aru)",
        meaning: "Đang dần dần tiến triển...",
        explanation: "Diễn tả một xu hướng hay hành động đang trên đà thay đổi liên tục, chưa dừng lại.",
        category: "grammar",
        examples: [
          { japanese: "グローバル企業への変革に伴い, 採用基準も変化しつつあります。", kana: "グローバルきぎょうへのへんかくにともない, さいようきじゅんもへんかしつつあります。", vietnamese: "Cùng với việc chuyển dịch thành doanh nghiệp toàn cầu, tiêu chuẩn tuyển dụng cũng đang dần thay đổi." }
        ]
      },
      {
        structure: "なんというか (nan to iu ka)",
        meaning: "Nói thế nào nhỉ / Kiểu như là...",
        explanation: "Từ đệm đắt giá dùng để ngắt nghỉ khi đang tìm từ vựng phù hợp diễn tả ý kiến.",
        category: "filler",
        examples: [
          { japanese: "なんというか、仕事のやりがいをもっと追求したいのです。", kana: "なんというか、しごとのやりがいをもっとついきゅうしたいのです。", vietnamese: "Nói thế nào nhỉ, tôi muốn theo đuổi giá trị công việc nhiều hơn nữa." }
        ]
      },
      {
        structure: "率直に申し上げますと (sotchoku ni moushiagemasu to)",
        meaning: "Nói một cách thẳng thắn thì...",
        explanation: "Từ đệm dùng khi chuẩn bị đưa ra câu trả lời trực diện, không né tránh câu hỏi khó của nhà tuyển dụng.",
        category: "filler",
        examples: [
          { japanese: "率直に申し上げますと、スキルアップの限界を感じたためです。", kana: "そっちょくにもうしあげますと、スキルアップのげんかいにかんじたためです。", vietnamese: "Nói thẳng ra thì là do tôi cảm thấy bản thân đã chạm giới hạn phát triển kỹ năng tại công ty cũ." }
        ]
      },
      {
        structure: "まさにその通りです (masani sono toori desu)",
        meaning: "Chính xác hoàn toàn là như vậy",
        explanation: "Bày tỏ sự đồng ý sâu sắc, nhấn mạnh luận điểm đối phương vừa phát biểu là chính xác.",
        category: "aizuchi",
        examples: [
          { japanese: "まさにその通りです。それが私の就職活動の軸です。", kana: "まさにそのとおりです。それがわたしのしゅうしょくかつどうのじくです。", vietnamese: "Chính xác hoàn toàn là như vậy ạ. Đó chính là tôn chỉ tìm việc của tôi." }
        ]
      },
      {
        structure: "なるほど、納得しました (naruhodo nattoku shimashita)",
        meaning: "À ra là vậy, tôi hoàn toàn bị thuyết phục",
        explanation: "Thể hiện sự tiếp nhận thông tin và thấu hiểu sâu sắc suy nghĩ của đối phương.",
        category: "aizuchi",
        examples: [
          { japanese: "なるほど、納得しました。非常に明確なキャリアパスですね。", kana: "なるほど、なっとくしました。ひじょうにめいかくなキャリアパスですね。", vietnamese: "Ra là vậy, tôi hiểu rồi. Lộ trình sự nghiệp cực kỳ rõ ràng đấy." }
        ]
      }
    ],
    vocabulary: [
      { word: "志望動機", kana: "しぼうどうき", meaning: "Lý do nộp đơn ứng tuyển" },
      { word: "キャリアパス", kana: "きゃりあぱす", meaning: "Lộ trình sự nghiệp" },
      { word: "責任感", kana: "せきにんかん", meaning: "Tinh thần trách nhiệm" },
      { word: "粘り強い", kana: "ねばりづよい", meaning: "Kiên trì, nhẫn nại" },
      { word: "自己PR", kana: "じこぴーあーる", meaning: "Tự quảng bá bản thân" }
    ],
    dialogue: [
      { speaker: "A (Nhà tuyển dụng)", japanese: "ナムさん、転職を考えられた最大の理由は何ですか。", kana: "ナムさん、てんしょくをかんがえられたさいだいのりゆうはなんですか。", vietnamese: "Nam này, lý do lớn nhất khiến cậu quyết định chuyển việc là gì?" },
      { speaker: "B (Nam)", japanese: "前職では安定していたものの、若いうちに挑戦的な環境に身vựngを置かないわけにはいかないと考えたためです。", kana: "ぜんしょくではあんていしていたものの、わかいうちにちょうせんてきなかんきょうにみを置かないわけにはいかないとかんがえたためです。", vietnamese: "Mặc dù ở công ty cũ công việc khá ổn định, nhưng tôi nghĩ mình không thể không dấn thân vào một môi trường đầy thử thách khi còn trẻ." },
      { speaker: "A (Nhà tuyển dụng)", japanese: "なるほど。厳しい環境では、個人の裁量次第で結果が大きく変わりますが大丈夫ですか。", kana: "なるほど。きびしいかんきょうでは、こじんのさいりょうしだいでけっかがおおきくかわりますがだいじょうぶですか。", vietnamese: "Tôi hiểu rồi. Trong môi trường khắc nghiệt, kết quả sẽ thay đổi lớn tùy thuộc vào năng lực tự quyết của cá nhân, cậu có tự tin không?" },
      { speaker: "B (Nam)", japanese: "はい。強みである粘り強さを活かし、チームの目標達成に貢献できると確信しております。", kana: "はい。つよみであるねばりづよさをいかし、チームのもくひょうたっせいにこうけんできるとかくしんしております。", vietnamese: "Vâng. Phát huy thế mạnh là sự kiên trì nhẫn nại, tôi tin chắc mình có thể đóng góp vào việc hoàn thành mục tiêu của đội ngũ." }
    ]
  },
  {
    week: 4,
    month: 1,
    title: "Tiếp đón đối tác & Báo cáo sếp (HouRenSo)",
    objective: "Thực hành quy trình giao tiếp báo cáo sếp về các sự cố phát sinh bất ngờ (HouRenSo) và cách đón tiếp khách VIP đến thăm văn phòng bằng ngôn từ N2 trang nhã.",
    roleplayPrompt: "Hãy đóng vai là sếp tổng (Shachou) khó tính. Hãy hỏi tôi về việc tại sao tiến độ dự án lại bị trễ và yêu cầu tôi đưa ra phương án khắc phục ngay lập tức.",
    patterns: [
      {
        structure: "〜に伴って (〜 ni tomonatte)",
        meaning: "Cùng với việc / Kéo theo...",
        explanation: "Dùng để diễn tả sự thay đổi của vế sau là do sự biến đổi quy mô lớn của vế trước dẫn đến.",
        category: "grammar",
        examples: [
          { japanese: "仕様変更に伴って、スケジュールの見直しが必要となりました。", kana: "しようへんこうにともなって、スケジュールのみなおしがひつようとなりました。", vietnamese: "Kèm theo sự thay đổi về mặt spec (yêu cầu kỹ thuật), việc xem xét lại lịch trình đã trở nên cần thiết." }
        ]
      },
      {
        structure: "〜うちに (〜 uchi ni)",
        meaning: "Trong lúc tranh thủ... / Trong lúc trạng thái chưa đổi...",
        explanation: "Thực hiện hành động vế sau khi trạng thái vế trước chưa thay đổi, hoặc vế sau tự diễn biến trong quá trình vế trước.",
        category: "grammar",
        examples: [
          { japanese: "若いうちに, 様々なプロジェクトを経験しておきたいです。", kana: "わかいうちに, さまざまなプロジェクトをけいけんしておきたいです。", vietnamese: "Trong lúc còn trẻ, tôi muốn được trải nghiệm nhiều dự án khác nhau." }
        ]
      },
      {
        structure: "〜つつ (〜 tsutsu)",
        meaning: "Vừa làm... vừa làm... / Mặc dù...",
        explanation: "1. V-masu + tsutsu diễn tả 2 hành động song song (lịch sự hơn ながら). 2. Diễn tả sự đối lập tương tự 'mặc dù... nhưng'.",
        category: "grammar",
        examples: [
          { japanese: "改善策を考えつつ、目の前の作業も並行して進めます。", kana: "かいぜんさくをかんがえつつ、めのまえのさぎょうもへいこうしてすすめます。", vietnamese: "Vừa suy nghĩ phương án cải thiện, tôi vừa tiến hành song song các tác vụ trước mắt." }
        ]
      },
      {
        structure: "〜わけがない (〜 wake ga nai)",
        meaning: "Không lẽ nào / Chắc chắn không...",
        explanation: "Phủ định hoàn toàn một khả năng dựa trên căn cứ xác đáng.",
        category: "grammar",
        examples: [
          { japanese: "事前に十分なテストを行わずに、リリースできるわけがありません。", kana: "じぜんにじゅうぶんなテストをおこなわずに、リリースできるわけがありません。", vietnamese: "Không lẽ nào chúng ta lại release mà chưa tiến hành test kỹ càng trước đó." }
        ]
      },
      {
        structure: "とりあえず (toriaezu)",
        meaning: "Trước hết là / Tạm thời...",
        explanation: "Từ đệm đàm thoại chỉ hành động ưu tiên cần làm ngay lập tức trước khi có phương án hoàn chỉnh.",
        category: "filler",
        examples: [
          { japanese: "とりあえず, 現在の進捗状況をSlackで共有します。", kana: "とりあえず, げんざいのしんちょくじょうきょうをSlackできょうゆうします。", vietnamese: "Trước mắt, tôi sẽ chia sẻ tình hình tiến độ hiện tại qua Slack ạ." }
        ]
      },
      {
        structure: "〜というか何というか (to iu ka nani to iu ka)",
        meaning: "Nói thế nào nhỉ / Hay nói đúng hơn là...",
        explanation: "Cụm từ nối đệm thể hiện phản xạ tìm từ ngữ lịch sự khi phải báo cáo một tin xấu cho sếp.",
        category: "filler",
        examples: [
          { japanese: "進行に問題が生じているというか何というか、リソース不足が深刻です。", kana: "しんこうにもんだいがしょうじているというかなにというか、リソースぶそくがしんこくです。", vietnamese: "Tiến trình đang phát sinh vấn đề, hay nói đúng hơn là tình trạng thiếu hụt nhân sự đang rất nghiêm trọng." }
        ]
      },
      {
        structure: "承知いたしました (shouchi itashimashita)",
        meaning: "Tôi đã hiểu rõ / Đã tiếp nhận yêu cầu",
        explanation: "Kính ngữ trang trọng dùng thay thế cho 'わかりました' để thể hiện sự phục tùng chỉ thị của cấp trên.",
        category: "aizuchi",
        examples: [
          { japanese: "承知いたしました。ただちにリカバリープランを作成します。", kana: "しょうちいたしました。ただちにリカバリープランをさくせいします。", vietnamese: "Dạ tôi đã rõ. Tôi sẽ lập phương án khắc phục ngay lập tức ạ." }
        ]
      },
      {
        structure: "確かにその懸念はありますね (tashikani sono kenen wa arimasu ne)",
        meaning: "Quả thật là cũng có mối lo ngại đó nhỉ",
        explanation: "Xác nhận mối lo ngại của sếp hoặc khách hàng để tạo niềm tin.",
        category: "aizuchi",
        examples: [
          { japanese: "確かにその懸念はありますね。品質管理を徹底します。", kana: "たしかにそのけねんはありますね。ひんしつかんりをてっていします。", vietnamese: "Dạ quả thật cũng có lo ngại đó ạ. Chúng tôi sẽ triệt để kiểm soát chất lượng." }
        ]
      }
    ],
    vocabulary: [
      { word: "進捗状況", kana: "しんちょくじょうきょう", meaning: "Tình hình tiến độ" },
      { word: "報告連絡相談", kana: "ほうれんそう", meaning: "Báo cáo - Liên lạc - Thảo luận" },
      { word: "仕様変更", kana: "仕様変更", meaning: "Thay đổi thiết kế, đặc tả kỹ thuật" },
      { word: "遅延", kana: "ちえん", meaning: "Trì hoãn, chậm trễ" },
      { word: "挽回する", kana: "ばんかいする", meaning: "Cứu vãn, bù đắp, lấy lại" }
    ],
    dialogue: [
      { speaker: "A (Sếp Shachou)", japanese: "ナムさん、新しいシステムの開発進捗はどうなっていますか。少し遅れているようですが。", kana: "ナムさん、あたらしいシステムのかいはつしんちょくはどうなっていますか。すこしおそいようですが。", vietnamese: "Cậu Nam, tiến độ phát triển hệ thống mới thế nào rồi? Có vẻ hơi trễ thì phải?" },
      { speaker: "B (Nam)", japanese: "はい、一部の仕様変更に伴って開発が遅れておりますが、現在は巻き返しつつあります。", kana: "はい、いちぶのしようへんこうにともなってかいはつがおくれておりますが、げんざいはまきかえしつつあります。", vietnamese: "Vâng ạ, do đi kèm với một số thay đổi đặc tả kỹ thuật nên việc phát triển bị trễ, nhưng hiện tại chúng tôi đang dần đẩy nhanh tiến độ để bắt kịp." },
      { speaker: "A (Sếp Shachou)", japanese: "予定通りのリリースは可能ですか。リスクマネジメントはできていますか。", kana: "よていどおりのリリースはかのうですか。リスクマネジメントはできていますか。", vietnamese: "Liệu có thể release theo đúng kế hoạch không? Việc quản trị rủi ro đã ổn thỏa chưa?" },
      { speaker: "B (Nam)", japanese: "開発メンバーを増員し、期日通りに納品できるよう全力を尽くしております。", kana: "かいはつメンバーをぞういんし、きじつどおりにのうひんできるようぜんりょくをつくしております。", vietnamese: "Chúng tôi đã tăng cường nhân sự phát triển, đang nỗ lực hết mình để đảm bảo bàn giao đúng thời hạn." }
    ]
  },

  // MONTH 2: COMMERCIAL NEGOTIATION & PROBLEM SOLVING
  {
    week: 5,
    month: 2,
    title: "Xử lý khiếu nại của khách hàng (Claim)",
    objective: "Học quy trình xử lý khủng hoảng truyền thông hoặc khiếu nại gay gắt (Claim) từ đối tác Nhật Bản. Sử dụng các thể phủ định khiêm tốn tối đa của N2.",
    roleplayPrompt: "Hãy đóng vai là một khách hàng khó tính đang vô cùng giận dữ vì sản phẩm hệ thống bị lỗi gây tổn thất tài chính lớn cho họ. Hãy mắng tôi bằng tiếng Nhật và bắt tôi giải trình.",
    patterns: [
      {
        structure: "〜かねます (〜 kanemasu)",
        meaning: "Khó lòng có thể làm... / Không thể làm...",
        explanation: "Dạng phủ định nhẹ nhàng và cực kỳ lịch sự thay thế cho '〜できません' trong giao dịch kinh doanh để từ chối khách hàng.",
        category: "grammar",
        examples: [
          { japanese: "現時点での返金対応はいたしかねます。", kana: "げんじてんでのへんきんたいおうはいたしかねます。", vietnamese: "Tại thời điểm hiện tại, chúng tôi khó lòng thực hiện việc hoàn tiền." }
        ]
      },
      {
        structure: "〜次第です (〜 shidai desu)",
        meaning: "Đó là lý do tại sao... / Tình hình là như vậy",
        explanation: "Dùng để giải thích nguồn cơn, tiến trình của sự việc dẫn đến kết quả hiện tại trong văn phong báo cáo.",
        category: "grammar",
        examples: [
          { japanese: "システムの不整合が発生し、緊急調査を行った次第です。", kana: "システムのおりあいがわるくはっせいし、きんきゅうちょうさをおこなったしだいです。", vietnamese: "Do xảy ra sự bất tương thích hệ thống nên tình hình là chúng tôi đã phải tiến hành điều xu hướng khẩn cấp." }
        ]
      },
      {
        structure: "〜ai にあたり (〜 ni atari)",
        meaning: "Khi bắt đầu làm / Khi chuẩn bị...",
        explanation: "Giống với `〜にあたって`, thường dùng trong văn phong viết hoặc các phát biểu có tính chất long trọng.",
        category: "grammar",
        examples: [
          { japanese: "新システムの運用開始にあたり, 万全のサポート体制を整えました。", kana: "しんシステムのおんようかいしにあたり, ばんぜんのサポートたいせいをととのえました。", vietnamese: "Khi bắt đầu đưa hệ thống mới vào vận hành, chúng tôi đã hoàn thiện hệ thống hỗ trợ toàn diện." }
        ]
      },
      {
        structure: "〜に応えて (〜 ni kotaete)",
        meaning: "Đáp lại / Đáp ứng mong mỏi...",
        explanation: "Diễn tả hành động vế sau được thực hiện để đáp ứng nguyện vọng, nhu cầu hoặc sự kỳ vọng ở vế trước.",
        category: "grammar",
        examples: [
          { japanese: "お客様のご要望に応えて、システムのセキュリティレベルを強化しました。", kana: "おきゃくさまのごようぼうにこたえて、システムのセキュリティレベルをきょうかしました。", vietnamese: "Đáp lại yêu cầu của khách hàng, chúng tôi đã gia cố mức độ bảo mật hệ thống." }
        ]
      },
      {
        structure: "あいにくですが (ainiku desu ga)",
        meaning: "Thật không may là / Tiếc rằng...",
        explanation: "Từ đệm lịch sự báo hiệu cho khách hàng rằng chúng ta sắp đưa ra một lời từ chối hoặc tin không vui.",
        category: "filler",
        examples: [
          { japanese: "あいにくですが、本日の復旧は技術的に厳しい状況です。", kana: "あいにくですが、ほんじつのふっきゅうはぎじゅつてきにきびしいじょうきょうです。", vietnamese: "Tiếc rằng việc khôi phục trong hôm nay quả thực là khó khăn về mặt kỹ thuật ạ." }
        ]
      },
      {
        structure: "何卒ご容赦ください (nanitzo goyousha kudasai)",
        meaning: "Xin quý khách lượng thứ và thông cảm cho",
        explanation: "Cụm từ chốt cuối câu cực kỳ lịch sự cầu xin sự bao dung và tha lỗi từ khách hàng.",
        category: "filler",
        examples: [
          { japanese: "不手際に関しまして、何卒ご容赦くださいますようお願い申し上げます。", kana: "ふてぎわにかんしまして、なにとぞごようしゃくださいますようおねがいもうしあげます。", vietnamese: "Về sự bất tiện này, kính mong quý khách mở lòng lượng thứ cho chúng tôi." }
        ]
      },
      {
        structure: "深くお詫び申し上げます (fukaku owabi moushiagemasu)",
        meaning: "Tôi xin gửi lời xin lỗi sâu sắc nhất",
        explanation: "Cách xin lỗi trịnh trọng nhất trong văn phong công sở Nhật Bản khi có sự cố nghiêm trọng xảy ra.",
        category: "aizuchi",
        examples: [
          { japanese: "この度の障害について、深くお詫び申し上げます。", kana: "このたびのしょうがいについて、ふかくおわびもうしあげます。", vietnamese: "Chúng tôi xin thành thật gửi lời xin lỗi sâu sắc nhất về sự cố lần này." }
        ]
      },
      {
        structure: "おっしゃる通り、弁解の余地もございません (ossharu toori, benkai no yochi mo gozaimasen)",
        meaning: "Đúng như ông nói, chúng tôi không có lời nào để bào chữa",
        explanation: "Thể hiện việc hoàn toàn nhận lỗi, không cố chấp biện hộ khi khách hàng đang tức giận.",
        category: "aizuchi",
        examples: [
          { japanese: "おっしゃる通り、弁解の余地もございません。ただちに対応します。", kana: "おっしゃるとおり、べんかいのよちもございません。ただちに対応します。", vietnamese: "Đúng như ông nói, chúng tôi không có gì để biện minh cả. Chúng tôi sẽ xử lý ngay lập tức." }
        ]
      }
    ],
    vocabulary: [
      { word: "お詫び", kana: "おわび", meaning: "Lời xin lỗi chân thành" },
      { word: "迅速に", kana: "じんそくに", meaning: "Nhanh chóng, mau lẹ" },
      { word: "ご容赦", kana: "ごようしゃ", meaning: "Sự dung thứ, bỏ qua cho" },
      { word: "事実関係", kana: "じじつかんけい", meaning: "Mối quan hệ thực tế của sự việc" },
      { word: "再発防止", kana: "再発防止", meaning: "Ngăn chặn tái diễn" }
    ],
    dialogue: [
      { speaker: "A (Khách hàng giận dữ)", japanese: "システム障害で今日の取引が全てストップしたんだ！どう責任を取ってくれるんだ！", kana: "システムしょうがいできょうのとりひきがすべてストップしたんだ！どうせきにんをとってくれるんだ！", vietnamese: "Hệ thống lỗi làm cho mọi giao dịch hôm nay của tôi bị đóng băng hết rồi! Các anh định chịu trách nhiệm thế nào đây hả!" },
      { speaker: "B (Nam)", japanese: "多大なご迷惑をおかけし、深くお詫び申し上げます。ただいま原因究明を急いでいる次第です。", kana: "ただいなごめいわくをおかけし、ふかくおわびもうしあげます。ただいまげんいんきゅうめいをいそいでいるしだいです。", vietnamese: "Tôi xin gửi lời xin lỗi sâu sắc nhất vì đã gây ra phiền toái cực kỳ lớn này cho quý khách. Tình hình hiện tại là chúng tôi đang khẩn cấp làm rõ nguyên nhân ạ." },
      { speaker: "A (Khách hàng giận dữ)", japanese: "急ぐのは当然だ！本日中にデータ復旧できないなら、契約解除も検討するぞ。", kana: "いそぐのはとうぜんだ！ほんじつちゅうにデータふっきゅうできないなら、けいやくかいじょもけんとうするぞ。", vietnamese: "Khẩn cấp là đương nhiên! Nếu trong ngày hôm nay không khôi phục dữ liệu, tôi sẽ xem xét việc hủy hợp đồng đấy." },
      { speaker: "B (Nam)", japanese: "ご納得いただけるよう、最優先でエンジニアを派遣し、対応にあたらせる所存でございます。", kana: "ごなっとくいただけるよう、さいゆうせんでエンジニアをはけんし、たいおうにあたらせるしょぞんでございます。", vietnamese: "Để quý khách có thể yên lòng, chúng tôi dự định sẽ cử kỹ sư đến ngay lập tức để xử lý sự cố với mức ưu tiên cao nhất." }
    ]
  },
  {
    week: 6,
    month: 2,
    title: "Đàm phán thương mại & deadline",
    objective: "Luyện kỹ năng đàm phán thương lượng giảm giá dịch vụ, thương lượng lùi thời hạn giao hàng (Deadline) mà không làm rạn nứt quan hệ đối tác.",
    roleplayPrompt: "Hãy đóng vai là đại diện mua hàng khó tính của khách hàng. Hãy ép tôi giảm giá dịch vụ outsource thêm 15% và đẩy lịch bàn giao sớm hơn 1 tuần.",
    patterns: [
      {
        structure: "〜に応じて (〜 ni oujite)",
        meaning: "Ứng với / Tương ứng với...",
        explanation: "Thay đổi vế sau sao cho phù hợp, tương thích với những thay đổi về yêu cầu, mức độ ở vế trước.",
        category: "grammar",
        examples: [
          { japanese: "ご予算に応じて、開発スコープを柔軟に調整いたします。", kana: "ごよさんにおうじて、かいはつスコープをじゅうなんにちょうせいいたします。", vietnamese: "Tương ứng với ngân sách của quý khách, chúng tôi sẽ điều chỉnh phạm vi phát triển linh hoạt." }
        ]
      },
      {
        structure: "〜さえ〜ば (〜 sae 〜 ba)",
        meaning: "Chỉ cần... thì...",
        explanation: "Nhấn mạnh điều kiện duy nhất cần có để vế sau được thiết lập.",
        category: "grammar",
        examples: [
          { japanese: "納期さえ伸ばしていただければ、ご要望の機能を全て実装できます。", kana: "のうきさえのばしていただければ、ごようぼうのきのうをすべてじっそうできます。", vietnamese: "Chỉ cần phía anh đồng ý lùi deadline giao hàng, chúng tôi sẽ implement toàn bộ các chức năng yêu cầu." }
        ]
      },
      {
        structure: "〜を通じて / を通して (〜 wo tsuujite / wo tooshite)",
        meaning: "Thông qua / Qua phương tiện...",
        explanation: "Dùng để diễn tả việc thực hiện một hành động hoặc đạt được điều gì thông qua một trung gian, cầu nối.",
        category: "grammar",
        examples: [
          { japanese: "代理店を通じて、ライセンス契約の調整を行いました。", kana: "だいりてんをつうじて、ライセンスけいやくのちょうせいをおこないました。", vietnamese: "Chúng tôi đã thực hiện việc điều chỉnh hợp đồng license thông qua đại lý." }
        ]
      },
      {
        structure: "〜うえで (〜 ue de)",
        meaning: "Sau khi làm... / Trong quá trình làm...",
        explanation: "1. V-ta + ue de: Thực hiện hành động sau khi đã làm xong vế trước. 2. V-ru + ue de: Chỉ mục đích, quá trình cần thiết.",
        category: "grammar",
        examples: [
          { japanese: "契約書を確認したうえで、署名させていただきます。", kana: "けいやくしょをかくにんしたうえで、しょめいさせていただきます。", vietnamese: "Sau khi kiểm tra kỹ lưỡng hợp đồng, tôi xin phép được ký nhận." }
        ]
      },
      {
        structure: "せっかくですが (sekkaku desu ga)",
        meaning: "Mặc dù đã tốn công/cực kỳ trân quý đề xuất đó, nhưng...",
        explanation: "Từ đệm đắt giá lịch sự dùng khi phải từ chối một lời đề xuất hấp dẫn từ đối tác để giảm bớt sự đột ngột.",
        category: "filler",
        examples: [
          { japanese: "せっかくですが、その価格でのご提供は原価割れとなってしまいます。", kana: "せっかくですが、そのかかくでのごていきょうはげんかわれとなってしまいます。", vietnamese: "Mặc dù rất tiếc nhưng nếu cung cấp ở mức giá đó thì chúng tôi sẽ bị lỗ vốn mất ạ." }
        ]
      },
      {
        structure: "現実的なお話をしますと (genjitsuteki na ohanashi wo shimasu to)",
        meaning: "Nói một cách thực tế thì...",
        explanation: "Từ nối dùng để kéo đối tác quay lại các lập luận có căn cứ thực tế và số liệu thay vì ép giá vô căn cứ.",
        category: "filler",
        examples: [
          { japanese: "現実的なお話をしますと、開発期間の短縮には追加コストがかかります。", kana: "げんじつてきなおはなしをしますと、かいはつきかんのたんしゅくにはついかコストがかかります。", vietnamese: "Nói một cách thực tế thì việc rút ngắn thời gian code sẽ làm phát sinh thêm chi phí nhân sự." }
        ]
      },
      {
        structure: "妥協点を見出したいと考えております (dakyouten wo miidashitai to kangaete orimasu)",
        meaning: "Chúng tôi mong muốn tìm ra một điểm thỏa hiệp chung cho cả hai bên",
        explanation: "Phản xạ đàm phán hợp tác, thể hiện thiện chí muốn giải quyết vấn đề có lợi cho cả đôi bên.",
        category: "aizuchi",
        examples: [
          { japanese: "何とか双方の妥協点を見出したいと考えております。", kana: "なんとかそうほうのだきょうてんをみいだしたいとかんがえております。", vietnamese: "Bằng cách nào đó, chúng tôi mong muốn tìm ra một phương án thỏa hiệp chung dung hòa lợi ích của cả hai bên." }
        ]
      },
      {
        structure: "前向きに検討させていただきます (maemuki ni kentouさせていただきます)",
        meaning: "Chúng tôi xin phép được tích cực xem xét/cân nhắc điều đó",
        explanation: "Cách trả lời khôn khéo để không từ chối ngay lập tức, hứa hẹn sẽ mang về thảo luận nội bộ kỹ càng.",
        category: "aizuchi",
        examples: [
          { japanese: "その代替案に関して、前向きに検討させていただきます。", kana: "そのだいたいあんにかんして、まえむきにけんとうさせていただきます。", vietnamese: "Liên quan đến phương án thay thế đó, chúng tôi xin phép được tích cực xem xét thảo luận ạ." }
        ]
      }
    ],
    vocabulary: [
      { word: "歩み寄る", kana: "あゆみよる", meaning: "Nhượng bộ lẫn nhau, xích lại gần nhau" },
      { word: "妥協案", kana: "だきょうあん", meaning: "Phương án thỏa hiệp" },
      { word: "納期前倒し", kana: "のうきまえだおし", meaning: "Đẩy sớm lịch giao hàng" },
      { word: "コスト削減", kana: "こすとさくげん", meaning: "Cắt giảm chi phí" },
      { word: "検討の余地", kana: "けんとうのよち", meaning: "Khả năng cân nhắc, xem xét" }
    ],
    dialogue: [
      { speaker: "A (Đối tác đàm phán)", japanese: "ナムさん、今回の見積もりですが、予算オーバーでして15％減額できませんか。", kana: "ナムさん、こんかいのみつもりですが、よさんオーバーでしてじゅうごパーセントげんがくできませんか。", vietnamese: "Nam này, báo giá lần này của các cậu bị vượt quá ngân sách mất rồi, có thể giảm giá 15% được không?" },
      { speaker: "B (Nam)", japanese: "15％は厳しいですが、ご予算に応じて一部機能のフェーズ分けをご提案できます。", kana: "じゅうごパーセントはきびしいですが、ごよさんにおうじていちぶきのうのフェーズ分けをご提案できます。", vietnamese: "Giảm 15% thì quả thực rất khó cho chúng tôi, nhưng tương ứng với ngân sách, tôi có thể đề xuất chia việc phát triển một số tính năng theo từng giai đoạn." },
      { speaker: "A (Đối tác đàm phán)", japanese: "価格交渉をめぐって揉めるのは本意ではないので、機能削減 cũng 検討しましょう。", kana: "かかくこうしょうをめぐってもめるのはほんいではないので、きのうさくげんもけんとうしましょう。", vietnamese: "Tôi không muốn đôi bên tranh cãi xoay quanh việc đàm phán giá cả, vậy chúng ta hãy cân nhắc bớt tính năng đi xem sao." },
      { speaker: "B (Nam)", japanese: "ありがとうございます。双方にとって最適な妥協案を作成し、明日お持ちします。", kana: "ありがとうございます。そうほうにとってさいてきなだきょうあんをさくせいし、あしたおもちします。", vietnamese: "Xin cảm ơn ông. Tôi sẽ soạn thảo phương án thỏa hiệp tối ưu nhất cho cả hai bên và mang qua vào ngày mai." }
    ]
  },
  {
    week: 7,
    month: 2,
    title: "Báo cáo Bug & Giải quyết sự cố IT",
    objective: "Giao tiếp chuyên môn IT. Học cách báo cáo các lỗ hổng bảo mật hoặc lỗi Crash ứng dụng, phân tích mức độ nghiêm trọng bằng các cấu trúc suy đoán của N2.",
    roleplayPrompt: "Hãy đóng vai là Tech Lead người Nhật. Hãy chất vấn tôi về vụ rò rỉ dữ liệu hệ thống đêm qua và bắt tôi báo cáo chi tiết nguyên nhân, giải pháp vá lỗi.",
    patterns: [
      {
        structure: "〜おそれがある (〜 osore ga aru)",
        meaning: "Có nguy cơ / Lo ngại là sẽ xảy ra việc xấu...",
        explanation: "Dùng để diễn tả khả năng một kết quả tiêu cực, không mong muốn xảy ra trong tương lai gần.",
        category: "grammar",
        examples: [
          { japanese: "このバグを放置すると、個人情報が流出するおそれがあります。", kana: "このバグをほうちすると、こじんじょうほうがりゅうしゅつするおそれがあります。", vietnamese: "If bỏ mặc lỗi này, lo ngại là thông tin cá nhân sẽ có nguy cơ bị rò rỉ." }
        ]
      },
      {
        structure: "〜かねない (〜 kanenai)",
        meaning: "Rất có thể dẫn đến kết quả tồi tệ...",
        explanation: "Dùng khi muốn cảnh báo rằng từ một nguyên nhân hiện tại, rất có khả năng sẽ gây ra hậu quả cực kỳ nghiêm trọng.",
        category: "grammar",
        examples: [
          { japanese: "サーバーの過負荷は、システムダウンを引き起こしかねません。", kana: "サーバーのかふかは、システムダウンをひきおこしかねません。", vietnamese: "Việc quá tải server rất có thể dẫn đến sập toàn bộ hệ thống." }
        ]
      },
      {
        structure: "〜にすぎない (〜 ni suginai)",
        meaning: "Chẳng qua chỉ là / Không hơn không kém...",
        explanation: "Dùng để đánh giá thấp mức độ hoặc tính chất của sự việc, thể hiện sự khiêm tốn hoặc giảm nhẹ tầm quan trọng.",
        category: "grammar",
        examples: [
          { japanese: "この不具合は、設定ファイルの軽微な記述ミスにすぎません。", kana: "このふぐあいは、せっていファイルのけいびなきじゅつミスにすぎません。", vietnamese: "Lỗi này thực chất chỉ là một lỗi viết nhầm nhỏ trong file setting mà thôi." }
        ]
      },
      {
        structure: "〜わけではない (〜 wake de wa nai)",
        meaning: "Không hẳn là / Không nhất thiết phải...",
        explanation: "Phủ định một phần nhận định, không đồng nghĩa với phủ định hoàn toàn.",
        category: "grammar",
        examples: [
          { japanese: "開発が全て順調というわけではありませんが、納期は厳守します。", kana: "かいはつがすべてじゅんちょうというわけではありませんが、のうきはげんしゅします。", vietnamese: "Không hẳn là quá trình code diễn ra trơn tru hoàn toàn, nhưng chúng tôi sẽ tuân thủ nghiêm ngặt deadline." }
        ]
      },
      {
        structure: "なんというか (nan to iu ka)",
        meaning: "Nói thế nào nhỉ / Đại loại là...",
        explanation: "Từ đệm đắt giá giúp kéo dài thời gian tìm giải pháp hoặc từ ngữ kỹ thuật khi đang đối diện với chỉ trích của Tech Lead.",
        category: "filler",
        examples: [
          { japanese: "なんというか、ログの解析結果が少し不透明な状況です。", kana: "なんというか、ログのかいせきけっかがすこしふとうめいなじょうきょうです。", vietnamese: "Đại loại như là kết quả phân tích log hiện tại đang hơi có điểm chưa được rõ ràng." }
        ]
      },
      {
        structure: "要するにですね (yousuruni desu ne)",
        meaning: "Mấu chốt vấn đề là...",
        explanation: "Giúp người nói nhanh chóng tóm tắt lỗi kỹ thuật phức tạp thành một câu cốt lõi dễ hiểu cho sếp.",
        category: "filler",
        examples: [
          { japanese: "要するにですね、DBサーバーの接続設定に不備があったわけです。", kana: "ようするにですね、DBサーバーのせつぞくせっていにかがみがあったわけです。", vietnamese: "Mấu chốt vấn đề là có thiếu sót trong cấu hình kết nối của DB server đấy ạ." }
        ]
      },
      {
        structure: "ただちに修正に入ります (tadachi ni shuusei ni hairimasu)",
        meaning: "Chúng tôi sẽ tiến hành fix lỗi ngay lập tức",
        explanation: "Thể hiện phản xạ hành động nhanh gọn, chịu trách nhiệm khắc phục sự cố IT khẩn cấp.",
        category: "aizuchi",
        examples: [
          { japanese: "ご指摘の通りです。ただちにパッチ修正に入ります。", kana: "ごしてきのとおりです。ただちにしゅうせいにはいります。", vietnamese: "Dạ đúng như anh chỉ ra. Chúng tôi sẽ tiến hành apply bản sửa lỗi ngay lập tức." }
        ]
      },
      {
        structure: "おっしゃるリスクは回避可能です (ossharu risuku wa kaihi kanou desu)",
        meaning: "Những rủi ro mà anh vừa nêu hoàn toàn có thể né tránh được",
        explanation: "Phản xạ trấn an sếp bằng phương án backup kỹ thuật tin cậy.",
        category: "aizuchi",
        examples: [
          { japanese: "はい、おっしゃるリスクはテスト環境の構築により回避可能です。", kana: "はい、おっしゃるリスクはテストかんきょうのこうちくによりかいひかのうです。", vietnamese: "Dạ vâng, rủi ro anh nêu có thể tránh được thông qua việc dựng thêm môi trường testing." }
        ]
      }
    ],
    vocabulary: [
      { word: "脆弱性", kana: "ぜいじゃくせい", meaning: "Lỗ hổng bảo mật, tính dễ bị tổn thương" },
      { word: "流出する", kana: "りゅうしゅつする", meaning: "Rò rỉ ra ngoài" },
      { word: "過負荷", kana: "かふか", meaning: "Quá tải" },
      { word: "バグ修正", kana: "ばぐしゅうせい", meaning: "Vá lỗi, sửa bug" },
      { word: "緊急パッチ", kana: "きんきゅうぱっち", meaning: "Bản vá lỗi khẩn cấp" }
    ],
    dialogue: [
      { speaker: "A (Tech Lead)", japanese: "ナムさん、本番環境で深刻な脆弱性が見つかったそうだけど、詳細は？", kana: "ナムさん、ほんばんかんきょうでしんこくなぜいじゃくせいがみつかったそうだけど、しょうさいは？", vietnamese: "Nam này, nghe nói phát hiện lỗ hổng bảo mật nghiêm trọng trên môi trường production, chi tiết cụ thể thế nào?" },
      { speaker: "B (Nam)", japanese: "SQLインジェクションの脆弱性があり、外部からの攻撃でデータが流出するおそれがあります。", kana: "SQLインジェクションのぜいじゃくせいがあり、がいぶからのこうげきでデータがりゅうしゅつするおそれがあります。", vietnamese: "Dạ, có lỗ hổng SQL Injection, lo ngại là dữ liệu có nguy cơ bị rò rỉ nếu bị tấn công từ bên ngoài." },
      { speaker: "A (Tech Lead)", japanese: "それはマズイね。会社の信用問題に発展しかねないよ。すぐ直せる？", kana: "それはマズイね。かいしゃのしんようもんだいにはってんしかねないよ。すぐなおせる？", vietnamese: "Cái đó nguy hiểm đấy nhé. Việc này rất có thể sẽ làm ảnh hưởng nghiêm trọng đến uy tín của công ty đấy. Có sửa được ngay không?" },
      { speaker: "B (Nam)", japanese: "はい、本日の午後までに緊急パッチを適用し、安全性を確保いたします。", kana: "はい、ほんじつのごごまでにきんきゅうパッチをてきようし、あんぜんせいをかくほいたします。", vietnamese: "Vâng, chúng tôi sẽ áp dụng bản vá lỗi khẩn cấp trước chiều nay để đảm bảo tính an toàn bảo mật ạ." }
    ]
  },
  {
    week: 8,
    month: 2,
    title: "Đánh giá nhân sự & Feedback",
    objective: "Thuyết trình các thành tích đạt được trong kỳ và tiếp nhận ý kiến đóng góp nâng cao kỹ năng mềm từ Manager.",
    roleplayPrompt: "Hãy đóng vai là người quản lý trực tiếp (Manager) của tôi tại công ty Nhật. Hãy nhận xét về kết quả làm việc của tôi trong 6 tháng qua và thảo luận những điểm tôi cần cải thiện.",
    patterns: [
      {
        structure: "〜からいうと / からいって (〜 kara iu to / kara itte)",
        meaning: "Xét từ khía cạnh / Nhìn từ góc độ...",
        explanation: "Dùng để đưa ra phán đoán, đánh giá dựa trên một góc nhìn hay lập trường cụ thể nào đó.",
        category: "grammar",
        examples: [
          { japanese: "チームへの貢献度からいうと、今回の評価は妥当だと思います。", kana: "チームへのこうけんどからいうと、こんかいのひょうかはだとうだとおもいます。", vietnamese: "Xét từ góc độ đóng góp cho đội ngũ, tôi nghĩ đánh giá lần này là hoàn toàn thỏa đáng." }
        ]
      },
      {
        structure: "〜ものがある (〜 mono ga aru)",
        meaning: "Có cảm giác gì đó... / Quả thật có điểm...",
        explanation: "Dùng để nhấn mạnh cảm xúc, ấn tượng mạnh mẽ của người nói về một sự việc mang tính định tính.",
        category: "grammar",
        examples: [
          { japanese: "彼のプログラミング能力の高さには, 目を見張るものがあります。", kana: "かれのプログラミングのうりょくのたかさには, めをみはるものがあります。", vietnamese: "Về độ cao trong năng lực lập trình của cậu ấy, quả thật có điều gì đó khiến ta phải kinh ngạc." }
        ]
      },
      {
        structure: "〜にわたって (〜 ni watatte)",
        meaning: "Trải suốt / Trong phạm vi lớn...",
        explanation: "Diễn tả phạm vi rộng của không gian hoặc khoảng thời gian kéo dài suốt một quá trình.",
        category: "grammar",
        examples: [
          { japanese: "３ヶ月にわたって、全社的な業務プロセス改善を行いました。", kana: "さんかげつにわたって、ぜんしゃてきなぎょうむプロセスかいぜんをおこないました。", vietnamese: "Trải suốt 3 tháng liền, chúng tôi đã tiến hành tối ưu hóa quy trình làm việc trên quy mô toàn công ty." }
        ]
      },
      {
        structure: "〜ものなら (〜 mono nara)",
        meaning: "Nếu như có thể làm được...",
        explanation: "Giả định về một việc khó xảy ra hoặc dường như không thể thực hiện ở hiện thực (thường đi với động từ khả năng).",
        category: "grammar",
        examples: [
          { japanese: "やり直せるものなら、最初の設計から修正したいです。", kana: "やりなおせるものなら、さいしょのせっけいからしゅうせいしたいです。", vietnamese: "Nếu như có thể làm lại, tôi muốn chỉnh sửa ngay từ phần thiết kế ban đầu." }
        ]
      },
      {
        structure: "客観的に見て (kyakkanteki ni mite)",
        meaning: "Nhìn nhận khách quan thì...",
        explanation: "Từ đệm lịch sự, tạo chiều sâu cho câu trả lời tự đánh giá của bản thân, không mang tính chủ quan phiến diện.",
        category: "filler",
        examples: [
          { japanese: "客観的に見て、まだまだマネジメントスキルが不足しています。", kana: "きゃっかんてきにみて、まだまだマネジメントスキルがふそくしています。", vietnamese: "Nhìn nhận một cách khách quan, tôi cảm thấy kỹ năng quản lý dự án của mình vẫn còn thiếu hụt nhiều." }
        ]
      },
      {
        structure: "どちらかというと (dochira ka to iu to)",
        meaning: "Nếu phải chọn một bên thì là / Có xu hướng là...",
        explanation: "Giúp diễn đạt một xu hướng, đánh giá nhẹ nhàng, không khẳng định quá cứng nhắc.",
        category: "filler",
        examples: [
          { japanese: "どちらかというと、技術志向よりマネジメントに関心があります。", kana: "どちらかというと、ぎじゅつしこうよりマネジメントにかんしんがあります。", vietnamese: "Nếu phải chọn thì tôi quan tâm đến mảng quản lý hơn là đi thuần con đường kỹ thuật." }
        ]
      },
      {
        structure: "ご指摘の点は重々承知しております (goshiteki no ten wa juuju shouchi shite orimasu)",
        meaning: "Những điểm anh chỉ ra tôi đã vô cùng thấu hiểu và nhận thức rõ",
        explanation: "Phản xạ nhận phản hồi chuyên nghiệp từ sếp, thể hiện tinh thần cầu tiến.",
        category: "aizuchi",
        examples: [
          { japanese: "ご指摘の点は重々承知しております。改善に努めます。", kana: "ごしてきのてんはじゅうじゅうしょうちしております。かいぜんにつとめます。", vietnamese: "Những điểm anh chỉ ra tôi đã hoàn toàn thấu hiểu. Tôi sẽ nỗ lực để cải thiện tốt hơn." }
        ]
      },
      {
        structure: "今後の励みといたします (kougo no hagemi to itashimasu)",
        meaning: "Tôi sẽ lấy đó làm nguồn động lực cố gắng cho tương lai",
        explanation: "Cách trả lời nhã nhặn, tôn trọng khi nhận được lời khen hoặc lời khuyên từ sếp.",
        category: "aizuchi",
        examples: [
          { japanese: "温かいお言葉、今後の励みといたします。ありがとうございます。", kana: "あたたかいおことば、こんごのはげみといたします。ありがとうございます。", vietnamese: "Những lời động viên ấm áp của anh, tôi sẽ lấy đó làm động lực cố gắng hơn cho tương lai. Xin cảm ơn anh." }
        ]
      }
    ],
    vocabulary: [
      { word: "評価面談", kana: "ひょうかめんだん", meaning: "Phỏng vấn, thảo luận đánh giá nhân sự" },
      { word: "貢献度", kana: "こうけんど", meaning: "Mức độ cống hiện, đóng góp" },
      { word: "妥当", kana: "だとう", meaning: "Hợp lý, thỏa đáng" },
      { word: "目標達成率", kana: "もくひょうたっせいりつ", meaning: "Tỷ lệ hoàn thành mục tiêu" },
      { word: "課題点", kana: "かだいてん", meaning: "Vấn đề cần khắc phục, cải thiện" }
    ],
    dialogue: [
      { speaker: "A (Manager Yamada)", japanese: "ナムさん、今期のプロジェクトの振り返りをしましょう。自己評価はどうですか。", kana: "ナムさん、こんきのプロジェクトのふりかえりをしましょう。じこひょうかはどうですか。", vietnamese: "Nam này, chúng ta cùng nhìn nhận lại dự án của kỳ này nhé. Cậu tự đánh giá thế nào?" },
      { speaker: "B (Nam)", japanese: "目標達成率の観点からいうと、計画通りに実装でき、満足のいく結果が出せたと考えております。", kana: "もくひょうたっせいりつのかんてんからいうと、けいかくどおりにじっそうでき、まんぞくのいくけっかがだせたとかんがえております。", vietnamese: "Xét từ khía cạnh tỷ lệ hoàn thành mục tiêu, tôi nghĩ mình đã implement đúng kế hoạch và đạt được kết quả đáng hài lòng." },
      { speaker: "A (Manager Yamada)", japanese: "そうですね。ただ、他のメンバーとの連携面では、改善の余地があるものと感じます。", kana: "そうですね。ただ、ほかのメンバーとのれんけいめんでは、かいぜんのよちがあるものとかんじます。", vietnamese: "Đúng thế thật. Có điều, về mảng phối hợp với các thành viên khác, tôi có cảm giác quả thực vẫn còn điểm cần cải thiện." },
      { speaker: "B (Nam)", japanese: "ご指摘ありがとうございます。コミュニケーションの頻度を増やし、連動性を高めるよう努めます。", kana: "ごしてきありがとうございます。コミュニケーションのひんどをふやし、れんどうせいをたかめるようつとめます。", vietnamese: "Xin cảm ơn những chỉ bảo của anh. Tôi sẽ cố gắng tăng tần suất giao tiếp để nâng cao tính liên kết của đội ngũ." }
    ]
  },

  // MONTH 3: HIGH-LEVEL DAILY LIFE & SOCIAL DEBATES
  {
    week: 9,
    month: 3,
    title: "Thuê nhà & Thủ tục Shiyakusho",
    objective: "Đàm phán hợp đồng thuê nhà tại Nhật với Fudosan, xin giảm cọc lễ và giải quyết giấy tờ đăng ký cư trú tại quận (Shiyakusho).",
    roleplayPrompt: "Hãy đóng vai nhân viên văn phòng môi giới nhà đất người Nhật (Fudosan). Hãy giới thiệu cho tôi một số căn hộ ở Tokyo và giải thích về các khoản phí cọc lễ. Hãy đàm phán phí cọc lễ N2 với tôi.",
    patterns: [
      {
        structure: "〜に限らず (〜 ni kagirazu)",
        meaning: "Không chỉ... mà còn (phạm vi rộng hơn)",
        explanation: "Dùng để diễn tả một sự việc không chỉ giới hạn trong một nhóm nhỏ mà đúng với toàn bộ phạm vi rộng hơn.",
        category: "grammar",
        examples: [
          { japanese: "このエリアは外国人留学生に限らず、若いビジネスマンにも大人気です。", kana: "このエリアはがいこくじんりゅうがくせいにかぎらず、わかいビジネスマンにもだいにんきです。", vietnamese: "Khu vực này không chỉ học sinh du học nước ngoài mà cả giới văn phòng trẻ cũng cực kỳ yêu thích." }
        ]
      },
      {
        structure: "〜を契機に (〜 wo keiki ni)",
        meaning: "Lấy việc... làm cơ hội / Bước ngoặt để...",
        explanation: "Diễn tả việc một sự kiện lớn xảy ra đóng vai trò như ngòi nổ hay bước ngoặt làm thay đổi tình trạng hiện tại.",
        category: "grammar",
        examples: [
          { japanese: "就職を契機に、新しいアパートに引っ越すことにしました。", kana: "しゅうしょくをけいきに、あたらしいアパートにひっこすことにしました。", vietnamese: "Nhân cơ hội xin được việc làm, tôi đã quyết định chuyển sang một căn hộ mới." }
        ]
      },
      {
        structure: "〜bi ぬきにしては / ぬきでは (〜 nuki ni shite wa / 〜 nuki de wa)",
        meaning: "Nếu không có... thì không thể...",
        explanation: "Nhấn mạnh tầm quan trọng tuyệt đối của yếu tố đi trước, nếu thiếu nó thì không thể làm nổi việc vế sau.",
        category: "grammar",
        examples: [
          { japanese: "不動産会社の紹介ぬきにしては、良い物件を見つけることは難しい。", kana: "ふどうさんがいしゃのしょうかいぬきにしては、よいぶっけんをみつけることはむずかしい。", vietnamese: "Nếu không có sự giới thiệu của công ty bất động sản, việc tìm được căn nhà tốt quả thực rất khó." }
        ]
      },
      {
        structure: "〜わけだ (〜 wake da)",
        meaning: "Tất nhiên là / Vì thế nên đương nhiên là...",
        explanation: "Đưa ra kết luận logic, tự nhiên từ các sự kiện trước đó. Dịch là 'thảo nào mà...'.",
        category: "grammar",
        examples: [
          { japanese: "礼金なしの物件だから、初期費用が抑えられたわけですね。", kana: "れいきんなしのぶっけんだから、しょきひようがおさえられたわけですね。", vietnamese: "Vì là nhà không có phí tiền lễ nên thảo nào chi phí ban đầu lại rẻ đi như thế." }
        ]
      },
      {
        structure: "もしよろしければ (moshi yoroshikereba)",
        meaning: "Nếu như anh/chị không phiền...",
        explanation: "Cụm từ đệm Kushon Kotoba lịch sự để đưa ra một đề xuất nhẹ nhàng cho đối phương.",
        category: "filler",
        examples: [
          { japanese: "もしよろしければ、来週の土曜日に内見を調整しましょうか。", kana: "もしよろしければ、らいしゅうのどようびのないけんをちょうせいしましょうか。", vietnamese: "Nếu ông không phiền, chúng ta lên lịch xem nhà vào thứ Bảy tuần tới nhé?" }
        ]
      },
      {
        structure: "率직に言うと (sotchoku ni iu to)",
        meaning: "Thẳng thắn mà nói...",
        explanation: "Từ đệm đàm thoại, dùng khi muốn bày tỏ thật lòng về giá cả thuê nhà đang bị đắt so với thu nhập.",
        category: "filler",
        examples: [
          { japanese: "率直に言うと、毎月の家賃が少し予算をオーバーしているんです。", kana: "そっちょくにいうと、まいつきのやちんがすこしよさんをオーバーしているんです。", vietnamese: "Thẳng thắn mà nói thì tiền nhà mỗi tháng đang bị hơi vượt quá ngân sách của tôi một chút." }
        ]
      },
      {
        structure: "非常に助かります (hijou ni tasukarimasu)",
        meaning: "Việc đó quả thực giúp tôi rất nhiều / Biết ơn vô cùng",
        explanation: "Cách nói cảm ơn chân thành lịch sự khi nhận được sự giúp đỡ, chỉ dẫn hoặc ưu đãi từ đại lý bất động sản.",
        category: "aizuchi",
        examples: [
          { japanese: "初期費用を下げていただけるなら、非常に助かります。", kana: "しょきひようをさげていただけるなら、ひじょうにたすかります。", vietnamese: "Nếu ông có thể giảm bớt chi phí ban đầu giúp tôi thì thực sự giúp tôi đỡ gánh nặng rất nhiều." }
        ]
      },
      {
        structure: "なるほど、そういう仕組みなんですね (naruhodo, sou iu shikumi nan desu ne)",
        meaning: "À ra thế, tôi đã hiểu rõ cơ chế vận hành của nó rồi",
        explanation: "Phản xạ tiếp thu thông tin khi nghe giải thích về các luật lệ thuê nhà phức tạp ở Nhật.",
        category: "aizuchi",
        examples: [
          { japanese: "なるほど、そういう仕組みなんですね。更新料の件、理解しました。", kana: "なるほど、そういうしくみなんですね。こうしんりょうのけん、りかいしました。", vietnamese: "À ra là vậy, tôi đã hiểu cơ chế đó rồi. Việc phí gia hạn hợp đồng tôi đã nắm rõ." }
        ]
      }
    ],
    vocabulary: [
      { word: "敷金礼金", kana: "しききんれいきん", meaning: "Tiền đặt cọc và tiền lễ (thuê nhà ở Nhật)" },
      { word: "不動産屋", kana: "ふどうさんや", meaning: "Văn phòng môi giới nhà đất" },
      { word: "初期費用", kana: "しょきひよう", meaning: "Chi phí ban đầu" },
      { word: "区役所", kana: "くやくしょ", meaning: "Ủy ban quận" },
      { word: "住民票", kana: "じゅうみんひょう", meaning: "Giấy đăng ký cư trú" }
    ],
    dialogue: [
      { speaker: "A (Nhân viên Fudosan)", japanese: "ナムさん、新生活の部屋探しですね。やはり駅から近い物件がよろしいですか。", kana: "ナムさん、しんせいかつのへやさがしですね。やはりえきからちかいぶっけんがよろしいですか。", vietnamese: "Nam tìm phòng cho cuộc sống mới nhỉ. Quả nhiên là các căn hộ gần ga thì tốt hơn đúng không?" },
      { speaker: "B (Nam)", japanese: "はい。就職を契機に引っ越すので、駅徒歩10分以内で礼金なしの物件を希望します。", kana: "はい。しゅうしょくをけいきにひっこすので、えきとほじゅっぷんいないでれいきんなしのぶっけんをきぼうします。", vietnamese: "Vâng ạ. Nhân dịp đi làm nên tôi chuyển nhà, tôi mong muốn tìm căn hộ đi bộ dưới 10 phút và không mất tiền lễ (Reikin)." },
      { speaker: "A (Nhân viên Fudosan)", japanese: "礼金なしですね。この物件は留学生に限らず日本人にも人気で、初期費用が抑えられますよ。", kana: "れいきんなしですね。このぶっけんはりゅうがくせいにかぎらずにほんじんにもにんきで、しょきひようがおさえられますよ。", vietnamese: "Không tiền lễ nhỉ. Căn này không chỉ du học sinh mà cả người Nhật cũng chuộng lắm, phí ban đầu sẽ được tiết giảm tối đa đấy." },
      { speaker: "B (Nam)", japanese: "それは魅力的ですね。近いうちに内見させていただくことは可能でしょうか。", kana: "それはみりょくてきですね. ちかいうちにないけんさせていただくことはかのうでしょうか。", vietnamese: "Nghe hấp dẫn quá. Liệu tôi có thể đi xem nhà trực tiếp trong thời gian tới được không ạ?" }
    ]
  },
  {
    week: 10,
    month: 3,
    title: "Khám bệnh chuyên sâu & Triệu chứng",
    objective: "Giao tiếp tại phòng khám/bệnh viện lớn khi bị đau ốm. Diễn đạt chi tiết các cảm giác mệt mỏi, đau âm ỉ hoặc đau buốt bằng từ vựng N2.",
    roleplayPrompt: "Hãy đóng vai bác sĩ (Ishi) tại bệnh viện ở Nhật Bản. Hãy hỏi thăm triệu chứng đau dạ dày của tôi và giải thích cách uống thuốc, lưu ý ăn uống bằng tiếng Nhật N2.",
    patterns: [
      {
        structure: "〜気味 (〜 gimi / V-masu + gimi)",
        meaning: "Có vẻ hơi / Có triệu chứng hơi...",
        explanation: "Dùng để diễn tả một trạng thái cơ thể hoặc tinh thần đang có xu hướng hơi xấu đi một chút.",
        category: "grammar",
        examples: [
          { japanese: "最近寝不足気味で, 胃がキリキリ痛むんです。", kana: "さいきんねぶそくぎみで, いがキリキリいたむんです。", vietnamese: "Dạo này tôi hơi có vẻ thiếu ngủ, dạ dày cứ đau nhói từng cơn." }
        ]
      },
      {
        structure: "〜がち (〜 gachi / V-masu + gachi)",
        meaning: "Thường hay / Thường xuyên xảy ra (tần suất xấu)...",
        explanation: "Diễn tả một thói quen hoặc hiện tượng mang tính tiêu cực dễ xảy ra nhiều lần.",
        category: "grammar",
        examples: [
          { japanese: "ストレスが溜まると, 食事を抜きがちになってしまいます。", kana: "ストレスがたまると, しょくじをぬきがちになってしまいます。", vietnamese: "Mỗi khi stress tích tụ, tôi thường hay có xu hướng bỏ bữa ăn mất." }
        ]
      },
      {
        structure: "〜だらけ (〜 darake)",
        meaning: "Đầy rẫy / Toàn là...",
        explanation: "Đi với danh từ diễn tả tình trạng một bề mặt hoặc không gian bị phủ đầy bởi những thứ tiêu cực, khó chịu.",
        category: "grammar",
        examples: [
          { japanese: "体中傷だらけになってしまいました。", kana: "からだじゅうきずだらけになってしまいました。", vietnamese: "Toàn thân tôi đã bị đầy vết thương trầy xước mất rồi." }
        ]
      },
      {
        structure: "〜っぽい (〜 ppoi)",
        meaning: "Hơi có vẻ / Hay làm... / Giống như...",
        explanation: "Đi với danh từ hoặc V-masu để diễn tả một tính chất, sắc thái hoặc xu hướng.",
        category: "grammar",
        examples: [
          { japanese: "この処方薬を飲むと、少し熱っぽくなる感覚があります。", kana: "このしょほうやくをのむと、すこしねつっぽくなるかんかくがあります。", vietnamese: "Uống thuốc đơn này vào là tôi có cảm giác cơ thể hơi sốt nhẹ." }
        ]
      },
      {
        structure: "何というか (nan to iu ka)",
        meaning: "Nói thế nào nhỉ / Kiểu như...",
        explanation: "Từ đệm đàm thoại giúp bạn ngắt quãng để miêu tả chính xác cảm giác đau vật lý trong cơ thể.",
        category: "filler",
        examples: [
          { japanese: "何というか、胃がズキズキと脈打つように痛むんです。", kana: "なんというか、いがズキズキとみゃくうつようにいたむんです。", vietnamese: "Kiểu như là dạ dày nó cứ đau nhói buốt lên từng nhịp ấy thưa bác sĩ." }
        ]
      },
      {
        structure: "具体的に言うと (kutaiteki ni iu to)",
        meaning: "Cụ thể nói ra là...",
        explanation: "Dùng để chi tiết hóa trạng thái sức khỏe để bác sĩ dễ chẩn đoán lâm sàng.",
        category: "filler",
        examples: [
          { japanese: "具体的に言うと、食事の後30分くらいで痛みが強くなります。", kana: "ぐたいてきにいうと、しょくじのあとさんじゅっぷんくらいでいたみがつよくなります。", vietnamese: "Cụ thể nói ra là cơn đau sẽ nhói mạnh lên vào khoảng 30 phút sau bữa ăn." }
        ]
      },
      {
        structure: "それは大変でしたね (sore wa taihen deshita ne)",
        meaning: "Thật là vất vả, khó khăn cho cậu quá nhỉ (bác sĩ an ủi)",
        explanation: "Aizuchi chia sẻ sự đồng cảm với khó khăn thể chất hoặc tinh thần của người bệnh.",
        category: "aizuchi",
        examples: [
          { japanese: "それは大変でしたね。すぐに痛みを抑える薬を出します。", kana: "それはたいへんでしたね。すぐにいたみをおさえるくすりをだします。", vietnamese: "Cậu đã vất vả chịu đau thế cơ à. Tôi sẽ kê thuốc giảm đau ngay lập tức cho cậu." }
        ]
      },
      {
        structure: "よく分かりました (yoku wakarimashita)",
        meaning: "Tôi đã hiểu rõ tình trạng rồi",
        explanation: "Xác nhận đã nắm thông tin đầy đủ, giúp đối phương an tâm.",
        category: "aizuchi",
        examples: [
          { japanese: "はい、よく分かりました。胃酸の分泌を抑えるお薬です。", kana: "はい、よくわかりました。いさんのぶんぴつをおさえるおくすりです。", vietnamese: "Rồi, tôi hiểu rõ rồi. Đây là thuốc ức chế tiết dịch vị dạ dày." }
        ]
      }
    ],
    vocabulary: [
      { word: "処方箋", kana: "しょほうせん", meaning: "Đơn thuốc của bác sĩ" },
      { word: "副作用", kana: "ふくさよう", meaning: "Tác dụng phụ của thuốc" },
      { word: "胃もたれ", kana: "いもたれ", meaning: "Đầy bụng, khó tiêu" },
      { word: "消化に良い", kana: "しょうかによい", meaning: "Dễ tiêu hóa" },
      { word: "診断書", kana: "しんだんしょ", meaning: "Giấy chẩn đoán bệnh" }
    ],
    dialogue: [
      { speaker: "A (Bác sĩ)", japanese: "ナムさん、今日はどうされましたか。胃の調子が悪いようですね。", kana: "ナムさん、きょうはどうされましたか。いのちょうしがわるいようですね。", vietnamese: "Nam ơi, hôm nay cậu bị sao thế? Có vẻ tình trạng dạ dày không tốt nhỉ." },
      { speaker: "B (Nam)", japanese: "はい、数日前から風邪気味で、胃もたれもしがちなんです。", kana: "はい、すうじつまえからかぜぎみで、いもたれもしがちなんです。", vietnamese: "Vâng thưa bác sĩ, từ vài ngày trước tôi thấy hơi có triệu chứng cảm cúm, và cũng thường xuyên bị đầy bụng khó tiêu nữa." },
      { speaker: "A (Bác sĩ)", japanese: "お薬を出しておきますね. 胃に負担がかかるような辛いものは避けてください。", kana: "おくすりをだしておきますね. いにふたんがかかるようなからいものはさけてください。", vietnamese: "Tôi sẽ kê đơn thuốc cho cậu nhé. Hãy tránh ăn đồ cay nóng gây gánh nặng cho dạ dày." },
      { speaker: "B (Nam)", japanese: "分かりました。この薬は副作用で眠くなることがありますか。", kana: "わかりました。このくすりはふくさようでねむくなることがありますか。", vietnamese: "Tôi hiểu rồi ạ. Thuốc này có tác dụng phụ gây buồn ngủ không thưa bác sĩ?" }
    ]
  },
  {
    week: 11,
    month: 3,
    title: "Tranh luận các chủ đề xã hội nóng",
    objective: "Tập diễn thuyết ngắn và thảo luận phản biện các chủ đề nóng tại Nhật Bản như Già hóa dân số (少子高齢化), Cải cách cách làm việc (働き方改革), làm việc từ xa.",
    roleplayPrompt: "Hãy đóng vai một đồng nghiệp Nhật Bản có quan điểm truyền thống thích làm việc tại văn phòng. Hãy cùng tôi tranh luận gay gắt về việc có nên cho phép làm việc từ xa (Remote work) 100% hay không bằng tiếng Nhật N2.",
    patterns: [
      {
        structure: "〜に反して (〜 ni hanshite)",
        meaning: "Trái ngược với / Khác với...",
        explanation: "Dùng để diễn tả một kết quả thực tế xảy ra hoàn toàn trái ngược với kỳ vọng, dự đoán hoặc mong muốn ban đầu.",
        category: "grammar",
        examples: [
          { japanese: "周囲の期待に反して、少子化問題はさらに深刻化しています。", kana: "しゅういのきたいにはんして、しょうしかもんだいはさらにしnこくかしています。", vietnamese: "Trái ngược với mong đợi của mọi người xung quanh, vấn đề giảm tỷ lệ sinh lại ngày càng nghiêm trọng." }
        ]
      },
      {
        structure: "〜において (〜 ni oite)",
        meaning: "Tại / Ở / Trong lĩnh vực...",
        explanation: "Dùng để xác định địa điểm, thời gian hoặc lĩnh vực diễn ra hành động (trang trọng hơn で).",
        category: "grammar",
        examples: [
          { japanese: "現代のビジネスにおいて, ITスキルの習得は必須です。", kana: "げんだいのビジネスにおいて, ITスキルのしゅうとくはひっすです。", vietnamese: "Trong môi trường kinh doanh hiện đại, việc trang bị kỹ năng IT là bắt buộc." }
        ]
      },
      {
        structure: "〜に比べて (〜 ni kurabe te)",
        meaning: "So với...",
        explanation: "Dùng để thực hiện việc so sánh hai đối tượng để làm nổi bật sự khác biệt.",
        category: "grammar",
        examples: [
          { japanese: "リモートワークはオフィス出社に比べて、移動時間を大幅に節約できます。", kana: "リモートワークはオフィスしゅっしゃにくらべて、いどうじかんをおおはばにせつやくできます。", vietnamese: "Làm việc từ xa so với đi làm tại văn phòng giúp tiết kiệm đáng kể thời gian di chuyển." }
        ]
      },
      {
        structure: "〜とともに (〜 to tomo ni)",
        meaning: "Cùng với / Kéo theo sự thay đổi...",
        explanation: "1. Đồng thời với hành động khác. 2. Cùng với sự thay đổi của vế trước dẫn đến sự thay đổi đồng bộ của vế sau.",
        category: "grammar",
        examples: [
          { japanese: "時代の変化とともに, 労働者の意識も多様化しています。", kana: "じだいのへんかとともに, ろうどうしゃのいしきもたようかしています。", vietnamese: "Cùng với sự thay đổi của thời đại, nhận thức của người lao động cũng đang đa dạng hóa." }
        ]
      },
      {
        structure: "〜に関して言えば (〜 ni kanshite ieba)",
        meaning: "Nếu nói riêng về mảng... / Xét về...",
        explanation: "Từ đệm đàm thoại giúp giới hạn phạm vi lập luận một cách chính xác trước khi phản biện.",
        category: "filler",
        examples: [
          { japanese: "生産性の向上に関して言えば、自宅の方が集中しやすい環境と言えます。", kana: "せいさんせいのこうじょうにかんしていえば、じたくのほうがしゅうちゅうしやすいかんきょうといえます。", vietnamese: "Nếu nói riêng về mảng nâng cao năng suất, môi trường tại nhà quả thực dễ tập trung hơn." }
        ]
      },
      {
        structure: "いわゆる (iwayuru)",
        meaning: "Cái gọi là / Định nghĩa là...",
        explanation: "Dùng để trích dẫn hoặc nhắc lại một định nghĩa, khái niệm phổ biến trong xã hội.",
        category: "filler",
        examples: [
          { japanese: "これは、いわゆる働き方改革の核心部分に相当します。", kana: "これは、いわゆるはたらきかたかいかくのかくしんぶぶんにそうとうします。", vietnamese: "Đây tương đương với phần cốt lõi của cái gọi là Cải cách cách làm việc." }
        ]
      },
      {
        structure: "確かにそうなんですが (tashikani sou nan desu ga)",
        meaning: "Quả thật đúng là như vậy, thế nhưng...",
        explanation: "Phản xạ đệm nhượng bộ (Acknowledge) trước khi bắt đầu lập luận phản biện ngược lại đối phương.",
        category: "aizuchi",
        examples: [
          { japanese: "確かにそうなんですが、情報漏洩のリスク対策も軽視できません。", kana: "たしかにそうなんですが、じょうほうろうえいのリスクたいさくもけいしできません。", vietnamese: "Dạ quả thật là như vậy, thế nhưng các giải pháp phòng chống rò rỉ thông tin cũng không thể coi nhẹ." }
        ]
      },
      {
        structure: "一概には言えないと思います (ichigai ni wa ienai to omoimasu)",
        meaning: "Tôi nghĩ là không thể đánh đồng/nói một cách phiến diện như vậy được",
        explanation: "Phản xạ tranh luận sắc sảo, bác bỏ quan điểm quy chụp một chiều của đối phương.",
        category: "aizuchi",
        examples: [
          { japanese: "リモートワークが一律に悪いとは、一概には言えないと思います。", kana: "リモートワークがいちりつにわるいとは、いちがいにはいえないとおもいます。", vietnamese: "Tôi nghĩ không thể quy kết phiến diện rằng làm việc từ xa là hoàn toàn không tốt được." }
        ]
      }
    ],
    vocabulary: [
      { word: "少子高齢化", kana: "しょうしこうれいか", meaning: "Già hóa dân số và giảm tỷ lệ sinh" },
      { word: "働き方改革", kana: "はたらきかたかいかく", meaning: "Cải cách phương thức làm việc" },
      { word: "生産性", kana: "せいさんせい", meaning: "Năng suất lao động" },
      { word: "多様性", kana: "たようせい", meaning: "Tính đa dạng (Diversity)" },
      { word: "意思疎通", kana: "いしそつう", meaning: "Sự hiểu nhau, thông tin thông suốt" }
    ],
    dialogue: [
      { speaker: "A (Đồng nghiệp Ken)", japanese: "やっぱり仕事は対面ですべきだよ。リモートワークだと意思疎通が難しい。", kana: "やっぱりしごとはたいめんですべきだよ。リモートワークだといしそつうがむずかしい。", vietnamese: "Rõ ràng công việc là cứ phải gặp mặt trực tiếp làm mới ổn. Làm từ xa thì khó thông suốt thông tin lắm." },
      { speaker: "B (Nam)", japanese: "個人の好みに反するかもしれませんが、リモートワークは単なる手段にすぎず、生産性を高める仕組み作りが重要です。", kana: "こじんのこのみにはんするかもしれませんが、リモートワークはたんなるしゅだんにすぎず、せいさんせいをたかめるしくみづくりがじゅうようです。", vietnamese: "Có thể việc này đi ngược lại với sở thích của từng cá nhân, nhưng làm việc từ xa chỉ là một phương tiện mà thôi, điều quan trọng là xây dựng cơ chế để nâng cao năng suất." },
      { speaker: "A (Đồng nghiệp Ken)", japanese: "確かにそうだが、新人の育成なんかはどうするんだい？背中を見て育てることも必要だ。", kana: "たしかにそうだが、しんじんのいくせいなんかはどうするんだい？せなかをみてそだてることもひつようだ。", vietnamese: "Đúng là vậy, nhưng việc đào tạo người mới thì tính sao đây? Dạy dỗ bằng cách quan sát thực tế cũng rất cần thiết mà." },
      { speaker: "B (Nam)", japanese: "オンライン研修の強化により、対面と変わらない質を確保できると考えております。", kana: "オンラインけんしゅうのきょうかにより、たいめんとかわらないしつをかくほできるとかんがえております。", vietnamese: "Tôi nghĩ thông qua việc tăng cường đào tạo online, chúng ta hoàn toàn có thể đảm bảo chất lượng không kém gì gặp trực tiếp." }
    ]
  },
  {
    week: 12,
    month: 3,
    title: "Đàm thoại tự do & Tameguchi tự nhiên",
    objective: "Luyện phản xạ nói chuyện thoải mái với bạn bè ngang hàng (Tameguchi). Phân biệt sắc thái của các phó từ hội thoại và cách dùng các từ cảm thán thân mật, tự nhiên như người bản xứ.",
    roleplayPrompt: "Hãy đóng vai là một người bạn thân chí cốt từ thời đại học người Nhật. Tụi mình đang đi nhậu bia và nói chuyện phiếm thoải mái về dự định kỳ nghỉ hè sắp tới bằng thể ngắn (tameguchi) cực kỳ thân thiết nhé.",
    patterns: [
      {
        structure: "Thể lấp lửng ~っけ (Plain Form + kke)",
        meaning: "...nhỉ? (Dùng để xác nhận lại thông tin đã quên)",
        explanation: "Dùng cuối câu trong văn nói thân mật để hỏi lại một việc gì đó mà mình đã nghe hoặc biết trước đây nhưng hiện tại đột ngột không nhớ rõ.",
        category: "grammar",
        examples: [
          { japanese: "明日の飲み会、何時集合だっけ？", kana: "あしたののみかい、なんじしゅうごうだっけ？", vietnamese: "Tiệc nhậu ngày mai, mấy giờ tụ tập ấy nhỉ?" }
        ]
      },
      {
        structure: "〜つつも (〜 tsutsu mo)",
        meaning: "Mặc dù biết là... nhưng vẫn làm...",
        explanation: "Diễn tả một trạng thái hành động có sự mâu thuẫn giữa lý trí nhận thức và hành vi thực tế, tương tự như '〜ながらも'.",
        category: "grammar",
        examples: [
          { japanese: "体に悪いと知りつつも, ついつい夜更かしをしてしまう。", kana: "からだにわるいとしりつつも, ついついよふかしをしてしまう。", vietnamese: "Mặc dù biết là có hại cho sức khỏe đấy nhưng tôi vẫn cứ vô tình thức khuya." }
        ]
      },
      {
        structure: "〜どころか (〜 dokoroka)",
        meaning: "Nói chi tới... / Ngay cả... cũng không...",
        explanation: "Dùng để bác bỏ thông tin trước đó, khẳng định một thực trạng tệ hại hơn nhiều ở vế sau.",
        category: "grammar",
        examples: [
          { japanese: "夏休みは旅行どころか、毎日残業で忙しいよ。", kana: "なつやすみはりょこうどころか、まいにちざんぎょうでいそがしいよ。", vietnamese: "Kỳ nghỉ hè nói chi tới đi du lịch, ngày nào tớ cũng bận tăng ca bù đầu đây." }
        ]
      },
      {
        structure: "〜からこそ (〜 kara koso)",
        meaning: "Chính vì... nên mới càng...",
        explanation: "Nhấn mạnh lý do chính yếu nhất dẫn đến quyết định ở vế sau (nhấn mạnh ý nghĩa nguyên nhân).",
        category: "grammar",
        examples: [
          { japanese: "大変な時期だからこそ, お互い助け合わなきゃいけないんだ。", kana: "たいへんなじきだからこそ, おたがいたすけあわなきゃいけないんだ。", vietnamese: "Chính vì là thời điểm khó khăn, chúng ta lại càng phải giúp đỡ lẫn nhau." }
        ]
      },
      {
        structure: "ぶっちゃけ (butchake)",
        meaning: "Nói thật lòng ra thì / Thẳng thắn ra thì...",
        explanation: "Từ lóng, tiếng đệm đàm thoại cực kỳ phổ biến của giới trẻ Nhật Bản khi chuẩn bị kể một bí mật hoặc nói thật suy nghĩ ích kỷ của mình.",
        category: "filler",
        examples: [
          { japanese: "ぶっちゃけ、今度の旅行はちょっと面倒くさいんだよね。", kana: "ぶっちゃけ、こんどのりょこうはちょっとめんどくさいんだよね。", vietnamese: "Nói thẳng ra là tớ thấy chuyến đi lần này hơi phiền phức tẹo cậu ạ." }
        ]
      },
      {
        structure: "ついつい (tsuitsui)",
        meaning: "Vô tình / Theo thói quen lỡ làm...",
        explanation: "Từ đệm miêu tả hành động lỡ làm do không kiểm soát nổi lý trí, tạo nên âm điệu rất bản xứ.",
        category: "filler",
        examples: [
          { japanese: "仕事が忙しいと, ついついお酒を飲みすぎちゃうんだ。", kana: "しごとがいそがしいと, ついついおさけをのみすぎちゃうんだ。", vietnamese: "Công việc bận rộn một cái là tớ lại lỡ uống quá chén mất." }
        ]
      },
      {
        structure: "うそ！マジで？ (uso! maji de?)",
        meaning: "Không thể nào! Thật á?",
        explanation: "Cặp phản xạ Aizuchi kinh điển của người Nhật để biểu lộ sự ngạc nhiên tột độ trong giao tiếp thân mật.",
        category: "aizuchi",
        examples: [
          { japanese: "うそ！マジで？ケンが結婚するって本当？", kana: "うそ！マジで？ケンがけっこんするってほんとう？", vietnamese: "Không thể nào! Thật á? Chuyện Ken kết hôn là thật á?" }
        ]
      },
      {
        structure: "それな！ (sore na!)",
        meaning: "Chuẩn luôn! Đồng ý hai tay!",
        explanation: "Từ lóng Aizuchi cực kỳ hot của giới trẻ Nhật Bản để thể hiện sự đồng tình 100% với lời bạn mình nói.",
        category: "aizuchi",
        examples: [
          { japanese: "「毎日残業はきついよね」「それな！」", kana: "「まいにちざんぎょうはきついよね」「それな！」", vietnamese: "“Ngày nào cũng tăng ca mệt mỏi thật đấy nhỉ” “Chuẩn luôn!”" }
        ]
      }
    ],
    vocabulary: [
      { word: "タメ口", kana: "ためぐち", meaning: "Cách nói chuyện thân mật, không kính ngữ" },
      { word: "ぶっちゃけ", kana: "ぶっちゃけ", meaning: "Nói thẳng ra là, thật lòng mà nói" },
      { word: "ついつい", kana: "ついつい", meaning: "Vô tình, lỡ (không kiềm chế được)" },
      { word: "夜更かし", kana: "よふかし", meaning: "Thức khuya" },
      { word: "愚痴", kana: "ぐち", meaning: "Sự than vãn, cằn nhằn chuyện buồn bực" }
    ],
    dialogue: [
      { speaker: "A (Bạn Ken - Tame)", japanese: "ナム、今年の夏休みってどこ行くんだっけ？旅行計画立てた？", kana: "ナム、ことしのなつやすみってどこいくんだっけ？りょこうけいかくたてた？", vietnamese: "Nam này, kỳ nghỉ hè năm nay cậu đi đâu ấy nhỉ? Đã lên kế hoạch du lịch chưa?" },
      { speaker: "B (Nam - Tame)", japanese: "ぶっちゃけ、忙しくて何も決めてないんだよね。お金使いすぎちゃダメと思いつつも、旅行は行きたいな。", kana: "ぶっちゃけ、いそがしくてなにもきめてないんだよね。おかねつかいすぎちゃダメとおもいつつも、りょこうはいきたいな。", vietnamese: "Thật lòng mà nói thì bận quá tớ chưa quyết định gì cả cậu ạ. Mặc dù tự nhủ không được tiêu hoang nhưng vẫn muốn đi du lịch quá cơ." },
      { speaker: "A (Bạn Ken - Tame)", japanese: "わかる。俺も最近ついつい無駄遣いしがちでさ。一緒に沖縄でも行かない？", kana: "わかる。おれもさいきんついついむだづかいしがちでさ。いっしょにおきなわでもいかない？", vietnamese: "Tớ hiểu. Tớ dạo này cũng toàn vô tình tiêu pha vớ vẩn. Hay tụi mình cùng đi Okinawa đi?" },
      { speaker: "B (Nam - Tame)", japanese: "沖縄！最高じゃん。チケットいつ取る？早めの方が安いよね。", kana: "おきなわ！さいこうじゃん. チケットいつとる？はやめのほうがやすいよね。", vietnamese: "Okinawa á! Tuyệt cú mèo luôn. Khi nào đặt vé đây? Đặt sớm thì rẻ hơn đúng không nhỉ." }
    ]
  }
];
