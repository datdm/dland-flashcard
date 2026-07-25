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

        groups.push({
          level: "N5", // Level slot
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji: 0,
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

        groups.push({
          level: "N5",
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji: 0,
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

        groups.push({
          level,
          title: data.title,
          description: data.description,
          totalLessons: data.lessons.length,
          totalVocab,
          totalGrammar,
          totalKanji,
          lessons: data.lessons
        });
      }
    }

    return groups;
  }

  async getLessonById(id: string): Promise<DetailedLesson | null> {
    const groups = await this.getCurriculums();
    for (const group of groups) {
      const found = group.lessons.find((l) => l.id === id);
      if (found) return found;
    }
    return null;
  }

  async getLessonsByLevel(level: JLPTLevel): Promise<DetailedLesson[]> {
    const data = await fetchJsonData<{ lessons: DetailedLesson[] }>(LEVEL_FILES[level]);
    return data?.lessons || [];
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
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(
      (g) =>
        g.structure.toLowerCase().includes(q) ||
        g.meaning.toLowerCase().includes(q) ||
        g.explanation?.toLowerCase().includes(q)
    );
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
