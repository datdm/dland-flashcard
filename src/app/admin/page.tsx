"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { checkAuthStatus, getUser } from "@/lib/syncService";
import { fetchAdminUsers, fetchAdminUserDetail, AdminUser, AdminUserDetail } from "@/lib/adminService";
import { DEFAULT_VOCABULARY } from "@/data";
import { SUPPORTED_LANGUAGES } from "@/hooks/useLanguageSetting";
import CurriculumDisplaySettings from "@/components/CurriculumDisplaySettings";
import NavMenuSettingsPanel from "@/components/NavMenuSettingsPanel";
import ExportImportPanel from "@/components/ExportImportPanel";
import BackupHistoryPanel from "@/components/BackupHistoryPanel";
import SystemCurriculumRegistryPanel from "@/components/SystemCurriculumRegistryPanel";
import FullScreenLoading from "@/components/FullScreenLoading";
import {
  fetchCurriculumRegistry,
  getAllBooksFromRegistry,
  inferStudiedBooksFromVocabIds,
  loadAllSystemCurriculums,
  RegistryBook
} from "@/lib/curriculumRegistry";
import type { Curriculum } from "@/types";

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adminView, setAdminView] = useState<"users" | "curriculums" | "config" | "backup">("users");
  const [registryBooks, setRegistryBooks] = useState<RegistryBook[]>([]);
  const [systemCurriculums, setSystemCurriculums] = useState<Curriculum[]>([]);

  // Curriculum detail tab state inside user detail
  const [activeDetailTab, setActiveDetailTab] = useState<"curriculum" | "timeline" | "notebook">("curriculum");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurriculumRegistry().then((reg) => {
      if (reg) {
        setRegistryBooks(getAllBooksFromRegistry(reg));
      }
    });
    loadAllSystemCurriculums().then((list) => {
      setSystemCurriculums(list);
    });
  }, []);

  // Authenticate admin user
  useEffect(() => {
    const authenticated = checkAuthStatus();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      const user = getUser();
      if (user?.isAdmin) {
        setIsAdmin(true);
        loadUsers();
      } else {
        setIsAdmin(false);
        setLoadingUsers(false);
      }
    } else {
      setLoadingUsers(false);
    }
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sync-loading-start"));
    }
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoadingUsers(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sync-loading-stop"));
      }
    }
  };

  const loadUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setLoadingDetail(true);
    setError(null);
    setUserDetail(null);
    setSelectedCurriculumId(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sync-loading-start"));
    }
    try {
      const detail = await fetchAdminUserDetail(userId);
      setUserDetail(detail);
      
      const allSystem = await loadAllSystemCurriculums();
      const synced = (detail.data && Array.isArray(detail.data.curriculums)) ? detail.data.curriculums : [];
      const firstId = synced.length > 0 ? synced[0].id : (allSystem.length > 0 ? allSystem[0].id : null);
      if (firstId) {
        setSelectedCurriculumId(firstId);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin chi tiết của người dùng.");
    } finally {
      setLoadingDetail(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("sync-loading-stop"));
      }
    }
  };

  // Filter users based on search term and exclude admins
  const filteredUsers = useMemo(() => {
    const nonAdmins = users.filter(u => !u.isAdmin);
    if (!searchTerm.trim()) return nonAdmins;
    const term = searchTerm.toLowerCase();
    return nonAdmins.filter(u => 
      u.username.toLowerCase().includes(term) || 
      u.id.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Overall system stats
  const stats = useMemo(() => {
    const total = users.length;
    const adminCount = users.filter(u => u.isAdmin).length;
    const activeToday = users.filter(u => {
      if (!u.lastSyncAt) return false;
      const syncDate = new Date(u.lastSyncAt).toDateString();
      return syncDate === new Date().toDateString();
    }).length;

    let totalWordsLearned = 0;
    users.forEach(u => {
      totalWordsLearned += u.vocabLearnedCount;
    });

    return {
      total,
      adminCount,
      activeToday,
      totalWordsLearned,
      avgWords: total > 0 ? Math.round(totalWordsLearned / total) : 0
    };
  }, [users]);

  // Merged Curriculums (All System Curriculums + User Synced Curriculums)
  const mergedCurriculums = useMemo(() => {
    if (!userDetail) return systemCurriculums;
    const synced = (userDetail.data && Array.isArray(userDetail.data.curriculums))
      ? userDetail.data.curriculums
      : [];
    
    const map = new Map<string, Curriculum>();
    systemCurriculums.forEach((sc) => map.set(sc.id, sc));
    synced.forEach((uc) => map.set(uc.id, uc));

    return Array.from(map.values());
  }, [userDetail, systemCurriculums]);

  // Count learned vocab from progress keys (works even without curriculum data)
  const learnedVocabCount = useMemo(() => {
    if (!userDetail) return 0;
    const progress = userDetail.data.progress || {};
    return Object.values(progress).filter((p: any) => p.learned).length;
  }, [userDetail]);

  const hasCurriculumData = mergedCurriculums.length > 0;

  // Infer studied books from user's learned vocab IDs
  const inferredStudiedBooks = useMemo(() => {
    if (!userDetail || registryBooks.length === 0) return [];
    const progress = userDetail.data.progress || {};
    const learnedIds = Object.entries(progress)
      .filter(([, p]: any) => p.learned)
      .map(([id]) => id);
    return inferStudiedBooksFromVocabIds(learnedIds, registryBooks);
  }, [userDetail, registryBooks]);

  // Map of active curriculum
  const activeCurriculum = useMemo(() => {
    if (!selectedCurriculumId || !userDetail) return null;
    return mergedCurriculums.find(c => c.id === selectedCurriculumId) || null;
  }, [selectedCurriculumId, mergedCurriculums, userDetail]);

  // Curriculum Filters State inside user detail
  const [curriculumLangFilter, setCurriculumLangFilter] = useState<string>("all");
  const [curriculumStatusFilter, setCurriculumStatusFilter] = useState<"all" | "studied">("all");

  // Calculate detailed progress for each curriculum of selected user
  const curriculumProgresses = useMemo(() => {
    if (!userDetail) return [];
    const progress = userDetail.data.progress || {};
    
    return mergedCurriculums.map((c) => {
      let totalVocab = 0;
      let learnedVocab = 0;

      (c.lessons || []).forEach((l: any) => {
        (l.vocabulary || []).forEach((v: any) => {
          totalVocab++;
          if (progress[v.id]?.learned) {
            learnedVocab++;
          }
        });
      });

      let lang = c.lang;
      if (!lang) {
        if (c.id.startsWith("de-")) lang = "de";
        else if (c.id.startsWith("en-")) lang = "en";
        else lang = "ja";
      }

      let level = c.level;
      if (!level) {
        if (c.id.includes("n5")) level = "N5";
        else if (c.id.includes("n4")) level = "N4";
        else if (c.id.includes("n3")) level = "N3";
        else if (c.id.includes("n2")) level = "N2";
        else if (c.id.startsWith("de")) level = "A1";
        else if (c.id.startsWith("en")) level = "IELTS";
        else level = "N5";
      }

      return {
        id: c.id,
        name: c.name,
        lang,
        level,
        total: totalVocab,
        learned: learnedVocab,
        percentage: totalVocab > 0 ? Math.round((learnedVocab / totalVocab) * 100) : 0,
      };
    });
  }, [userDetail, mergedCurriculums]);

  // Filtered Curriculum Progresses
  const filteredCurriculumProgresses = useMemo(() => {
    let list = curriculumProgresses;

    if (curriculumLangFilter === "user") {
      const userLang = userDetail?.data?.settings?.activeLangCode || "ja";
      list = list.filter((p) => (p.lang || "ja") === userLang);
    } else if (curriculumLangFilter !== "all") {
      list = list.filter((p) => (p.lang || "ja") === curriculumLangFilter);
    }

    if (curriculumStatusFilter === "studied") {
      list = list.filter((p) => p.learned > 0);
    }

    return list;
  }, [curriculumProgresses, curriculumLangFilter, curriculumStatusFilter, userDetail]);

  // Grouped by Level
  const groupedCurriculumProgresses = useMemo(() => {
    const map = new Map<string, typeof filteredCurriculumProgresses>();
    filteredCurriculumProgresses.forEach((p) => {
      let lvl = p.level || "N5";
      if (!map.has(lvl)) map.set(lvl, []);
      map.get(lvl)!.push(p);
    });

    return Array.from(map.entries());
  }, [filteredCurriculumProgresses]);

  // Build lookup lists for names
  const languageName = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.name}` : code;
  };

  // Build daily study timeline for selected user
  const userTimeline = useMemo(() => {
    if (!userDetail) return [];
    
    const items: Array<{
      id: string;
      type: "vocab" | "grammar" | "kanji" | "lesson";
      title: string;
      meaning?: string;
      learnedAt: string;
      source?: string;
    }> = [];

    const progress = userDetail.data.progress || {};
    const grammarProgress = userDetail.data.grammarProgress || {};
    const kanjiProgress = userDetail.data.kanjiProgress || {};
    const curriculumHistory = userDetail.data.curriculumHistory || [];

    // Local lookup maps inside user context to display details
    const vocabLookup = new Map<string, { kanji?: string; hiragana?: string; meaning?: string; source: string }>();
    mergedCurriculums.forEach(c => {
      (c.lessons || []).forEach((l: any) => {
        (l.vocabulary || []).forEach((v: any) => {
          vocabLookup.set(v.id, {
            kanji: v.kanji,
            hiragana: v.hiragana,
            meaning: v.meaning,
            source: `${c.name} • ${l.name}`
          });
        });
      });
    });
    (userDetail.data.notebooks && Array.isArray(userDetail.data.notebooks) ? userDetail.data.notebooks : []).forEach((nb: any) => {
      (nb.vocabulary || []).forEach((v: any) => {
        vocabLookup.set(v.id, {
          kanji: v.kanji,
          hiragana: v.hiragana,
          meaning: v.meaning,
          source: `Sổ tay: ${nb.name}`
        });
      });
    });

    // Populate vocab timeline
    Object.entries(progress).forEach(([id, p]: any) => {
      if (p.learned && p.learnedAt) {
        const details = vocabLookup.get(id);
        items.push({
          id,
          type: "vocab",
          title: details?.kanji || details?.hiragana || "Từ vựng",
          meaning: details?.meaning || "",
          learnedAt: p.learnedAt,
          source: details?.source || "Không rõ nguồn"
        });
      }
    });

    // Populate grammar timeline
    Object.entries(grammarProgress).forEach(([id, p]: any) => {
      if (p.learned && p.learnedAt) {
        items.push({
          id,
          type: "grammar",
          title: `Cấu trúc: ${id}`,
          learnedAt: p.learnedAt,
          source: "Ngữ pháp"
        });
      }
    });

    // Populate Kanji timeline
    Object.entries(kanjiProgress).forEach(([char, p]: any) => {
      if (p.learned && p.learnedAt) {
        items.push({
          id: char,
          type: "kanji",
          title: `Chữ Hán: ${char}`,
          learnedAt: p.learnedAt,
          source: "Kanji Hub"
        });
      }
    });

    // Populate Completed Lessons timeline
    curriculumHistory.forEach((h: any) => {
      if (h.completedAt) {
        items.push({
          id: h.lessonId || String(Math.random()),
          type: "lesson",
          title: `Hoàn thành bài học: ${h.lessonName}`,
          learnedAt: h.completedAt,
          source: h.curriculumName || "Giáo trình"
        });
      }
    });

    // Sort descending
    items.sort((a, b) => new Date(b.learnedAt).getTime() - new Date(a.learnedAt).getTime());

    // Group by Date String
    const groups: Record<string, typeof items> = {};
    items.forEach(item => {
      const dateStr = new Date(item.learnedAt).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });

    return Object.entries(groups);
  }, [userDetail, mergedCurriculums]);

  if (loadingUsers) {
    return (
      <FullScreenLoading
        show={true}
        title="Đang tải Admin Dashboard..."
        subtitle="Hệ thống đang phản hồi dữ liệu danh sách người dùng từ API Backend, vui lòng chờ trong giây lát."
        onRetry={loadUsers}
      />
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 max-w-md mx-auto">
        <span className="text-5xl mb-4">⛔</span>
        <h1 className="text-lg font-extrabold text-gray-900">Truy Cập Bị Từ Chối</h1>
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          Tài khoản của bạn không được phân quyền Quản trị viên (is_admin = false).
          Vui lòng đăng nhập tài khoản admin hoặc chạy SQL để nâng quyền.
        </p>
        <Link href="/" className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors">
          Quay lại Trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-indigo-600/30 border border-indigo-500/20 rounded-full text-[10px] font-bold tracking-wide uppercase">
            🛡️ Dland System Administrator Panel
          </span>
          <h1 className="text-2xl font-black mt-2 tracking-tight">Bảng Điều Khiển Quản Trị Viên</h1>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">
            Theo dõi, phân tích tiến độ học từ vựng, ngữ pháp, kanji của từng user trên hệ thống Dland.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={loadUsers} 
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition border border-white/10 shadow-sm"
          >
            🔄 Tải lại dữ liệu
          </button>
          <Link 
            href="/settings" 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-md"
          >
            ⚙️ Cài đặt tài khoản
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Tổng số Users</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats.total}</div>
          <div className="text-[10px] text-gray-400 mt-1">({stats.adminCount} quản trị viên)</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Hoạt động Hôm nay</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{stats.activeToday}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Đồng bộ hoạt động mới</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Tổng số từ đã học</div>
          <div className="text-2xl font-black text-purple-600 mt-1">{stats.totalWordsLearned}</div>
          <div className="text-[10px] text-gray-400 mt-1">Của tất cả users cộng lại</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Trung bình/User</div>
          <div className="text-2xl font-black text-teal-600 mt-1">{stats.avgWords} <span className="text-xs text-gray-400 font-normal">từ</span></div>
          <div className="text-[10px] text-gray-400 mt-1">Tiến độ trung bình học từ</div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-bold">
          ✕ {error}
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3">
        <button
          type="button"
          onClick={() => setAdminView("users")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            adminView === "users"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>👥</span>
          <span>Học viên & Tiến độ</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
            adminView === "users" ? "bg-indigo-500 text-white" : "bg-gray-150 text-gray-600"
          }`}>
            {filteredUsers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminView("curriculums")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            adminView === "curriculums"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>📚</span>
          <span>Giáo trình Hệ thống</span>
          <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
            adminView === "curriculums" ? "bg-indigo-500 text-white" : "bg-gray-150 text-gray-600"
          }`}>
            {registryBooks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAdminView("config")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            adminView === "config"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>⚙️</span>
          <span>Cấu hình Hệ thống</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminView("backup")}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
            adminView === "backup"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <span>💾</span>
          <span>Sao Lưu, Phục Hồi & Đồng Bộ System DB</span>
        </button>
      </div>

      {adminView === "users" ? (
        /* Main Grid: User List & Detail */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Users list (4 columns wide on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-gray-900">Danh sách Người dùng</h3>
              <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg font-bold">
                {filteredUsers.length} Users
              </span>
            </div>
            
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm username hoặc ID..."
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* List items */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 italic">Không tìm thấy user nào.</div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUserId === u.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => loadUserDetail(u.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? "bg-indigo-50/50 border-indigo-200 shadow-3xs" 
                          : "bg-white border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-gray-800 truncate">{u.username}</span>
                          {u.isAdmin && (
                            <span className="px-1.5 py-0.2 bg-red-100 text-red-800 text-[8px] font-bold rounded">Admin</span>
                          )}
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 truncate">ID: {u.id}</p>
                        <div className="flex gap-2 mt-1.5">
                          <span className="text-[9px] font-semibold text-indigo-600">📚 {u.vocabLearnedCount} từ</span>
                          <span className="text-[9px] font-semibold text-purple-600">🉐 {u.kanjiLearnedCount} Kanji</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold block text-gray-700">{languageName(u.activeLanguage)}</span>
                        <span className="text-[8px] text-gray-400 block mt-1">
                          {u.lastSyncAt ? `Đồng bộ: ${new Date(u.lastSyncAt).toLocaleDateString("vi-VN")}` : "Chưa sync"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right column: User Details and curriculum/timeline tracker */}
        <div className="lg:col-span-8">
          <FullScreenLoading
            show={loadingDetail}
            title="Đang tải chi tiết học tập học viên..."
            subtitle="Đang kết nối API Server để truy xuất toàn bộ tiến độ từ vựng, ngữ pháp, kanji và giáo trình của học viên."
            onRetry={() => selectedUserId && loadUserDetail(selectedUserId)}
          />
          {loadingDetail ? (
            <div className="bg-white rounded-3xl p-16 border border-gray-100 text-center flex flex-col items-center justify-center gap-3 min-h-[400px]">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-gray-500 font-bold animate-pulse">Đang tải chi tiết học tập của user...</p>
            </div>
          ) : userDetail ? (
            <div className="space-y-4">
              
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900">{userDetail.user.username}</h2>
                    {userDetail.user.isAdmin && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded-lg uppercase">Quản trị viên</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 font-mono">User ID: {userDetail.user.id}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Đăng ký ngày: {new Date(userDetail.user.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg">
                      📚 {learnedVocabCount} từ đã học
                    </span>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg">
                      📖 {Object.keys(userDetail.data.grammarProgress || {}).filter(k => (userDetail.data.grammarProgress as any)[k]?.learned).length} ngữ pháp
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold block">Ngôn ngữ hiện tại:</span>
                    <span className="text-xs font-extrabold text-gray-800 mt-0.5 block">{languageName(userDetail.data.settings?.activeLangCode || "ja")}</span>
                  </div>
                  <span className="text-2xl">
                    {(({ en: "🇬🇧", de: "🇩🇪", ko: "🇰🇷", zh: "🇨🇳", ja: "🇯🇵" } as Record<string, string>)[userDetail.data.settings?.activeLangCode || "ja"]) || "🇯🇵"}
                  </span>
                </div>
              </div>

              {/* Tabs Selector */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveDetailTab("curriculum")}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                    activeDetailTab === "curriculum" 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📖 Lộ trình & Giáo trình ({hasCurriculumData ? curriculumProgresses.length : 0})
                </button>
                <button
                  onClick={() => setActiveDetailTab("timeline")}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                    activeDetailTab === "timeline" 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  ⏱️ Hoạt động theo ngày ({userTimeline.length} ngày)
                </button>
                <button
                  onClick={() => setActiveDetailTab("notebook")}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px ${
                    activeDetailTab === "notebook" 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📓 Sổ tay từ vựng ({userDetail.data.notebooks.length})
                </button>
              </div>

              {/* TAB 1: CURRICULUMS TRACKING */}
              {activeDetailTab === "curriculum" && (
                hasCurriculumData ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Left List of Curriculums */}
                  <div className="md:col-span-5 bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-3">
                    
                    {/* Filter Header & Language Selector */}
                    <div className="space-y-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-xs text-gray-700 uppercase tracking-wider">
                          Giáo Trình ({filteredCurriculumProgresses.length})
                        </h4>
                        <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md">
                          Dland Multi-Lang
                        </span>
                      </div>

                      {/* Language Filter Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                        <button
                          onClick={() => setCurriculumLangFilter("all")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            curriculumLangFilter === "all"
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          🌐 Tất cả
                        </button>
                        <button
                          onClick={() => setCurriculumLangFilter("user")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                            curriculumLangFilter === "user"
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          }`}
                        >
                          <span>🎯 Target User</span>
                        </button>
                        <button
                          onClick={() => setCurriculumLangFilter("ja")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                            curriculumLangFilter === "ja"
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span>🇯🇵 Nhật</span>
                        </button>
                        <button
                          onClick={() => setCurriculumLangFilter("de")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                            curriculumLangFilter === "de"
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span>🇩🇪 Đức</span>
                        </button>
                        <button
                          onClick={() => setCurriculumLangFilter("en")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                            curriculumLangFilter === "en"
                              ? "bg-indigo-600 text-white shadow-2xs"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span>🇬🇧 Anh</span>
                        </button>
                      </div>

                      {/* Status Filter Sub-row */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setCurriculumStatusFilter("all")}
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer ${
                            curriculumStatusFilter === "all"
                              ? "bg-gray-800 text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          Tất cả sách ({curriculumProgresses.length})
                        </button>
                        <button
                          onClick={() => setCurriculumStatusFilter("studied")}
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md cursor-pointer flex items-center gap-1 ${
                            curriculumStatusFilter === "studied"
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          <span>⭐ Đã học</span>
                          <span>({curriculumProgresses.filter(p => p.learned > 0).length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Grouped List of Curriculums */}
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                      {filteredCurriculumProgresses.length === 0 ? (
                        <div className="text-center py-8 text-xs text-gray-400 italic">
                          Không có giáo trình nào phù hợp với bộ lọc.
                        </div>
                      ) : (
                        groupedCurriculumProgresses.map(([levelGroup, books]) => (
                          <div key={levelGroup} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-extrabold text-gray-400 uppercase tracking-wider px-1 pt-1">
                              <span>Trình độ {levelGroup}</span>
                              <span className="text-[9px] text-gray-400 font-normal">{books.length} sách</span>
                            </div>

                            {books.map((p) => {
                              const isSelected = selectedCurriculumId === p.id;
                              let icon = "📖";
                              if (p.id.includes("n5")) icon = "⛩️";
                              if (p.id.includes("super-master") || p.id.includes("tango")) icon = "⚡";
                              if (p.id.includes("n4")) icon = "🏯";
                              if (p.id.includes("n3")) icon = "🌸";
                              if (p.id.includes("n2")) icon = "🗻";
                              if (p.id.startsWith("de-")) icon = "🏰";
                              if (p.id.startsWith("en-")) icon = "🏆";

                              let levelBadgeColor = "bg-indigo-100 text-indigo-800 border-indigo-200";
                              if (p.level === "N4") levelBadgeColor = "bg-blue-100 text-blue-800 border-blue-200";
                              if (p.level === "N3") levelBadgeColor = "bg-purple-100 text-purple-800 border-purple-200";
                              if (p.level === "N2") levelBadgeColor = "bg-rose-100 text-rose-800 border-rose-200";
                              if (p.level === "A1") levelBadgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                              if (p.level === "IELTS") levelBadgeColor = "bg-amber-100 text-amber-800 border-amber-200";

                              return (
                                <button
                                  key={p.id}
                                  onClick={() => setSelectedCurriculumId(p.id)}
                                  className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                                    isSelected 
                                      ? "bg-indigo-50/80 border-indigo-300 shadow-3xs" 
                                      : "bg-gray-50/40 border-gray-100 hover:bg-gray-50"
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full min-w-0">
                                    <span className="font-extrabold text-xs text-gray-800 truncate pr-1 flex items-center gap-1.5 min-w-0">
                                      <span className="shrink-0">{icon}</span>
                                      <span className="truncate">{p.name}</span>
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className={`px-1.5 py-0.2 text-[8px] font-black rounded border ${levelBadgeColor}`}>
                                        {p.level}
                                      </span>
                                      <span className={`text-[10px] font-black ${p.percentage > 0 ? "text-indigo-600" : "text-gray-400"}`}>
                                        {p.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Progress bar */}
                                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-300 ${p.percentage > 0 ? "bg-indigo-600" : "bg-gray-300"}`}
                                      style={{ width: `${p.percentage}%` }}
                                    />
                                  </div>

                                  <div className="flex justify-between w-full text-[9px] font-semibold mt-0.5">
                                    <span className={p.learned > 0 ? "text-emerald-700 font-bold" : "text-gray-400"}>
                                      {p.learned > 0 ? `✓ Đã thuộc: ${p.learned} từ` : `Đã thuộc: 0 từ`}
                                    </span>
                                    <span className="text-gray-400">Tổng: {p.total} từ</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Vocabulary Viewer for Selected Curriculum */}
                  <div className="md:col-span-7 bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-4">
                    {activeCurriculum ? (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-extrabold text-xs text-gray-900">Chi tiết: {activeCurriculum.name}</h4>
                          <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg uppercase">Từ vựng giáo trình</span>
                        </div>

                        {(!activeCurriculum.lessons || activeCurriculum.lessons.length === 0) ? (
                          <div className="text-center py-12 text-xs text-gray-400 italic">Giáo trình này không chứa bài học nào.</div>
                        ) : (
                          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                            {(activeCurriculum.lessons || []).map((lesson: any) => {
                              const lessonVocab = lesson.vocabulary || [];
                              const learnedCountInLesson = lessonVocab.filter((v: any) => userDetail.data.progress[v.id]?.learned).length;
                              const lessonPercentage = lessonVocab.length > 0 ? Math.round((learnedCountInLesson / lessonVocab.length) * 100) : 0;
                              
                              // Check if lesson is completely marked completed in history
                              const isCompletedLesson = userDetail.data.curriculumHistory.some((h: any) => h.lessonId === lesson.id);

                              return (
                                <div key={lesson.id} className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-2">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <span className="font-extrabold text-xs text-gray-800">{lesson.name}</span>
                                      {isCompletedLesson && (
                                        <span className="ml-2 inline-block px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[8px] font-bold rounded">Bài đã hoàn thành ✓</span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-indigo-600 font-bold">{learnedCountInLesson}/{lessonVocab.length} từ ({lessonPercentage}%)</span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 border-t border-gray-100/50">
                                    {lessonVocab.map((v: any) => {
                                      const isLearned = !!userDetail.data.progress[v.id]?.learned;
                                      return (
                                        <div 
                                          key={v.id} 
                                          className={`p-2 rounded-xl text-[10px] border flex flex-col justify-between ${
                                            isLearned 
                                              ? "bg-emerald-50/20 border-emerald-100 text-emerald-800 font-semibold" 
                                              : "bg-white border-gray-100 text-gray-600"
                                          }`}
                                        >
                                          <div className="flex justify-between items-start gap-1">
                                            <span className="font-bold">{v.kanji || v.hiragana}</span>
                                            {isLearned && <span className="text-emerald-600 font-bold">✓</span>}
                                          </div>
                                          {v.kanji && v.hiragana && <span className="text-[8px] text-gray-400 font-mono mt-0.5">{v.hiragana}</span>}
                                          <span className="text-[9px] text-gray-500 mt-1 line-clamp-1">{v.meaning}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-xs text-gray-400 italic">Vui lòng chọn một giáo trình bên trái.</div>
                    )}
                  </div>
                </div>
                ) : (
                  /* No curriculum synced - show progress summary from progress keys instead */
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
                    <div className="flex items-start gap-3 mb-5 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
                      <span className="text-lg shrink-0">⚠️</span>
                      <div>
                        <p className="text-xs font-bold text-amber-800">Chưa đồng bộ dữ liệu giáo trình</p>
                        <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                          User này chưa sync danh sách giáo trình lên server. Dữ liệu bên dưới được tính từ các ID từ vựng đã học trong progress.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                        <div className="text-2xl font-black text-indigo-700">{learnedVocabCount}</div>
                        <div className="text-[10px] text-indigo-500 font-bold mt-1">Từ vựng đã học</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                        <div className="text-2xl font-black text-purple-700">
                          {Object.values(userDetail.data.grammarProgress || {}).filter((p: any) => p.learned).length}
                        </div>
                        <div className="text-[10px] text-purple-500 font-bold mt-1">Ngữ pháp đã học</div>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                        <div className="text-2xl font-black text-emerald-700">
                          {Object.values(userDetail.data.kanjiProgress || {}).filter((p: any) => p.learned).length}
                        </div>
                        <div className="text-[10px] text-emerald-500 font-bold mt-1">Kanji đã học</div>
                      </div>
                    </div>

                    {inferredStudiedBooks.length > 0 && (
                      <div className="mb-6 space-y-3">
                        <h4 className="font-extrabold text-xs text-gray-700 uppercase tracking-wider">
                          📚 Giáo Trình Hệ Thống Đã Học (Suy Luận Từ ID Tiến Độ)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {inferredStudiedBooks.map(({ book, count }) => {
                            const pct = Math.round((count / book.totalVocab) * 100);
                            return (
                              <div key={book.id} className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-150 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xl shrink-0">{book.icon}</span>
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-xs text-gray-900 block truncate">{book.name}</span>
                                      <span className="text-[9px] text-gray-400 font-bold block truncate">{book.publisher} • Trình độ {book.level}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-black text-indigo-600 shrink-0">{pct}%</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="flex justify-between text-[9px] text-gray-500 font-semibold">
                                  <span>Đã thuộc: {count} từ</span>
                                  <span>Tổng sách: {book.totalVocab} từ ({book.totalLessons} bài)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {learnedVocabCount > 0 && (
                      <div>
                        <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-2">ID từ vựng đã học gần đây</h4>
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto no-scrollbar">
                          {Object.entries(userDetail.data.progress || {})
                            .filter(([, p]: any) => p.learned)
                            .sort(([, a]: any, [, b]: any) => new Date(b.learnedAt || 0).getTime() - new Date(a.learnedAt || 0).getTime())
                            .slice(0, 50)
                            .map(([id]: any) => (
                              <span key={id} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-mono rounded border border-gray-200">
                                {id}
                              </span>
                            ))}
                          {learnedVocabCount > 50 && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-500 text-[9px] font-bold rounded">
                              +{learnedVocabCount - 50} từ khác
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}

              {/* TAB 2: DAILY STUDY TIMELINE */}
              {activeDetailTab === "timeline" && (
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Lịch Sử Hoạt Động Theo Ngày</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-lg">Realtime log</span>
                  </div>

                  {userTimeline.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400 italic">User chưa có hoạt động học tập nào.</div>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                      {userTimeline.map(([date, items]) => (
                        <div key={date} className="relative pl-8">
                          <div className="absolute left-[3px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-50 z-10" />
                          <h4 className="font-extrabold text-xs text-gray-800 mb-2.5">{date}</h4>
                          
                          <div className="space-y-2">
                            {items.map((item, itIdx) => {
                              const timeStr = new Date(item.learnedAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit"
                              });
                              
                              let typeLabel = "Từ vựng";
                              let typeClass = "bg-indigo-50 text-indigo-700 border-indigo-100";
                              if (item.type === "grammar") {
                                typeLabel = "Ngữ pháp";
                                typeClass = "bg-purple-50 text-purple-700 border-purple-100";
                              } else if (item.type === "kanji") {
                                typeLabel = "Kanji";
                                typeClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
                              } else if (item.type === "lesson") {
                                typeLabel = "Bài học hoàn thành";
                                typeClass = "bg-rose-50 text-rose-700 border-rose-100";
                              }

                              return (
                                <div key={item.id + itIdx} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50 flex justify-between items-center gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold border uppercase shrink-0 ${typeClass}`}>
                                      {typeLabel}
                                    </span>
                                    <div>
                                      <span className="text-xs font-bold text-gray-800">{item.title}</span>
                                      {item.meaning && (
                                        <p className="text-[10px] text-gray-500 mt-0.5">{item.meaning}</p>
                                      )}
                                      {item.source && (
                                        <p className="text-[8px] text-gray-400 mt-0.5">📂 {item.source}</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400 shrink-0">🕒 {timeStr}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: NOTEBOOKS */}
              {activeDetailTab === "notebook" && (
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-2xs space-y-4">
                  <h3 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Danh sách Sổ tay của User</h3>
                  {(!userDetail.data.notebooks || !Array.isArray(userDetail.data.notebooks) || userDetail.data.notebooks.length === 0) ? (
                    <div className="text-center py-12 text-xs text-gray-400 italic">User chưa tạo sổ tay cá nhân nào.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 no-scrollbar">
                      {userDetail.data.notebooks.map((nb: any) => {
                        const vocabList = nb.vocabulary || [];
                        return (
                          <div key={nb.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-150 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-gray-800">{nb.name}</span>
                              <span className="text-[9px] px-2 py-0.5 bg-gray-200 text-gray-600 rounded-lg font-bold">{vocabList.length} từ</span>
                            </div>
                            
                            {vocabList.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-1.5 border-t border-gray-200">
                                {vocabList.slice(0, 8).map((v: any, vIdx: number) => (
                                  <span 
                                    key={v.id || vIdx} 
                                    className="px-1.5 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-md text-[9px] font-semibold"
                                  >
                                    {v.kanji || v.hiragana}
                                  </span>
                                ))}
                                {vocabList.length > 8 && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[9px] font-bold">
                                    +{vocabList.length - 8}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-[10px] text-gray-400 italic">Không có từ vựng nào.</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 border border-gray-150 text-center flex flex-col items-center justify-center gap-3 min-h-[400px] shadow-2xs">
              <span className="text-4xl">🛡️</span>
              <h3 className="font-bold text-gray-800 text-sm">Chưa chọn User</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm">
                Vui lòng nhấp chọn một người dùng ở cột bên trái để hiển thị biểu đồ học tập và lịch sử chi tiết.
              </p>
            </div>
          )}
        </div>
      </div>
      ) : adminView === "curriculums" ? (
        /* System Curriculum Registry View */
        <SystemCurriculumRegistryPanel />
      ) : adminView === "config" ? (
        /* System Configuration View */
        <div className="space-y-6">
          {/* Nav Menu Settings Panel (with dev features controls) */}
          <NavMenuSettingsPanel />

          {/* Sample Curriculum Display Settings */}
          <CurriculumDisplaySettings />
        </div>
      ) : (
        /* Database Backup, Restore & Sync View - Admin Only */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-2xs">
            <h2 className="text-base font-extrabold text-gray-900 mb-1 flex items-center gap-2">
              <span>💾</span>
              <span>Quản Lý Sao Lưu, Phục Hồi & Đồng Bộ System Database</span>
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Công cụ dành riêng cho Quản trị viên: Xuất/Nhập toàn bộ Database hệ thống (bao gồm tất cả học viên & bảng dữ liệu Cloud), tạo Snapshot và đồng bộ 2 chiều.
            </p>
            <ExportImportPanel />
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-2xs">
            <BackupHistoryPanel />
          </div>
        </div>
      )}
    </div>
  );
}
