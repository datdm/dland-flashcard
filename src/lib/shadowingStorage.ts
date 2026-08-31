import { ShadowingVideo, ShadowingSessionResult } from "@/types/shadowing";
import { BUILTIN_SHADOWING_VIDEOS } from "@/data/shadowingVideos";
import { autoSync } from "./syncService";

const STORAGE_KEYS = {
  CUSTOM_VIDEOS: "dland_shadowing_custom_videos",
  RESULTS: "dland_shadowing_results",
  RECORDINGS_PREFIX: "dland_shadowing_rec_",
};

export function getAllShadowingVideos(): ShadowingVideo[] {
  if (typeof window === "undefined") return BUILTIN_SHADOWING_VIDEOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_VIDEOS);
    const custom: ShadowingVideo[] = raw ? JSON.parse(raw) : [];
    return [...custom, ...BUILTIN_SHADOWING_VIDEOS];
  } catch {
    return BUILTIN_SHADOWING_VIDEOS;
  }
}

export function getShadowingVideoById(id: string): ShadowingVideo | null {
  const all = getAllShadowingVideos();
  return all.find((v) => v.id === id || v.youtubeId === id) || null;
}

export function saveCustomShadowingVideo(video: ShadowingVideo): ShadowingVideo {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_VIDEOS);
      const custom: ShadowingVideo[] = raw ? JSON.parse(raw) : [];
      const existingIdx = custom.findIndex((v) => v.id === video.id || v.youtubeId === video.youtubeId);
      if (existingIdx >= 0) {
        custom[existingIdx] = video;
      } else {
        custom.unshift(video);
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOM_VIDEOS, JSON.stringify(custom));
      window.dispatchEvent(new CustomEvent("shadowing-updated"));
      autoSync();
    } catch (e) {
      console.error("Failed to save custom shadowing video:", e);
    }
  }
  return video;
}

export function deleteCustomShadowingVideo(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_VIDEOS);
    const custom: ShadowingVideo[] = raw ? JSON.parse(raw) : [];
    const filtered = custom.filter((v) => v.id !== id && v.youtubeId !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_VIDEOS, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent("shadowing-updated"));
    autoSync();
    return true;
  } catch {
    return false;
  }
}

export function saveShadowingResult(result: ShadowingSessionResult): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    const list: ShadowingSessionResult[] = raw ? JSON.parse(raw) : [];
    list.unshift(result);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(list.slice(0, 100)));
    autoSync();
  } catch (e) {
    console.error("Failed to save shadowing result:", e);
  }
}

export function getShadowingResults(): ShadowingSessionResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
