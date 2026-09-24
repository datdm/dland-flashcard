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

export async function searchJapaneseDictionary(query: string, langCode: string = "ja", signal?: AbortSignal): Promise<DictionaryItem[]> {
  return searchMultilingualDictionary(query, langCode, signal);
}

export async function searchMultilingualDictionary(query: string, langCode: string = "ja", signal?: AbortSignal): Promise<DictionaryItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: DictionaryItem[] = [];

  // 1. Search Local Repository for active language only
  try {
    const vocabRepo = getVocabularyRepository();
    const localMatches = await vocabRepo.searchVocabulary(q, langCode);

    // Limit max local matches to avoid memory overload
    const limitedLocal = localMatches.slice(0, 40);

    limitedLocal.forEach((v) => {
      let lvl = v.id.startsWith("n5") ? "N5" : v.id.startsWith("n4") ? "N4" : v.id.startsWith("n3") ? "N3" : v.id.startsWith("n2") ? "N2" : undefined;
      
      if (langCode === "en") {
        if (v.id.startsWith("en-w")) {
          const parts = v.id.split("-w");
          const wNum = parseInt(parts[1] ? parts[1].split("-")[0] : "0", 10);
          if (wNum <= 12) lvl = "Band 4.0-4.5";
          else if (wNum <= 26) lvl = "Band 5.0-5.5";
          else if (wNum <= 39) lvl = "Band 6.0-6.5";
          else lvl = "Band 7.0+";
        } else {
          lvl = "IELTS 7.0";
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

  if (signal?.aborted) return results;

  // 2. Fetch Online API for active language with AbortSignal support
  try {
    const res = await fetch(`/api/dictionary?keyword=${encodeURIComponent(q)}&lang=${langCode}`, { signal });
    if (res.ok) {
      const json = await res.json();
      const onlineData = json.data || [];

      onlineData.forEach((item: any, idx: number) => {
        const itemKanji = item.kanji;
        const itemHiragana = item.hiragana;

        const alreadyExists = results.some(
          (r) => r.source === item.source && r.meaning === item.meaning
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
  } catch (err: any) {
    if (err.name !== "AbortError") {
      console.error("Online dictionary search error:", err);
    }
  }

  return results;
}
