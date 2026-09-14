import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://flashcard-japanese-be.onrender.com/api';
const TOKEN_KEY = 'flashcard_auth_token';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach Bearer token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (username: string, password: string) =>
    api.post('/auth/register', { username, password }),
  verify: () => api.get('/auth/verify'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export const syncApi = {
  getData: () => api.get('/sync/data'),
  uploadData: (data: Record<string, any>, skipBackup = true) =>
    api.post(`/sync/upload?skipBackup=${skipBackup}`, { data }),
  getStatus: () => api.get('/sync/status'),
};

export const vocabApi = {
  upload: (vocab: {
    kanji: string;
    hiragana: string;
    meaning: string;
    onyomi?: string;
    phonetic?: string;
    notebookId: string;
  }) => api.post('/vocab/upload', vocab),
  checkDuplicate: (kanji: string, hiragana: string, notebookId?: string) =>
    api.post('/vocab/check-duplicate', { kanji, hiragana, notebookId }),
  delete: (vocabId: string, notebookId: string) =>
    api.delete(`/vocab/${vocabId}`, { data: { notebookId } }),
  patch: (vocabId: string, notebookId: string, patch: Record<string, any>) =>
    api.patch(`/vocab/${vocabId}`, { notebookId, patch }),
  move: (vocabIds: string[], toNotebookId: string) =>
    api.post('/vocab/move', { vocabIds, toNotebookId }),
};

export const TOKEN_STORAGE_KEY = TOKEN_KEY;
export default api;

