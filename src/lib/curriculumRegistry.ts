import type { Curriculum } from "@/types";

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
 * e.g., 'n5-001' -> N5 Speed Master
 *       'n5-01-01' -> Minna no Nihongo I
 *       'n4-26-01' -> Minna no Nihongo II
 *       'de-a1-k01-v01' -> Netzwerk Neu A1
 *       'en-w01-v01' -> IELTS 7.0 (52 Weeks)
 */
export function inferStudiedBooksFromVocabIds(
  vocabIds: string[],
  registryBooks: RegistryBook[]
): Array<{ book: RegistryBook; count: number }> {
  if (!vocabIds || vocabIds.length === 0) return [];

  const bookCounts: Record<string, number> = {};

  for (const id of vocabIds) {
    let matchedBookId: string | null = null;

    if (id.startsWith("de-")) {
      matchedBookId = "de-netzwerk-a1";
    } else if (id.startsWith("en-")) {
      matchedBookId = "en-ielts-52w";
    } else if (id.startsWith("n2-")) {
      matchedBookId = "n2-soumatome";
    } else if (id.startsWith("n3-")) {
      matchedBookId = "n3-soumatome";
    } else if (id.startsWith("n4-")) {
      matchedBookId = "n4-minna-2";
    } else if (id.startsWith("n5-")) {
      // Differentiate n5-001 (Speed Master) vs n5-01-01 (Minna no Nihongo I)
      const parts = id.split("-");
      if (parts.length === 3) {
        matchedBookId = "n5-minna-1"; // format n5-01-01
      } else if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        matchedBookId = "default-n5-super-master-tango"; // format n5-001
      } else {
        matchedBookId = "n5-minna-1";
      }
    }

    if (matchedBookId) {
      bookCounts[matchedBookId] = (bookCounts[matchedBookId] || 0) + 1;
    }
  }

  return registryBooks
    .filter((book) => bookCounts[book.id] > 0)
    .map((book) => ({
      book,
      count: bookCounts[book.id] || 0
    }));
}

/**
 * Load all available system curricula from public/data/ as Curriculum[] objects
 */
export async function loadAllSystemCurriculums(): Promise<Curriculum[]> {
  if (cachedSystemCurriculums) return cachedSystemCurriculums;

  const registry = await fetchCurriculumRegistry();
  if (!registry) return [];

  const curriculums: Curriculum[] = [];

  const fetchJson = async <T>(fileUrl: string): Promise<T | null> => {
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(fileUrl);
        if (!res.ok) return null;
        return (await res.json()) as T;
      } else {
        const fs = require("fs");
        const path = require("path");
        const cleanPath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
        const filePath = path.join(process.cwd(), "public", cleanPath);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
      }
    } catch {
      return null;
    }
  };

  for (const langKey of Object.keys(registry.languages)) {
    const langObj = registry.languages[langKey];
    for (const book of langObj.books || []) {
      const data = await fetchJson<any>(book.file);
      if (!data) continue;

      if (book.format === "curriculums" && Array.isArray(data.curriculums)) {
        data.curriculums.forEach((c: Curriculum) => {
          curriculums.push({
            ...c,
            lang: langKey,
            level: book.level
          });
        });
      } else if (book.format === "level" && Array.isArray(data.lessons)) {
        curriculums.push({
          id: book.id,
          name: book.name,
          lang: langKey,
          level: book.level,
          createdAt: new Date().toISOString(),
          lessons: data.lessons.map((l: any) => ({
            id: l.id,
            name: l.name,
            vocabulary: l.vocabulary || []
          }))
        });
      }
    }
  }

  cachedSystemCurriculums = curriculums;
  return curriculums;
}
