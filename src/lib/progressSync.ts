// Sync curriculum progress between localStorage and server database
import { getAuthToken } from "./auth";

const SYNC_QUEUE_KEY = "flashcash-progress-sync-queue";
const LAST_SYNC_KEY = "flashcash-last-progress-sync";

interface ProgressSyncItem {
  vocabId?: string;
  lessonId?: string;
  learned?: boolean;
  learnedAt?: string;
  favorite?: boolean;
  type?: "vocab" | "grammar" | "kanji";
  timestamp: number;
}

/**
 * Add progress change to sync queue
 */
export function queueProgressSync(item: Omit<ProgressSyncItem, "timestamp">) {
  if (typeof window === "undefined") return;

  try {
    const queue = getProgressSyncQueue();
    queue.push({ ...item, timestamp: Date.now() });
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    
    // Auto-sync if online
    if (navigator.onLine) {
      syncProgressToServer();
    }
  } catch (e) {
    console.error("Failed to queue progress sync:", e);
  }
}

/**
 * Get pending sync queue
 */
function getProgressSyncQueue(): ProgressSyncItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Sync all pending progress changes to server
 */
export async function syncProgressToServer() {
  const token = getAuthToken();
  if (!token) return; // Not logged in

  if (typeof window === "undefined") return;

  try {
    const queue = getProgressSyncQueue();
    if (queue.length === 0) return;

    console.log(`🔄 Syncing ${queue.length} progress items to server...`);

    // Send each item
    const results = await Promise.allSettled(
      queue.map((item) =>
        fetch("/api/data/curriculum-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(item),
        })
      )
    );

    // Track which items synced successfully
    const successCount = results.filter((r) => r.status === "fulfilled").length;
    
    if (successCount === queue.length) {
      // All synced - clear queue
      localStorage.removeItem(SYNC_QUEUE_KEY);
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      console.log(`✅ Synced ${successCount}/${queue.length} progress items`);
    } else {
      console.warn(
        `⚠️ Synced ${successCount}/${queue.length} progress items. Retrying failed items next time.`
      );
    }
  } catch (error) {
    console.error("Progress sync error:", error);
  }
}

/**
 * Load progress from server (merge with localStorage)
 */
export async function loadProgressFromServer() {
  const token = getAuthToken();
  if (!token) return {}; // Not logged in

  try {
    const response = await fetch("/api/data/curriculum-progress", {
      headers: { "Authorization": `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to load progress");
    const data = await response.json();
    return data.data || {};
  } catch (error) {
    console.error("Failed to load progress from server:", error);
    return {};
  }
}

/**
 * Listen for online/offline and auto-sync when coming online
 */
export function setupProgressSyncListener() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    console.log("📡 Back online - syncing progress...");
    syncProgressToServer();
  });
}

/**
 * Get last sync time
 */
export function getLastProgressSync(): Date | null {
  if (typeof window === "undefined") return null;

  try {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    return lastSync ? new Date(lastSync) : null;
  } catch {
    return null;
  }
}
