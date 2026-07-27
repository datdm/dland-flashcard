import { NextRequest, NextResponse } from "next/server";

// Function to translate English text to Vietnamese using free Google Translate endpoint
async function translateToVietnamese(text: string): Promise<string> {
  if (!text) return "";
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
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
  return text; // Fallback to original
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword");

  if (!keyword || !keyword.trim()) {
    return NextResponse.json({ data: [] });
  }

  const query = keyword.trim();
  let results: any[] = [];

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
              onyomi: item.hb, // Âm Hán Việt từ Mazii
              meaning: meaningsStr, // Nghĩa tiếng Việt 100%
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

  // 2. If Mazii yields no results, fallback to Jisho + Auto Translation to Vietnamese
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

          const translatedMeaning = await translateToVietnamese(englishMeanings);

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
