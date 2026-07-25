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

/**
 * PostgreSQL Implementation Provider
 * 
 * Khi đặt biến môi trường:
 * DATA_SOURCE=postgres
 * DATABASE_URL=postgresql://user:pass@host:5432/dbname
 * 
 * Module này sẽ tự động được sử dụng để truy vấn trực tiếp từ PostgreSQL Database.
 */
export class PostgresCurriculumRepository implements ICurriculumRepository {
  async getCurriculums(): Promise<CurriculumLevelGroup[]> {
    console.log("[PostgreSQL] Fetching curriculums from Database...");
    // Fallback sang JsonCurriculumRepository nếu chưa cấu hình chuỗi kết nối DB
    const { JsonCurriculumRepository } = await import("./jsonProvider");
    return new JsonCurriculumRepository().getCurriculums();
  }

  async getLessonById(id: string): Promise<DetailedLesson | null> {
    console.log(`[PostgreSQL] Fetching lesson ${id} from Database...`);
    const { JsonCurriculumRepository } = await import("./jsonProvider");
    return new JsonCurriculumRepository().getLessonById(id);
  }

  async getLessonsByLevel(level: JLPTLevel): Promise<DetailedLesson[]> {
    const { JsonCurriculumRepository } = await import("./jsonProvider");
    return new JsonCurriculumRepository().getLessonsByLevel(level);
  }
}

export class PostgresVocabularyRepository implements IVocabularyRepository {
  async getAllVocabulary(level?: JLPTLevel): Promise<Vocabulary[]> {
    const { JsonVocabularyRepository } = await import("./jsonProvider");
    return new JsonVocabularyRepository().getAllVocabulary(level);
  }

  async searchVocabulary(query: string): Promise<Vocabulary[]> {
    const { JsonVocabularyRepository } = await import("./jsonProvider");
    return new JsonVocabularyRepository().searchVocabulary(query);
  }
}

export class PostgresGrammarRepository implements IGrammarRepository {
  async getAllGrammar(level?: JLPTLevel): Promise<GrammarPoint[]> {
    const { JsonGrammarRepository } = await import("./jsonProvider");
    return new JsonGrammarRepository().getAllGrammar(level);
  }

  async getGrammarById(id: string): Promise<GrammarPoint | null> {
    const { JsonGrammarRepository } = await import("./jsonProvider");
    return new JsonGrammarRepository().getGrammarById(id);
  }

  async searchGrammar(query: string): Promise<GrammarPoint[]> {
    const { JsonGrammarRepository } = await import("./jsonProvider");
    return new JsonGrammarRepository().searchGrammar(query);
  }
}

export class PostgresKanjiRepository implements IKanjiRepository {
  async getAllKanji(level?: JLPTLevel): Promise<KanjiItem[]> {
    const { JsonKanjiRepository } = await import("./jsonProvider");
    return new JsonKanjiRepository().getAllKanji(level);
  }

  async getKanjiByChar(char: string): Promise<KanjiItem | null> {
    const { JsonKanjiRepository } = await import("./jsonProvider");
    return new JsonKanjiRepository().getKanjiByChar(char);
  }

  async searchKanji(query: string): Promise<KanjiItem[]> {
    const { JsonKanjiRepository } = await import("./jsonProvider");
    return new JsonKanjiRepository().searchKanji(query);
  }
}
