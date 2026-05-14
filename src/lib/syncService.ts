import { StorageKeys, exportAllData } from './storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const AUTH_TOKEN_KEY = 'flashcash-auth-token';
const USER_KEY = 'flashcash-user';
const LAST_SYNC_KEY = 'flashcash-last-sync-at';

interface User {
  id: string;
  username: string;
  createdAt: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

interface SyncStatusResponse {
  success: boolean;
  hasData: boolean;
  lastSyncAt: string | null;
}

interface DataResponse {
  success: boolean;
  data: Record<string, any>;
  timestamp: string;
}

// Get stored JWT token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Get stored user info
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Check if user is authenticated
export function checkAuthStatus(): boolean {
  return !!getAuthToken();
}

// Register new user
export async function register(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Registration failed' };
    }

    const authData = data as AuthResponse;
    localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));

    return { success: true };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Login user
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }

    const authData = data as AuthResponse;
    localStorage.setItem(AUTH_TOKEN_KEY, authData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authData.user));

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Logout user
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(LAST_SYNC_KEY);
}

// Verify token is still valid
export async function verifyToken(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    return response.ok;
  } catch {
    return false;
  }
}

// Check if localStorage has any app data
export function detectLocalData(): boolean {
  if (typeof window === 'undefined') return false;
  
  const keys = Object.values(StorageKeys);
  for (const key of keys) {
    const data = localStorage.getItem(key);
    if (data && data !== 'null' && data !== '{}' && data !== '[]') {
      return true;
    }
  }
  return false;
}

// Check if user has data on server
export async function hasServerData(): Promise<{ hasData: boolean; lastSyncAt: string | null }> {
  const token = getAuthToken();
  if (!token) return { hasData: false, lastSyncAt: null };

  try {
    const response = await fetch(`${API_URL}/api/sync/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to check server status');
    }

    const data = await response.json() as SyncStatusResponse;
    return { hasData: data.hasData, lastSyncAt: data.lastSyncAt };
  } catch (error) {
    console.error('Check server data error:', error);
    return { hasData: false, lastSyncAt: null };
  }
}

// Upload local data to server
export async function uploadToServer(): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    // Collect all localStorage data
    const data: Record<string, any> = {};
    const keys = Object.values(StorageKeys);
    
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    }

    const response = await fetch(`${API_URL}/api/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Upload failed' };
    }

    const result = await response.json();
    localStorage.setItem(LAST_SYNC_KEY, result.timestamp);

    return { success: true };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Download data from server
export async function downloadFromServer(): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${API_URL}/api/sync/data`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error || 'Download failed' };
    }

    const result = await response.json() as DataResponse;

    // Clear existing app data
    clearLocalData();

    // Write server data to localStorage
    for (const [key, value] of Object.entries(result.data)) {
      localStorage.setItem(key, JSON.stringify(value));
    }

    localStorage.setItem(LAST_SYNC_KEY, result.timestamp);

    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Clear all app data from localStorage (keep auth tokens)
export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  
  const keys = Object.values(StorageKeys);
  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

// Get last sync timestamp
export function getLastSyncAt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

// Check if sync is needed (> 24 hours since last sync)
export function needsSync(): boolean {
  const lastSync = getLastSyncAt();
  if (!lastSync) return true;

  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  const hoursSinceSync = (now - lastSyncTime) / (1000 * 60 * 60);

  return hoursSinceSync > 24;
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  const token = getAuthToken();
  if (!token) return { success: false, error: 'Not authenticated' };

  try {
    const response = await fetch(`${API_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to change password' };
    }

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Auto-sync helper - silently sync data to server if authenticated
export async function autoSync(): Promise<void> {
  if (!checkAuthStatus()) return;
  
  try {
    await uploadToServer();
  } catch (error) {
    console.error('Auto-sync error:', error);
    // Silently fail - don't disrupt user experience
  }
}

// Backup history functions
export interface BackupHistoryItem {
  id: string;
  created_at: string;
  backup_type: string;
  data_keys: string[];
  note: string | null;
  data_size: string;
}

export interface BackupDetail {
  id: string;
  backup_data: Record<string, any>;
  created_at: string;
  backup_type: string;
  data_keys: string[];
  note: string | null;
}

// Get backup history list
export async function getBackupHistory(): Promise<BackupHistoryItem[]> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/backup/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch backup history');
  }

  const data = await response.json();
  return data.backups || [];
}

// Get specific backup detail
export async function getBackupDetail(backupId: string): Promise<BackupDetail> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/backup/${backupId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch backup detail');
  }

  const data = await response.json();
  return data.backup;
}

// Delete backup
export async function deleteBackup(backupId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/backup/${backupId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete backup');
  }
}

// Restore from backup
export async function restoreFromBackup(backupId: string): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/backup/${backupId}/restore`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to restore backup');
  }
}

// Vocabulary duplicate check
export interface VocabDuplicate {
  notebookId: string;
  notebookName: string;
  vocab: {
    id: string;
    kanji?: string;
    hiragana?: string;
    meaning?: string;
    onyomi?: string;
    phonetic?: string;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicates: VocabDuplicate[];
}

// Check if vocabulary is duplicate in server data
export async function checkVocabDuplicate(
  kanji?: string,
  hiragana?: string,
  notebookId?: string
): Promise<DuplicateCheckResult> {
  const token = getAuthToken();
  if (!token) {
    // If not authenticated, can't check server-side
    return { isDuplicate: false, duplicates: [] };
  }

  try {
    const response = await fetch(`${API_URL}/api/vocab/check-duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ kanji, hiragana, notebookId }),
    });

    if (!response.ok) {
      throw new Error('Failed to check duplicate');
    }

    return await response.json();
  } catch (error) {
    console.error('Check duplicate error:', error);
    return { isDuplicate: false, duplicates: [] };
  }
}

