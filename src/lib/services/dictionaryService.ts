import { getVocabularyRepository } from "@/lib/repositories";

export interface DictionaryItem {
  id: string;
  kanji?: string;
  hiragana?: string;
  onyomi?: string;
  meaning: string;
  phonetic?: string;
  level?: string;
  isOnline?: boolean;
  source?: string;
}

export async function searchJapaneseDictionary(query: string, langCode: string = "ja"): Promise<DictionaryItem[]> {
  return searchMultilingualDictionary(query, langCode);
}

export async function searchMultilingualDictionary(query: string, langCode: string = "ja"): Promise<DictionaryItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: DictionaryItem[] = [];

  // 1. Search Local Repository for active language
  try {
    const vocabRepo = getVocabularyRepository();
    const localMatches = await vocabRepo.searchVocabulary(q);

    localMatches.forEach((v) => {
      let lvl = v.id.startsWith("n5") ? "N5" : v.id.startsWith("n4") ? "N4" : v.id.startsWith("n3") ? "N3" : v.id.startsWith("n2") ? "N2" : undefined;
      
      if (langCode === "en") {
        if (v.id.startsWith("en-w")) {
          const wNum = parseInt(v.id.split("-w")[1] || "0", 10);
          if (wNum <= 12) lvl = "GĐ 1";
          else if (wNum <= 26) lvl = "GĐ 2";
          else if (wNum <= 39) lvl = "GĐ 3";
          else lvl = "GĐ 4";
        } else {
          lvl = "IELTS";
        }
      } else if (langCode === "de") {
        lvl = "A1";
      }

      const sourceLabel = langCode === "en"
        ? "Nội bộ (IELTS Anh-Việt)"
        : langCode === "de"
        ? "Nội bộ (Goethe Đức-Việt)"
        : "Nội bộ (JLPT Nhật-Việt)";

      results.push({
        id: v.id,
        kanji: v.kanji,
        hiragana: v.hiragana,
        onyomi: v.onyomi,
        meaning: v.meaning || "",
        phonetic: v.phonetic,
        level: lvl,
        isOnline: false,
        source: sourceLabel
      });
    });
  } catch (err) {
    console.error("Local dictionary search error:", err);
  }

  // 2. Fetch Online API for active language
  try {
    const res = await fetch(`/api/dictionary?keyword=${encodeURIComponent(q)}&lang=${langCode}`);
    if (res.ok) {
      const json = await res.json();
      const onlineData = json.data || [];

      onlineData.forEach((item: any, idx: number) => {
        const itemKanji = item.kanji;
        const itemHiragana = item.hiragana;

        const alreadyExists = results.some(
          (r) =>
            (itemKanji && r.kanji?.toLowerCase() === itemKanji.toLowerCase()) ||
            (itemHiragana && r.hiragana?.toLowerCase() === itemHiragana.toLowerCase())
        );

        if (!alreadyExists && (itemKanji || itemHiragana || item.meaning)) {
          results.push({
            id: `online-${idx}-${Date.now()}`,
            kanji: itemKanji,
            hiragana: itemHiragana,
            onyomi: item.onyomi,
            meaning: item.meaning,
            phonetic: item.phonetic,
            level: item.level,
            isOnline: true,
            source: item.source || "Trực tuyến"
          });
        }
      });
    }
  } catch (err) {
    console.error("Online dictionary search error:", err);
  }

  return results;
}
