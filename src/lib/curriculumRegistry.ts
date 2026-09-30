import type { Curriculum } from "@/types";
import { JsonCurriculumRepository } from "@/lib/repositories/jsonProvider";

export interface RegistryBook {
  id: string;
  name: string;
  level: string;
  file: string;
  format: "curriculums" | "level";
  publisher: string;
  tag: string;
  icon: string;
  totalLessons: number;
  totalVocab: number;
  totalGrammar: number;
  description: string;
}

export interface RegistryLanguage {
  code: string;
  name: string;
  flag: string;
  description: string;
  books: RegistryBook[];
}

export interface CurriculumRegistryData {
  version: string;
  updatedAt: string;
  languages: Record<string, RegistryLanguage>;
}

let cachedRegistry: CurriculumRegistryData | null = null;
let cachedSystemCurriculums: Curriculum[] | null = null;
let cachedVocabToBookMap: Map<string, Set<string>> | null = null;

export async function fetchCurriculumRegistry(): Promise<CurriculumRegistryData | null> {
  if (cachedRegistry) return cachedRegistry;

  try {
    if (typeof window !== "undefined") {
      const res = await fetch("/data/curriculum-registry.json");
      if (!res.ok) return null;
      cachedRegistry = (await res.json()) as CurriculumRegistryData;
      return cachedRegistry;
    } else {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "public", "data", "curriculum-registry.json");
      if (!fs.existsSync(filePath)) return null;
      const fileData = fs.readFileSync(filePath, "utf-8");
      cachedRegistry = JSON.parse(fileData) as CurriculumRegistryData;
      return cachedRegistry;
    }
  } catch (err) {
    console.error("Failed to load curriculum registry:", err);
    return null;
  }
}

export function getAllBooksFromRegistry(registry: CurriculumRegistryData): RegistryBook[] {
  const books: RegistryBook[] = [];
  if (!registry || !registry.languages) return books;
  for (const langKey of Object.keys(registry.languages)) {
    const langObj = registry.languages[langKey];
    if (langObj && Array.isArray(langObj.books)) {
      books.push(...langObj.books);
    }
  }
  return books;
}

/**
 * Infer studied books based on a user's progress vocab IDs
 * Uses systemCurriculums dynamic vocab membership lookup when provided, with fallback rules.
 */
export function inferStudiedBooksFromVocabIds(
  vocabIds: string[],
  registryBooks: RegistryBook[],
  systemCurriculums?: Curriculum[]
): Array<{ book: RegistryBook; count: number }> {
  if (!vocabIds || vocabIds.length === 0) return [];

  const bookCounts: Record<string, number> = {};

  // Build lookup map from systemCurriculums or cache if available
  let vocabToBookIds = cachedVocabToBookMap;
  if (!vocabToBookIds && systemCurriculums && systemCurriculums.length > 0) {
    vocabToBookIds = new Map<string, Set<string>>();
    for (const sc of systemCurriculums) {
      for (const l of sc.lessons || []) {
        for (const v of l.vocabulary || []) {
          if (!vocabToBookIds.has(v.id)) {
            vocabToBookIds.set(v.id, new Set<string>());
          }
          vocabToBookIds.get(v.id)!.add(sc.id);
        }
      }
    }
    cachedVocabToBookMap = vocabToBookIds;
  }

  for (const id of vocabIds) {
    const matchingBookIds = vocabToBookIds?.get(id);
    if (matchingBookIds && matchingBookIds.size > 0) {
      matchingBookIds.forEach((bId) => {
        bookCounts[bId] = (bookCounts[bId] || 0) + 1;
      });
    } else {
      // Fallback matching
      let matchedBookId: string | null = null;
      if (id.startsWith("de-")) {
        matchedBookId = "de-netzwerk-a1";
      } else if (id.startsWith("en-")) {
        matchedBookId = "en-ielts-52w";
      } else if (id.startsWith("n2-")) {
        matchedBookId = "n2-shinkanzen";
      } else if (id.startsWith("n3-")) {
        matchedBookId = "n3-soumatome";
      } else if (id.startsWith("n4-")) {
        matchedBookId = "n4-minna-2";
      } else if (id.startsWith("n5-")) {
        const parts = id.split("-");
        if (parts.length === 2 && !isNaN(Number(parts[1]))) {
          matchedBookId = "default-n5-super-master-tango";
        } else {
          matchedBookId = "n5-minna-1";
        }
      }
      if (matchedBookId) {
        bookCounts[matchedBookId] = (bookCounts[matchedBookId] || 0) + 1;
      }
    }
  }

  return registryBooks
    .filter((book) => (bookCounts[book.id] || 0) > 0)
    .map((book) => ({
      book,
      count: bookCounts[book.id] || 0
    }));
}

/**
 * Load all available system curricula as Curriculum[] objects
 * Delegates to JsonCurriculumRepository to guarantee 100% 1-to-1 mapping with the curriculum page.
 */
export async function loadAllSystemCurriculums(): Promise<Curriculum[]> {
  if (cachedSystemCurriculums) return cachedSystemCurriculums;

  try {
    const repo = new JsonCurriculumRepository();
    const groups = await repo.getAllCurriculums();

    const list: Curriculum[] = [];
    const vocabMap = new Map<string, Set<string>>();

    for (const group of groups) {
      for (const book of group.books || []) {
        let bookLang = "ja";
        if (book.id.startsWith("de-")) bookLang = "de";
        else if (book.id.startsWith("en-")) bookLang = "en";

        const formattedLessons = (book.lessons || []).map((l: any) => {
          (l.vocabulary || []).forEach((v: any) => {
            if (!vocabMap.has(v.id)) {
              vocabMap.set(v.id, new Set<string>());
            }
            vocabMap.get(v.id)!.add(book.id);
          });

          return {
            id: l.id,
            name: l.name,
            vocabulary: l.vocabulary || []
          };
        });

        list.push({
          id: book.id,
          name: book.name,
          lang: bookLang,
          level: book.level,
          createdAt: new Date().toISOString(),
          lessons: formattedLessons
        });
      }
    }

    cachedVocabToBookMap = vocabMap;
    cachedSystemCurriculums = list;
    return list;
  } catch (err) {
    console.error("Error loading system curriculums:", err);
    return [];
  }
}

