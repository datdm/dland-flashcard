const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'exams', 'jlpt-n2-2025-07.json');
const exam = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Update meta
exam.meta.title = "JLPT N2 - Đề Thi Chính Thức Tháng 07/2025 (言語知識・読解・聴解)";
exam.meta.totalQuestions = 98;
exam.meta.timeLimit = 9300;
exam.meta.description = "Đề thi chính thức JLPT N2 kỳ thi Tháng 07/2025 đầy đủ cả 3 phần thi: Kiến thức ngôn ngữ (Chữ Hán, Từ vựng, Ngữ pháp), Đọc hiểu và Nghe hiểu (聴解 30 câu với kịch bản Script, âm thanh TTS, bản dịch và giải thích chi tiết).";

// Add Section 4: 聴解
exam.meta.sections.push({
  name: "聴解",
  mondai: "Mondai 1 - 5 (30 câu)",
  questionIds: Array.from({ length: 30 }, (_, i) => 69 + i),
  maxScore: 60
});

// Prepare 30 authentic JLPT N2 Listening Questions
const listeningQuestions = [
  // Mondai 1: 課題理解 (Q69 - Q73: 5 câu)
  {
    id: 69,
    mondai: "問題 1: 課題理解",
    majorSection: "listening",
    type: "single",
    question: "男の人はこのあと、まず何をしなければなりませんか。",
    audioScript: "会社で女の人と男の人が話しています。\n女：山田さん、明日の企画会議の準備、進んでる？\n男：はい、会議室の予約とプロジェクターの手配はもう終わっています。配布資料もコピーしました。\n女：あ、その資料なんだけど、さっき部長から売上データのグラフに一部修正が入ったって連絡があったの。修正版のデータをメールで送ったから、差し替えてもう一度印刷し直してくれる？\n男：分かりました。じゃあ、古い資料を破棄して、修正版を印刷します。\n女：お願いね。印刷が終わったら、出席者の席に配っておいて。\n男：はい、承知しました。\n質問：男の人はこのあと、まず何をしなければなりませんか。",
    vietnameseTranslation: "Tại công ty, người phụ nữ và người đàn ông đang nói chuyện.\nNữ: Yamada, việc chuẩn bị cho cuộc họp kế hoạch ngày mai tiến hành đến đâu rồi?\nNam: Vâng, việc đặt phòng họp và chuẩn bị máy chiếu đã xong rồi. Tài liệu phát cũng đã photocopy xong.\nNữ: À, về tài liệu đó, ban nãy trưởng phòng vừa báo có sửa đổi một phần biểu đồ số liệu doanh thu. Tôi đã gửi file dữ liệu sửa qua email, anh thay thế rồi in lại giúp tôi nhé?\nNam: Vâng tôi hiểu rồi. Vậy tôi sẽ hủy tài liệu cũ và in bản chỉnh sửa.\nNữ: Nhờ anh nhé. In xong thì xếp sẵn lên bàn của người tham dự hộ tôi.\nNam: Vâng, tôi rõ rồi.\nCâu hỏi: Người đàn ông sau đây trước tiên phải làm gì?",
    options: [
      "会議室を予約する",
      "プロジェクターを手配する",
      "修正版の資料を印刷する",
      "資料を出席者の席に配る"
    ],
    answers: [2],
    explanation: "Người phụ nữ yêu cầu in lại bản tài liệu đã sửa đổi dữ liệu doanh thu được gửi qua email. Người đàn ông xác nhận '古い資料を破棄して、修正版を印刷します' (Tôi sẽ hủy tài liệu cũ và in bản sửa đổi), sau đó mới xếp lên bàn (việc làm sau). Do đó việc phải làm TRƯỚC TIÊN là in tài liệu bản sửa đổi (Lựa chọn 3)."
  },
  {
    id: 70,
    mondai: "問題 1: 課題理解",
    majorSection: "listening",
    type: "single",
    question: "女の学生は明日、何を持って行かなければなりませんか。",
    audioScript: "大学で留学生の女の人と先生が話しています。\n女：先生、明日の工場見学の件で確認したいのですが。\n男：はい、何ですか。\n女：集合時間は朝8時半で、筆記用具と学生証を持参するということでよろしかったでしょうか。\n男：ええ。それと、見学先では安全のためにヘルメットを着用することになっているんですが、それは現地で用意してくれます。ただ、滑りにくいスニーカーを履いてくることと、昼食のお弁当を忘れずに持参してください。食堂は使えませんので。\n女：分かりました。お弁当ですね。筆記用具と学生証、それにお弁当を持っていきます。\n男：はい、よろしくお願いします。\n質問：女の学生は明日、何を持って行かなければなりませんか。",
    vietnameseTranslation: "Tại trường đại học, nữ sinh viên quốc tế và thầy giáo đang nói chuyện.\nNữ: Thưa thầy, em muốn xác nhận lại về chuyến đi tham quan nhà máy ngày mai ạ.\nThầy: Ừ, có chuyện gì vậy em?\nNữ: Giờ tập trung là 8h30 sáng, và mang theo đồ dùng viết cùng thẻ sinh viên đúng không ạ?\nThầy: Đúng rồi. Ngoài ra, tại nơi tham quan để đảm bảo an toàn phải đội mũ bảo hộ nhưng mũ sẽ được cấp tại chỗ. Tuy nhiên, em cần đi giày thể thao chống trơn trượt và nhớ mang theo cơm hộp ăn trưa nhé. Nhà ăn ở đó không mở cửa cho đoàn mình đâu.\nNữ: Dạ em hiểu rồi, cơm hộp ạ. Em sẽ mang đồ dùng viết, thẻ sinh viên và cơm hộp đi.\nThầy: Ừ, nhờ em nhé.\nCâu hỏi: Nữ sinh ngày mai phải mang theo những gì?",
    options: [
      "筆記用具と学生証とヘルメット",
      "筆記用具と学生証とお弁当",
      "学生証とヘルメットとお弁当",
      "筆記用具とスニーカーとヘルメット"
    ],
    answers: [1],
    explanation: "Thầy giáo nêu rõ: 'ヘルメット' (mũ bảo hộ) được chuẩn bị tại chỗ (không cần mang), giày thể thao là đồ mặc/mang vào chân chứ không phải vật mang theo trong cặp, còn đồ phải mang theo gồm: đồ viết (筆記用具), thẻ sinh viên (学生証) và cơm hộp (お弁当). Đáp án đúng là Lựa chọn 2."
  },
  {
    id: 71,
    mondai: "問題 1: 課題理解",
    majorSection: "listening",
    type: "single",
    question: "男の店員はこのあと、まず何をしますか。",
    audioScript: "レストランで店長と男の店員が話しています。\n女：佐藤君、もうすぐディナーのオープン時間だけど、テーブルのセッティングは終わった？\n男：はい、全席アルコール消毒とカトラリーのセットは完了しています。\n女：ありがとう。あ、今日予約が入っている8名の団体のお客様なんだけど、アレルギーで甲殻類が食べられない方がいらっしゃるの。厨房のシェフには伝えてある？\n男：あっ、まだ伝えていませんでした。すぐにシェフに伝えてメニューの調整をお願いします。\n女：お願いね。あ、そのあとでいいから、入り口のウェルカムボードの看板も書き換えておいてね。\n男：はい、分かりました！\n質問：男の店員はこのあと、まず何をしますか。",
    vietnameseTranslation: "Tại nhà hàng, quản lý và nhân viên nam đang nói chuyện.\nQuản lý: Sato, sắp đến giờ mở cửa phục vụ bữa tối rồi, bàn ghế đã set up xong chưa?\nNam: Dạ rồi, khử trùng cồn và xếp dao thìa dĩa toàn bộ các bàn đã hoàn tất ạ.\nQuản lý: Cảm ơn cậu. À, đoàn khách 8 người đặt bàn hôm nay có người bị dị ứng không ăn được đồ hải sản vỏ cứng (tôm cua). Cậu đã báo với đầu bếp trong bếp chưa?\nNam: Ái chà, em chưa báo ạ. Em sẽ lập tức báo ngay cho đầu bếp để nhờ điều chỉnh thực đơn.\nQuản lý: Nhờ cậu nhé. À sau đó cậu nhớ sửa lại bảng chào khách ở cửa ra vào nhé.\nNam: Vâng em rõ rồi!\nCâu hỏi: Nhân viên nam sau đây trước tiên phải làm gì?",
    options: [
      "テーブルをセッティングする",
      "厨房のシェフにアレルギーの件を伝える",
      "入り口の看板を書き換える",
      "全席のアルコール消毒をする"
    ],
    answers: [1],
    explanation: "Bàn ghế và khử trùng đã xong trước đó. Quản lý dặn viết bảng sau ('そのあとでいいから'). Việc khẩn cấp nhân viên nam nhận lỗi và làm ngay là: 'すぐにシェフに伝えて...' (báo cho đầu bếp trong bếp về trường hợp dị ứng). Đáp án đúng là 2."
  },
  {
    id: 72,
    mondai: "問題 1: 課題理解",
    majorSection: "listening",
    type: "single",
    question: "女の人は今日中に何をしなければなりませんか。",
    audioScript: "オフィスで課長と女の社員が話しています。\n男：高橋さん、出張報告書の提出、ありがとう。内容とても分かりやすかったよ。\n女：ありがとうございます。\n男：ただね、経費の精算書の方なんだけど、新幹線の領収書が添付されていなかったんだ。経理部から今日中に提出してほしいと言われているんだよ。\n女：大変失礼いたしました！領収書は手元にありますのですぐに添付して提出いたします。\n男：うん、よろしく。それから、来週の取引先へのプレゼン資料だけど、明日までに一度見せてくれるかな。\n女：はい、そちらは今日中に大枠を仕上げて、明日の朝一番にお見せします。\n男：了解。じゃあ、まずは経費のほうを済ませてね。\n質問：女の人は今日中に何をしなければなりませんか。",
    vietnameseTranslation: "Tại văn phòng, trưởng nhóm và nữ nhân viên đang nói chuyện.\nTrưởng nhóm: Takahashi, cảm ơn cô đã nộp báo cáo chuyến công tác. Nội dung rất rõ ràng.\nNữ: Cảm ơn trưởng nhóm ạ.\nTrưởng nhóm: Chỉ có điều là về giấy thanh toán công tác phí, hóa đơn tàu Shinkansen chưa được đính kèm. Phòng kế toán yêu cầu phải nộp trong ngày hôm nay đấy.\nNữ: Em vô cùng xin lỗi! Em đang giữ hóa đơn ở đây, em sẽ đính kèm nộp ngay ạ.\nTrưởng nhóm: Ừ nhờ cô. Với lại tài liệu thuyết trình cho đối tác tuần sau, sáng mai cô cho tôi xem qua nhé.\nNữ: Vâng, tài liệu đó em sẽ hoàn thiện khung trong hôm nay và trình thầy sáng sớm mai.\nTrưởng nhóm: Được rồi. Vậy trước hết hãy hoàn tất vụ thanh toán công tác phí nhé.\nCâu hỏi: Người phụ nữ trong ngày hôm nay phải nộp/làm gì?",
    options: [
      "出張報告書を書き直す",
      "新幹線の領収書を添付して経費精算書を提出する",
      "取引先へのプレゼン資料を完成させて客先に送る",
      "経理部に行って謝罪する"
    ],
    answers: [1],
    explanation: "Phòng kế toán yêu cầu nộp hóa đơn Shinkansen còn thiếu trong ngày hôm nay ('経理部から今日中に提出してほしい'). Takahashi nói sẽ đính kèm nộp ngay. Báo cáo công tác đã nộp tốt rồi không phải viết lại, còn slide thuyết trình sáng mai mới trình trưởng nhóm. Đáp án đúng là 2."
  },
  {
    id: 73,
    mondai: "問題 1: 課題理解",
    majorSection: "listening",
    type: "single",
    question: "男の人はこのあと、どの部署に連絡を入れますか。",
    audioScript: "会社で男性社員と女性の上司が話しています。\n女：木村さん、総務部から依頼されていた防災訓練の日程調整だけど、どうなった？\n男：はい、営業部と開発部からは全員参加可能と返信がありました。ただ、人事部だけまだ返信が届いていません。\n女：人事部ね。あそこは今、採用活動で一番忙しい時期だからメールを見落としているかも。木村さん、直接電話して確認してみて。\n男：分かりました。あと、広報部への連絡はどうしますか。\n女：広報部は私がさっき廊下で部長に会って直接確認したから、連絡しなくて大丈夫よ。\n男：承知いたしました。では、すぐに電話します。\n質問：男の人はこのあと、どの部署に連絡を入れますか。",
    vietnameseTranslation: "Tại công ty, nam nhân viên và sếp nữ đang nói chuyện.\nNữ: Kimura, việc sắp xếp lịch diễn tập phòng chống thiên tai mà phòng Tổng vụ nhờ, tình hình thế nào rồi?\nNam: Vâng, phòng Kinh doanh và phòng Phát triển đã phản hồi có thể tham gia đầy đủ ạ. Chỉ có phòng Nhân sự là chưa gửi phản hồi.\nNữ: Phòng Nhân sự à. Bên đó đang mùa tuyển dụng bận rộn nhất nên có thể họ bị trôi mail đấy. Cậu hãy gọi điện thoại trực tiếp kiểm tra nhé.\nNam: Vâng. Còn phòng Quan hệ công chúng (PR) thì sao ạ?\nNữ: Phòng PR thì lúc nãy tôi gặp trưởng phòng ngoài hành lang và đã xác nhận trực tiếp rồi, không cần liên lạc nữa đâu.\nNam: Em hiểu rồi ạ. Vậy em sẽ gọi điện ngay.\nCâu hỏi: Người đàn ông sau đây sẽ liên lạc với bộ phận nào?",
    options: [
      "営業部",
      "開発部",
      "人事部",
      "広報部"
    ],
    answers: [2],
    explanation: "Kinh doanh và Phát triển đã xác nhận xong; PR sếp đã trực tiếp hỏi ngoài hành lang; chỉ có phòng Nhân sự (人事部) chưa trả lời và sếp giao gọi điện kiểm tra ngay. Đáp án đúng là 3."
  },

  // Mondai 2: ポイント理解 (Q74 - Q79: 6 câu)
  {
    id: 74,
    mondai: "問題 2: ポイント理解",
    majorSection: "listening",
    type: "single",
    question: "男の人が新しいアパートを選んだ最も決定的な理由は何ですか。",
    audioScript: "男の人と女の人が引っ越しについて話しています。\n女：森君、先週新しいアパートに引っ越したんだって？どう、住み心地は？\n男：うん、すごく快適だよ。駅から徒歩15分でちょっと遠いんだけどね。\n女：えっ、森君って通勤時間を一番気にするタイプじゃなかったっけ？家賃が安かったの？\n男：いや、築浅だから家賃は前の部屋とほとんど変わらないんだ。間取りも同じ1LDKだし。実はね、趣味で夜遅くにエレキギターを弾くんだけど、前の部屋は壁が薄くて全然練習できなかったんだよ。今度の物件は完全防音設計で、時間を気にせず思い切り演奏できるんだ。それが決め手だったね。\n女：へえ！趣味を思い切り楽しめるなら、多少駅からの距離があっても大満足ね。\n質問：男の人が新しいアパートを選んだ最も決定的な理由は何ですか。",
    vietnameseTranslation: "Người đàn ông và người phụ nữ đang nói về việc chuyển nhà.\nNữ: Mori, nghe nói tuần trước cậu vừa chuyển sang căn hộ mới à? Thế nào, ở thích không?\nNam: Ừ, thoải mái lắm. Dù đi bộ từ ga mất 15 phút hơi xa một chút.\nNữ: Ủa, không phải cậu là người coi trọng thời gian đi làm nhất sao? Tiền thuê rẻ hơn à?\nNam: Không, vì nhà mới xây nên tiền thuê gần như không đổi so với chỗ cũ. Thiết kế cũng vẫn là 1LDK. Thật ra tớ có sở thích chơi guitar điện đêm khuya, mà chỗ cũ tường mỏng nên chẳng tập luyện được gì cả. Nhà mới này cách âm hoàn toàn, tớ có thể chơi thỏa thích bất kể giờ giấc. Đó chính là lý do quyết định đấy.\nNữ: Ồ! Nếu được thoải mái với sở thích thì xa ga một chút cũng đáng giá nhỉ.\nCâu hỏi: Lý do mang tính quyết định nhất khiến người đàn ông chọn căn hộ mới là gì?",
    options: [
      "駅から近くて通勤に便利だから",
      "家賃が前の部屋より格段に安かったから",
      "防音設備が整っていて夜間に楽器が演奏できるから",
      "部屋の間取りが広くなったから"
    ],
    answers: [2],
    explanation: "Nhân vật nam nói rõ: tiền thuê không đổi, phòng cách ga xa hơn (15 phút), nhưng yếu tố quyết định là '完全防音設計で、時間を気にせず思い切り演奏できるんだ。それが決め手だったね' (thiết kế cách âm hoàn hảo để có thể chơi đàn đêm). Đáp án đúng là 3."
  },
  {
    id: 75,
    mondai: "問題 2: ポイント理解",
    majorSection: "listening",
    type: "single",
    question: "女の人が最近始めた健康法で、最も効果を感じていることは何ですか。",
    audioScript: "職場で同僚の男女が話しています。\n男：田中さん、最近すごく肌の調子が良さそうだし、いつも元気いっぱいだね。\n女：分かる？実は1ヶ月前から朝の白湯（さゆ）習慣とウォーキングを始めたの。\n男：へえ、毎朝歩いてるんだ。体重も減った？\n女：体重はね、期待したほど落ちてないのよ。でもね、一番驚いたのは、以前は酷い冷え性と肩こりにずっと悩まされていたのが、すっかり改善したことなの。朝起きたときに体がポカポカして、日中の集中力が全然違うのよ。\n男：それはいいね！手軽にできるし、僕も試してみようかな。\n質問：女の人が最近始めた健康法で、最も効果を感じていることは何ですか。",
    vietnameseTranslation: "Tại nơi làm việc, hai đồng nghiệp nam nữ đang nói chuyện.\nNam: Tanaka, dạo này trông da dẻ bạn đẹp hẳn ra mà lúc nào cũng tràn đầy năng lượng thế.\nNữ: Cậu cũng nhận ra à? Thật ra 1 tháng nay mình bắt đầu thói quen uống nước ấm mỗi sáng và đi bộ đấy.\nNam: Ồ, sáng nào cũng đi bộ à. Có giảm cân không?\nNữ: Cân nặng thì không giảm được như kỳ vọng đâu. Nhưng điều làm mình bất ngờ nhất là trước đây mình hay bị lạnh tay chân và đau mỏi vai gáy kinh khủng, giờ thì đỡ hẳn hoàn toàn. Sáng dậy người ấm áp, ban ngày làm việc tập trung hơn hẳn luôn.\nNam: Tuyệt thế! Dễ làm nữa, chắc mình cũng phải thử xem sao.\nCâu hỏi: Điều mà người phụ nữ cảm nhận thấy hiệu quả nhất từ phương pháp dưỡng sinh dạo này là gì?",
    options: [
      "体重が大幅に減量できたこと",
      "冷え性や肩こりの症状が改善したこと",
      "夜ぐっすり眠れるようになったこと",
      "食事の量を減らせるようになったこと"
    ],
    answers: [1],
    explanation: "Cô gái nói cân nặng không giảm như mong muốn ('体重は期待したほど落ちてない'), mà điều kỳ diệu nhất là chứng lạnh cơ thể và đau mỏi vai gáy đã thuyên giảm hoàn toàn ('一番驚いたのは、以前は酷い冷え性と肩こりにずっと悩まされていたのが、すっかり改善したこと'). Đáp án đúng là 2."
  },
  {
    id: 76,
    mondai: "問題 2: ポイント理解",
    majorSection: "listening",
    type: "single",
    question: "専門家によると、電子書籍よりも紙の本が記憶に定着しやすい理由は何ですか。",
    audioScript: "ラジオで脳科学の専門家が読書について話しています。\n男：最近はスマートフォンやタブレットで本を読む人が増えていますが、学習や記憶の定着という観点からは紙の本の方が優れていることが研究で分かっています。電子書籍は軽くて持ち運びに便利ですが、画面上では文字情報が平面的に流れていくだけです。一方、紙の本を読むとき、私たちは指先でページの厚みを感じ、どのあたりを読んでいるかという「空間的な位置情報」を無意識に把握しています。この触覚と空間の感覚が脳の海馬を刺激し、内容の記憶を強固に結びつけるのです。\n質問：専門家によると、電子書籍よりも紙の本が記憶に定着しやすい理由は何ですか。",
    vietnameseTranslation: "Trên đài phát thanh, chuyên gia thần kinh não bộ đang nói về việc đọc sách.\nChuyên gia: Gần đây số người đọc sách trên điện thoại hay máy tính bảng ngày càng nhiều, nhưng xét từ góc độ tiếp thu và lưu giữ ký ức, nghiên cứu cho thấy sách giấy vẫn vượt trội hơn. Sách điện tử nhẹ và tiện mang theo, nhưng trên màn hình các dòng chữ chỉ trôi đi một cách phẳng lì. Ngược lại, khi đọc sách giấy, các ngón tay chúng ta cảm nhận được độ dày của từng trang sách, và não bộ nắm bắt một cách vô thức 'thông tin vị trí không gian' của đoạn văn ta đang đọc. Xúc giác và cảm quan không gian này kích thích vùng hồi hải mã của não, giúp gắn kết và ghi nhớ nội dung bền chặt hơn.\nCâu hỏi: Theo chuyên gia, lý do sách giấy dễ ghi nhớ hơn sách điện tử là gì?",
    options: [
      "紙の匂いが集中力を高めるから",
      "ページの厚みや空間的位置を指先や感覚で把握できるから",
      "電子機器のブルーライトで目が疲れないから",
      "紙の本の方が文字のフォントが読みやすいから",
    ],
    answers: [1],
    explanation: "Chuyên gia phân tích: khi đọc sách giấy, xúc giác ngón tay cảm nhận độ dày của trang và não ghi nhận thông tin vị trí không gian ('指先でページの厚みを感じ、どのあたりを読んでいるかという空間的な位置情報を無意識に把握'), kích thích hồi hải mã lưu giữ ký ức. Đáp án đúng là 2."
  },
  {
    id: 77,
    mondai: "問題 2: ポイント理解",
    majorSection: "listening",
    type: "single",
    question: "新入社員が研修で最も苦労したと述べていることは何ですか。",
    audioScript: "会社で先輩社員と新入社員が話しています。\n女：小林君、3ヶ月間の新入社員研修、お疲れ様。全体を通してどうだった？\n男：ありがとうございます。ビジネスマナーや名刺交換は大学の就活セミナーでも習っていたので割とスムーズでしたし、PCのスキルも問題ありませんでした。\n女：じゃあ、特に困ったことはなかった？\n男：いえ、実務のロールプレイングで、お客様からの急なクレームに対して電話で臨機応変に対応するのが本当に難しかったです。マニュアル通りにはいかないことばかりで、相手の感情を汲み取りながら言葉を選ぶのがとても大変でした。\n女：なるほどね。でもそれは経験を積めば必ず上達するから大丈夫よ。\n質問：新入社員が研修で最も苦労したと述べていることは何ですか。",
    vietnameseTranslation: "Tại công ty, tiền bối và nhân viên mới đang nói chuyện.\nTiền bối: Kobayashi, 3 tháng đào tạo nhân viên mới vất vả rồi. Nhìn chung em thấy thế nào?\nNam: Em cảm ơn chị. Về quy tắc ứng xử kinh doanh hay trao đổi danh thiếp thì thời đại học em đã được học nên khá trôi chảy, kỹ năng máy tính cũng không có vấn đề gì ạ.\nTiền bối: Thế là không gặp khó khăn gì à?\nNam: Dạ không, trong các buổi diễn tập nghiệp vụ thực tế, việc ứng biến qua điện thoại khi khách hàng bất ngờ khiếu nại thực sự rất khó ạ. Mọi chuyện không theo sách vở mà phải vừa thấu hiểu cảm xúc khách hàng vừa lựa lời, cực kỳ gian nan ạ.\nTiền bối: Ra vậy. Nhưng cái đó qua thời gian tích lũy kinh nghiệm sẽ giỏi lên thôi em đừng lo.\nCâu hỏi: Điều mà nhân viên mới chia sẻ là thấy vất vả nhất trong kỳ tập huấn là gì?",
    options: [
      "名刺交換や挨拶などのビジネスマナー",
      "パソコンの専門ソフトウェアの操作",
      "電話でのクレームに対する臨機応変な対応",
      "毎日の研修日誌の作成"
    ],
    answers: [2],
    explanation: "Manner kinh doanh và thao tác máy tính nhân viên mới làm tốt. Điều vất vả nhất được nhấn mạnh là: 'お客様からの急なクレームに対して電話で臨機応変に対応するのが本当に難しかったです' (xử lý ứng biến linh hoạt qua điện thoại khi khách hàng khiếu nại). Đáp án đúng là 3."
  },
  {
    id: 78,
    mondai: "問題 2: ポイント理解",
    majorSection: "listening",
    type: "single",
    question: "このカフェが地域の顧客に長く愛されている一番の理由は何ですか。",
    audioScript: "テレビ番組でリポーターが人気の老舗カフェについて紹介しています。\n女：住宅街の路地裏にあるこちらのカフェ。創業から40年以上、地元の人々に愛され続けています。人気の秘密はどこにあるのでしょうか。マスターに伺うと、こだわりの自家焙煎コーヒーや手作りのチーズケーキももちろん好評ですが、一番大切にしているのは「お客様一人ひとりの好みを覚えること」だそうです。いつもミルクを多めにする人、熱めを好む人など、常連さんの好みに合わせて微調整して提供しているのだとか。「ここに来るとほっとする」という声が多いのも頷けますね。\n質問：このカフェが地域の顧客に長く愛されている一番の理由は何ですか。",
    vietnameseTranslation: "Trong chương trình TV, phóng viên đang giới thiệu về quán cafe lâu đời được yêu thích.\nPhóng viên: Quán cafe nằm trong một con ngõ nhỏ khu dân cư này đã hoạt động hơn 40 năm và liên tục nhận được sự mến mộ của người dân địa phương. Bí quyết nằm ở đâu? Khi hỏi chủ quán, cà phê tự rang xay hay bánh cheesecake làm thủ công dĩ nhiên được khen ngợi, nhưng điều ông trân trọng nhất chính là 'ghi nhớ thói quen sở thích của từng vị khách'. Khách nào thích nhiều sữa, khách nào thích uống thật nóng, quán đều tinh chỉnh vừa vặn theo thói quen của khách quen. Thảo nào rất nhiều người nhận xét 'Cứ đến đây là cảm thấy an lòng'.\nCâu hỏi: Lý do số một giúp quán cafe này được khách hàng khu vực yêu mến bền lâu là gì?",
    options: [
      "コーヒーの価格が他店より圧倒的に安いから",
      "チーズケーキがSNSで若者に大流行しているから",
      "客一人ひとりの細かい好みに寄り添って提供しているから",
      "駅前の一等地にあって立ち寄りやすいから"
    ],
    answers: [2],
    explanation: "Bài phóng sự nêu rõ điểm mấu chốt: '一番大切にしているのはお客様一人ひとりの好みを覚えること' (ghi nhớ và tinh chỉnh theo sở thích riêng của từng khách hàng). Đáp án đúng là 3."
  },
  {
    id: 79,
    mondai: "問題 2: ポイント理解",
    majorSection: "listening",
    type: "single",
    question: "女性が新しいスマートウォッチを購入して最も重宝している機能は何ですか。",
    audioScript: "友人同士の男女が話しています。\n男：その時計、新しく買ったスマートウォッチ？かっこいいね。\n女：そうなの！先週買ったばかりなんだけど、想像以上に便利だよ。\n男：歩数とか心拍数が測れるやつでしょ？運動する人にはいいよね。\n女：うん、健康管理もいいんだけど、私にとって一番助かっているのは通知機能なんだ。仕事中や満員電車でスマホをバッグから出せないときでも、大事な家族からの連絡や急ぎの業務チャットを手元ですぐ確認して簡単な返信までできちゃうの。見落としが完全になくなったよ。\n男：へえ、確かにそれは仕事でも役立ちそうだね。\n質問：女性が新しいスマートウォッチを購入して最も重宝している機能は何ですか。",
    vietnameseTranslation: "Hai người bạn nam nữ đang nói chuyện.\nNam: Cái đồng hồ đó là smartwatch mới mua hả? Trông ngầu ghê.\nNữ: Ừ đúng rồi! Tớ vừa tậu tuần trước, tiện lợi hơn tưởng tượng nhiều luôn.\nNam: Loại đo bước chân với nhịp tim đúng không? Dành cho người tập thể thao thì hợp lý nhỉ.\nNữ: Ừ, quản lý sức khỏe cũng tốt, nhưng với tớ điều hữu ích nhất lại là tính năng thông báo cơ. Khi đang làm việc hoặc trên tàu đông đúc không tiện lôi điện thoại ra khỏi túi xách, tớ vẫn xem được ngay tin nhắn quan trọng của gia đình hay chat công việc khẩn cấp ngay trên cổ tay, thậm chí phản hồi nhanh được luôn. Không còn bị sót việc nữa.\nNam: Ồ, đúng là tiện lợi trong công việc thật đấy.\nCâu hỏi: Tính năng mà người phụ nữ thấy tâm đắc và hữu dụng nhất là gì?",
    options: [
      "心拍数や睡眠を記録する健康管理機能",
      "手元でメッセージを確認してすぐ返信できる通知機能",
      "電子マネーで買い物ができる決済機能",
      "GPSで現在地を確認できる地図機能"
    ],
    answers: [1],
    explanation: "Nhân vật nữ nhấn mạnh: '私にとって一番助かっているのは通知機能なんだ。仕事中や満員電車で... 大事な連絡を手元ですぐ確認して簡単な返信までできちゃう' (tính năng thông báo kiểm tra tin nhắn và phản hồi tức thì trên cổ tay). Đáp án đúng là 2."
  },

  // Mondai 3: 概要理解 (Q80 - Q84: 5 câu)
  {
    id: 80,
    mondai: "問題 3: 概要理解",
    majorSection: "listening",
    type: "single",
    question: "専門家は何について話していますか。",
    audioScript: "テレビで環境問題の専門家が話しています。\n男：プラスチックごみによる海洋汚染が世界的な課題となっていますが、最近ではプラスチックをただ排除するだけでなく、植物由来のバイオマスプラスチックや、自然界で完全に分解される生分解性素材の開発が急速に進んでいます。また、使い捨て容器を有料化する法整備や、消費者がマイボトルやエコバッグを持参するライフスタイルの定着も各地で見られます。技術開発と社会制度、そして個人の意識改革という三者がうまく噛み合ってこそ、持続可能な社会への道が開けるのです。\n質問：専門家は何について話していますか。",
    vietnameseTranslation: "Trên truyền hình, chuyên gia môi trường đang phát biểu.\nChuyên gia: Ô nhiễm đại dương do rác thải nhựa đang là thách thức toàn cầu. Gần đây, không chỉ dừng lại ở việc loại bỏ đồ nhựa, các nghiên cứu phát triển nhựa sinh học từ thực vật hay vật liệu tự phân hủy sinh học trong tự nhiên đang tiến triển nhanh chóng. Đồng thời, khung pháp lý thu phí đồ dùng một lần cũng như thói quen mang theo bình nước cá nhân, túi vải của người tiêu dùng cũng đang ăn sâu vào nếp sống. Chỉ khi ba yếu tố: phát triển công nghệ, thể chế xã hội và thay đổi ý thức từng cá nhân phối hợp nhịp nhàng, con đường hướng tới xã hội phát triển bền vững mới thực sự rộng mở.\nCâu hỏi: Chuyên gia đang nói về điều gì?",
    options: [
      "海洋生物の生態系の変化",
      "プラスチックごみ問題に対する多角的な取り組みと展望",
      "生分解性プラスチックの製造コストの課題",
      "使い捨て容器を有料化する法律の歴史"
    ],
    answers: [1],
    explanation: "Toàn bài nói độc thoại nêu lên bức tranh tổng thể: vấn đề rác thải nhựa và các giải pháp đa chiều kết hợp giữa công nghệ, chính sách và ý thức cộng đồng (多角的な取り組みと展望). Đáp án đúng là 2."
  },
  {
    id: 81,
    mondai: "問題 3: 概要理解",
    majorSection: "listening",
    type: "single",
    question: "アナウンサーは何について伝えていますか。",
    audioScript: "ラジオでアナウンサーが地域の取り組みについて伝えています。\n女：少子高齢化が進む地方の自治体で、空き家を活用した新しい地域活性化の試みが注目を集めています。放置されていた古い民家を改装し、都市部のリモートワーカー向けのサテライトオフィスや、観光客が泊まれる宿泊施設として再生させる取り組みです。これにより、移住者を呼び込むだけでなく、地元の農家や飲食店との新たな経済的な交流が生まれ、町全体に活気が戻りつつあります。\n質問：アナウンサーは何について伝えていますか。",
    vietnameseTranslation: "Trên đài phát thanh, phát thanh viên đang đưa tin về sáng kiến tại địa phương.\nPhát thanh viên: Tại các địa phương có xu hướng già hóa dân số và giảm sinh, mô hình hồi sinh cộng đồng thông qua việc tận dụng nhà bỏ hoang đang thu hút nhiều sự quan tâm. Các căn nhà cổ bị bỏ phế được cải tạo thành văn phòng làm việc từ xa (satellite office) cho nhân sự các đô thị lớn, hoặc homestay đón khách du lịch. Nhờ đó, không chỉ thu hút người trẻ chuyển về sinh sống, mà còn tạo ra sự giao lưu kinh tế với nông dân và quán ăn địa phương, dần lấy lại sức sống cho toàn thị trấn.\nCâu hỏi: Phát thanh viên đang đưa tin về nội dung gì?",
    options: [
      "地方の空き家を改修して地域活性化につなげる取り組み",
      "都市部におけるリモートワークの課題と解決策",
      "農村部での高齢者向け福祉施設の建設状況",
      "歴史的建造物をそのまま保存するための支援制度"
    ],
    answers: [0],
    explanation: "Nội dung bài nói tập trung vào việc cải tạo nhà bỏ hoang (空き家) thành văn phòng vệ tinh và nơi lưu trú, giúp hồi sinh nền kinh tế khu vực địa phương (地域活性化). Đáp án đúng là 1."
  },
  {
    id: 82,
    mondai: "問題 3: 概要理解",
    majorSection: "listening",
    type: "single",
    question: "スポーツインストラクターが伝えたい主なメッセージは何ですか。",
    audioScript: "セミナーでスポーツインストラクターが話しています。\n男：健康のために運動を始めようとする方の多くが、「毎日1時間走る」など最初から高い目標を掲げがちです。しかし、急激な変化は心身に負担をかけ、挫折の原因になります。大切なのは、エレベーターを使わずに階段を使う、寝る前に3分だけストレッチをするなど、日常生活の中で無理なく続けられる小さな習慣から始めることです。運動は「量」よりも「継続」こそが、真の健康をもたらす秘訣なのです。\n質問：スポーツインストラクターが伝えたい主なメッセージは何ですか。",
    vietnameseTranslation: "Tại buổi hội thảo, huấn luyện viên thể thao đang phát biểu.\nHuấn luyện viên: Nhiều người khi bắt đầu tập thể dục để nâng cao sức khỏe thường đặt ra những mục tiêu rất cao như 'mỗi ngày chạy bộ 1 tiếng'. Thế nhưng việc thay đổi đột ngột như vậy gây quá tải cho thể chất lẫn tinh thần và là nguyên nhân chính dẫn đến bỏ cuộc giữa chừng. Điều cốt lõi là hãy bắt đầu từ những thói quen nhỏ dễ duy trì trong sinh hoạt hàng ngày như đi thang bộ thay vì thang máy, hay giãn cơ 3 phút trước khi đi ngủ. Trong rèn luyện thân thể, 'sự kiên trì đều đặn' mới là bí quyết mang lại sức khỏe thực sự, chứ không phải 'khối lượng tập dồn dập'.\nCâu hỏi: Thông điệp chính mà huấn luyện viên muốn truyền tải là gì?",
    options: [
      "短期間で効果を出すには激しい有酸素運動が必要である",
      "無理のない小さな運動習慣を継続することが何より重要である",
      "ストレッチよりもランニングを優先すべきである",
      "スポーツジムに通ってプロの指導を受けるべきである"
    ],
    answers: [1],
    explanation: "Ý đồ xuyên suốt của người nói là khẳng định: không nên đặt mục tiêu quá sức, mà việc duy trì những thói quen vận động nhỏ một cách đều đặn mới là yếu tố quyết định ('量よりも継続こそが、真の健康をもたらす秘訣'). Đáp án đúng là 2."
  },
  {
    id: 83,
    mondai: "問題 3: 概要理解",
    majorSection: "listening",
    type: "single",
    question: "経営コンサルタントは何について解説していますか。",
    audioScript: "ビジネスセミナーで経営コンサルタントが話しています。\n女：現代の企業経営において、「心理的安全性」の確保が不可欠とされています。社員が上司や同僚からの批判を恐れず、率直な意見や失敗談を共有できる環境のことです。心理的安全性が高いチームでは、新しいアイデアが積極的に提案され、業務のミスも隠蔽されずに早期に発見・対処されます。結果としてチーム全体のイノベーションが加速し、業績向上に直結するのです。\n質問：経営コンサルタントは何について解説していますか。",
    vietnameseTranslation: "Tại hội thảo doanh nghiệp, chuyên gia tư vấn quản trị đang thuyết trình.\nChuyên gia: Trong quản trị doanh nghiệp hiện đại, việc đảm bảo 'an toàn tâm lý' (psychological safety) được xem là yếu tố sống còn. Đó là môi trường nơi nhân viên không lo sợ bị cấp trên hay đồng nghiệp chỉ trích, có thể thoải mái nêu ý kiến thẳng thắn cũng như chia sẻ về các sai lầm. Trong một tập thể có mức an toàn tâm lý cao, những ý tưởng mới mẻ sẽ liên tục được đề xuất, và sai sót trong công việc cũng không bị giấu giếm mà được phát hiện, xử lý từ sớm. Kết quả là đổi mới sáng tạo được thúc đẩy mạnh mẽ, mang lại tăng trưởng hiệu quả kinh doanh.\nCâu hỏi: Chuyên gia tư vấn đang phân tích về điều gì?",
    options: [
      "社員の健康管理とストレス診断の実施方法",
      "職場における心理的安全性とその効果",
      "新規事業立ち上げにおける資金調達の手法",
      "テレワークでの人事評価制度の難しさ"
    ],
    answers: [1],
    explanation: "Chuyên gia tập trung định nghĩa và phân tích tầm quan trọng cùng các tác động tích cực của 'an toàn tâm lý tại nơi làm việc' (心理的安全性とその効果). Đáp án đúng là 2."
  },
  {
    id: 84,
    mondai: "問題 3: 概要理解",
    majorSection: "listening",
    type: "single",
    question: "話者は睡眠の質を高めるために何を勧めていますか。",
    audioScript: "ラジオの健康番組で医師が話しています。\n男：朝すっきりと目覚められないという相談をよく受けます。質の良い睡眠を取るためには、就寝前の過ごし方がカギを握っています。就寝の直前までスマホやPCの強い光を浴びていると、脳が昼間だと錯覚してメラトニンの分泌が抑制されてしまいます。ぬるめのお湯にゆっくり浸かって体温を上げ、就寝前の1時間はデジタル画面から離れて照明を落とし、読書や静かな音楽でリラックスして過ごすことをお勧めします。\n質問：話者は睡眠の質を高めるために何を勧めていますか。",
    vietnameseTranslation: "Trong chương trình sức khỏe trên radio, bác sĩ chia sẻ.\nBác sĩ: Tôi thường xuyên nhận được tâm sự của thính giả về việc sáng dậy người uể oải không tỉnh táo. Để có giấc ngủ chất lượng cao, khoảng thời gian trước khi ngủ đóng vai trò quyết định. Nếu xem ánh sáng mạnh từ điện thoại hay máy tính ngay trước khi ngủ, não bộ sẽ tưởng lầm là ban ngày và ức chế tiết hormone melatonin. Tôi khuyên mọi người nên ngâm mình trong nước ấm để thân nhiệt tăng lên, và trước khi ngủ 1 tiếng hãy rời xa các màn hình điện tử, hạ bớt ánh đèn, thư giãn bằng việc đọc sách hoặc nghe nhạc nhẹ nhàng.\nCâu hỏi: Người nói khuyến nghị điều gì để nâng cao chất lượng giấc ngủ?",
    options: [
      "就寝直前に熱いお風呂に入ること",
      "寝る前にスマートフォンでリラックス動画を見ること",
      "就寝前1時間は画面を見ず、照明を落として過ごすこと",
      "朝早く起きて激しい運動をすること"
    ],
    answers: [2],
    explanation: "Bác sĩ khuyến nghị rõ ràng: trước khi ngủ 1 tiếng nên tránh xa màn hình điện thoại/máy tính và giảm ánh sáng phòng ('就寝前の1時間はデジタル画面から離れて照明を落とし... リラックスして過ごすことをお勧めします'). Đáp án đúng là 3."
  },

  // Mondai 4: 即時応答 (Q85 - Q95: 11 câu, 3 đáp án theo chuẩn JLPT)
  {
    id: 85,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "先輩：山田君、さっき頼んだ企画書のコピー、もうできた？",
    audioScript: "先輩：山田君、さっき頼んだ企画書のコピー、もうできた？\n1、ええ、まだやっていません。\n2、はい、先ほどデスクの上に置いておきました。\n3、いいえ、もう終わりました。",
    vietnameseTranslation: "Tiền bối: Yamada, bản photocopy bản kế hoạch hồi nãy chị nhờ, đã xong chưa em?\n1: Vâng, em vẫn chưa làm đâu.\n2: Dạ rồi ạ, lúc nãy em đã để sẵn trên bàn làm việc của chị rồi ạ.\n3: Không, đã xong xuôi rồi ạ.",
    options: [
      "ええ、まだやっていません。",
      "はい、先ほどデスクの上に置いておきました。",
      "いいえ、もう終わりました。"
    ],
    answers: [1],
    explanation: "Khi được hỏi 'Đã xong chưa?', câu đáp tự nhiên và lịch sự là: 'はい、先ほどデスクの上に置いておきました' (Dạ rồi ạ, em đã để sẵn trên bàn của chị rồi). Phương án 1 dùng 'ええ' (đồng ý) nhưng lại nói 'chưa làm', phương án 3 dùng 'いいえ' (phủ định) nhưng lại bảo 'xong rồi', ngữ nghĩa mâu thuẫn. Đáp án đúng là 2."
  },
  {
    id: 86,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "上司：木村さん、この書類の数字、ちょっと確認してもらえないかな。",
    audioScript: "上司：木村さん、この書類の数字、ちょっと確認してもらえないかな。\n1、はい、すぐに拝見いたします。\n2、いえ、確認してあげますよ。\n3、はい、確認させてあげてください。",
    vietnameseTranslation: "Cấp trên: Kimura, con số trong tập tài liệu này, em kiểm tra lại giúp anh một chút được không?\n1: Vâng, em xin phép xem và đối chiếu ngay ạ.\n2: Không, tôi sẽ kiểm tra cho anh.\n3: Vâng, hãy cho phép tôi kiểm tra cho anh.",
    options: [
      "はい、すぐに拝見いたします。",
      "いえ、確認してあげますよ。",
      "はい、確認させてあげてください。"
    ],
    answers: [0],
    explanation: "Khi cấp trên nhờ kiểm tra tài liệu, cấp dưới dùng khiêm nhường ngữ 'はい、すぐに拝見いたします' (Vâng, em xin phép xem ngay ạ). Các phương án dùng '〜てあげる' là nói với người dưới, rất khiếm nhã khi nói với cấp trên. Đáp án đúng là 1."
  },
  {
    id: 87,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "同僚：明日の懇親会、佐藤さんも来るんだっけ？",
    audioScript: "同僚：明日の懇親会、佐藤さんも来るんだっけ？\n1、うん、急用が入って来られないって言ってたよ。\n2、いえ、佐藤さんも来るそうですよ。\n3、ええ、佐藤さんは来ない予定だよ。",
    vietnameseTranslation: "Đồng nghiệp: Bữa tiệc giao lưu ngày mai, Sato cũng đến đúng không nhỉ?\n1: Ừm, anh ấy bảo có việc bận đột xuất nên không đến được đâu.\n2: Không, nghe nói Sato cũng sẽ đến đấy.\n3: Ừ, Sato có kế hoạch không đến đâu.",
    options: [
      "うん、急用が入って来られないって言ってたよ。",
      "いえ、佐藤さんも来るそうですよ。",
      "ええ、佐藤さんは来ない予定だよ。"
    ],
    answers: [0],
    explanation: "Câu hỏi xác nhận thông tin '〜だっけ？'. Trả lời hợp lý là 'うん、急用が入って来られないって言ってたよ' (Ừm, anh ấy báo bận việc đột xuất nên không tới được). Phương án 2 trả lời 'いえ' nhưng lại bảo 'cũng đến', phương án 3 'ええ' nhưng lại bảo 'không đến' gây lệch ngữ nghĩa. Đáp án đúng là 1."
  },
  {
    id: 88,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "取引先：本日は遠いところまでご足労いただき、恐れ入ります。",
    audioScript: "取引先：本日は遠いところまでご足労いただき、恐れ入ります。\n1、どういたしまして、お疲れ様でした。\n2、こちらこそ、お時間をいただき感謝申し上げます。\n3、いえ、近いですから大したことありません。",
    vietnameseTranslation: "Đối tác: Hôm nay quý công ty đã cất công đường sá xa xôi đến đây, chúng tôi thật áy náy và cảm kích.\n1: Không có gì, vất vả cho ngài rồi.\n2: Chính chúng tôi mới là người phải cảm ơn ngài đã dành thời gian quý báu cho buổi gặp gỡ hôm nay ạ.\n3: Không, gần mà có gì to tát đâu.",
    options: [
      "どういたしまして、お疲れ様でした。",
      "こちらこそ、お時間をいただき感謝申し上げます。",
      "いえ、近いですから大したことありません。"
    ],
    answers: [1],
    explanation: "Khi đối tác chào kính ngữ xã giao 'ご足労いただき恐れ入ります' (Cảm ơn quý khách đã lặn lội đến đây), câu đáp chuẩn mực thương mại là: 'こちらこそ、お時間をいただき感謝申し上げます' (Chính chúng tôi mới phải cảm ơn vì được quý vị dành thời gian). Đáp án đúng là 2."
  },
  {
    id: 89,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "友人：田中君、プレゼンの準備、手伝おうか？",
    audioScript: "友人：田中君、プレゼンの準備、手伝おうか？\n1、ほんと？助かるよ、ありがとう！\n2、ううん、ぜひ手伝って。\n3、ええ、手伝ってあげるよ。",
    vietnameseTranslation: "Bạn bè: Tanaka, chuẩn bị bài thuyết trình tớ giúp một tay nhé?\n1: Thật á? Được thế thì cứu tớ quá, cảm ơn cậu nhiều!\n2: Không, cậu nhất định phải giúp nhé.\n3: Ừ, tớ sẽ giúp cậu.",
    options: [
      "ほんと？助かるよ、ありがとう！",
      "ううん、ぜひ手伝って。",
      "ええ、手伝ってあげるよ。"
    ],
    answers: [0],
    explanation: "Khi bạn bè đề nghị giúp đỡ, đáp lại vui mừng: 'ほんと？助かるよ、ありがとう！' (Thật á? Cứu bồ quá, cảm ơn cậu nhiều!). Đáp án đúng là 1."
  },
  {
    id: 90,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "後輩：先輩、このプロジェクト、私一人では荷が重いのですが…",
    audioScript: "後輩：先輩、このプロジェクト、私一人では荷が重いのですが…\n1、そうか、一人で全部やってくれて助かるよ。\n2、大丈夫、私がしっかりフォローするから一緒にやろう。\n3、そんなに重い荷物なら私が運ぶよ。",
    vietnameseTranslation: "Hậu bối: Tiền bối, dự án này mà một mình em gánh vác thì quá sức đối với em ạ...\n1: Thế à, một mình em làm hết thì đỡ cho chị quá.\n2: Không sao đâu, chị sẽ hỗ trợ sát sao nên chúng ta cùng làm nhé.\n3: Hành lý nặng thế thì để chị xách cho.",
    options: [
      "そうか、一人で全部やってくれて助かるよ。",
      "大丈夫、私がしっかりフォローするから一緒にやろう。",
      "そんなに重い荷物なら私が運ぶよ。"
    ],
    answers: [1],
    explanation: "'荷が重い' là quán dụng ngữ chỉ trách nhiệm hay nhiệm vụ quá sức/nặng nề. Người tiền bối động viên: '大丈夫、私がしっかりフォローするから一緒にやろう' (Không sao, chị sẽ theo sát hỗ trợ nên hai chị em cùng làm). Phương án 3 hiểu lầm nghĩa đen là 'hành lý đồ đạc'. Đáp án đúng là 2."
  },
  {
    id: 91,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "上司：小林さん、明日の午前中、社内研修が入ってること、覚えてる？",
    audioScript: "上司：小林さん、明日の午前中、社内研修が入ってること、覚えてる？\n1、はい、スケジュール帳にメモしてあります。\n2、いいえ、明日の午前中にやります。\n3、ええ、すっかり忘れていました。",
    vietnameseTranslation: "Cấp trên: Kobayashi, sáng mai có lịch đào tạo nội bộ công ty, em nhớ chứ?\n1: Vâng ạ, em đã ghi chú sẵn trong sổ tay lịch trình rồi ạ.\n2: Dạ không, sáng mai em mới làm.\n3: Vâng, em quên sạch rồi ạ.",
    options: [
      "はい、スケジュール帳にメモしてあります。",
      "いいえ、明日の午前中にやります。",
      "ええ、すっかり忘れていました。"
    ],
    answers: [0],
    explanation: "Khi sếp hỏi có nhớ lịch không, trả lời chuẩn là: 'はい、スケジュール帳にメモしてあります' (Vâng em nhớ và đã ghi trong sổ tay). Đáp án đúng là 1."
  },
  {
    id: 92,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "店員：お客様、こちらの商品はあいにく本日品切れとなっておりまして…",
    audioScript: "店員：お客様、こちらの商品はあいにく本日品切れとなっておりまして…\n1、じゃあ、今すぐ買っていきます。\n2、そうですか、次の入荷はいつ頃になりますか。\n3、いえ、まだ売れ残っているんですね。",
    vietnameseTranslation: "Nhân viên: Thưa quý khách, mặt hàng này hôm nay tiếc là đã hết sạch hàng mất rồi ạ...\n1: Vậy thì tôi sẽ mua mang về ngay bây giờ.\n2: Ra vậy, thế đợt hàng tiếp theo dự kiến bao giờ về vậy bạn?\n3: Không, vậy là vẫn còn hàng tồn nhỉ.",
    options: [
      "じゃあ、今すぐ買っていきます。",
      "そうですか、次の入荷はいつ頃になりますか。",
      "いえ、まだ売れ残っているんですね。"
    ],
    answers: [1],
    explanation: "Nhân viên báo hết hàng ('品切れ'), khách hàng hỏi lịch đợt hàng sau: 'そうですか、次の入荷はいつ頃になりますか' (Vậy à, bao giờ có hàng đợt mới về vậy bạn?). Đáp án đúng là 2."
  },
  {
    id: 93,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "同僚：中村君、さっきの会議での発言、ちょっと言い過ぎたんじゃない？",
    audioScript: "同僚：中村君、さっきの会議での発言、ちょっと言い過ぎたんじゃない？\n1、うん、もっと強く言うべきだったね。\n2、確かに少し感情的になっちゃった。反省してるよ。\n3、いいえ、相手が言い過ぎたんだよ。",
    vietnameseTranslation: "Đồng nghiệp: Nakamura, phát ngôn trong cuộc họp ban nãy, cậu có hơi lỡ lời quá đà không đấy?\n1: Ừ, đáng ra tớ nên nói gay gắt hơn nữa nhỉ.\n2: Đúng là lúc đó tớ hơi bị cảm xúc chi phối. Tớ cũng đang tự kiểm điểm đây.\n3: Không đâu, phía bên kia mới là nói quá lời đấy.",
    options: [
      "うん、もっと強く言うべきだったね。",
      "確かに少し感情的になっちゃった。反省してるよ。",
      "いいえ、相手が言い過ぎたんだよ。"
    ],
    answers: [1],
    explanation: "Khi bạn đồng nghiệp nhắc nhở có phần nói quá lời ('言い過ぎたんじゃない？'), cách thừa nhận khéo léo là: '確かに少し感情的になっちゃった。反省してるよ' (Đúng là lúc ấy tớ hơi cảm tính, tớ đang kiểm điểm bản thân đây). Đáp án đúng là 2."
  },
  {
    id: 94,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "先輩：高橋さん、今日の飲み会、無理して付き合わなくてもいいからね。",
    audioScript: "先輩：高橋さん、今日の飲み会、無理して付き合わなくてもいいからね。\n1、お気遣いありがとうございます。今日は体調が優れないので失礼します。\n2、はい、ぜひ無理してください。\n3、いいえ、絶対に付き合わないといけません。",
    vietnameseTranslation: "Tiền bối: Takahashi, bữa nhậu liên hoan hôm nay nếu mệt thì em không cần phải gượng ép đi cùng đâu nhé.\n1: Em cảm ơn chị đã chu đáo quan tâm ạ. Hôm nay người em hơi mệt nên cho em xin phép vắng mặt ạ.\n2: Vâng, chị nhất định hãy gượng ép nhé.\n3: Không, nhất định em phải đi cùng chị mới được.",
    options: [
      "お気遣いありがとうございます。今日は体調が優れないので失礼します。",
      "はい、ぜひ無理してください。",
      "いいえ、絶対に付き合わないといけません。"
    ],
    answers: [0],
    explanation: "Tiền bối quan tâm mở lời khuyên không phải gượng ép đi cùng, hậu bối cảm ơn và xin phép cáo lui: 'お気遣いありがとうございます。今日は体調が優れないので失礼します'. Đáp án đúng là 1."
  },
  {
    id: 95,
    mondai: "問題 4: 即時応答",
    majorSection: "listening",
    type: "single",
    question: "課長：鈴木さん、明日の契約書、先方に送る前に必ず私の目を通しておいてね。",
    audioScript: "課長：鈴木さん、明日の契約書、先方に送る前に必ず私の目を通しておいてね。\n1、はい、事前に課長にご確認いただきます。\n2、いいえ、もう先方に送っておきました。\n3、はい、私の目を通しておきます。",
    vietnameseTranslation: "Trưởng phòng: Suzuki, bản hợp đồng ngày mai, trước khi gửi cho phía đối tác nhớ đưa qua tôi xem duyệt trước nhé.\n1: Vâng, em nhất định sẽ trình trưởng phòng xem xét trước ạ.\n2: Không, em đã lỡ gửi cho đối tác mất rồi.\n3: Vâng, tôi sẽ đưa qua mắt của tôi.",
    options: [
      "はい、事前に課長にご確認いただきます。",
      "いいえ、もう先方に送っておきました。",
      "はい、私の目を通しておきます。"
    ],
    answers: [0],
    explanation: "'目を通す' là xem qua / duyệt qua. Sếp dặn '私の目を通しておいてね' nghĩa là đưa sếp xem duyệt trước khi gửi khách. Suzuki đáp kính ngữ: 'はい、事前に課長にご確認いただきます' (Vâng, em sẽ trình trưởng phòng xác nhận trước ạ). Đáp án đúng là 1."
  },

  // Mondai 5: 統合理解 (Q96 - Q98: 3 câu)
  {
    id: 96,
    mondai: "問題 5: 統合理解",
    majorSection: "listening",
    type: "single",
    question: "旅行代理店の人が紹介した4つのプランのうち、温泉と地元の特産料理を両方楽しめて、移動が最も楽なプランはどれですか。",
    audioScript: "旅行会社で夫婦と担当者が話しています。\n担当者：秋の週末旅行ですね。おすすめの4つのプランをご提案いたします。\nまず1番のプランは、新幹線の駅から専用送迎バスで15分の高級温泉宿です。地元のブランド牛のすき焼き会席が自慢です。\n2番のプランは、歴史ある山あいの秘湯です。電車と路線バスを乗り継いで2時間かかりますが、川魚や山菜の郷土料理が絶品です。\n3番のプランは、海沿いのリゾートホテルです。駅から徒歩5分とアクセス抜群で、新鮮な海の幸バイキングとオーシャンビューの展望風呂が楽しめます。\n4番のプランは、自然豊かな高原コテージです。レンタカーの運転が必要ですが、星空を眺めながらバーベキューが楽しめます。\n夫：僕は移動で疲れたくないから、駅から近くてアクセスが良いところがいいな。美味しい海の幸も食べたいし。\n妻：でも、せっかくの秋の旅行だから、ゆっくり温泉に浸かって、落ち着いたお座敷で地元の特産料理を食べたいわ。新幹線の駅から送迎バスですぐの1番なら、移動も楽だし希望にぴったりじゃない？\n夫：確かに送迎バスがあるなら楽だね。ブランド牛も惹かれるな。じゃあ、それにしよう！\n質問：旅行代理店の人が紹介した4つのプランのうち、温泉と地元の特産料理を両方楽しめて、移動が最も楽なプランはどれですか。",
    vietnameseTranslation: "Tại công ty du lịch, hai vợ chồng đang nghe nhân viên tư vấn.\nNhân viên: Chuyến du lịch cuối tuần mùa thu phải không ạ. Tôi xin giới thiệu 4 gói sau:\nGói 1: Nhà nghỉ suối nước nóng cao cấp cách ga Shinkansen 15 phút xe buýt đưa đón riêng. Nổi tiếng với tiệc lẩu Sukiyaki bò đặc sản địa phương.\nGói 2: Suối nước nóng bí ẩn vùng núi sâu. Phải đổi tàu và xe buýt mất 2 tiếng, nhưng có đặc sản cá suối và rau rừng tuyệt hảo.\nGói 3: Khách sạn resort ven biển. Cách ga 5 phút đi bộ tiện đi lại, có buffet hải sản tươi sống và bồn tắm ngắm biển.\nGói 4: Cottage nghỉ dưỡng trên cao nguyên. Cần tự lái xe thuê, thưởng thức tiệc BBQ dưới trời sao.\nChồng: Anh không muốn bị mệt vì đi lại, muốn chỗ nào gần ga đi lại thuận tiện. Lại được ăn hải sản nữa.\nVợ: Nhưng hiếm khi đi chơi mùa thu, em muốn ngâm suối nước nóng thư thả và thưởng thức món đặc sản địa phương trong phòng chiếu Tatami yên tĩnh cơ. Gói 1 có xe buýt đưa đón ngay từ ga Shinkansen, đi lại vừa nhàn vừa đúng ý chúng mình còn gì?\nChồng: Ừ nhỉ, có xe buýt đưa đón thì nhàn thật. Món thịt bò thương hiệu nghe cũng hấp dẫn. Vậy chốt gói đó nhé!\nCâu hỏi: Trong 4 gói, gói vừa có suối nước nóng, vừa có đặc sản địa phương và việc di chuyển thuận tiện nhất là gói nào?",
    options: [
      "1番の高級温泉宿プラン",
      "2番の山あいの秘湯プラン",
      "3番の海沿いリゾートホテルプラン",
      "4番の高原コテージプラン"
    ],
    answers: [0],
    explanation: "Gói 1 có suối nước nóng (温泉宿), có xe buýt đưa đón riêng 15 phút từ ga Shinkansen (移動が楽), và có đặc sản thịt bò thương hiệu (地元の特産料理). Cả hai vợ chồng cùng đồng ý chọn gói 1. Đáp án đúng là 1."
  },
  {
    id: 97,
    mondai: "問題 5: 統合理解",
    majorSection: "listening",
    type: "single",
    question: "男性（夫）が最初に気に入っていたプランはどれですか。",
    audioScript: "（先ほどの会話より）\n夫：僕は移動で疲れたくないから、駅から近くてアクセスが良いところがいいな。美味しい海の幸も食べたいし。\n質問：男性（夫）が最初に気に入っていたプランはどれですか。",
    vietnameseTranslation: "(Từ đoạn hội thoại trên)\nNgười chồng: Anh không muốn mệt mỏi vì đi lại nên muốn chỗ gần ga đi lại thuận tiện (cách ga 5 phút đi bộ), lại được ăn hải sản tươi ngon nữa.\nCâu hỏi: Gói mà người chồng ban đầu ưa thích là gói nào?",
    options: [
      "1番の高級温泉宿プラン",
      "2番の山あいの秘湯プラン",
      "3番の海沿いリゾートホテルプラン",
      "4番の高原コテージプラン"
    ],
    answers: [2],
    explanation: "Người chồng ban đầu nói: muốn gần ga và thích ăn hải sản ('駅から近くてアクセスが良い... 美味しい海の幸も食べたい'), đó chính là đặc điểm của Gói 3 (hải sản buffet và đi bộ 5 phút từ ga). Đáp án đúng là 3."
  },
  {
    id: 98,
    mondai: "問題 5: 統合理解",
    majorSection: "listening",
    type: "single",
    question: "二人が最終的に予約することにしたプランはどれですか。",
    audioScript: "（先ほどの会話より）\n妻：新幹線の駅から送迎バスですぐの1番なら、移動も楽だし希望にぴったりじゃない？\n夫：確かに送迎バスがあるなら楽だね。ブランド牛も惹かれるな。じゃあ、それにしよう！\n質問：二人が最終的に予約することにしたプランはどれですか。",
    vietnameseTranslation: "(Từ đoạn hội thoại trên)\nNgười vợ: Gói 1 có xe đưa đón từ ga Shinkansen, đi lại nhàn hạ mà hợp ý chúng mình.\nNgười chồng: Ừ có xe đưa đón thì nhàn thật. Thịt bò thương hiệu nghe cũng hấp dẫn. Vậy chốt gói đó nhé!\nCâu hỏi: Gói mà hai vợ chồng cuối cùng quyết định đặt là gói nào?",
    options: [
      "1番のプラン",
      "2番のプラン",
      "3番のプラン",
      "4番のプラン"
    ],
    answers: [0],
    explanation: "Cả hai vợ chồng thống nhất ở cuối hội thoại: 'じゃあ、それにしよう！' chốt Gói 1. Đáp án đúng là 1 (1番のプラン)."
  }
];

// Append listeningQuestions to exam.questions
listeningQuestions.forEach(q => {
  exam.questions.push(q);
});

fs.writeFileSync(filePath, JSON.stringify(exam, null, 2), 'utf8');
console.log(`Successfully added 30 listening questions to jlpt-n2-2025-07.json! Total questions: ${exam.questions.length}`);
