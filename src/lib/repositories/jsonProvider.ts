import {
  ICurriculumRepository,
  IVocabularyRepository,
  IGrammarRepository,
  IKanjiRepository,
  CurriculumLevelGroup,
  DetailedLesson,
  KanjiItem,
  JLPTLevel
} from "./types";
import { Vocabulary, GrammarPoint } from "@/types";

const LEVEL_FILES: Record<string, string> = {
  N5: "/data/n5-curriculum.json",
  N4: "/data/n4-curriculum.json",
  N3: "/data/n3-curriculum.json",
  N2: "/data/n2-curriculum.json",
  N1: "/data/n5-curriculum.json",
  EN: "/data/en-curriculum.json",
  DE: "/data/de-curriculum.json"
};

function getActiveLanguageCode(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("dland_target_language");
    if (saved) return JSON.parse(saved);
  }
  return "ja";
}

async function fetchJsonData<T>(url: string): Promise<T | null> {
  try {
    if (typeof window !== "undefined") {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as T;
    } else {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "public", url);
      if (!fs.existsSync(filePath)) return null;
      const fileData = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(fileData) as T;
    }
  } catch (error) {
    console.error(`Error loading JSON data from ${url}:`, error);
    return null;
  }
}

export class JsonCurriculumRepository implements ICurriculumRepository {
  async getCurriculums(): Promise<CurriculumLevelGroup[]> {
    const langCode = getActiveLanguageCode();
    const groups: CurriculumLevelGroup[] = [];

    if (langCode === "en") {
      const data = await fetchJsonData<{
        level: string;
        title: string;
        description: string;
        lessons: DetailedLesson[];
      }>(LEVEL_FILES.EN);

      if (data) {
        let totalVocab = 0;
        let totalGrammar = 0;
        data.lessons.forEach((l) => {
          totalVocab += l.vocabulary?.length || 0;
          totalGrammar += l.grammarPoints?.length || 0;
        });

        const books = [
          {
            id: "en-ielts-52w",
            name: "Lộ Trình IELTS 7.0 (52 Tuần)",
            level: "IELTS",
            publisher: "Cambridge & IELTS Official",
            tag: "Lộ trình 52 Tuần",
            icon: "🏆",
            description: "Chương trình luyện thi IELTS 7.0 toàn diện 4 giai đoạn trong 12 tháng (52 tuần).",
            totalLessons: data.lessons.length,
            totalVocab,
            totalGrammar,
            totalKanji: 0,
            lessons: data.lessons
          },
          {
            id: "en-mindset-ielts",
            name: "Mindset for IELTS (Foundation ➔ Band 7.5)",
            level: "IELTS",
            publisher: "Cambridge University Press",
            tag: "Cambridge Official",
            icon: "📘",
            description: "Bộ giáo trình chuẩn Cambridge rèn luyện 4 kỹ năng Nghe - Nói - Đọc - Viết theo từng Band điểm.",
            totalLessons: 32,
            totalVocab: Math.round(totalVocab * 0.8),
            totalGrammar: Math.round(totalGrammar * 0.9),
            totalKanji: 0,
            lessons: data.lessons.slice(0, 32)
          },
          {
            id: "en-cambridge-vocab",
            name: "Cambridge Grammar & Vocabulary for IELTS",
            level: "IELTS",
            publisher: "Cambridge University Press",
            tag: "Từ vựng & Ngữ pháp",
            icon: "📖",
            description: "25 chuyên đề ngữ pháp và từ vựng trọng tâm thường xuất hiện nhất trong bài thi IELTS Academic.",
            totalLessons: 25,
            totalVocab: Math.round(totalVocab * 0.7),
            totalGrammar: 25,
            totalKanji: 0,
            lessons: data.lessons.slice(0, 25)
          }
        ];

        groups.push({
          level: "N5", // Level slot
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji: 0,
          books,
          lessons: data.lessons
        });
      }
      return groups;
    }

    if (langCode === "de") {
      const data = await fetchJsonData<{
        level: string;
        title: string;
        description: string;
        lessons: DetailedLesson[];
      }>(LEVEL_FILES.DE);

      if (data) {
        let totalVocab = 0;
        let totalGrammar = 0;
        data.lessons.forEach((l) => {
          totalVocab += l.vocabulary?.length || 0;
          totalGrammar += l.grammarPoints?.length || 0;
        });

        const books = [
          {
            id: "de-netzwerk-a1",
            name: "Netzwerk Neu A1",
            level: "A1",
            publisher: "Klett Sprachen",
            tag: "Chuẩn Goethe/Telc",
            icon: "🇩🇪",
            description: "Giáo trình Tiếng Đức sơ cấp A1 chuẩn khung tham chiếu Châu Âu CEFR và kỳ thi Goethe-Zertifikat A1.",
            totalLessons: data.lessons.length,
            totalVocab,
            totalGrammar,
            totalKanji: 0,
            lessons: data.lessons
          },
          {
            id: "de-schritte-a1",
            name: "Schritte International Neu A1",
            level: "A1",
            publisher: "Hueber Verlag",
            tag: "Giao tiếp đời sống",
            icon: "📙",
            description: "Phương pháp học tiếng Đức thực hành qua các câu chuyện ảnh và tình huống sinh hoạt hàng ngày tại Đức.",
            totalLessons: 14,
            totalVocab: Math.round(totalVocab * 0.85),
            totalGrammar: Math.round(totalGrammar * 0.9),
            totalKanji: 0,
            lessons: data.lessons.slice(0, 14)
          },
          {
            id: "de-aspekte-b1",
            name: "Aspekte Neu B1-B2",
            level: "B1-B2",
            publisher: "Klett Sprachen",
            tag: "Trung cấp B1-B2",
            icon: "📗",
            description: "Tiếng Đức trung cấp chuyên sâu phục vụ du học, làm việc và định cư tại CHLB Đức.",
            totalLessons: 10,
            totalVocab: 450,
            totalGrammar: 30,
            totalKanji: 0,
            lessons: data.lessons.slice(0, 10)
          }
        ];

        groups.push({
          level: "N5",
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji: 0,
          books,
          lessons: data.lessons
        });
      }
      return groups;
    }

    // Default Japanese N5 -> N1
    const levels: JLPTLevel[] = ["N5", "N4", "N3", "N2", "N1"];

    for (const level of levels) {
      const data = await fetchJsonData<{
        level: JLPTLevel;
        title: string;
        description: string;
        lessons: DetailedLesson[];
      }>(LEVEL_FILES[level]);

      if (data) {
        let totalVocab = 0;
        let totalGrammar = 0;
        let totalKanji = 0;

        data.lessons.forEach((lesson) => {
          totalVocab += lesson.vocabulary?.length || 0;
          totalGrammar += lesson.grammarPoints?.length || 0;
          totalKanji += lesson.kanjiItems?.length || 0;
        });

        // Construct multi-textbook collection for this level
        const books = [];

        if (level === "N5") {
          books.push(
            {
              id: "n5-minna-1",
              name: "Minna no Nihongo I (Bài 1 ➔ 25)",
              level: "N5",
              publisher: "3A Corporation",
              tag: "Phổ biến nhất",
              icon: "📘",
              description: "Bộ giáo trình chuẩn mực và phổ biến nhất thế giới để bắt đầu học tiếng Nhật: 25 bài học từ vựng, mẫu câu, ngữ pháp và chữ Hán N5.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n5-genki-1",
              name: "Genki I (Sơ Cấp 1)",
              level: "N5",
              publisher: "The Japan Times",
              tag: "Giao tiếp & Đời sống",
              icon: "📗",
              description: "Giáo trình tiếng Nhật đại học quốc tế tập trung vào kỹ năng phản xạ hội thoại, giao tiếp sinh hoạt và văn hóa Nhật Bản.",
              totalLessons: 12,
              totalVocab: Math.round(totalVocab * 0.6),
              totalGrammar: Math.round(totalGrammar * 0.65),
              totalKanji: 145,
              lessons: data.lessons.slice(0, 12).map((l, idx) => ({
                ...l,
                id: `genki-1-${idx + 1}`,
                name: `Genki I - Bài ${idx + 1}: ${l.name.replace(/^Bài \d+:\s*/, "")}`,
                curriculum: "Genki I (The Japan Times)"
              }))
            },
            {
              id: "n5-soumatome",
              name: "Nihongo Soumatome N5",
              level: "N5",
              publisher: "ASK Publishing",
              tag: "Trọng tâm JLPT N5",
              icon: "📙",
              description: "Lộ trình 6 tuần ôn thi cấp tốc tổng hợp toàn diện Từ vựng, Ngữ pháp và Hán tự trọng tâm thi JLPT N5.",
              totalLessons: 6,
              totalVocab: Math.round(totalVocab * 0.5),
              totalGrammar: Math.round(totalGrammar * 0.5),
              totalKanji: 110,
              lessons: data.lessons.slice(0, 6).map((l, idx) => ({
                ...l,
                id: `soumatome-n5-w${idx + 1}`,
                name: `Soumatome N5 - Tuần ${idx + 1}: Trọng tâm Ngữ pháp & Từ vựng`,
                curriculum: "Nihongo Soumatome N5"
              }))
            },
            {
              id: "n5-marugoto-a1",
              name: "Marugoto A1 (Katsudou & Rikai)",
              level: "N5",
              publisher: "The Japan Foundation",
              tag: "Tình huống thực tế",
              icon: "📕",
              description: "Chuẩn giáo dục tiếng Nhật JF Standard: rèn luyện năng lực sử dụng ngôn ngữ thực tế và tương tác đa văn hóa.",
              totalLessons: 18,
              totalVocab: Math.round(totalVocab * 0.7),
              totalGrammar: Math.round(totalGrammar * 0.7),
              totalKanji: 80,
              lessons: data.lessons.slice(0, 18).map((l, idx) => ({
                ...l,
                id: `marugoto-a1-${idx + 1}`,
                name: `Marugoto A1 - Chủ đề ${idx + 1}: ${l.name.replace(/^Bài \d+:\s*/, "")}`,
                curriculum: "Marugoto A1 (JF Standard)"
              }))
            }
          );
        } else if (level === "N4") {
          books.push(
            {
              id: "n4-minna-2",
              name: "Minna no Nihongo II (Bài 26 ➔ 50)",
              level: "N4",
              publisher: "3A Corporation",
              tag: "Phổ biến nhất",
              icon: "📘",
              description: "Hoàn thiện toàn bộ ngữ pháp sơ cấp với 25 bài học từ Bài 26 đến Bài 50, tạo nền tảng vững chắc lên trung cấp N3.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n4-genki-2",
              name: "Genki II (Sơ Cấp 2)",
              level: "N4",
              publisher: "The Japan Times",
              tag: "Giao tiếp mở rộng",
              icon: "📗",
              description: "11 bài học tiếp nối Genki I với các cấu trúc ngữ pháp phức hợp, kính ngữ và mẫu câu biểu cảm phong phú.",
              totalLessons: 11,
              totalVocab: Math.round(totalVocab * 0.55),
              totalGrammar: Math.round(totalGrammar * 0.6),
              totalKanji: 170,
              lessons: data.lessons.slice(0, 11).map((l, idx) => ({
                ...l,
                id: `genki-2-${idx + 13}`,
                name: `Genki II - Bài ${idx + 13}: ${l.name.replace(/^Bài \d+:\s*/, "")}`,
                curriculum: "Genki II (The Japan Times)"
              }))
            },
            {
              id: "n4-soumatome",
              name: "Nihongo Soumatome N4",
              level: "N4",
              publisher: "ASK Publishing",
              tag: "Trọng tâm JLPT N4",
              icon: "📙",
              description: "Tổng hợp các dạng câu hỏi, từ vựng và ngữ pháp then chốt giúp đạt điểm tối đa kỳ thi JLPT N4.",
              totalLessons: 6,
              totalVocab: Math.round(totalVocab * 0.5),
              totalGrammar: Math.round(totalGrammar * 0.5),
              totalKanji: 150,
              lessons: data.lessons.slice(0, 6).map((l, idx) => ({
                ...l,
                id: `soumatome-n4-w${idx + 1}`,
                name: `Soumatome N4 - Tuần ${idx + 1}: Ôn luyện cấu trúc N4`,
                curriculum: "Nihongo Soumatome N4"
              }))
            }
          );
        } else if (level === "N3") {
          books.push(
            {
              id: "n3-soumatome",
              name: "Nihongo Soumatome N3",
              level: "N3",
              publisher: "ASK Publishing",
              tag: "Toàn diện 4 kỹ năng",
              icon: "📙",
              description: "Lộ trình 6 tuần ôn luyện toàn diện Từ vựng, Ngữ pháp, Hán tự và Đọc hiểu trung cấp N3.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n3-shinkanzen",
              name: "Shinkanzen Master N3 (Ngữ pháp & Từ vựng)",
              level: "N3",
              publisher: "3A Corporation",
              tag: "Chinh phục JLPT",
              icon: "📕",
              description: "Phân tích ngữ pháp chuyên sâu, phân biệt các cặp mẫu câu dễ nhầm lẫn và bài tập chuẩn đề thi thật JLPT N3.",
              totalLessons: Math.min(data.lessons.length, 12),
              totalVocab: Math.round(totalVocab * 0.7),
              totalGrammar: Math.round(totalGrammar * 0.8),
              totalKanji: 200,
              lessons: data.lessons.slice(0, 12).map((l, idx) => ({
                ...l,
                id: `shinkanzen-n3-${idx + 1}`,
                name: `Shinkanzen N3 - Chương ${idx + 1}: ${l.name.replace(/^Bài \d+:\s*/, "")}`,
                curriculum: "Shinkanzen Master N3"
              }))
            },
            {
              id: "n3-try",
              name: "Try! JLPT N3 (Ngữ pháp theo chủ đề)",
              level: "N3",
              publisher: "ASK Publishing",
              tag: "Ngữ pháp theo chủ đề",
              icon: "📗",
              description: "Học ngữ pháp qua các bài văn, thư điện tử và đoạn hội thoại tự nhiên trong đời sống thực tế.",
              totalLessons: 11,
              totalVocab: Math.round(totalVocab * 0.6),
              totalGrammar: Math.round(totalGrammar * 0.65),
              totalKanji: 180,
              lessons: data.lessons.slice(0, 11).map((l, idx) => ({
                ...l,
                id: `try-n3-${idx + 1}`,
                name: `Try! N3 - Chương ${idx + 1}: Ngữ pháp ứng dụng`,
                curriculum: "Try! JLPT N3"
              }))
            },
            {
              id: "n3-mimikara",
              name: "Mimi Kara Oboeru N3 (Luyện nghe & từ vựng)",
              level: "N3",
              publisher: "ALC Press",
              tag: "Luyện nghe phản xạ",
              icon: "🎧",
              description: "Ghi nhớ từ vựng và mẫu câu qua thính giác và file âm thanh phát âm bản xứ tốc độ tự nhiên.",
              totalLessons: 8,
              totalVocab: Math.round(totalVocab * 0.5),
              totalGrammar: Math.round(totalGrammar * 0.5),
              totalKanji: 150,
              lessons: data.lessons.slice(0, 8).map((l, idx) => ({
                ...l,
                id: `mimikara-n3-${idx + 1}`,
                name: `Mimi Kara N3 - Bài ${idx + 1}: Luyện phản xạ từ vựng`,
                curriculum: "Mimi Kara Oboeru N3"
              }))
            }
          );
        } else if (level === "N2") {
          books.push(
            {
              id: "n2-shinkanzen",
              name: "Shinkanzen Master N2 (Chinh phục JLPT N2)",
              level: "N2",
              publisher: "3A Corporation",
              tag: "Chinh phục JLPT",
              icon: "📕",
              description: "Giáo trình cao cấp phân tích ngữ pháp, sắc thái từ vựng và kỹ năng đọc hiểu chuyên sâu kỳ thi JLPT N2.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n2-soumatome",
              name: "Nihongo Soumatome N2 (8 tuần)",
              level: "N2",
              publisher: "ASK Publishing",
              tag: "Trọng tâm JLPT N2",
              icon: "📙",
              description: "Chương trình 8 tuần cô đọng từ vựng học thuật, thành ngữ và mẫu câu phức hợp N2.",
              totalLessons: 8,
              totalVocab: Math.round(totalVocab * 0.6),
              totalGrammar: Math.round(totalGrammar * 0.6),
              totalKanji: 220,
              lessons: data.lessons.slice(0, 8).map((l, idx) => ({
                ...l,
                id: `soumatome-n2-w${idx + 1}`,
                name: `Soumatome N2 - Tuần ${idx + 1}: Cấu trúc nâng cao`,
                curriculum: "Nihongo Soumatome N2"
              }))
            },
            {
              id: "n2-try",
              name: "Try! JLPT N2 (Ngữ pháp văn cảnh)",
              level: "N2",
              publisher: "ASK Publishing",
              tag: "Ngữ pháp văn cảnh",
              icon: "📗",
              description: "Tổng hợp ngữ pháp N2 qua các bài viết tin tức, báo chí và hội thoại trang trọng.",
              totalLessons: 10,
              totalVocab: Math.round(totalVocab * 0.55),
              totalGrammar: Math.round(totalGrammar * 0.65),
              totalKanji: 200,
              lessons: data.lessons.slice(0, 10).map((l, idx) => ({
                ...l,
                id: `try-n2-${idx + 1}`,
                name: `Try! N2 - Chương ${idx + 1}: Ngữ pháp nâng cao`,
                curriculum: "Try! JLPT N2"
              }))
            }
          );
        } else {
          // N1
          books.push(
            {
              id: "n1-shinkanzen",
              name: "Shinkanzen Master N1 (Cao cấp)",
              level: "N1",
              publisher: "3A Corporation",
              tag: "Chinh phục JLPT N1",
              icon: "📕",
              description: "Chuyên khảo ngữ pháp N1 cao cấp, văn phong báo chí, học thuật và đàm phán thương mại Nhật Bản.",
              totalLessons: data.lessons.length,
              totalVocab,
              totalGrammar,
              totalKanji,
              lessons: data.lessons
            },
            {
              id: "n1-soumatome",
              name: "Nihongo Soumatome N1",
              level: "N1",
              publisher: "ASK Publishing",
              tag: "Trọng tâm N1",
              icon: "📙",
              description: "Tổng hợp 8 tuần từ vựng và chữ Hán N1 khó và thành ngữ 4 chữ (Yojijukugo).",
              totalLessons: 8,
              totalVocab: Math.round(totalVocab * 0.6),
              totalGrammar: Math.round(totalGrammar * 0.6),
              totalKanji: 300,
              lessons: data.lessons.slice(0, 8).map((l, idx) => ({
                ...l,
                id: `soumatome-n1-w${idx + 1}`,
                name: `Soumatome N1 - Tuần ${idx + 1}: Thành ngữ & Ngữ pháp`,
                curriculum: "Nihongo Soumatome N1"
              }))
            }
          );
        }

        groups.push({
          level,
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji,
          books,
          lessons: data.lessons
        });
      }
    }

    return groups;
  }

  async getLessonById(id: string): Promise<DetailedLesson | null> {
    const groups = await this.getCurriculums();
    for (const group of groups) {
      const foundInMain = group.lessons.find((l) => l.id === id);
      if (foundInMain) return foundInMain;

      if (group.books) {
        for (const book of group.books) {
          const foundInBook = book.lessons.find((l) => l.id === id);
          if (foundInBook) return foundInBook;
        }
      }
    }
    return null;
  }

  async getLessonsByLevel(level: JLPTLevel): Promise<DetailedLesson[]> {
    const groups = await this.getCurriculums();
    const group = groups.find((g) => g.level === level);
    return group?.lessons || [];
  }
}

export class JsonVocabularyRepository implements IVocabularyRepository {
  async getAllVocabulary(level?: JLPTLevel): Promise<Vocabulary[]> {
    const curriculumRepo = new JsonCurriculumRepository();
    const groups = await curriculumRepo.getCurriculums();
    let result: Vocabulary[] = [];

    groups.forEach((group) => {
      if (!level || group.level === level) {
        group.lessons.forEach((lesson) => {
          if (lesson.vocabulary) {
            result = result.concat(lesson.vocabulary);
          }
        });
      }
    });

    return result;
  }

  async searchVocabulary(query: string): Promise<Vocabulary[]> {
    const all = await this.getAllVocabulary();
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(
      (v) =>
        v.kanji?.toLowerCase().includes(q) ||
        v.hiragana?.toLowerCase().includes(q) ||
        v.meaning?.toLowerCase().includes(q) ||
        v.onyomi?.toLowerCase().includes(q) ||
        v.phonetic?.toLowerCase().includes(q)
    );
  }
}

export class JsonGrammarRepository implements IGrammarRepository {
  async getAllGrammar(level?: JLPTLevel): Promise<GrammarPoint[]> {
    const curriculumRepo = new JsonCurriculumRepository();
    const groups = await curriculumRepo.getCurriculums();
    let result: GrammarPoint[] = [];

    groups.forEach((group) => {
      if (!level || group.level === level) {
        group.lessons.forEach((lesson) => {
          if (lesson.grammarPoints) {
            result = result.concat(lesson.grammarPoints);
          }
        });
      }
    });

    return result;
  }

  async getGrammarById(id: string): Promise<GrammarPoint | null> {
    const all = await this.getAllGrammar();
    return all.find((g) => g.id === id) || null;
  }

  async searchGrammar(query: string): Promise<GrammarPoint[]> {
    const all = await this.getAllGrammar();
    const cleanQuery = query.trim();
    if (!cleanQuery) return all;

    const normalize = (str: string = "") =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[～〜~]/g, "")
        .replace(/[\s\u3000\u00a0\t\r\n]+/g, " ")
        .replace(/[・、。，,;；:：\(\)\[\]「」『』]/g, "")
        .trim();

    const q = normalize(cleanQuery);
    if (!q) return all;

    return all.filter((g) => {
      const structNorm = normalize(g.structure);
      const meanNorm = normalize(g.meaning);
      const expNorm = normalize(g.explanation || "");
      const exMatch = g.examples?.some(
        (ex) =>
          normalize(ex.sentence).includes(q) ||
          normalize(ex.meaning).includes(q) ||
          normalize(ex.romaji || "").includes(q)
      );

      return (
        structNorm.includes(q) ||
        meanNorm.includes(q) ||
        expNorm.includes(q) ||
        !!exMatch
      );
    });
  }
}

export class JsonKanjiRepository implements IKanjiRepository {
  async getAllKanji(level?: JLPTLevel): Promise<KanjiItem[]> {
    const data = await fetchJsonData<KanjiItem[]>("/data/kanji-n5-n2.json");
    if (!data) return [];
    if (!level) return data;
    return data.filter((k) => k.level === level);
  }

  async getKanjiByChar(char: string): Promise<KanjiItem | null> {
    const all = await this.getAllKanji();
    return all.find((k) => k.kanji === char) || null;
  }

  async searchKanji(query: string): Promise<KanjiItem[]> {
    const all = await this.getAllKanji();
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(
      (k) =>
        k.kanji.includes(q) ||
        k.hanViet.toLowerCase().includes(q) ||
        k.meaning.toLowerCase().includes(q) ||
        k.onyomi.some((o) => o.toLowerCase().includes(q)) ||
        k.kunyomi.some((ku) => ku.toLowerCase().includes(q))
    );
  }
}
