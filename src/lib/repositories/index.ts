import {
  ICurriculumRepository,
  IVocabularyRepository,
  IGrammarRepository,
  IKanjiRepository
} from "./types";
import {
  JsonCurriculumRepository,
  JsonVocabularyRepository,
  JsonGrammarRepository,
  JsonKanjiRepository
} from "./jsonProvider";
import {
  PostgresCurriculumRepository,
  PostgresVocabularyRepository,
  PostgresGrammarRepository,
  PostgresKanjiRepository
} from "./postgresProvider";

const isPostgres = process.env.NEXT_PUBLIC_DATA_SOURCE === "postgres" || process.env.DATA_SOURCE === "postgres";

export function getCurriculumRepository(): ICurriculumRepository {
  if (isPostgres) {
    return new PostgresCurriculumRepository();
  }
  return new JsonCurriculumRepository();
}

export function getVocabularyRepository(): IVocabularyRepository {
  if (isPostgres) {
    return new PostgresVocabularyRepository();
  }
  return new JsonVocabularyRepository();
}

export function getGrammarRepository(): IGrammarRepository {
  if (isPostgres) {
    return new PostgresGrammarRepository();
  }
  return new JsonGrammarRepository();
}

export function getKanjiRepository(): IKanjiRepository {
  if (isPostgres) {
    return new PostgresKanjiRepository();
  }
  return new JsonKanjiRepository();
}

export * from "./types";
