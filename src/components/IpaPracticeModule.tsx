"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface IpaSound {
  ipa: string;
  type: "monophthong_long" | "monophthong_short" | "diphthong" | "consonant_unvoiced" | "consonant_voiced" | "consonant_other";
  categoryName: string;
  exampleWord: string;
  highlightLetter: string;
  meaning: string;
  mouthGuide: string;
  vietnameseApprox: string;
  moreWords: string[];
}

export interface MinimalPair {
  id: string;
  soundA: string;
  soundB: string;
  title: string;
  mouthGuideA: string;
  mouthGuideB: string;
  pairs: {
    wordA: string;
    ipaA: string;
    meaningA: string;
    wordB: string;
    ipaB: string;
    meaningB: string;
  }[];
}

// 44 IPA Sound Bank
export const IPA_SOUNDS: IpaSound[] = [
  // 1. Monophthongs - Long Vowels (5)
  {
    ipa: "/iː/",
    type: "monophthong_long",
    categoryName: "Nguyên âm đơn dài",
    exampleWord: "see",
    highlightLetter: "ee",
    meaning: "nhìn thấy",
    mouthGuide: "Mở miệng hẹp, khóe miệng kéo rộng sang hai bên như đang cười tươi, phát âm âm 'i' kéo dài.",
    vietnameseApprox: "Âm 'i' kéo dài (cười nhẹ)",
    moreWords: ["sheep", "feel", "meet", "eat", "leave"],
  },
  {
    ipa: "/uː/",
    type: "monophthong_long",
    categoryName: "Nguyên âm đơn dài",
    exampleWord: "too",
    highlightLetter: "oo",
    meaning: "quá, cũng",
    mouthGuide: "Môi chu tròn hướng về phía trước, lưỡi nâng cao về phía sau vòm họng, phát âm âm 'u' kéo dài.",
    vietnameseApprox: "Âm 'u' kéo dài (chu môi)",
    moreWords: ["blue", "food", "moon", "group", "shoe"],
  },
  {
    ipa: "/ɔː/",
    type: "monophthong_long",
    categoryName: "Nguyên âm đơn dài",
    exampleWord: "door",
    highlightLetter: "oor",
    meaning: "cửa ra vào",
    mouthGuide: "Môi tròn, hạ cằm vừa phải, phát âm âm 'o' sâu trong cổ họng kéo dài.",
    vietnameseApprox: "Âm 'o' tròn môi kéo dài",
    moreWords: ["call", "law", "four", "water", "short"],
  },
  {
    ipa: "/ɑː/",
    type: "monophthong_long",
    categoryName: "Nguyên âm đơn dài",
    exampleWord: "far",
    highlightLetter: "ar",
    meaning: "xa xôi",
    mouthGuide: "Hạ cằm mở rộng miệng theo chiều dọc, lưỡi hạ thấp, phát âm âm 'a' sâu từ cổ họng kéo dài.",
    vietnameseApprox: "Âm 'a' trầm sâu kéo dài",
    moreWords: ["car", "start", "heart", "father", "park"],
  },
  {
    ipa: "/ɜː/",
    type: "monophthong_long",
    categoryName: "Nguyên âm đơn dài",
    exampleWord: "bird",
    highlightLetter: "ir",
    meaning: "con chim",
    mouthGuide: "Miệng mở tự nhiên, lưỡi hơi nâng nhẹ ở giữa miệng, phát âm âm 'ơ' kéo dài và hơi cong lưỡi.",
    vietnameseApprox: "Âm 'ơ' kéo dài hơi cong lưỡi",
    moreWords: ["girl", "work", "learn", "turn", "first"],
  },

  // 2. Monophthongs - Short Vowels (7)
  {
    ipa: "/ɪ/",
    type: "monophthong_short",
    categoryName: "Nguyên âm đơn ngắn",
    exampleWord: "sit",
    highlightLetter: "i",
    meaning: "ngồi",
    mouthGuide: "Mở miệng hơi hẹp hơn âm /iː/, phát âm âm 'i' dứt khoát và ngắn gọn (hơi lai âm 'ê').",
    vietnameseApprox: "Âm 'i' ngắn giật dứt khoát",
    moreWords: ["ship", "fit", "hit", "live", "big"],
  },
  {
    ipa: "/ʊ/",
    type: "monophthong_short",
    categoryName: "Nguyên âm đơn ngắn",
    exampleWord: "put",
    highlightLetter: "u",
    meaning: "đặt, để",
    mouthGuide: "Môi hơi tròn tự nhiên, phát âm âm 'u' ngắn và dứt khoát (hơi lai âm 'ư').",
    vietnameseApprox: "Âm 'u' ngắn dứt khoát",
    moreWords: ["foot", "book", "good", "look", "push"],
  },
  {
    ipa: "/ɒ/",
    type: "monophthong_short",
    categoryName: "Nguyên âm đơn ngắn",
    exampleWord: "hot",
    highlightLetter: "o",
    meaning: "nóng",
    mouthGuide: "Hạ quai hàm, mở tròn môi tự nhiên, phát âm âm 'o' ngắn và gọn.",
    vietnameseApprox: "Âm 'o' ngắn dứt khoát",
    moreWords: ["dog", "box", "stop", "clock", "shop"],
  },
  {
    ipa: "/ʌ/",
    type: "monophthong_short",
    categoryName: "Nguyên âm đơn ngắn",
    exampleWord: "cup",
    highlightLetter: "u",
    meaning: "chiếc cốc",
    mouthGuide: "Miệng mở vừa phải, phát âm âm 'á/ớ' ngắn gọn, dứt khoát từ bụng.",
    vietnameseApprox: "Âm 'á' ngắn giật bụng",
    moreWords: ["bus", "run", "sun", "cut", "love"],
  },
  {
    ipa: "/ə/",
    type: "monophthong_short",
    categoryName: "Nguyên âm đơn ngắn (Schwa)",
    exampleWord: "teacher",
    highlightLetter: "er",
    meaning: "giáo viên",
    mouthGuide: "Âm Schwa quan trọng nhất tiếng Anh: Miệng thả lỏng hoàn toàn, phát âm âm 'ơ' rất nhẹ và ngắn.",
    vietnameseApprox: "Âm 'ơ' nhẹ thả lỏng (Schwa)",
    moreWords: ["about", "banana", "sofa", "doctor", "ago"],
  },
  {
    ipa: "/e/",
    type: "monophthong_short",
    categoryName: "Nguyên âm đơn ngắn",
    exampleWord: "bed",
    highlightLetter: "e",
    meaning: "chiếc giường",
    mouthGuide: "Mở miệng rộng hơn âm /ɪ/, phát âm âm 'e' ngắn và dứt khoát.",
    vietnameseApprox: "Âm 'e' ngắn gọn gàng",
    moreWords: ["head", "pen", "red", "men", "send"],
  },
  {
    ipa: "/æ/",
    type: "monophthong_short",
    categoryName: "Nguyên âm đơn ngắn (A bẹt)",
    exampleWord: "cat",
    highlightLetter: "a",
    meaning: "con mèo",
    mouthGuide: "Mở rộng miệng hết cỡ cả chiều ngang lẫn chiều dọc, đè lưỡi xuống thấp, phát âm âm 'e/a' bẹt dứt khoát.",
    vietnameseApprox: "Âm 'a bẹt' mở rộng miệng",
    moreWords: ["man", "pan", "apple", "bad", "hand"],
  },

  // 3. Diphthongs - 8 Nguyên âm đôi
  {
    ipa: "/eɪ/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "say",
    highlightLetter: "ay",
    meaning: "nói",
    mouthGuide: "Bắt đầu bằng âm /e/ sau đó trượt nhẹ và khép miệng sang âm /ɪ/.",
    vietnameseApprox: "Âm 'ê-i' mượt mà",
    moreWords: ["make", "day", "train", "game", "eight"],
  },
  {
    ipa: "/aɪ/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "my",
    highlightLetter: "y",
    meaning: "của tôi",
    mouthGuide: "Bắt đầu bằng âm /ɑː/ mở rộng miệng, sau đó thu hẹp chuyển sang âm /ɪ/.",
    vietnameseApprox: "Âm 'a-i' mở sang hẹp",
    moreWords: ["time", "like", "night", "high", "fly"],
  },
  {
    ipa: "/ɔɪ/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "boy",
    highlightLetter: "oy",
    meaning: "cậu bé",
    mouthGuide: "Bắt đầu bằng âm /ɔː/ tròn môi, sau đó trượt sang âm /ɪ/.",
    vietnameseApprox: "Âm 'oi' tròn môi",
    moreWords: ["toy", "voice", "oil", "choice", "coin"],
  },
  {
    ipa: "/əʊ/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "go",
    highlightLetter: "o",
    meaning: "đi",
    mouthGuide: "Bắt đầu bằng âm /ə/ thả lỏng, sau đó chu tròn môi sang âm /ʊ/.",
    vietnameseApprox: "Âm 'ơ-u' thu tròn môi",
    moreWords: ["no", "home", "boat", "cold", "phone"],
  },
  {
    ipa: "/aʊ/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "now",
    highlightLetter: "ow",
    meaning: "bây giờ",
    mouthGuide: "Bắt đầu bằng âm /ɑː/ mở rộng miệng, sau đó chu tròn môi sang âm /ʊ/.",
    vietnameseApprox: "Âm 'ao' mở rộng rồi chu môi",
    moreWords: ["cow", "house", "town", "sound", "out"],
  },
  {
    ipa: "/ɪə/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "hear",
    highlightLetter: "ear",
    meaning: "nghe",
    mouthGuide: "Bắt đầu bằng âm /ɪ/ rồi thả lỏng trượt về âm /ə/.",
    vietnameseApprox: "Âm 'i-ơ' mượt mà",
    moreWords: ["ear", "clear", "near", "beer", "here"],
  },
  {
    ipa: "/eə/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "hair",
    highlightLetter: "air",
    meaning: "mái tóc",
    mouthGuide: "Bắt đầu bằng âm /e/ rồi thả lỏng trượt về âm /ə/.",
    vietnameseApprox: "Âm 'e-ơ' mượt mà",
    moreWords: ["air", "care", "chair", "bear", "where"],
  },
  {
    ipa: "/ʊə/",
    type: "diphthong",
    categoryName: "Nguyên âm đôi",
    exampleWord: "tour",
    highlightLetter: "our",
    meaning: "chuyến du lịch",
    mouthGuide: "Bắt đầu bằng âm /ʊ/ tròn môi rồi thả lỏng trượt về âm /ə/.",
    vietnameseApprox: "Âm 'u-ơ' mượt mà",
    moreWords: ["poor", "cure", "sure", "pure", "furious"],
  },

  // 4. Consonants - Unvoiced (Vô thanh - 8)
  {
    ipa: "/p/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Không rung)",
    exampleWord: "pen",
    highlightLetter: "p",
    meaning: "cây bút",
    mouthGuide: "Mím chặt hai môi lại để nén khí, sau đó mở bật môi đẩy luồng hơi mạnh ra ngoài (không rung cổ).",
    vietnameseApprox: "Bật hơi môi 'p' (không rung)",
    moreWords: ["pack", "pig", "pie", "stop", "happy"],
  },
  {
    ipa: "/t/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Không rung)",
    exampleWord: "tea",
    highlightLetter: "t",
    meaning: "trà",
    mouthGuide: "Đầu lưỡi chạm chặt vào chân răng trên, bật mạnh luồng khí ra ngoài (không rung cổ).",
    vietnameseApprox: "Bật đầu lưỡi 't' (không rung)",
    moreWords: ["time", "take", "two", "water", "cat"],
  },
  {
    ipa: "/tʃ/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Không rung)",
    exampleWord: "church",
    highlightLetter: "ch",
    meaning: "nhà thờ",
    mouthGuide: "Chu tròn môi hướng về trước, đầu lưỡi chạm vòm họng rồi bật luồng hơi xì mạnh ra (như 'ch' mạnh).",
    vietnameseApprox: "Bật hơi chu môi 'ch' (không rung)",
    moreWords: ["chair", "cheese", "watch", "match", "much"],
  },
  {
    ipa: "/k/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Không rung)",
    exampleWord: "key",
    highlightLetter: "k",
    meaning: "chìa khóa",
    mouthGuide: "Nâng cuống lưỡi chạm vòm họng mềm, bật luồng khí mạnh từ trong cuống họng ra ngoài.",
    vietnameseApprox: "Bật cuống họng 'k' (không rung)",
    moreWords: ["cat", "car", "black", "back", "look"],
  },
  {
    ipa: "/f/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Không rung)",
    exampleWord: "four",
    highlightLetter: "f",
    meaning: "số bốn",
    mouthGuide: "Răng cửa hàm trên chạm nhẹ vào môi dưới, đẩy luồng hơi êm qua kẽ răng và môi.",
    vietnameseApprox: "Răng cắn môi 'f' thổi hơi",
    moreWords: ["food", "fan", "coffee", "laugh", "life"],
  },
  {
    ipa: "/θ/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Trọng tâm TH)",
    exampleWord: "think",
    highlightLetter: "th",
    meaning: "suy nghĩ",
    mouthGuide: "Đặt đầu lưỡi chạm nhẹ vào giữa hai hàm răng trên và dưới, đẩy luồng khí thổi ra ngoài (hoàn toàn không rung cổ).",
    vietnameseApprox: "Thổi gió qua kẽ răng (TH không rung)",
    moreWords: ["thin", "thank", "mouth", "teeth", "breath"],
  },
  {
    ipa: "/s/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Trọng tâm S)",
    exampleWord: "see",
    highlightLetter: "s",
    meaning: "nhìn thấy",
    mouthGuide: "Cười nhẹ, hai hàm răng khép sát, đầu lưỡi nâng nhẹ sau răng trên, xì luồng khí sắc nét thẳng qua kẽ răng.",
    vietnameseApprox: "Xì hơi qua kẽ răng 's nhẹ'",
    moreWords: ["sock", "sign", "sun", "bus", "face"],
  },
  {
    ipa: "/ʃ/",
    type: "consonant_unvoiced",
    categoryName: "Phụ âm vô thanh (Trọng tâm SH)",
    exampleWord: "she",
    highlightLetter: "sh",
    meaning: "cô ấy",
    mouthGuide: "Chu tròn môi về phía trước, thân lưỡi nâng lên vòm họng, đẩy luồng hơi mạnh ra như khi ra hiệu 'suỵt'.",
    vietnameseApprox: "Chu môi nặng 'sh' (suỵt)",
    moreWords: ["shock", "shine", "shoe", "fish", "wash"],
  },

  // 5. Consonants - Voiced (Hữu thanh - 8)
  {
    ipa: "/b/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Rung cổ)",
    exampleWord: "big",
    highlightLetter: "b",
    meaning: "to lớn",
    mouthGuide: "Mím chặt hai môi lại, bật môi đồng thời rung mạnh dây thanh quản trong cổ họng.",
    vietnameseApprox: "Bật môi 'b' (rung cổ họng)",
    moreWords: ["book", "boy", "back", "baby", "job"],
  },
  {
    ipa: "/d/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Rung cổ)",
    exampleWord: "do",
    highlightLetter: "d",
    meaning: "làm",
    mouthGuide: "Đầu lưỡi chạm chân răng trên, bật đầu lưỡi đồng thời rung mạnh dây thanh quản trong cổ họng.",
    vietnameseApprox: "Bật đầu lưỡi 'd' (rung cổ họng)",
    moreWords: ["dog", "day", "door", "red", "food"],
  },
  {
    ipa: "/dʒ/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Rung cổ)",
    exampleWord: "judge",
    highlightLetter: "j/dge",
    meaning: "thẩm phán",
    mouthGuide: "Chu tròn môi, đầu lưỡi chạm vòm họng rồi bật ra kèm theo rung mạnh dây thanh quản.",
    vietnameseApprox: "Chu môi bật 'gi/dzh' (rung cổ)",
    moreWords: ["job", "juice", "age", "orange", "bridge"],
  },
  {
    ipa: "/g/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Rung cổ)",
    exampleWord: "go",
    highlightLetter: "g",
    meaning: "đi",
    mouthGuide: "Nâng cuống lưỡi chạm vòm họng mềm, bật cuống họng đồng thời rung mạnh dây thanh quản.",
    vietnameseApprox: "Bật cuống họng 'g' (rung cổ)",
    moreWords: ["get", "girl", "game", "bag", "big"],
  },
  {
    ipa: "/v/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Rung cổ)",
    exampleWord: "van",
    highlightLetter: "v",
    meaning: "xe tải nhỏ",
    mouthGuide: "Răng cửa trên chạm môi dưới, đẩy hơi đồng thời rung mạnh dây thanh quản tạo tiếng 'v'.",
    vietnameseApprox: "Răng cắn môi 'v' (rung cổ)",
    moreWords: ["very", "voice", "live", "love", "have"],
  },
  {
    ipa: "/ð/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Trọng tâm TH)",
    exampleWord: "this",
    highlightLetter: "th",
    meaning: "cái này",
    mouthGuide: "Đặt đầu lưỡi chạm nhẹ vào giữa hai hàm răng, vừa đẩy hơi vừa rung mạnh dây thanh quản tạo âm 'đ/th rung'.",
    vietnameseApprox: "Cắn lưỡi rung cổ (TH hữu thanh)",
    moreWords: ["that", "these", "then", "breathe", "with"],
  },
  {
    ipa: "/z/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Rung cổ)",
    exampleWord: "zoo",
    highlightLetter: "z",
    meaning: "sở thú",
    mouthGuide: "Cười nhẹ, hai hàm răng khép sát, đẩy luồng khí qua kẽ răng đồng thời rung mạnh dây thanh quản tạo tiếng 'z'.",
    vietnameseApprox: "Xì qua kẽ răng 'z' (rung cổ)",
    moreWords: ["zero", "rose", "busy", "easy", "is"],
  },
  {
    ipa: "/ʒ/",
    type: "consonant_voiced",
    categoryName: "Phụ âm hữu thanh (Rung cổ)",
    exampleWord: "vision",
    highlightLetter: "si",
    meaning: "tầm nhìn",
    mouthGuide: "Chu tròn môi về phía trước, đẩy hơi đồng thời rung mạnh dây thanh quản tạo tiếng 'zh' trầm.",
    vietnameseApprox: "Chu môi 'zh' (rung cổ)",
    moreWords: ["measure", "pleasure", "television", "decision", "casual"],
  },

  // 6. Consonants - Other 8 sounds
  {
    ipa: "/m/",
    type: "consonant_other",
    categoryName: "Phụ âm mũi (Nasal)",
    exampleWord: "man",
    highlightLetter: "m",
    meaning: "người đàn ông",
    mouthGuide: "Ngậm chặt hai môi lại, luồng hơi đi hoàn toàn qua mũi, rung cổ họng phát âm 'm'.",
    vietnameseApprox: "Âm mũi 'm' ngậm môi",
    moreWords: ["make", "me", "home", "time", "room"],
  },
  {
    ipa: "/n/",
    type: "consonant_other",
    categoryName: "Phụ âm mũi (Nasal)",
    exampleWord: "no",
    highlightLetter: "n",
    meaning: "không",
    mouthGuide: "Đầu lưỡi chạm chân răng trên, luồng hơi đi qua mũi, rung cổ họng phát âm 'n'.",
    vietnameseApprox: "Âm mũi 'n' chạm răng trên",
    moreWords: ["name", "night", "sun", "ten", "one"],
  },
  {
    ipa: "/ŋ/",
    type: "consonant_other",
    categoryName: "Phụ âm mũi (Nasal)",
    exampleWord: "sing",
    highlightLetter: "ng",
    meaning: "hát",
    mouthGuide: "Cuống lưỡi nâng chạm vòm họng mềm, luồng hơi thoát ra đằng mũi (như âm 'ng').",
    vietnameseApprox: "Âm mũi 'ng' cuống họng",
    moreWords: ["song", "ring", "long", "king", "English"],
  },
  {
    ipa: "/h/",
    type: "consonant_other",
    categoryName: "Phụ âm thở (Glottal)",
    exampleWord: "hat",
    highlightLetter: "h",
    meaning: "chiếc mũ",
    mouthGuide: "Mở miệng tự nhiên, thở nhẹ một luồng hơi ấm từ sâu trong họng ra ngoài (không rung cổ).",
    vietnameseApprox: "Thở hơi 'h' nhẹ nhàng",
    moreWords: ["hot", "home", "hand", "happy", "who"],
  },
  {
    ipa: "/l/",
    type: "consonant_other",
    categoryName: "Phụ âm bên (Liquid)",
    exampleWord: "leg",
    highlightLetter: "l",
    meaning: "cái chân",
    mouthGuide: "Đầu lưỡi chạm chân răng trên, luồng hơi lách qua hai bên thân lưỡi, rung cổ họng.",
    vietnameseApprox: "Âm 'l' uốn đầu lưỡi",
    moreWords: ["look", "love", "call", "table", "help"],
  },
  {
    ipa: "/r/",
    type: "consonant_other",
    categoryName: "Phụ âm cuộn (Liquid)",
    exampleWord: "red",
    highlightLetter: "r",
    meaning: "màu đỏ",
    mouthGuide: "Môi hơi chu tròn, đầu lưỡi cong vào trong hướng về vòm miệng (không chạm vòm), rung cổ họng.",
    vietnameseApprox: "Âm 'r' uốn cong lưỡi",
    moreWords: ["run", "right", "rain", "car", "room"],
  },
  {
    ipa: "/w/",
    type: "consonant_other",
    categoryName: "Bán nguyên âm (Glide)",
    exampleWord: "wet",
    highlightLetter: "w",
    meaning: "ẩm ướt",
    mouthGuide: "Môi chu thật tròn và nhỏ như huýt sáo, sau đó mở rộng nhanh sang hai bên đồng thời rung cổ.",
    vietnameseApprox: "Âm lướt 'qu/u' chu môi",
    moreWords: ["water", "win", "walk", "one", "quick"],
  },
  {
    ipa: "/j/",
    type: "consonant_other",
    categoryName: "Bán nguyên âm (Glide)",
    exampleWord: "yes",
    highlightLetter: "y",
    meaning: "vâng, đồng ý",
    mouthGuide: "Thân lưỡi nâng cao chạm gần vòm họng cứng, trượt nhanh sang âm kế tiếp (như âm 'd' mềm).",
    vietnameseApprox: "Âm lướt 'd/i' vòm họng",
    moreWords: ["you", "year", "young", "yellow", "use"],
  },
];

// Minimal Pairs Chuyên Sâu
export const MINIMAL_PAIRS_DATA: MinimalPair[] = [
  {
    id: "s-sh",
    soundA: "/s/",
    soundB: "/ʃ/",
    title: "Cặp Âm Kinh Điển 1: /s/ (S nhẹ xì răng) 🆚 /ʃ/ (SH chu môi nặng)",
    mouthGuideA: "Cười nhẹ, hai hàm răng khép sát, ép luồng khí xì sắc nét thẳng qua kẽ răng.",
    mouthGuideB: "Chu tròn môi về phía trước, thân lưỡi nâng lên vòm miệng, đẩy luồng hơi dày ra như ra hiệu 'suỵt'.",
    pairs: [
      { wordA: "see", ipaA: "/siː/", meaningA: "nhìn thấy", wordB: "she", ipaB: "/ʃiː/", meaningB: "cô ấy" },
      { wordA: "sea", ipaA: "/siː/", meaningA: "biển", wordB: "she", ipaB: "/ʃiː/", meaningB: "cô ấy" },
      { wordA: "sock", ipaA: "/sɒk/", meaningA: "chiếc tất", wordB: "shock", ipaB: "/ʃɒk/", meaningB: "cú sốc" },
      { wordA: "sign", ipaA: "/saɪn/", meaningA: "biển báo / ký tên", wordB: "shine", ipaB: "/ʃaɪn/", meaningB: "tỏa sáng" },
      { wordA: "suit", ipaA: "/suːt/", meaningA: "bộ vest", wordB: "shoot", ipaB: "/ʃuːt/", meaningB: "bắn súng" },
      { wordA: "crust", ipaA: "/krʌst/", meaningA: "vỏ bánh mì", wordB: "crushed", ipaB: "/krʌʃt/", meaningB: "bị nghiền nát" },
      { wordA: "lease", ipaA: "/liːs/", meaningA: "hợp đồng thuê", wordB: "leash", ipaB: "/liːʃ/", meaningB: "dây xích chó" },
    ],
  },
  {
    id: "th-unvoiced-voiced",
    soundA: "/θ/",
    soundB: "/ð/",
    title: "Cặp Âm Kinh Điển 2: /θ/ (TH thổi gió không rung) 🆚 /ð/ (TH cắn lưỡi rung cổ)",
    mouthGuideA: "Đặt đầu lưỡi chạm giữa 2 hàm răng, chỉ thổi luồng gió mát ra ngoài (cổ họng không rung).",
    mouthGuideB: "Đặt đầu lưỡi chạm giữa 2 hàm răng, vừa đẩy hơi vừa rung mạnh dây thanh quản trong cổ họng.",
    pairs: [
      { wordA: "thin", ipaA: "/θɪn/", meaningA: "mỏng, gầy", wordB: "this", ipaB: "/ðɪs/", meaningB: "cái này" },
      { wordA: "thank", ipaA: "/θæŋk/", meaningA: "cảm ơn", wordB: "that", ipaB: "/ðæt/", meaningB: "cái kia" },
      { wordA: "thought", ipaA: "/θɔːt/", meaningA: "suy nghĩ (quá khứ)", wordB: "though", ipaB: "/ðəʊ/", meaningB: "mặc dù" },
      { wordA: "mouth (n)", ipaA: "/maʊθ/", meaningA: "cái miệng (danh từ)", wordB: "mouth (v)", ipaB: "/maʊð/", meaningB: "mấp máy môi (động từ)" },
      { wordA: "teeth", ipaA: "/tiːθ/", meaningA: "những chiếc răng", wordB: "teethe", ipaB: "/tiːð/", meaningB: "mọc răng" },
      { wordA: "breath", ipaA: "/breθ/", meaningA: "hơi thở (danh từ)", wordB: "breathe", ipaB: "/briːð/", meaningB: "hít thở (động từ)" },
      { wordA: "bath", ipaA: "/bɑːθ/", meaningA: "bồn tắm (danh từ)", wordB: "bathe", ipaB: "/beɪð/", meaningB: "tắm rửa (động từ)" },
    ],
  },
  {
    id: "i-long-short",
    soundA: "/iː/",
    soundB: "/ɪ/",
    title: "Cặp Nguyên Âm: /iː/ (I dài cười tươi) 🆚 /ɪ/ (I ngắn dứt khoát)",
    mouthGuideA: "Khóe miệng kéo rộng như cười tươi, phát âm âm 'i' kéo dài 1.5 - 2 giây.",
    mouthGuideB: "Miệng hơi hẹp, phát âm âm 'i' dứt khoát trong 0.5 giây (hơi lai âm 'ê').",
    pairs: [
      { wordA: "sheep", ipaA: "/ʃiːp/", meaningA: "con cừu", wordB: "ship", ipaB: "/ʃɪp/", meaningB: "con tàu" },
      { wordA: "seat", ipaA: "/siːt/", meaningA: "chỗ ngồi", wordB: "sit", ipaB: "/sɪt/", meaningB: "ngồi xuống" },
      { wordA: "feet", ipaA: "/fiːt/", meaningA: "bàn chân", wordB: "fit", ipaB: "/fɪt/", meaningB: "vừa vặn" },
      { wordA: "leave", ipaA: "/liːv/", meaningA: "rời đi", wordB: "live", ipaB: "/lɪv/", meaningB: "sinh sống" },
      { wordA: "reach", ipaA: "/riːtʃ/", meaningA: "vươn tới", wordB: "rich", ipaB: "/rɪtʃ/", meaningB: "giàu có" },
      { wordA: "feel", ipaA: "/fiːl/", meaningA: "cảm thấy", wordB: "fill", ipaB: "/fɪl/", meaningB: "làm đầy" },
    ],
  },
  {
    id: "p-b",
    soundA: "/p/",
    soundB: "/b/",
    title: "Cặp Phụ Âm Bật Hơi: /p/ (P bật hơi không rung) 🆚 /b/ (B rung cổ họng)",
    mouthGuideA: "Mím chặt 2 môi nén khí, bật môi đẩy luồng hơi mạnh ra ngoài làm bay tờ giấy (không rung cổ).",
    mouthGuideB: "Mím chặt 2 môi, bật môi đồng thời phát âm rung mạnh dây thanh quản trong cổ họng.",
    pairs: [
      { wordA: "pen", ipaA: "/pen/", meaningA: "cây bút", wordB: "ben", ipaB: "/ben/", meaningB: "tên Ben" },
      { wordA: "pig", ipaA: "/pɪɡ/", meaningA: "con lợn", wordB: "big", ipaB: "/bɪɡ/", meaningB: "to lớn" },
      { wordA: "pear", ipaA: "/peə/", meaningA: "quả lê", wordB: "bear", ipaB: "/beə/", meaningB: "con gấu" },
      { wordA: "pack", ipaA: "/pæk/", meaningA: "đóng gói", wordB: "back", ipaB: "/bæk/", meaningB: "phía sau / lưng" },
      { wordA: "pie", ipaA: "/paɪ/", meaningA: "bánh nướng", wordB: "bye", ipaB: "/baɪ/", meaningB: "tạm biệt" },
    ],
  },
  {
    id: "ae-e",
    soundA: "/æ/",
    soundB: "/e/",
    title: "Cặp Nguyên Âm: /æ/ (A bẹt mở rộng miệng) 🆚 /e/ (E mở miệng vừa)",
    mouthGuideA: "Hạ quai hàm mở miệng hết cỡ theo chiều dọc và ngang, phát âm âm 'e/a' bẹt to rõ ràng.",
    mouthGuideB: "Mở miệng vừa phải, phát âm âm 'e' gọn gàng và dứt khoát.",
    pairs: [
      { wordA: "man", ipaA: "/mæn/", meaningA: "người đàn ông (số ít)", wordB: "men", ipaB: "/men/", meaningB: "đàn ông (số nhiều)" },
      { wordA: "pan", ipaA: "/pæn/", meaningA: "chiếc chảo", wordB: "pen", ipaB: "/pen/", meaningB: "cây bút" },
      { wordA: "bad", ipaA: "/bæd/", meaningA: "tồi tệ", wordB: "bed", ipaB: "/bed/", meaningB: "chiếc giường" },
      { wordA: "sat", ipaA: "/sæt/", meaningA: "đã ngồi", wordB: "set", ipaB: "/set/", meaningB: "thiết lập" },
      { wordA: "sad", ipaA: "/sæd/", meaningA: "buồn rầu", wordB: "said", ipaB: "/sed/", meaningB: "đã nói" },
    ],
  },
];

interface IpaPracticeModuleProps {
  onRecordHistory?: (entry: {
    type: "shadowing" | "translation" | "reading" | "presentation";
    typeName: string;
    topic: string;
    lang: string;
    score: number;
    userAnswer?: string;
    correctAnswer?: string;
    feedback?: string;
  }) => void;
}

export default function IpaPracticeModule({ onRecordHistory }: IpaPracticeModuleProps) {
  const [activeTab, setActiveTab] = useState<"vowels" | "consonants" | "minimal_pairs">("minimal_pairs");
  const [selectedSound, setSelectedSound] = useState<IpaSound | null>(IPA_SOUNDS[0]);
  const [activePairId, setActivePairId] = useState<string>("s-sh");
  
  // Microphone & Speech Scoring States
  const [recognizingWord, setRecognizingWord] = useState<string | null>(null);
  const [userTranscript, setUserTranscript] = useState<string>("");
  const [scoreResult, setScoreResult] = useState<{ word: string; score: number; feedback: string } | null>(null);
  const recognitionRef = useRef<any>(null);

  // Stop any active speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  // Text-To-Speech
  const playSpeech = (text: string, rate: number = 0.9) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = rate;
    window.speechSynthesis.speak(utterance);
  };

  // Simple string similarity for score calculation (0 - 100)
  const calculateScore = (target: string, actual: string): number => {
    const cleanTarget = target.toLowerCase().trim();
    const cleanActual = actual.toLowerCase().trim();
    if (cleanTarget === cleanActual) return 100;
    if (cleanActual.includes(cleanTarget) || cleanTarget.includes(cleanActual)) return 85;
    
    // Levenshtein distance
    const track = Array(cleanActual.length + 1).fill(null).map(() =>
      Array(cleanTarget.length + 1).fill(null));
    for (let i = 0; i <= cleanActual.length; i += 1) track[i][0] = i;
    for (let j = 0; j <= cleanTarget.length; j += 1) track[0][j] = j;
    for (let i = 1; i <= cleanActual.length; i += 1) {
      for (let j = 1; j <= cleanTarget.length; j += 1) {
        const indicator = cleanActual[i - 1] === cleanTarget[j - 1] ? 0 : 1;
        track[i][j] = Math.min(
          track[i - 1][j] + 1,
          track[i][j - 1] + 1,
          track[i - 1][j - 1] + indicator
        );
      }
    }
    const dist = track[cleanActual.length][cleanTarget.length];
    const maxLen = Math.max(cleanActual.length, cleanTarget.length);
    if (maxLen === 0) return 100;
    const similarity = Math.max(0, Math.round((1 - dist / maxLen) * 100));
    return similarity;
  };

  // Mic recording and grading handler
  const startSpeechRecognition = (targetWord: string, ipaSound: string) => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn chưa hỗ trợ Web Speech API. Vui lòng thử trên Google Chrome hoặc Microsoft Edge.");
      return;
    }

    if (recognizingWord === targetWord) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setRecognizingWord(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setRecognizingWord(targetWord);
      setUserTranscript("");
      setScoreResult(null);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        setUserTranscript(transcript);
        
        const score = calculateScore(targetWord, transcript);
        let feedback = "Cần luyện thêm khẩu hình miệng để phát âm chuẩn hơn!";
        if (score >= 90) feedback = "Xuất sắc! Phát âm cực kỳ chuẩn xác và tự nhiên!";
        else if (score >= 70) feedback = "Khá tốt! Bạn đã phát âm gần như chuẩn bản xứ.";
        else if (score >= 40) feedback = "Gần đúng rồi, hãy chú ý đẩy hơi và đặt lưỡi đúng vị trí nhé!";

        setScoreResult({ word: targetWord, score, feedback });
        setRecognizingWord(null);

        // Record to practice history
        if (onRecordHistory) {
          onRecordHistory({
            type: "shadowing",
            typeName: `Luyện IPA ${ipaSound}`,
            topic: `Phát âm từ: "${targetWord}"`,
            lang: "en",
            score,
            userAnswer: transcript,
            correctAnswer: `${targetWord} (${ipaSound})`,
            feedback,
          });
        }
      };

      recognition.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setRecognizingWord(null);
      };

      recognition.onend = () => {
        setRecognizingWord(null);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setRecognizingWord(null);
    }
  };

  const currentPair = MINIMAL_PAIRS_DATA.find((p) => p.id === activePairId) || MINIMAL_PAIRS_DATA[0];

  return (
    <div className="space-y-6">
      {/* Top Header Banner for IPA */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide">
              🇬🇧 English Phonetics Hub
            </span>
            <span className="px-3 py-0.5 bg-amber-400/90 text-amber-950 rounded-full text-xs font-extrabold shadow-xs">
              44 Âm IPA Chuẩn Quốc Tế
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            Luyện Phát Âm 44 Âm IPA & Chuyên Đề Cặp Âm (Minimal Pairs)
          </h1>
          <p className="text-xs text-blue-100 leading-relaxed">
            Nhận diện chuẩn xác 20 nguyên âm, 24 phụ âm và làm chủ các cặp âm kinh điển dễ nhầm lẫn như <strong>/s/ - /ʃ/</strong>, <strong>/θ/ - /ð/</strong>, <strong>/iː/ - /ɪ/</strong>, <strong>/p/ - /b/</strong>, <strong>/æ/ - /e/</strong> kèm chấm điểm AI tức thì!
          </p>
        </div>

        <div className="flex sm:flex-col gap-2 shrink-0 self-start sm:self-auto relative z-10">
          <Link
            href="/practice"
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm text-white"
          >
            <span>🏆</span>
            <span>Luyện Tập Chuyên Sâu</span>
          </Link>
          <Link
            href="/curriculum"
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 border border-white/30 backdrop-blur-md rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm text-white"
          >
            <span>📚</span>
            <span>Lộ Trình IELTS 7.0</span>
          </Link>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("minimal_pairs")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "minimal_pairs"
              ? "bg-white text-indigo-700 shadow-3xs scale-102"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span>🔥</span>
          <span>Phòng Luyện Cặp Âm (/s/-/ʃ/, /θ/-/ð/...)</span>
        </button>

        <button
          onClick={() => setActiveTab("vowels")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "vowels"
              ? "bg-white text-indigo-700 shadow-3xs scale-102"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span>🔵</span>
          <span>20 Nguyên Âm IPA (Vowels)</span>
        </button>

        <button
          onClick={() => setActiveTab("consonants")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "consonants"
              ? "bg-white text-indigo-700 shadow-3xs scale-102"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span>🟢</span>
          <span>24 Phụ Âm IPA (Consonants)</span>
        </button>
      </div>

      {/* ================= TAB 1: MINIMAL PAIRS TRAINING ================= */}
      {activeTab === "minimal_pairs" && (
        <div className="space-y-6">
          {/* Pair Selection Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {MINIMAL_PAIRS_DATA.map((pair) => (
              <button
                key={pair.id}
                onClick={() => {
                  setActivePairId(pair.id);
                  setScoreResult(null);
                  setUserTranscript("");
                }}
                className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activePairId === pair.id
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm scale-102"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded-md text-[11px]">
                  {pair.soundA} vs {pair.soundB}
                </span>
                <span className="text-[11px] font-semibold">{pair.id === "s-sh" ? "S nhẹ vs SH chu môi" : pair.id === "th-unvoiced-voiced" ? "TH thổi gió vs TH rung" : pair.soundA + " vs " + pair.soundB}</span>
              </button>
            ))}
          </div>

          {/* Current Pair Header & Mouth Guide */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <span>{currentPair.title}</span>
            </h3>

            {/* Side-by-Side Mouth Positioning Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-blue-700 font-mono">{currentPair.soundA}</span>
                  <button
                    onClick={() => playSpeech(currentPair.soundA.replace(/[\/ː]/g, ""))}
                    className="p-1.5 bg-white text-blue-700 rounded-xl shadow-3xs hover:bg-blue-100 transition-colors cursor-pointer"
                    title="Nghe âm mẫu"
                  >
                    🔊 Nghe âm
                  </button>
                </div>
                <div className="text-xs text-gray-700 font-medium leading-relaxed">
                  <strong className="text-blue-900 block mb-0.5">👄 Khẩu hình miệng:</strong>
                  {currentPair.mouthGuideA}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-purple-700 font-mono">{currentPair.soundB}</span>
                  <button
                    onClick={() => playSpeech(currentPair.soundB.replace(/[\/ː]/g, ""))}
                    className="p-1.5 bg-white text-purple-700 rounded-xl shadow-3xs hover:bg-purple-100 transition-colors cursor-pointer"
                    title="Nghe âm mẫu"
                  >
                    🔊 Nghe âm
                  </button>
                </div>
                <div className="text-xs text-gray-700 font-medium leading-relaxed">
                  <strong className="text-purple-900 block mb-0.5">👄 Khẩu hình miệng:</strong>
                  {currentPair.mouthGuideB}
                </div>
              </div>
            </div>

            {/* Minimal Pairs Word List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">
                  Cặp Từ So Sánh & Thực Hành Bằng Giọng Nói (Minimal Pairs):
                </h4>
                <span className="text-[10px] text-gray-400 italic">Bấm 🎙️ để nói và nhận điểm số AI</span>
              </div>

              <div className="space-y-2.5">
                {currentPair.pairs.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 shadow-3xs grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {/* Word A */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/80">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-gray-900">{p.wordA}</span>
                          <span className="text-xs font-mono text-blue-600 font-bold">{p.ipaA}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">{p.meaningA}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => playSpeech(p.wordA)}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Nghe phát âm"
                        >
                          🔊
                        </button>
                        <button
                          onClick={() => startSpeechRecognition(p.wordA, currentPair.soundA)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            recognizingWord === p.wordA
                              ? "bg-red-600 text-white animate-pulse"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                          title="Thu âm phát âm từ này"
                        >
                          🎙️
                        </button>
                      </div>
                    </div>

                    {/* Word B */}
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200/80">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-black text-gray-900">{p.wordB}</span>
                          <span className="text-xs font-mono text-purple-600 font-bold">{p.ipaB}</span>
                        </div>
                        <div className="text-[11px] text-gray-500">{p.meaningB}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => playSpeech(p.wordB)}
                          className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="Nghe phát âm"
                        >
                          🔊
                        </button>
                        <button
                          onClick={() => startSpeechRecognition(p.wordB, currentPair.soundB)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            recognizingWord === p.wordB
                              ? "bg-red-600 text-white animate-pulse"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}
                          title="Thu âm phát âm từ này"
                        >
                          🎙️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Score Feedback Card */}
              {scoreResult && (
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 shadow-3xs animate-in zoom-in-95 duration-200 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <span className="text-xs font-bold text-gray-900">
                        Kết quả luyện từ: <strong className="text-indigo-700 uppercase">{scoreResult.word}</strong>
                      </span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      scoreResult.score >= 80 ? "bg-emerald-600 text-white" : scoreResult.score >= 50 ? "bg-amber-600 text-white" : "bg-red-600 text-white"
                    }`}>
                      Điểm AI: {scoreResult.score}/100
                    </span>
                  </div>
                  <div className="text-xs text-indigo-950 font-semibold bg-white p-3 rounded-xl border border-indigo-100">
                    <div>Giọng đọc nhận diện: <strong className="text-gray-900">"{userTranscript}"</strong></div>
                    <div className="text-[11px] text-gray-600 mt-1">💡 Nhận xét: {scoreResult.feedback}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2 & 3: IPA CHART (VOWELS & CONSONANTS) ================= */}
      {(activeTab === "vowels" || activeTab === "consonants") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sounds Grid on Left/Center (2 columns on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                  <span>{activeTab === "vowels" ? "🔵" : "🟢"}</span>
                  <span>{activeTab === "vowels" ? "Bảng 20 Nguyên Âm Tiếng Anh" : "Bảng 24 Phụ Âm Tiếng Anh"}</span>
                </h3>
                <span className="text-[10px] text-gray-400 font-bold">Bấm vào âm để xem chi tiết</span>
              </div>

              {/* Grid of Sound Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {IPA_SOUNDS.filter((s) =>
                  activeTab === "vowels"
                    ? s.type.startsWith("monophthong") || s.type === "diphthong"
                    : s.type.startsWith("consonant")
                ).map((sound) => {
                  const isSelected = selectedSound?.ipa === sound.ipa;
                  return (
                    <button
                      key={sound.ipa}
                      onClick={() => {
                        setSelectedSound(sound);
                        playSpeech(sound.exampleWord);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 shadow-3xs ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 scale-103 shadow-md"
                          : "bg-gray-50/70 hover:bg-gray-100/90 text-gray-800 border-gray-200/80"
                      }`}
                    >
                      <span className="text-xl font-black font-mono">{sound.ipa}</span>
                      <span className={`text-[10px] font-bold ${isSelected ? "text-indigo-100" : "text-gray-500"}`}>
                        {sound.exampleWord}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sound Detail Panel on Right */}
          <div className="lg:col-span-1">
            {selectedSound ? (
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4 sticky top-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <span className="text-3xl font-black text-indigo-700 font-mono block">
                      {selectedSound.ipa}
                    </span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                      {selectedSound.categoryName}
                    </span>
                  </div>
                  <button
                    onClick={() => playSpeech(selectedSound.exampleWord)}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-base shadow-3xs transition-colors cursor-pointer"
                    title="Nghe phát âm từ mẫu"
                  >
                    🔊
                  </button>
                </div>

                {/* Example Word */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Từ mẫu tiêu biểu:</div>
                  <div className="text-lg font-black text-gray-900 flex items-baseline gap-2">
                    <span>{selectedSound.exampleWord}</span>
                    <span className="text-xs font-normal text-gray-500">({selectedSound.meaning})</span>
                  </div>
                  <div className="text-[11px] text-teal-700 font-semibold">
                    💡 Tương đương: {selectedSound.vietnameseApprox}
                  </div>
                </div>

                {/* Mouth Guide */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-extrabold text-gray-900 block flex items-center gap-1.5">
                    <span>👄</span>
                    <span>Hướng dẫn khẩu hình & cách phát âm:</span>
                  </span>
                  <p className="text-gray-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 font-medium">
                    {selectedSound.mouthGuide}
                  </p>
                </div>

                {/* Practice Words */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">Từ vựng luyện tập thêm:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSound.moreWords.map((word) => (
                      <button
                        key={word}
                        onClick={() => playSpeech(word)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{word}</span>
                        <span className="text-[10px]">🔊</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mic Practice Button */}
                <div className="pt-2">
                  <button
                    onClick={() => startSpeechRecognition(selectedSound.exampleWord, selectedSound.ipa)}
                    className={`w-full py-3 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      recognizingWord === selectedSound.exampleWord
                        ? "bg-red-600 text-white animate-pulse"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    <span>🎙️</span>
                    <span>
                      {recognizingWord === selectedSound.exampleWord
                        ? "Đang lắng nghe bạn nói..."
                        : `Luyện đọc từ "${selectedSound.exampleWord}"`}
                    </span>
                  </button>
                </div>

                {/* Single Sound Scoring Result */}
                {scoreResult && scoreResult.word === selectedSound.exampleWord && (
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs space-y-1 animate-in zoom-in-95 duration-150">
                    <div className="flex justify-between items-center font-bold">
                      <span>Điểm số:</span>
                      <span className="text-indigo-700 font-extrabold">{scoreResult.score}/100</span>
                    </div>
                    <div className="text-[11px] text-gray-600 italic">{scoreResult.feedback}</div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
