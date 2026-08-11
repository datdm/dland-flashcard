import { getAuthToken } from "@/lib/syncService";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AdminUser {
  id: string;
  username: string;
  createdAt: string;
  lastSyncAt: string | null;
  isAdmin: boolean;
  activeLanguage: string;
  vocabLearnedCount: number;
  grammarLearnedCount: number;
  kanjiLearnedCount: number;
  notebookCount: number;
}

export interface AdminUserDetail {
  user: {
    id: string;
    username: string;
    createdAt: string;
    lastSyncAt: string | null;
    isAdmin: boolean;
  };
  data: {
    curriculums: any[];
    notebooks: any[];
    progress: Record<string, { learned: boolean; learnedAt?: string; favorite?: boolean }>;
    grammarProgress: Record<string, { learned: boolean; learnedAt?: string; favorite?: boolean }>;
    kanjiProgress: Record<string, { learned: boolean; learnedAt?: string }>;
    curriculumHistory: any[];
    settings: any;
  };
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const token = getAuthToken();
  if (!token) throw new Error("Chưa đăng nhập.");

  const response = await fetch(`${API_URL}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Không thể tải danh sách người dùng.");
  }

  const result = await response.json();
  return result.users || [];
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail> {
  const token = getAuthToken();
  if (!token) throw new Error("Chưa đăng nhập.");

  const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Không thể tải chi tiết người dùng.");
  }

  return response.json();
}
