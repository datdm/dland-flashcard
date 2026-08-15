import { NextRequest, NextResponse } from "next/server";

// Free Google Translate endpoint (English/German -> Vietnamese)
async function translateToVietnamese(text: string, sourceLang: string = "en"): Promise<string> {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data[0])) {
        return data[0].map((item: any) => item[0]).join("");
      }
    }
  } catch (err) {
    console.error("Translation error:", err);
  }
  return text;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");
  const lang = searchParams.get("lang") || "ja";

  if (!keyword || !keyword.trim()) {
    return NextResponse.json({ data: [] });
  }

  const query = keyword.trim();
  let results: any[] = [];

  // ================= ENGLISH DICTIONARY API =================
  if (lang === "en") {
    try {
      // 1. Fetch FreeDictionaryAPI (IPA, Audio, Part of speech, English definition)
      const freeDictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
      let phoneticsStr = "";
      let partOfSpeech = "";
      let englishDef = "";
      let exampleSentence = "";

      if (freeDictRes.ok) {
        const freeDictData = await freeDictRes.json();
        if (Array.isArray(freeDictData) && freeDictData.length > 0) {
          const entry = freeDictData[0];
          phoneticsStr = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "";
          
          if (entry.meanings && entry.meanings.length > 0) {
            const m = entry.meanings[0];
            partOfSpeech = m.partOfSpeech || "";
            if (m.definitions && m.definitions.length > 0) {
              englishDef = m.definitions[0].definition || "";
              exampleSentence = m.definitions[0].example || "";
            }
          }
        }
      }

      // 2. Translate word & example to Vietnamese
      const viMeaning = await translateToVietnamese(query, "en");
      const viExample = exampleSentence ? await translateToVietnamese(exampleSentence, "en") : "";

      const phoneticCombined = [
        phoneticsStr,
        partOfSpeech ? `(${partOfSpeech})` : "",
        englishDef ? `[EN: ${englishDef}]` : ""
      ].filter(Boolean).join(" ");

      results.push({
        kanji: query,
        hiragana: phoneticsStr || partOfSpeech,
        meaning: viMeaning !== query ? viMeaning : (englishDef || viMeaning),
        phonetic: phoneticCombined + (viExample ? ` • Example: "${exampleSentence}" (${viExample})` : ""),
        level: "English",
        source: "FreeDictionary + Google Dịch (Anh-Việt)"
      });
    } catch (err) {
      console.error("English dictionary error:", err);
    }
    return NextResponse.json({ data: results });
  }

  // ================= GERMAN DICTIONARY API =================
  if (lang === "de") {
    try {
      const viMeaning = await translateToVietnamese(query, "de");
      results.push({
        kanji: query,
        hiragana: "Deutsch",
        meaning: viMeaning,
        phonetic: "Từ điển Đức-Việt",
        level: "A1-B2",
        source: "Google Dịch (Đức-Việt)"
      });
    } catch (err) {
      console.error("German dictionary error:", err);
    }
    return NextResponse.json({ data: results });
  }

  // ================= JAPANESE DICTIONARY API (MAZII & JISHO) =================
  // 1. Try Mazii Japanese-Vietnamese API first
  try {
    const maziiRes = await fetch("https://mazii.net/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query,
        dict: "javi",
        type: "word",
        limit: 10,
      }),
    });

    if (maziiRes.ok) {
      const maziiJson = await maziiRes.json();
      if (maziiJson.status === 200 && Array.isArray(maziiJson.data)) {
        maziiJson.data.slice(0, 10).forEach((item: any) => {
          const meaningsStr = item.means
            ?.map((m: any) => m.mean)
            .filter(Boolean)
            .join("; ");

          if (meaningsStr) {
            results.push({
              kanji: item.word !== item.phonetic ? item.word : undefined,
              hiragana: item.phonetic || item.word,
              onyomi: item.hb,
              meaning: meaningsStr,
              level: item.jlpt ? `N${item.jlpt}` : undefined,
              source: "Mazii (Nhật-Việt)",
            });
          }
        });
      }
    }
  } catch (err) {
    console.error("Mazii API error:", err);
  }

  // 2. Fallback to Jisho + Auto Translation to Vietnamese
  if (results.length === 0) {
    try {
      const jishoRes = await fetch(
        `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } }
      );

      if (jishoRes.ok) {
        const jishoJson = await jishoRes.json();
        const jishoData = jishoJson.data || [];

        for (const item of jishoData.slice(0, 8)) {
          const japanese = item.japanese?.[0] || {};
          const senses = item.senses?.[0] || {};
          const englishMeanings = senses.english_definitions?.join("; ") || "";
          const jlpt = item.jlpt?.[0]?.replace("jlpt-", "").toUpperCase();

          const translatedMeaning = await translateToVietnamese(englishMeanings, "en");

          if (japanese.word || japanese.reading) {
            results.push({
              kanji: japanese.word,
              hiragana: japanese.reading,
              meaning: translatedMeaning || englishMeanings,
              level: jlpt,
              source: "Jisho (Dịch Tiếng Việt)",
            });
          }
        }
      }
    } catch (err) {
      console.error("Jisho API error:", err);
    }
  }

  return NextResponse.json({ data: results });
}
