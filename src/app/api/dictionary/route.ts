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
  const keyword = searchParams.get("keyword") || searchParams.get("q") || searchParams.get("query");
  const lang = searchParams.get("lang") || "ja";

  if (!keyword || !keyword.trim()) {
    return NextResponse.json({ data: [] });
  }

  const query = keyword.trim();
  let results: any[] = [];

  // ================= ENGLISH DICTIONARY API (SEPARATE PER API SOURCE) =================
  if (lang === "en") {
    // Fetch FreeDictionaryAPI (IPA, Part of speech, English Definition & Example)
    let globalIpa = "";
    let freeDictItems: any[] = [];
    try {
      const freeDictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
      if (freeDictRes.ok) {
        const freeDictData = await freeDictRes.json();
        if (Array.isArray(freeDictData) && freeDictData.length > 0) {
          const entry = freeDictData[0];
          const rawIpa = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || "";
          if (rawIpa) {
            globalIpa = rawIpa.startsWith("/") ? rawIpa : `/${rawIpa}/`;
          }
          
          if (entry.meanings && entry.meanings.length > 0) {
            entry.meanings.slice(0, 2).forEach((m: any) => {
              const pos = m.partOfSpeech || "";
              const def = m.definitions?.[0]?.definition || "";
              const example = m.definitions?.[0]?.example || "";

              if (def) {
                freeDictItems.push({
                  kanji: query,
                  hiragana: globalIpa || "",
                  meaning: def,
                  phonetic: pos ? `[${pos}] ${example ? `💬 Example: "${example}"` : ""}`.trim() : (example ? `💬 "${example}"` : "Academic English Definition"),
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

    // If globalIpa still empty, fetch IPA from Datamuse IPA API
    if (!globalIpa) {
      try {
        const datamuseIpaRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(query)}&qe=sp&md=r&ipa=1&max=1`);
        if (datamuseIpaRes.ok) {
          const dmData = await datamuseIpaRes.json();
          if (Array.isArray(dmData) && dmData.length > 0) {
            const ipaTag = dmData[0]?.tags?.find((t: string) => t.startsWith("ipa_pron:"));
            if (ipaTag) {
              const pron = ipaTag.replace("ipa_pron:", "").trim();
              if (pron) {
                globalIpa = `/${pron}/`;
              }
            }
          }
        }
      } catch (dmErr) {
        console.error("Datamuse IPA error:", dmErr);
      }
    }

    // 1. Google Translate API (Anh - Việt)
    try {
      const viMeaning = await translateToVietnamese(query, "en");
      if (viMeaning && viMeaning.toLowerCase() !== query.toLowerCase()) {
        results.push({
          kanji: query,
          hiragana: globalIpa || "",
          meaning: viMeaning,
          phonetic: globalIpa ? `Phiên âm chuẩn IPA: ${globalIpa}` : "Dịch nghĩa Anh-Việt",
          level: "Anh-Việt",
          source: "Google Translate API"
        });
      }
    } catch (err) {
      console.error("Google Translate error:", err);
    }

    // Add FreeDictionary items (updating globalIpa if acquired from Datamuse)
    freeDictItems.forEach((item) => {
      if (!item.hiragana && globalIpa) {
        item.hiragana = globalIpa;
      }
    });
    results.push(...freeDictItems);

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
              hiragana: globalIpa || "",
              meaning: synonymsList.join(", "),
              phonetic: "🔄 Từ đồng nghĩa (IELTS Synonyms / Lexical Resource)",
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
  // 1. Try Mazii Japanese-Vietnamese API (Word Search)
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
        maziiJson.data.forEach((item: any) => {
          const meanList: string[] = [];
          const exampleList: { japanese: string; vietnamese: string }[] = [];

          if (Array.isArray(item.means)) {
            item.means.forEach((m: any) => {
              if (m.mean) {
                const kindStr = m.kind ? `[${m.kind}] ` : "";
                meanList.push(`${kindStr}${m.mean}`);
              }
              if (Array.isArray(m.examples)) {
                m.examples.forEach((ex: any) => {
                  if (ex.content && ex.mean) {
                    exampleList.push({
                      japanese: ex.content,
                      vietnamese: ex.mean,
                    });
                  }
                });
              }
            });
          }

          const meaningsStr = meanList.join("; ") || item.short_mean || "";
          const levelStr = Array.isArray(item.level) 
            ? item.level.join(", ") 
            : (item.level ? item.level : (item.jlpt ? `N${item.jlpt}` : undefined));

          if (meaningsStr || item.word || item.phonetic) {
            results.push({
              kanji: item.word,
              hiragana: item.phonetic || item.word,
              onyomi: item.han || item.hb || undefined,
              meaning: meaningsStr,
              level: levelStr,
              examples: exampleList.slice(0, 4),
              source: "Mazii API",
            });
          }
        });
      }
    }
  } catch (err) {
    console.error("Mazii Word API error:", err);
  }

  // 2. If single Kanji or 0 word results, try Mazii Kanji search
  if (results.length === 0 || query.length <= 2) {
    try {
      const kanjiRes = await fetch("https://mazii.net/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query,
          dict: "javi",
          type: "kanji",
          limit: 3,
        }),
      });

      if (kanjiRes.ok) {
        const kanjiJson = await kanjiRes.json();
        const kanjiData = kanjiJson.results || kanjiJson.data || [];
        if (Array.isArray(kanjiData)) {
          kanjiData.forEach((kItem: any) => {
            const mean = kItem.mean || kItem.detail || "";
            const onKun = [kItem.on ? `Âm On: ${kItem.on}` : "", kItem.kun ? `Âm Kun: ${kItem.kun}` : ""].filter(Boolean).join(" • ");
            const kanjiLevel = Array.isArray(kItem.level) ? kItem.level.join(", ") : kItem.level;
            
            const kanjiExamples: { japanese: string; vietnamese: string }[] = [];
            if (Array.isArray(kItem.examples)) {
              kItem.examples.slice(0, 4).forEach((ex: any) => {
                if (ex.w && ex.m) {
                  kanjiExamples.push({
                    japanese: `${ex.w} (${ex.p || ""}) - ${ex.h || ""}`.trim(),
                    vietnamese: ex.m,
                  });
                }
              });
            }

            if (kItem.kanji || mean) {
              results.push({
                kanji: kItem.kanji || query,
                hiragana: onKun || kItem.kun || kItem.on || query,
                onyomi: kItem.mean || undefined, // Hán Việt
                meaning: kItem.detail || mean,
                level: kanjiLevel,
                examples: kanjiExamples,
                source: "Mazii Hán Tự API",
              });
            }
          });
        }
      }
    } catch (kErr) {
      console.error("Mazii Kanji API error:", kErr);
    }
  }

  // 3. Fallback to Jisho + Auto Translation to Vietnamese
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
