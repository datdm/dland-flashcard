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

  // ================= ENGLISH DICTIONARY API (SEPARATE PER API SOURCE) =================
  if (lang === "en") {
    // 1. Google Translate API (Anh - Việt)
    try {
      const viMeaning = await translateToVietnamese(query, "en");
      if (viMeaning && viMeaning.toLowerCase() !== query.toLowerCase()) {
        results.push({
          kanji: query,
          hiragana: "Anh - Việt",
          meaning: viMeaning,
          phonetic: "Dịch nghĩa Tiếng Việt trực tuyến",
          level: "Anh-Việt",
          source: "Google Translate API"
        });
      }
    } catch (err) {
      console.error("Google Translate error:", err);
    }

    // 2. FreeDictionaryAPI (IPA, Part of speech, English Definition & Example)
    try {
      const freeDictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
      if (freeDictRes.ok) {
        const freeDictData = await freeDictRes.json();
        if (Array.isArray(freeDictData) && freeDictData.length > 0) {
          const entry = freeDictData[0];
          const phoneticsStr = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "";
          
          if (entry.meanings && entry.meanings.length > 0) {
            entry.meanings.slice(0, 2).forEach((m: any) => {
              const pos = m.partOfSpeech || "";
              const def = m.definitions?.[0]?.definition || "";
              const example = m.definitions?.[0]?.example || "";

              if (def) {
                results.push({
                  kanji: query,
                  hiragana: `${phoneticsStr ? phoneticsStr + " • " : ""}${pos}`,
                  meaning: def,
                  phonetic: example ? `💬 Example: "${example}"` : "Định nghĩa Tiếng Anh học thuật",
                  level: "IELTS",
                  source: "Free Dictionary API"
                });
              }
            });
          }
        }
      }
    } catch (err) {
      console.error("FreeDictionaryAPI error:", err);
    }

    // 3. Datamuse API (IELTS Synonyms / Lexical Resource)
    try {
      const datamuseRes = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(query)}&max=6`);
      if (datamuseRes.ok) {
        const datamuseData = await datamuseRes.json();
        if (Array.isArray(datamuseData) && datamuseData.length > 0) {
          const synonymsList = datamuseData.map((w: any) => w.word).filter(Boolean);
          if (synonymsList.length > 0) {
            results.push({
              kanji: query,
              hiragana: "Từ đồng nghĩa (Synonyms)",
              meaning: synonymsList.join(", "),
              phonetic: "🔄 IELTS Lexical Resource (Dùng cho Writing & Speaking)",
              level: "IELTS Synonyms",
              source: "Datamuse API"
            });
          }
        }
      }
    } catch (e) {
      console.error("Datamuse API error:", e);
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
        source: "Google Dịch API"
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
              source: "Mazii API",
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
              source: "Jisho API",
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
