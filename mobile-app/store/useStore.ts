import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_STORAGE_KEY } from '../services/api';

export interface VocabItem {
  id: string;
  kanji: string;
  hiragana: string;
  meaning: string;
  onyomi?: string;
  phonetic?: string;
  isFavorite?: boolean;
  note?: string;
  createdAt?: string;
}

export interface Notebook {
  id: string;
  name: string;
  vocabulary: VocabItem[];
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
  isAdmin?: boolean;
  createdAt?: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  isAuthLoading: boolean;
  notebooks: Notebook[];
  isSyncing: boolean;
  lastSyncAt: string | null;
  setAuth: (user: User, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setNotebooks: (notebooks: Notebook[]) => void;
  addNotebook: (notebook: Notebook) => void;
  updateNotebook: (id: string, updates: Partial<Notebook>) => void;
  deleteNotebook: (id: string) => void;
  addVocab: (notebookId: string, vocab: VocabItem) => void;
  updateVocab: (notebookId: string, vocabId: string, patch: Partial<VocabItem>) => void;
  deleteVocab: (notebookId: string, vocabId: string) => void;
  setIsSyncing: (v: boolean) => void;
  setLastSyncAt: (v: string) => void;
  loadAuthFromStorage: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  isAuthLoading: true,
  notebooks: [],
  isSyncing: false,
  lastSyncAt: null,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
    await SecureStore.setItemAsync('flashcard_user', JSON.stringify(user));
    set({ user, token });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync('flashcard_user');
    set({ user: null, token: null, notebooks: [] });
  },

  setNotebooks: (notebooks) => set({ notebooks }),
  addNotebook: (notebook) =>
    set((s) => ({ notebooks: [notebook, ...s.notebooks] })),
  updateNotebook: (id, updates) =>
    set((s) => ({
      notebooks: s.notebooks.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  deleteNotebook: (id) =>
    set((s) => ({ notebooks: s.notebooks.filter((n) => n.id !== id) })),
  addVocab: (notebookId, vocab) =>
    set((s) => ({
      notebooks: s.notebooks.map((n) =>
        n.id === notebookId ? { ...n, vocabulary: [vocab, ...(n.vocabulary || [])] } : n
      ),
    })),
  updateVocab: (notebookId, vocabId, patch) =>
    set((s) => ({
      notebooks: s.notebooks.map((n) =>
        n.id === notebookId
          ? {
              ...n,
              vocabulary: (n.vocabulary || []).map((v) =>
                v.id === vocabId ? { ...v, ...patch } : v
              ),
            }
          : n
      ),
    })),
  deleteVocab: (notebookId, vocabId) =>
    set((s) => ({
      notebooks: s.notebooks.map((n) =>
        n.id === notebookId
          ? { ...n, vocabulary: (n.vocabulary || []).filter((v) => v.id !== vocabId) }
          : n
      ),
    })),
  setIsSyncing: (v) => set({ isSyncing: v }),
  setLastSyncAt: (v) => set({ lastSyncAt: v }),

  loadAuthFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
      const userStr = await SecureStore.getItemAsync('flashcard_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthLoading: false });
      } else {
        set({ isAuthLoading: false });
      }
    } catch {
      set({ isAuthLoading: false });
    }
  },
}));
