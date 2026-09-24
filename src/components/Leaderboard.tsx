"use client";

import { useState, useMemo } from "react";
import { useStreak } from "@/hooks/useStreak";
import { useProgress } from "@/hooks/useProgress";
import { useAuth } from "@/context/AuthContext";
import { useLanguageSetting } from "@/hooks/useLanguageSetting";

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatarUrl?: string;
  avatarBg?: string;
  avatarIcon?: string;
  avatarText?: string;
  days?: number;
  score: number;
}

// Dữ liệu bảng xếp hạng chính xác theo ảnh mẫu cho N2 và các cấp độ khác
const LEADERBOARD_DATA: Record<string, LeaderboardUser[]> = {
  N2: [
    {
      rank: 1,
      name: "Bùi Quyên",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      days: 17,
      score: 2727,
    },
    {
      rank: 2,
      name: "Huy SoJi",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face",
      days: 5,
      score: 1508,
    },
    {
      rank: 3,
      name: "Rùa ẩn danh",
      avatarBg: "bg-purple-100 text-purple-600",
      avatarIcon: "🚗",
      days: 4,
      score: 1433,
    },
    {
      rank: 4,
      name: "Vũ Minh",
      avatarBg: "bg-emerald-100 text-emerald-700",
      avatarText: "S",
      days: 12,
      score: 1168,
    },
    {
      rank: 5,
      name: "Tân Bùi Duy",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      score: 875,
    },
  ],
  N3: [
    {
      rank: 1,
      name: "Minh Anh",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
      days: 21,
      score: 2540,
    },
    {
      rank: 2,
      name: "Hoàng Long",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      days: 14,
      score: 1890,
    },
    {
      rank: 3,
      name: "Mèo Lười",
      avatarBg: "bg-amber-100 text-amber-700",
      avatarIcon: "🐱",
      days: 9,
      score: 1320,
    },
    {
      rank: 4,
      name: "Thanh Trúc",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      days: 6,
      score: 980,
    },
    {
      rank: 5,
      name: "Tuấn Kiệt",
      avatarBg: "bg-blue-100 text-blue-700",
      avatarText: "TK",
      days: 3,
      score: 750,
    },
  ],
  N1: [
    {
      rank: 1,
      name: "Lê Đạt",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
      days: 32,
      score: 3890,
    },
    {
      rank: 2,
      name: "Ngọc Mai",
      avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
      days: 19,
      score: 2650,
    },
    {
      rank: 3,
      name: "Senpai",
      avatarBg: "bg-rose-100 text-rose-700",
      avatarIcon: "🎓",
      days: 15,
      score: 2100,
    },
    {
      rank: 4,
      name: "Bảo Nam",
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=face",
      days: 10,
      score: 1450,
    },
    {
      rank: 5,
      name: "Hải Yến",
      avatarBg: "bg-purple-100 text-purple-700",
      avatarText: "HY",
      days: 8,
      score: 920,
    },
  ],
  N4: [
    {
      rank: 1,
      name: "Thúy Nga",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      days: 11,
      score: 1780,
    },
    {
      rank: 2,
      name: "Đức Trọng",
      avatarBg: "bg-teal-100 text-teal-700",
      avatarText: "DT",
      days: 8,
      score: 1420,
    },
    {
      rank: 3,
      name: "Cáo Nhỏ",
      avatarBg: "bg-orange-100 text-orange-700",
      avatarIcon: "🦊",
      days: 7,
      score: 1150,
    },
    {
      rank: 4,
      name: "Kim Ngân",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
      days: 5,
      score: 910,
    },
    {
      rank: 5,
      name: "Văn Hùng",
      avatarBg: "bg-slate-100 text-slate-700",
      avatarText: "VH",
      days: 2,
      score: 620,
    },
  ],
  N5: [
    {
      rank: 1,
      name: "Lan Phương",
      avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
      days: 15,
      score: 1950,
    },
    {
      rank: 2,
      name: "Khánh Linh",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      days: 10,
      score: 1620,
    },
    {
      rank: 3,
      name: "Tân Binh",
      avatarBg: "bg-indigo-100 text-indigo-700",
      avatarIcon: "🌱",
      days: 6,
      score: 1210,
    },
    {
      rank: 4,
      name: "Hoài Nam",
      avatarBg: "bg-emerald-100 text-emerald-700",
      avatarText: "HN",
      days: 4,
      score: 850,
    },
    {
      rank: 5,
      name: "Quỳnh Anh",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      days: 3,
      score: 580,
    },
  ],
};

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex flex-col items-center justify-center w-7 shrink-0">
        <svg className="w-4 h-2 text-blue-500 -mb-0.5" viewBox="0 0 20 10" fill="currentColor">
          <polygon points="1,0 10,6 19,0 20,4 10,10 0,4" />
        </svg>
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
          1
        </div>
        <div className="w-5 h-1 rounded-full bg-amber-400 mt-0.5" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex flex-col items-center justify-center w-7 shrink-0">
        <svg className="w-4 h-2 text-blue-400 -mb-0.5" viewBox="0 0 20 10" fill="currentColor">
          <polygon points="1,0 10,6 19,0 20,4 10,10 0,4" />
        </svg>
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-slate-300 to-slate-400 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
          2
        </div>
        <div className="w-5 h-1 rounded-full bg-slate-300 mt-0.5" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex flex-col items-center justify-center w-7 shrink-0">
        <svg className="w-4 h-2 text-blue-400 -mb-0.5" viewBox="0 0 20 10" fill="currentColor">
          <polygon points="1,0 10,6 19,0 20,4 10,10 0,4" />
        </svg>
        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-amber-600 to-amber-700 text-white font-black text-[11px] flex items-center justify-center shadow-xs">
          3
        </div>
        <div className="w-5 h-1 rounded-full bg-orange-400 mt-0.5" />
      </div>
    );
  }
  return (
    <div className="w-7 text-center shrink-0">
      <span className="text-gray-400 font-bold text-xs sm:text-sm">{rank}</span>
    </div>
  );
}

function FireIcon() {
  return (
    <svg
      className="w-4 h-4 text-orange-500 fill-orange-50 shrink-0 inline-block ml-0.5"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.079A3.75 3.75 0 0012 18z"
      />
    </svg>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const streak = useStreak();
  const { progress } = useProgress();
  const { activeLanguage } = useLanguageSetting();

  const [selectedLevel, setSelectedLevel] = useState<string>("N2");
  const [timeframe, setTimeframe] = useState<"week" | "month" | "all">("week");
  const [showLevelDropdown, setShowLevelDropdown] = useState<boolean>(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState<boolean>(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const availableLevels = useMemo(() => {
    if (activeLanguage.code === "de" || activeLanguage.code === "en") {
      return ["A1", "A2", "B1", "B2"];
    }
    return ["N2", "N1", "N3", "N4", "N5"];
  }, [activeLanguage.code]);

  const currentLevelKey = availableLevels.includes(selectedLevel) ? selectedLevel : "N2";
  const currentList = LEADERBOARD_DATA[currentLevelKey] || LEADERBOARD_DATA["N2"];

  // Tính điểm của user hiện tại để hiển thị vị trí cá nhân
  const userScore = useMemo(() => {
    const learnedCount = Object.values(progress).filter((p) => p.learned).length;
    const streakBonus = (streak.currentStreak || 0) * 50;
    return learnedCount * 10 + streakBonus;
  }, [progress, streak.currentStreak]);

  const formatScore = (num: number) => {
    return num.toLocaleString("de-DE");
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs relative">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Title with Trophy and Level Switcher */}
        <div className="relative flex items-center gap-2">
          <div className="text-amber-500 shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0H8.496m8.008 0A4.5 4.5 0 0020.25 10.5V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v4.5a4.5 4.5 0 003.746 4.375"
              />
            </svg>
          </div>
          <button
            onClick={() => setShowLevelDropdown((prev) => !prev)}
            className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-gray-900 hover:text-indigo-600 transition-colors group cursor-pointer"
          >
            <span>Bảng xếp hạng {currentLevelKey}</span>
            <span className="text-[10px] text-gray-400 group-hover:text-indigo-500 transition-transform">
              ▼
            </span>
          </button>

          {/* Level Dropdown Menu */}
          {showLevelDropdown && (
            <div
              className="absolute top-8 left-0 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 min-w-[120px] animate-fadeIn"
              onMouseLeave={() => setShowLevelDropdown(false)}
            >
              <div className="text-[10px] font-bold text-gray-400 px-2.5 py-1 uppercase tracking-wider">
                Chọn cấp độ
              </div>
              {availableLevels.map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl);
                    setShowLevelDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                    selectedLevel === lvl
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Trình độ {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeframe selector (Tuần này) */}
        <div className="relative">
          <button
            onClick={() => setShowTimeframeDropdown((prev) => !prev)}
            className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>
              {timeframe === "week"
                ? "Tuần này"
                : timeframe === "month"
                ? "Tháng này"
                : "Toàn thời gian"}
            </span>
            <span className="text-[9px]">▼</span>
          </button>

          {showTimeframeDropdown && (
            <div
              className="absolute top-6 right-0 z-30 bg-white border border-gray-100 rounded-2xl shadow-xl p-1.5 min-w-[130px] animate-fadeIn"
              onMouseLeave={() => setShowTimeframeDropdown(false)}
            >
              <button
                onClick={() => {
                  setTimeframe("week");
                  setShowTimeframeDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                  timeframe === "week"
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Tuần này
              </button>
              <button
                onClick={() => {
                  setTimeframe("month");
                  setShowTimeframeDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                  timeframe === "month"
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Tháng này
              </button>
              <button
                onClick={() => {
                  setTimeframe("all");
                  setShowTimeframeDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium rounded-xl transition-colors ${
                  timeframe === "all"
                    ? "bg-indigo-50 text-indigo-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Toàn thời gian
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-gray-50/80">
        {currentList.map((userItem) => (
          <div
            key={userItem.rank + userItem.name}
            className="flex items-center justify-between py-2.5 sm:py-3 transition-colors hover:bg-gray-50/50 rounded-xl px-1"
          >
            {/* Left: Medal + Avatar + Name */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
              <RankMedal rank={userItem.rank} />

              {/* Avatar */}
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center font-bold text-xs shadow-2xs">
                {userItem.avatarUrl && !imgErrors[userItem.name] ? (
                  <img
                    src={userItem.avatarUrl}
                    alt={userItem.name}
                    className="w-full h-full object-cover"
                    onError={() =>
                      setImgErrors((prev) => ({ ...prev, [userItem.name]: true }))
                    }
                  />
                ) : userItem.avatarIcon ? (
                  <div
                    className={`w-full h-full flex items-center justify-center text-base ${
                      userItem.avatarBg || "bg-purple-100"
                    }`}
                  >
                    {userItem.avatarIcon}
                  </div>
                ) : userItem.avatarText ? (
                  <div
                    className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                      userItem.avatarBg || "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {userItem.avatarText}
                  </div>
                ) : (
                  <div className="w-full h-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {userItem.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate">
                {userItem.name}
              </span>
            </div>

            {/* Right: Days + Score + Fire Icon */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {userItem.days !== undefined && (
                <span className="text-[11px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">
                  {userItem.days} ngày
                </span>
              )}

              <div className="flex items-center text-orange-600 font-extrabold text-xs sm:text-sm">
                <span>{formatScore(userItem.score)}</span>
                <FireIcon />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User's position at the bottom */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs bg-amber-50/30 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-3 sm:p-3.5 rounded-b-3xl">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="text-gray-400 font-bold text-xs w-6 text-center shrink-0">
            #--
          </span>
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : "BẠN"}
          </div>
          <div className="truncate">
            <span className="font-bold text-gray-800 block truncate">
              {user?.username || "Bạn"}
            </span>
            <span className="text-[10px] text-gray-400">
              {streak.currentStreak > 0 ? `${streak.currentStreak} ngày liên tục` : "Bắt đầu học ngay"}
            </span>
          </div>
        </div>

        <div className="flex items-center text-orange-600 font-black text-xs sm:text-sm shrink-0">
          <span>{formatScore(userScore > 0 ? userScore : 0)}</span>
          <FireIcon />
        </div>
      </div>
    </div>
  );
}
