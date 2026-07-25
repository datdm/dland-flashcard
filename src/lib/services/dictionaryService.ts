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

export async function searchJapaneseDictionary(query: string): Promise<DictionaryItem[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: DictionaryItem[] = [];

  // 1. Search Local N5-N2 Repository (Tiếng Việt sẵn có)
  try {
    const vocabRepo = getVocabularyRepository();
    const localMatches = await vocabRepo.searchVocabulary(q);

    localMatches.forEach((v) => {
      results.push({
        id: v.id,
        kanji: v.kanji,
        hiragana: v.hiragana,
        onyomi: v.onyomi,
        meaning: v.meaning || "",
        phonetic: v.phonetic,
        level: v.id.startsWith("n5")
          ? "N5"
          : v.id.startsWith("n4")
          ? "N4"
          : v.id.startsWith("n3")
          ? "N3"
          : v.id.startsWith("n2")
          ? "N2"
          : undefined,
        isOnline: false,
        source: "Nội bộ (Nhật-Việt)"
      });
    });
  } catch (err) {
    console.error("Local search error:", err);
  }

  // 2. Fetch Online API (Mazii Nhật-Việt + Jisho Dịch Tiếng Việt)
  try {
    const res = await fetch(`/api/dictionary?keyword=${encodeURIComponent(q)}`);
    if (res.ok) {
      const json = await res.json();
      const onlineData = json.data || [];

      onlineData.forEach((item: any, idx: number) => {
        const itemKanji = item.kanji;
        const itemHiragana = item.hiragana;

        // Deduplicate if already found locally
        const alreadyExists = results.some(
          (r) =>
            (itemKanji && r.kanji === itemKanji) ||
            (itemHiragana && r.hiragana === itemHiragana)
        );

        if (!alreadyExists && (itemKanji || itemHiragana)) {
          results.push({
            id: `online-${idx}-${Date.now()}`,
            kanji: itemKanji,
            hiragana: itemHiragana,
            onyomi: item.onyomi,
            meaning: item.meaning, // 100% Tiếng Việt
            level: item.level,
            isOnline: true,
            source: item.source || "Trực tuyến (Nhật-Việt)"
          });
        }
      });
    }
  } catch (err) {
    console.error("Online dictionary search error:", err);
  }

  return results;
}
