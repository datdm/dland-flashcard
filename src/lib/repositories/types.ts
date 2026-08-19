import { Lesson, Vocabulary, GrammarPoint, JLPT_LEVELS } from "@/types";

export type JLPTLevel = typeof JLPT_LEVELS[number];

export interface KanjiItem {
  id: string;
  kanji: string;
  hanViet: string;
  radical: string;
  strokeCount: number;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  svgStrokes?: string[];
  level: JLPTLevel;
  compounds: { kanji: string; hiragana: string; meaning: string }[];
}

export interface DetailedLesson extends Lesson {
  grammarPoints?: GrammarPoint[];
  kanjiItems?: KanjiItem[];
}

export interface CurriculumBook {
  id: string;
  name: string;
  level: JLPTLevel | string;
  publisher?: string;
  tag?: string;
  description: string;
  icon?: string;
  totalLessons: number;
  totalVocab: number;
  totalGrammar: number;
  totalKanji: number;
  lessons: DetailedLesson[];
}

export interface CurriculumLevelGroup {
  level: JLPTLevel;
  title: string;
  description: string;
  totalLessons: number;
  totalVocab: number;
  totalGrammar: number;
  totalKanji: number;
  books?: CurriculumBook[];
  lessons: DetailedLesson[];
}

export interface ICurriculumRepository {
  getCurriculums(): Promise<CurriculumLevelGroup[]>;
  getLessonById(id: string): Promise<DetailedLesson | null>;
  getLessonsByLevel(level: JLPTLevel): Promise<DetailedLesson[]>;
}

export interface IVocabularyRepository {
  getAllVocabulary(level?: JLPTLevel): Promise<Vocabulary[]>;
  searchVocabulary(query: string): Promise<Vocabulary[]>;
}

export interface IGrammarRepository {
  getAllGrammar(level?: JLPTLevel): Promise<GrammarPoint[]>;
  getGrammarById(id: string): Promise<GrammarPoint | null>;
  searchGrammar(query: string): Promise<GrammarPoint[]>;
}

export interface IKanjiRepository {
  getAllKanji(level?: JLPTLevel): Promise<KanjiItem[]>;
  getKanjiByChar(char: string): Promise<KanjiItem | null>;
  searchKanji(query: string): Promise<KanjiItem[]>;
}
