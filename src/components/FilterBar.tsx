"use client";

type FilterTab = "all" | "learned" | "unlearned" | "favorite";

interface FilterBarProps {
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
  counts: { all: number; learned: number; unlearned: number; favorite: number };
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "unlearned", label: "Chưa học" },
  { key: "learned", label: "Đã học" },
  { key: "favorite", label: "Yêu thích" },
];

export default function FilterBar({ active, onChange, counts }: FilterBarProps) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors ${
            active === key
              ? "bg-white shadow text-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {label}
          <span
            className={`ml-1 text-xs ${
              active === key ? "text-indigo-400" : "text-gray-400"
            }`}
          >
            ({counts[key]})
          </span>
        </button>
      ))}
    </div>
  );
}

export type { FilterTab };
