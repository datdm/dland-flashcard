"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DetailedLesson } from "@/lib/repositories/types";
import { Vocabulary, GrammarPoint, getSpeechLangCode, getLanguageMetadata } from "@/types";

interface Props {
  lesson: DetailedLesson;
  isPassed: boolean;
  onPass: () => void;
  langCode?: string;
}

export interface DialogueLine {
  speaker: "A" | "B";
  textJa: string;
  textVi: string;
}

interface Question {
  id: number;
  type: "vocab" | "grammar";
  title: string;
  prompt: string;
  dialogue?: DialogueLine[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function generateVocabDialogue(v: Vocabulary, langCode: string = "ja"): DialogueLine[] {
  const meaning = (v.meaning || "").toLowerCase();
  const word = v.kanji || v.hiragana || "";
  const reading = v.hiragana || v.kanji || "";

  if (langCode === "ja") {
    // 1. Chào hỏi & Giao tiếp
    if (meaning.includes("cảm ơn") || reading.includes("ありがとう")) {
      return [
        { speaker: "A", textJa: "手伝ってくれて、本当にありがとうございます。", textVi: "Cảm ơn bạn rất nhiều vì đã giúp đỡ tôi." },
        { speaker: "B", textJa: "いいえ、どういたしまして。", textVi: "Không có chi, đừng bận tâm nhé." },
      ];
    }
    if (meaning.includes("xin lỗi") || reading.includes("すみません") || reading.includes("ごめん")) {
      return [
        { speaker: "A", textJa: "遅れてしまって、すみません！", textVi: "Tôi xin lỗi vì đã đến muộn!" },
        { speaker: "B", textJa: "大丈夫ですよ。気にしないでください。", textVi: "Không sao đâu, bạn đừng bận tâm." },
      ];
    }
    if (meaning.includes("chào buổi sáng") || reading.includes("おはよう")) {
      return [
        { speaker: "A", textJa: "田中さん、おはようございます！", textVi: "Chào buổi sáng anh Tanaka!" },
        { speaker: "B", textJa: "おはようございます。今日も頑張りましょう。", textVi: "Chào buổi sáng. Hôm nay chúng ta cùng cố gắng nhé." },
      ];
    }
    if (meaning.includes("tạm biệt") || reading.includes("さようなら") || reading.includes("じゃあ")) {
      return [
        { speaker: "A", textJa: "それでは、また明日！さようなら。", textVi: "Hẹn gặp lại vào ngày mai nhé! Tạm biệt." },
        { speaker: "B", textJa: "はい、また明日会いましょう。", textVi: "Vâng, hẹn ngày mai gặp lại." },
      ];
    }
    if (meaning.includes("chào") || reading.includes("こんにちは") || reading.includes("こんばんは")) {
      return [
        { speaker: "A", textJa: "みなさん、こんにちは！お元気ですか。", textVi: "Xin chào mọi người! Các bạn có khỏe không?" },
        { speaker: "B", textJa: "こんにちは！とても元気ですよ。", textVi: "Xin chào! Tôi rất khỏe ạ." },
      ];
    }

    // 2. Đại từ & Con người / Nghề nghiệp
    if (meaning === "tôi" || word === "私" || reading === "わたし") {
      return [
        { speaker: "A", textJa: "はじめまして、お名前は何ですか。", textVi: "Rất vui được gặp bạn, tên bạn là gì vậy?" },
        { speaker: "B", textJa: "私はナムです。ベトナムから来ました。", textVi: "Tôi là Nam. Tôi đến từ Việt Nam." },
      ];
    }
    if (meaning.includes("chúng tôi") || reading.includes("わたしたち")) {
      return [
        { speaker: "A", textJa: "皆さんは留学生ですか。", textVi: "Các bạn là du học sinh phải không?" },
        { speaker: "B", textJa: "はい、私たちは東京の大学で勉強しています。", textVi: "Vâng, chúng tôi đang học tại một trường đại học ở Tokyo." },
      ];
    }
    if ((meaning.includes("bạn") && !meaning.includes("bạn bè")) || word === "貴方" || reading === "あなた") {
      return [
        { speaker: "A", textJa: "あなたの趣味は何ですか。", textVi: "Sở thích của bạn là gì vậy?" },
        { speaker: "B", textJa: "私の趣味は音楽を聴くことです。", textVi: "Sở thích của tôi là nghe nhạc." },
      ];
    }
    if (meaning.includes("giáo viên") || meaning.includes("thầy") || meaning.includes("cô") || word === "先生" || word === "教師") {
      return [
        { speaker: "A", textJa: "あの方はどなたですか。", textVi: "Vị kia là ai thế ạ?" },
        { speaker: "B", textJa: "あの方は日本語の先生ですよ。", textVi: "Vị đó là giáo viên tiếng Nhật đấy." },
      ];
    }
    if (meaning.includes("học sinh") || meaning.includes("sinh viên") || word === "学生") {
      return [
        { speaker: "A", textJa: "マイクさんは学生ですか。", textVi: "Mike có phải là học sinh không?" },
        { speaker: "B", textJa: "はい、マイクさんはさくら大学の学生です。", textVi: "Vâng, Mike là sinh viên của trường đại học Sakura." },
      ];
    }
    if (meaning.includes("nhân viên") || meaning.includes("công ty") || word === "会社員" || word === "社員") {
      return [
        { speaker: "A", textJa: "お仕事は何をしていますか。", textVi: "Bạn đang làm nghề gì vậy?" },
        { speaker: "B", textJa: "私はIT会社の会社員です。", textVi: "Tôi là nhân viên của một công ty IT." },
      ];
    }
    if (meaning.includes("bác sĩ") || word === "医者") {
      return [
        { speaker: "A", textJa: "父の仕事は医者です。", textVi: "Công việc của bố tôi là bác sĩ." },
        { speaker: "B", textJa: "病院で働いているんですね。素晴らしいですね。", textVi: "Bác làm việc ở bệnh viện nhỉ. Thật tuyệt vời." },
      ];
    }
    if (meaning.includes("bạn bè") || meaning.includes("bạn thân") || word === "友達") {
      return [
        { speaker: "A", textJa: "昨日、誰と映画を見ましたか。", textVi: "Hôm qua bạn đã xem phim cùng ai vậy?" },
        { speaker: "B", textJa: "大学の友達と一緒に見ましたよ。", textVi: "Tôi đã xem cùng với bạn đại học đấy." },
      ];
    }
    if (meaning.includes("gia đình") || word === "家族") {
      return [
        { speaker: "A", textJa: "ご家族は何人ですか。", textVi: "Gia đình bạn có mấy người vậy?" },
        { speaker: "B", textJa: "家族は４人です。両親と妹がいます。", textVi: "Gia đình tôi có 4 người. Có bố mẹ và em gái." },
      ];
    }

    // 3. Địa điểm / Nơi chốn
    if ((meaning.includes("nhà") && !meaning.includes("nhà hàng") && !meaning.includes("nhà ga")) || word === "家" || word === "うち") {
      return [
        { speaker: "A", textJa: "週末はどこへ行きますか。", textVi: "Cuối tuần này bạn sẽ đi đâu?" },
        { speaker: "B", textJa: "どこへも行きません。家で休みます。", textVi: "Tôi không đi đâu cả. Tôi sẽ nghỉ ngơi ở nhà." },
      ];
    }
    if (meaning.includes("trường") || word === "学校" || word === "大学") {
      return [
        { speaker: "A", textJa: "毎朝、何時に学校へ行きますか。", textVi: "Mỗi sáng bạn đến trường lúc mấy giờ?" },
        { speaker: "B", textJa: "毎朝、８時に学校へ行きますよ。", textVi: "Mỗi sáng tôi đến trường lúc 8 giờ." },
      ];
    }
    if (meaning.includes("bệnh viện") || word === "病院") {
      return [
        { speaker: "A", textJa: "体調が悪そうですね。病院へ行きましたか。", textVi: "Trông bạn mệt mỏi thế. Bạn đã đi bệnh viện chưa?" },
        { speaker: "B", textJa: "はい、今朝近くの病院で診てもらいました。", textVi: "Có, sáng nay tôi đã khám ở bệnh viện gần nhà rồi." },
      ];
    }
    if (meaning.includes("ngân hàng") || word === "銀行") {
      return [
        { speaker: "A", textJa: "銀行は何時から何時までですか。", textVi: "Ngân hàng mở cửa từ mấy giờ đến mấy giờ vậy?" },
        { speaker: "B", textJa: "朝９時から午後３時までですよ。", textVi: "Từ 9 giờ sáng đến 3 giờ chiều đấy." },
      ];
    }
    if (meaning.includes("ga") || word === "駅") {
      return [
        { speaker: "A", textJa: "すみません、駅はどこですか。", textVi: "Xin lỗi, nhà ga ở đâu vậy ạ?" },
        { speaker: "B", textJa: "あそこを右に曲がると、駅がありますよ。", textVi: "Rẽ phải ở đằng kia là có nhà ga đấy." },
      ];
    }
    if (meaning.includes("nhật bản") || word === "日本") {
      return [
        { speaker: "A", textJa: "いつ日本へ来ましたか。", textVi: "Bạn đã đến Nhật Bản khi nào vậy?" },
        { speaker: "B", textJa: "去年の秋に日本へ来ました。", textVi: "Tôi đã đến Nhật Bản vào mùa thu năm ngoái." },
      ];
    }

    // 4. Đồ ăn & Đồ uống
    if ((meaning.includes("nước") && !meaning.includes("nước nào")) || word === "水" || reading === "みず") {
      return [
        { speaker: "A", textJa: "喉が渇きましたね。お水を飲みませんか。", textVi: "Khát nước quá nhỉ. Bạn có uống nước không?" },
        { speaker: "B", textJa: "ええ、冷たいお水を一杯お願いします。", textVi: "Vâng, cho tôi xin một cốc nước lạnh nhé." },
      ];
    }
    if (meaning.includes("trà") || word === "お茶" || word === "茶") {
      return [
        { speaker: "A", textJa: "日本のお茶をどうぞ。", textVi: "Xin mời bạn dùng trà Nhật Bản." },
        { speaker: "B", textJa: "ありがとうございます。いただきます。", textVi: "Cảm ơn bạn. Tôi xin phép thưởng thức." },
      ];
    }
    if (meaning.includes("cơm") || meaning.includes("bữa ăn") || word === "ご飯") {
      return [
        { speaker: "A", textJa: "もうお昼ご飯を食べましたか。", textVi: "Bạn đã ăn cơm trưa chưa?" },
        { speaker: "B", textJa: "はい、食堂で友達とご飯を食べました。", textVi: "Rồi, tôi đã ăn cơm cùng bạn ở nhà ăn." },
      ];
    }

    // 5. Đồ vật / Phương tiện
    if (meaning.includes("sách") || word === "本") {
      return [
        { speaker: "A", textJa: "これは何の教科書ですか。", textVi: "Đây là sách giáo khoa gì vậy?" },
        { speaker: "B", textJa: "これは日本語を勉強するための本です。", textVi: "Đây là cuốn sách dùng để học tiếng Nhật." },
      ];
    }
    if (meaning.includes("xe") || meaning.includes("ô tô") || word === "車" || word === "自動車") {
      return [
        { speaker: "A", textJa: "新しい車を買いましたか。", textVi: "Bạn đã mua xe ô tô mới à?" },
        { speaker: "B", textJa: "はい、先月白い車を買いましたよ。", textVi: "Vâng, tháng trước tôi đã mua một chiếc xe màu trắng." },
      ];
    }
    if (meaning.includes("điện thoại") || word === "電話" || word === "携帯") {
      return [
        { speaker: "A", textJa: "電話番号を教えてもらえますか。", textVi: "Bạn có thể cho tôi số điện thoại được không?" },
        { speaker: "B", textJa: "はい、私の携帯電話の番号はこれです。", textVi: "Vâng, số điện thoại di động của tôi là đây nhé." },
      ];
    }

    // 6. Thời gian
    if (meaning.includes("hôm nay") || word === "今日") {
      return [
        { speaker: "A", textJa: "今日は天気がとてもいいですね。", textVi: "Hôm nay thời tiết đẹp thật đấy nhỉ." },
        { speaker: "B", textJa: "そうですね。散歩に行きましょうか。", textVi: "Đúng thế thật. Chúng ta cùng đi dạo nhé?" },
      ];
    }
    if (meaning.includes("ngày mai") || word === "明日") {
      return [
        { speaker: "A", textJa: "明日は休みですか。", textVi: "Ngày mai bạn có được nghỉ không?" },
        { speaker: "B", textJa: "いいえ、明日も仕事があります。", textVi: "Không, ngày mai tôi vẫn có công việc." },
      ];
    }
    if (meaning.includes("giờ") || meaning.includes("thời gian") || word === "時間" || word === "時") {
      return [
        { speaker: "A", textJa: "今、何時ですか。", textVi: "Bây giờ là mấy giờ rồi?" },
        { speaker: "B", textJa: "ちょうど午後３時ですよ。", textVi: "Đúng 3 giờ chiều rồi đấy." },
      ];
    }

    // 7. Động từ thông dụng
    if (meaning.includes("ăn") || word.includes("食")) {
      return [
        { speaker: "A", textJa: "日本料理を食べたことがありますか。", textVi: "Bạn đã từng ăn món ăn Nhật Bản bao giờ chưa?" },
        { speaker: "B", textJa: "はい、寿司や天ぷらをよく食べますよ。", textVi: "Rồi, tôi rất hay ăn sushi và tempura đấy." },
      ];
    }
    if (meaning.includes("uống") || word.includes("飲")) {
      return [
        { speaker: "A", textJa: "何を飲みますか。", textVi: "Bạn sẽ uống gì thế?" },
        { speaker: "B", textJa: "冷たいコーヒーを飲みます。", textVi: "Tôi sẽ uống cà phê lạnh." },
      ];
    }
    if (meaning.includes("đi") || word.includes("行")) {
      return [
        { speaker: "A", textJa: "これからどこへ行きますか。", textVi: "Bây giờ bạn sẽ đi đâu?" },
        { speaker: "B", textJa: "スーパーへ買い物に行きます。", textVi: "Tôi sẽ đi siêu thị để mua đồ." },
      ];
    }
    if (meaning.includes("đến") || word.includes("来")) {
      return [
        { speaker: "A", textJa: "明日、パーティーに来ますか。", textVi: "Ngày mai bạn có đến bữa tiệc không?" },
        { speaker: "B", textJa: "はい、ぜひ行きますよ！楽しみにしています。", textVi: "Có, nhất định tôi sẽ đến! Rất mong chờ đấy." },
      ];
    }
    if (meaning.includes("học") || word.includes("勉") || word.includes("習")) {
      return [
        { speaker: "A", textJa: "毎日、日本語を勉強していますか。", textVi: "Mỗi ngày bạn đều học tiếng Nhật à?" },
        { speaker: "B", textJa: "はい、２時間くらい一生懸命勉強しています。", textVi: "Vâng, tôi chăm chỉ học khoảng 2 tiếng mỗi ngày." },
      ];
    }
    if (meaning.includes("mua") || word.includes("買")) {
      return [
        { speaker: "A", textJa: "そのカバンはどこで買いましたか。", textVi: "Chiếc cặp đó bạn đã mua ở đâu vậy?" },
        { speaker: "B", textJa: "デパートで買いました。とても使いやすいですよ。", textVi: "Tôi đã mua ở trung tâm thương mại. Dùng rất tiện đấy." },
      ];
    }

    // 8. Tính từ thông dụng
    if (meaning.includes("mới") || word.includes("新")) {
      return [
        { speaker: "A", textJa: "新しい部屋はどうですか。", textVi: "Căn phòng mới của bạn thế nào?" },
        { speaker: "B", textJa: "とても広くてきれいです。", textVi: "Rất là rộng rãi và sạch đẹp." },
      ];
    }
    if (meaning.includes("thích") || word.includes("好")) {
      return [
        { speaker: "A", textJa: "どんなスポーツが好きですか。", textVi: "Bạn thích môn thể thao nào?" },
        { speaker: "B", textJa: "サッカーを見るのが大好きです。", textVi: "Tôi rất thích xem bóng đá." },
      ];
    }
    if (meaning.includes("khó") || word.includes("難")) {
      return [
        { speaker: "A", textJa: "漢字の勉強は難しいですか。", textVi: "Việc học chữ Hán có khó không?" },
        { speaker: "B", textJa: "難しいですが、とても面白いですよ。", textVi: "Khó đấy, nhưng mà rất thú vị." },
      ];
    }

    // Universal Fallback for Japanese
    return [
      {
        speaker: "A",
        textJa: `会話の中で「${word}」という言葉はよく耳にしますね。`,
        textVi: `Trong các cuộc trò chuyện, chúng ta rất hay nghe thấy từ "${word}" (${v.meaning}) nhỉ.`,
      },
      {
        speaker: "B",
        textJa: `ええ、日常でとてもよく使われる大切な単語ですよ。`,
        textVi: `Đúng vậy, đó là một từ vựng rất quan trọng và thường gặp trong đời sống đấy.`,
      },
    ];
  } else if (langCode === "de") {
    const wLower = word.toLowerCase();
    if (wLower.includes("hallo") || wLower.includes("tag") || wLower.includes("morgen") || meaning.includes("xin chào") || meaning.includes("chào")) {
      return [
        { speaker: "A", textJa: "Hallo! Wie geht es Ihnen?", textVi: "Xin chào! Bạn có khỏe không?" },
        { speaker: "B", textJa: "Guten Tag! Mir geht es sehr gut, danke.", textVi: "Xin chào! Tôi rất khỏe, cảm ơn bạn." },
      ];
    }
    if (wLower.includes("danke") || meaning.includes("cảm ơn")) {
      return [
        { speaker: "A", textJa: "Vielen Dank für deine Hilfe!", textVi: "Cảm ơn bạn rất nhiều vì đã giúp đỡ!" },
        { speaker: "B", textJa: "Gern geschehen! Keine Ursache.", textVi: "Không có chi! Rất sẵn lòng." },
      ];
    }
    if (wLower.includes("bitte") || meaning.includes("làm ơn") || meaning.includes("xin mời")) {
      return [
        { speaker: "A", textJa: "Können Sie mir bitte helfen?", textVi: "Bạn có thể làm ơn giúp tôi được không?" },
        { speaker: "B", textJa: "Ja, natürlich. Sehr gerne!", textVi: "Vâng, tất nhiên rồi. Rất sẵn lòng!" },
      ];
    }
    if (wLower.includes("tschüss") || wLower.includes("wiedersehen") || meaning.includes("tạm biệt")) {
      return [
        { speaker: "A", textJa: "Auf Wiedersehen! Bis morgen.", textVi: "Tạm biệt! Hẹn gặp lại vào ngày mai." },
        { speaker: "B", textJa: "Tschüss! Einen schönen Tag noch.", textVi: "Tạm biệt! Chúc một ngày tốt lành nhé." },
      ];
    }
    if (wLower.includes("heißen") || wLower.includes("name") || meaning.includes("tên")) {
      return [
        { speaker: "A", textJa: "Wie heißen Sie?", textVi: "Bạn tên là gì vậy?" },
        { speaker: "B", textJa: "Ich heiße Anna. Freut mich!", textVi: "Tôi tên là Anna. Rất vui được gặp bạn!" },
      ];
    }
    if (wLower.includes("kommen") || meaning.includes("đến từ") || meaning.includes("quê")) {
      return [
        { speaker: "A", textJa: "Woher kommen Sie?", textVi: "Bạn đến từ đâu vậy?" },
        { speaker: "B", textJa: "Ich komme aus Vietnam.", textVi: "Tôi đến từ Việt Nam." },
      ];
    }
    if (wLower.includes("wohnen") || meaning.includes("sống") || meaning.includes("ở")) {
      return [
        { speaker: "A", textJa: "Wo wohnen Sie im Moment?", textVi: "Hiện tại bạn đang sống ở đâu?" },
        { speaker: "B", textJa: "Ich wohne in Berlin.", textVi: "Tôi đang sống ở Berlin." },
      ];
    }
    if (wLower.includes("deutsch") || meaning.includes("tiếng đức")) {
      return [
        { speaker: "A", textJa: "Lernen Sie Deutsch?", textVi: "Bạn đang học tiếng Đức à?" },
        { speaker: "B", textJa: "Ja, Deutsch ist sehr interessant!", textVi: "Vâng, tiếng Đức rất là thú vị!" },
      ];
    }

    return [
      {
        speaker: "A",
        textJa: `Wie verwendet man das Wort „${word}“ im Alltag?`,
        textVi: `Từ "${word}" (${v.meaning}) được dùng như thế nào trong đời sống?`,
      },
      {
        speaker: "B",
        textJa: `Das Wort „${word}“ ist sehr nützlich und bedeutet „${v.meaning}“.`,
        textVi: `Từ "${word}" rất hữu dụng và mang nghĩa là "${v.meaning}".`,
      },
    ];
  } else if (langCode === "en") {
    const wLower = word.toLowerCase();
    if (meaning.includes("xin chào") || meaning.includes("chào") || wLower.includes("hello") || wLower.includes("hi")) {
      return [
        { speaker: "A", textJa: "Hello, how are you today?", textVi: "Xin chào, hôm nay bạn thế nào?" },
        { speaker: "B", textJa: "I am doing well, thank you!", textVi: "Tôi khỏe, cảm ơn bạn nhé!" },
      ];
    }
    if (meaning.includes("cảm ơn") || wLower.includes("thank")) {
      return [
        { speaker: "A", textJa: "Thank you so much for your support!", textVi: "Cảm ơn bạn rất nhiều vì đã giúp đỡ!" },
        { speaker: "B", textJa: "You are very welcome!", textVi: "Không có chi, rất sẵn lòng!" },
      ];
    }
    return [
      {
        speaker: "A",
        textJa: `How do you use the word "${word}" in daily conversation?`,
        textVi: `Từ "${word}" (${v.meaning}) được dùng như thế nào trong giao tiếp hàng ngày?`,
      },
      {
        speaker: "B",
        textJa: `We often use "${word}" to talk about ${v.meaning}.`,
        textVi: `Chúng ta thường dùng "${word}" để diễn đạt về ${v.meaning}.`,
      },
    ];
  } else {
    return [
      {
        speaker: "A",
        textJa: `How is the word "${word}" used?`,
        textVi: `Từ "${word}" (${v.meaning}) được dùng như thế nào?`,
      },
      {
        speaker: "B",
        textJa: `It means "${v.meaning}".`,
        textVi: `Từ đó có nghĩa là "${v.meaning}".`,
      },
    ];
  }
}

function generateGrammarDialogue(g: GrammarPoint, langCode: string = "ja"): DialogueLine[] {
  const struct = g.structure || "";
  const meaning = g.meaning || "";

  if (langCode === "de") {
    if (g.examples && g.examples.length >= 1) {
      const ex = g.examples[0];
      return [
        {
          speaker: "A",
          textJa: `Können Sie mir ein natürliches Beispiel für „${struct}“ geben?`,
          textVi: `Bạn có thể cho tôi một ví dụ tự nhiên với cấu trúc ngữ pháp "${struct}" (${meaning}) không?`,
        },
        {
          speaker: "B",
          textJa: `Zum Beispiel: „${ex.sentence}“.`,
          textVi: `Ví dụ như câu: "${ex.sentence}" (${ex.meaning}).`,
        },
      ];
    }

    return [
      {
        speaker: "A",
        textJa: `Was bedeutet die Grammatikstruktur „${struct}“?`,
        textVi: `Cấu trúc ngữ pháp "${struct}" này có ý nghĩa gì vậy?`,
      },
      {
        speaker: "B",
        textJa: `„${struct}“ wird oft verwendet für: ${meaning}.`,
        textVi: `"${struct}" thường được dùng với ý nghĩa: ${meaning}.`,
      },
    ];
  }

  if (langCode === "en") {
    if (g.examples && g.examples.length >= 1) {
      const ex = g.examples[0];
      return [
        {
          speaker: "A",
          textJa: `Could you give me a natural example using "${struct}"?`,
          textVi: `Bạn có thể cho tôi một ví dụ tự nhiên dùng ngữ pháp "${struct}" (${meaning}) không?`,
        },
        {
          speaker: "B",
          textJa: `For example: "${ex.sentence}".`,
          textVi: `Ví dụ như câu: "${ex.sentence}" (${ex.meaning}).`,
        },
      ];
    }

    return [
      {
        speaker: "A",
        textJa: `What does the grammar structure "${struct}" mean?`,
        textVi: `Cấu trúc ngữ pháp "${struct}" này có ý nghĩa gì vậy?`,
      },
      {
        speaker: "B",
        textJa: `"${struct}" is commonly used to express: ${meaning}.`,
        textVi: `"${struct}" thường được dùng với ý nghĩa: ${meaning}.`,
      },
    ];
  }

  // Default: Japanese (ja)
  if (g.examples && g.examples.length >= 1) {
    const ex = g.examples[0];
    return [
      {
        speaker: "A",
        textJa: `文法「${struct}」を使った自然な例文を教えてください。`,
        textVi: `Hãy cho tôi một câu ví dụ tự nhiên dùng ngữ pháp "${struct}" (${meaning}) nhé.`,
      },
      {
        speaker: "B",
        textJa: `例えば、「${ex.sentence}」のように使いますよ。`,
        textVi: `Ví dụ như câu: "${ex.sentence}" (${ex.meaning}).`,
      },
    ];
  }

  return [
    {
      speaker: "A",
      textJa: `この文法「${struct}」はどういう意味ですか。`,
      textVi: `Cấu trúc ngữ pháp "${struct}" này có ý nghĩa gì vậy?`,
    },
    {
      speaker: "B",
      textJa: `「${struct}」は「${meaning}」という意味でよく使われます。`,
      textVi: `"${struct}" thường được dùng với ý nghĩa là "${meaning}".`,
    },
  ];
}

export default function LessonExerciseSection({
  lesson,
  isPassed,
  onPass,
  langCode = "ja",
}: Props) {
  const langMeta = useMemo(() => getLanguageMetadata(langCode), [langCode]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const toggleTranslation = (qId: number) => {
    setShowTranslation((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const playSpeech = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getSpeechLangCode(langCode);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Generate interactive exercise questions from lesson vocabulary & grammar
  const generateQuestions = useCallback(() => {
    const list: Question[] = [];
    const vocabs = lesson.vocabulary || [];
    const grammars = lesson.grammarPoints || [];

    let qId = 1;

    // 1. Generate Vocab questions
    vocabs.slice(0, 5).forEach((v, idx) => {
      const jp = v.kanji || v.hiragana || "";
      const meaning = v.meaning || "";

      // Distractors from other vocabs
      const distractors = vocabs
        .filter((item) => item.id !== v.id && item.meaning)
        .map((item) => item.meaning!)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const defaultFallbacks = ["Trường học", "Cảm ơn", "Bạn bè", "Gia đình", "Thời gian"];
      while (distractors.length < 3) {
        const fb = defaultFallbacks[distractors.length];
        if (!distractors.includes(fb) && fb !== meaning) distractors.push(fb);
      }

      const options = [meaning, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.indexOf(meaning);
      const dialogue = generateVocabDialogue(v, langCode);

      const readingPart = (langCode === "ja" && v.hiragana && v.hiragana !== jp) ? ` (${v.hiragana})` : "";
      list.push({
        id: qId++,
        type: "vocab",
        title: `Từ vựng ${idx + 1}`,
        prompt: `Nghĩa chính xác của từ "${jp}"${readingPart} là gì?`,
        dialogue,
        options,
        correctIndex: correctIdx,
        explanation: `Từ "${jp}" mang nghĩa là "${meaning}".`,
      });
    });

    // 2. Generate Grammar questions
    grammars.slice(0, 4).forEach((g, idx) => {
      const struct = g.structure || "";
      const meaning = g.meaning || "";

      const distractors = grammars
        .filter((item) => item.id !== g.id && item.meaning)
        .map((item) => item.meaning!)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      const defaultFallbacks = [
        "Diễn tả hành động đang diễn ra",
        "Dùng để giải thích lý do",
        "Biểu thị khả năng hoặc đề nghị",
        "Dùng để hỏi ý kiến người nghe"
      ];
      while (distractors.length < 3) {
        const fb = defaultFallbacks[distractors.length];
        if (!distractors.includes(fb) && fb !== meaning) distractors.push(fb);
      }

      const options = [meaning, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = options.indexOf(meaning);
      const dialogue = generateGrammarDialogue(g, langCode);

      list.push({
        id: qId++,
        type: "grammar",
        title: `Ngữ pháp ${idx + 1}`,
        prompt: `Ý nghĩa và cách dùng của mẫu câu "${struct}" là gì?`,
        dialogue,
        options,
        correctIndex: correctIdx,
        explanation: `Cấu trúc "${struct}" được dùng để: ${meaning}.`,
      });
    });

    // Shuffle questions
    setQuestions(list.sort(() => Math.random() - 0.5));
    setSelectedAnswers({});
    setShowTranslation({});
    setSubmitted(false);
    setScore(0);
  }, [lesson, langCode]);

  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  const handleSelectOption = (qId: number, optIdx: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleSubmit = () => {
    if (questions.length === 0) return;

    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct++;
      }
    });

    setScore(correct);
    setSubmitted(true);

    const percentage = Math.round((correct / questions.length) * 100);
    // Pass if score >= 70% or all correct if small test
    if (percentage >= 70 || correct === questions.length) {
      onPass();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center text-gray-400 text-xs">
        Bài học này không có câu hỏi bài tập tự động.
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = answeredCount === questions.length;
  const passPercentage = Math.round((score / questions.length) * 100);
  const isPassScore = passPercentage >= 70;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Exercise Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            ✏️ BÀI TẬP BẮT BUỘC HOÀN THÀNH BÀI HỌC
          </span>
          <h2 className="text-xl font-black mt-2">Bài Tập Tổng Hợp Bài Học</h2>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Hoàn thành các câu hỏi kiểm tra từ vựng & ngữ pháp bên dưới với điểm số đạt từ **70% trở lên** để hoàn thành điều kiện Bài tập.
          </p>
        </div>

        <div className="shrink-0 text-right">
          {isPassed ? (
            <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-2xl font-black text-xs inline-flex items-center gap-1.5 shadow-md">
              ✓ ĐÃ PASS BÀI TẬP
            </span>
          ) : (
            <span className="px-4 py-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-2xl font-black text-xs inline-flex items-center gap-1.5">
              ⏳ CHƯA ĐẠT (Cần Pass)
            </span>
          )}
        </div>
      </div>

      {/* Submitted Result Summary */}
      {submitted && (
        <div className={`p-6 rounded-3xl border shadow-md space-y-3 text-center ${
          isPassScore ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-rose-50 border-rose-200 text-rose-950"
        }`}>
          <div className="text-4xl">{isPassScore ? "🎉" : "⚠️"}</div>
          <h3 className="text-lg font-black">
            {isPassScore ? "Chúc Mừng! Bạn Đã Đạt Bài Tập!" : "Chưa Đạt Điểm Yêu Cầu!"}
          </h3>
          <p className="text-xs font-medium">
            Bạn đã trả lời đúng <strong className="text-sm font-black">{score} / {questions.length}</strong> câu ({passPercentage}%).
            {isPassScore ? " Điều kiện Bài tập của bài học này đã được ghi nhận hoàn thành!" : " Vui lòng xem lại các câu chưa chính xác và thử làm lại."}
          </p>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={generateQuestions}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
            >
              🔄 Làm lại bài tập
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const selectedOpt = selectedAnswers[q.id];
          const isAnswered = selectedOpt !== undefined;

          return (
            <div key={q.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                  q.type === "vocab" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-purple-50 text-purple-700 border border-purple-100"
                }`}>
                  Câu {idx + 1} • {q.title}
                </span>

                {submitted && (
                  <span className={`text-xs font-black ${
                    selectedOpt === q.correctIndex ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {selectedOpt === q.correctIndex ? "✓ Đúng" : "✕ Sai"}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-extrabold text-gray-900 leading-snug">{q.prompt}</h4>

              {/* Dialogue Box (A & B with translation toggle button) */}
              {q.dialogue && q.dialogue.length > 0 && (
                <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-3xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">💬</span>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                        Đoạn hội thoại mẫu (A & B)
                      </span>
                    </div>

                    {/* Switch Target Language / Vietnamese button */}
                    <button
                      type="button"
                      onClick={() => toggleTranslation(q.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-3xs border ${
                        showTranslation[q.id]
                          ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                      }`}
                      title={`Bấm để chuyển đổi giữa ${langMeta.name} và Tiếng Việt`}
                    >
                      <span>{showTranslation[q.id] ? langMeta.flag : "🌐"}</span>
                      <span>{showTranslation[q.id] ? langMeta.name : "Dịch"}</span>
                    </button>
                  </div>

                  {/* Lines A and B */}
                  <div className="space-y-2 pt-0.5">
                    {q.dialogue.map((line, lIdx) => (
                      <div key={lIdx} className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 shadow-2xs mt-0.5 ${
                            line.speaker === "A"
                              ? "bg-blue-600 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {line.speaker}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                            {showTranslation[q.id] ? line.textVi : line.textJa}
                          </p>
                        </div>
                        {/* Audio speech button */}
                        {!showTranslation[q.id] && (
                          <button
                            type="button"
                            onClick={() => playSpeech(line.textJa)}
                            className="text-xs text-slate-400 hover:text-indigo-600 p-1 rounded-lg hover:bg-white transition-colors cursor-pointer shrink-0"
                            title="Nghe phát âm câu này"
                          >
                            🔊
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOpt === optIdx;
                  const isCorrect = optIdx === q.correctIndex;

                  let style = "bg-gray-50/60 border-gray-150 text-gray-800 hover:bg-indigo-50/40 hover:border-indigo-200 cursor-pointer";

                  if (submitted) {
                    if (isCorrect) {
                      style = "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-200";
                    } else if (isSelected) {
                      style = "bg-rose-50 border-rose-400 text-rose-950 font-bold ring-2 ring-rose-200";
                    } else {
                      style = "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                    }
                  } else if (isSelected) {
                    style = "bg-indigo-50 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-200";
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={submitted}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`p-3.5 rounded-2xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${style}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center font-bold text-[10px] shrink-0">
                          {["A", "B", "C", "D"][optIdx]}
                        </span>
                        <span className="font-semibold truncate">{opt}</span>
                      </div>
                      {submitted && isCorrect && <span className="text-emerald-600 font-black shrink-0">✓</span>}
                      {submitted && isSelected && !isCorrect && <span className="text-rose-600 font-black shrink-0">✕</span>}
                    </button>
                  );
                })}
              </div>

              {/* Explanation on submit */}
              {submitted && (
                <div className="pt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="font-bold text-indigo-700">💡 Giải thích:</span> {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-xs text-gray-500 font-medium">
            Đã trả lời <strong className="text-indigo-600 font-extrabold">{answeredCount} / {questions.length}</strong> câu
          </span>

          <button
            onClick={handleSubmit}
            disabled={!isAllAnswered}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-200 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            🚀 Nộp Bài Tập & Tính Điểm
          </button>
        </div>
      )}
    </div>
  );
}
