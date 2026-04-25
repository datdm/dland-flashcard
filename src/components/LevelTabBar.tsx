"use client";

interface LevelTabBarProps {
  levels: string[];
  active: string | null;
  onChange: (level: string | null) => void;
}

export default function LevelTabBar({ levels, active, onChange }: LevelTabBarProps) {
  if (levels.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
      <button
        onClick={() => onChange(null)}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === null
            ? "bg-indigo-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Tất cả
      </button>
      {levels.map((lvl) => (
        <button
          key={lvl}
          onClick={() => onChange(lvl)}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === lvl
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
}
