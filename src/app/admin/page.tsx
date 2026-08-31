"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { checkAuthStatus, getUser } from "@/lib/syncService";
import { fetchAdminUsers, fetchAdminUserDetail, AdminUser, AdminUserDetail } from "@/lib/adminService";
import { DEFAULT_VOCABULARY } from "@/data";
import { SUPPORTED_LANGUAGES } from "@/hooks/useLanguageSetting";

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

  // Curriculum detail tab state inside user detail
  const [activeDetailTab, setActiveDetailTab] = useState<"curriculum" | "timeline" | "notebook">("curriculum");
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string | null>(null);

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
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách người dùng.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadUserDetail = async (userId: string) => {
    setSelectedUserId(userId);
    setLoadingDetail(true);
    setError(null);
    setUserDetail(null);
    setSelectedCurriculumId(null);
    try {
      const detail = await fetchAdminUserDetail(userId);
      setUserDetail(detail);
      
      // Auto select first curriculum if available
      const userCurriculums = (detail.data && Array.isArray(detail.data.curriculums)) && detail.data.curriculums.length > 0
        ? detail.data.curriculums
        : (DEFAULT_VOCABULARY?.curriculums || []);
      
      if (userCurriculums.length > 0) {
        setSelectedCurriculumId(userCurriculums[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin chi tiết của người dùng.");
    } finally {
      setLoadingDetail(false);
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

  // User Curriculums List (including fallback default)
  const userCurriculums = useMemo(() => {
    if (!userDetail) return [];
    return (userDetail.data && Array.isArray(userDetail.data.curriculums)) && userDetail.data.curriculums.length > 0
      ? userDetail.data.curriculums
      : (DEFAULT_VOCABULARY?.curriculums || []);
  }, [userDetail]);

  // Map of active curriculum
  const activeCurriculum = useMemo(() => {
    if (!selectedCurriculumId || !userDetail) return null;
    return userCurriculums.find(c => c.id === selectedCurriculumId) || null;
  }, [selectedCurriculumId, userCurriculums, userDetail]);

  // Calculate detailed progress for each curriculum of selected user
  const curriculumProgresses = useMemo(() => {
    if (!userDetail) return [];
    const progress = userDetail.data.progress || {};
    
    return userCurriculums.map((c) => {
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

      return {
        id: c.id,
        name: c.name,
        total: totalVocab,
        learned: learnedVocab,
        percentage: totalVocab > 0 ? Math.round((learnedVocab / totalVocab) * 100) : 0,
      };
    });
  }, [userDetail, userCurriculums]);

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
    userCurriculums.forEach(c => {
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
  }, [userDetail, userCurriculums]);

  if (loadingUsers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-bold animate-pulse">Đang tải Admin Dashboard...</p>
      </div>
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

      {/* Main Grid: User List & Detail */}
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
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-bold block">Ngôn ngữ hiện tại:</span>
                    <span className="text-xs font-extrabold text-gray-800 mt-0.5 block">{languageName(userDetail.data.settings?.activeLangCode || "ja")}</span>
                  </div>
                  <span className="text-2xl">
                    {userDetail.data.settings?.activeLangCode === "en" ? "🇬🇧" : userDetail.data.settings?.activeLangCode === "de" ? "🇩🇪" : "🇯🇵"}
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
                  📖 Lộ trình & Giáo trình ({curriculumProgresses.length})
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
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Left List of Curriculums */}
                  <div className="md:col-span-5 bg-white rounded-3xl p-4 border border-gray-100 shadow-2xs space-y-2">
                    <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider mb-2">Tiến độ Giáo trình</h4>
                    {curriculumProgresses.map((p) => {
                      const isSelected = selectedCurriculumId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelectedCurriculumId(p.id)}
                          className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1.5 ${
                            isSelected 
                              ? "bg-indigo-50/50 border-indigo-200" 
                              : "bg-gray-50/40 border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-extrabold text-xs text-gray-800 truncate pr-1">{p.name}</span>
                            <span className="text-[10px] font-bold text-indigo-600 shrink-0">{p.percentage}%</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full transition-all duration-300"
                              style={{ width: `${p.percentage}%` }}
                            />
                          </div>

                          <div className="flex justify-between w-full text-[9px] text-gray-400 font-semibold mt-0.5">
                            <span>Đã thuộc: {p.learned} từ</span>
                            <span>Tổng: {p.total} từ</span>
                          </div>
                        </button>
                      );
                    })}
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
    </div>
  );
}
