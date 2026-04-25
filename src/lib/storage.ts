const LESSONS_KEY = "flashcash-lessons";
const PROGRESS_KEY = "flashcash-progress";
const SETTINGS_KEY = "flashcash-settings";

export const StorageKeys = {
  LESSONS: LESSONS_KEY,
  PROGRESS: PROGRESS_KEY,
  SETTINGS: SETTINGS_KEY,
} as const;

export function getItem<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function exportAllData(): string {
  if (typeof window === "undefined") return "{}";
  const data: Record<string, unknown> = {};
  const keys = [LESSONS_KEY, PROGRESS_KEY, SETTINGS_KEY];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): void {
  if (typeof window === "undefined") return;
  const data = JSON.parse(jsonString) as Record<string, unknown>;
  const keys = [LESSONS_KEY, PROGRESS_KEY, SETTINGS_KEY];
  for (const key of keys) {
    if (data[key] !== undefined) {
      localStorage.setItem(key, JSON.stringify(data[key]));
    }
  }
}
