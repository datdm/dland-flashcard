const fs = require('fs');
const path = require('path');

// 1. Update src/hooks/useNavMenuSettings.ts
const navHookPath = path.join(__dirname, '..', 'src', 'hooks', 'useNavMenuSettings.ts');
let navHookContent = fs.readFileSync(navHookPath, 'utf8');

const updatedNavHook = `"use client";

import { useState, useEffect, useCallback } from "react";
import { autoSync } from "@/lib/syncService";

const STORAGE_KEY = "dland_nav_menu_settings";
const ADMIN_DEV_KEY = "dland_admin_dev_features_enabled";

// Per-language map of href → visible (true = show)
export type NavMenuSettings = Record<string, Record<string, boolean>>;

function loadSettings(): NavMenuSettings {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSettingsToStorage(settings: NavMenuSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function loadDevFeaturesEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_DEV_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveDevFeaturesEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_DEV_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
}

export function useNavMenuSettings() {
  const [settings, setSettings] = useState<NavMenuSettings>(() => loadSettings());
  const [devFeaturesEnabled, setDevFeaturesEnabledState] = useState<boolean>(() => loadDevFeaturesEnabled());

  useEffect(() => {
    setSettings(loadSettings());
    setDevFeaturesEnabledState(loadDevFeaturesEnabled());
  }, []);

  const isVisible = useCallback(
    (langCode: string, href: string): boolean => {
      const langSettings = settings[langCode];
      if (!langSettings || langSettings[href] === undefined) return true;
      return langSettings[href];
    },
    [settings]
  );

  const toggleItem = useCallback(
    (langCode: string, href: string) => {
      setSettings((prev) => {
        const langSettings = prev[langCode] ?? {};
        const current = langSettings[href] === undefined ? true : langSettings[href];
        const updated: NavMenuSettings = {
          ...prev,
          [langCode]: {
            ...langSettings,
            [href]: !current,
          },
        };
        saveSettingsToStorage(updated);
        window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
        autoSync();
        return updated;
      });
    },
    []
  );

  const setDevFeaturesEnabled = useCallback((enabled: boolean) => {
    saveDevFeaturesEnabled(enabled);
    setDevFeaturesEnabledState(enabled);
  }, []);

  const resetLang = useCallback((langCode: string) => {
    setSettings((prev) => {
      const updated = { ...prev };
      delete updated[langCode];
      saveSettingsToStorage(updated);
      window.dispatchEvent(new CustomEvent("nav-menu-settings-changed"));
      autoSync();
      return updated;
    });
  }, []);

  useEffect(() => {
    const handler = () => {
      setSettings(loadSettings());
      setDevFeaturesEnabledState(loadDevFeaturesEnabled());
    };
    window.addEventListener("nav-menu-settings-changed", handler);
    return () => window.removeEventListener("nav-menu-settings-changed", handler);
  }, []);

  return { settings, isVisible, toggleItem, resetLang, devFeaturesEnabled, setDevFeaturesEnabled };
}
`;

fs.writeFileSync(navHookPath, updatedNavHook, 'utf8');
console.log("Updated useNavMenuSettings.ts!");

// 2. Update src/components/Navbar.tsx to add isComingSoon & isDevOnly and disabled behavior
const navbarPath = path.join(__dirname, '..', 'src', 'components', 'Navbar.tsx');
let navbarContent = fs.readFileSync(navbarPath, 'utf8');

navbarContent = navbarContent.replace(
  `export interface NavItem {
  href: string;
  label: string;
  icon: string;
}`,
  `export interface NavItem {
  href: string;
  label: string;
  icon: string;
  isComingSoon?: boolean;
  isDevOnly?: boolean;
}`
);

// Add items with isComingSoon or isDevOnly for testing and language status
const oldNavJaItems = `        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/settings", label: "Cài đặt Ngôn ngữ", icon: "⚙️" },
      ];`;

const newNavJaItems = `        { href: "/history", label: "Lịch sử học tập", icon: "📊" },
        { href: "/settings", label: "Cài đặt Ngôn ngữ", icon: "⚙️" },
        { href: "/practice/ai-voice-room", label: "Phòng Luyện Voice AI", icon: "🎙️", isComingSoon: true, isDevOnly: true },
        { href: "/practice/mock-interview", label: "Phỏng Vấn Xin Việc AI", icon: "💼", isComingSoon: true, isDevOnly: true },
      ];`;

if (navbarContent.includes(oldNavJaItems)) {
  navbarContent = navbarContent.replace(oldNavJaItems, newNavJaItems);
}

// In Navbar component, read devFeaturesEnabled
navbarContent = navbarContent.replace(
  '  const { isVisible } = useNavMenuSettings();\n  const visibleNavItems = navItems.filter((item) => isVisible(activeLanguage.code, item.href));',
  `  const { isVisible, devFeaturesEnabled } = useNavMenuSettings();
  const visibleNavItems = navItems.filter((item) => {
    if (item.isDevOnly && !devFeaturesEnabled) return false;
    return isVisible(activeLanguage.code, item.href);
  });`
);

// Update Desktop links rendering
const oldDesktopLinkRegex = /<Link\s+key=\{href \+ label\}\s+href=\{href\}[\s\S]*?<\/Link>/;

const newDesktopLink = `<Link
                  key={href + label}
                  href={item.isComingSoon ? "#" : href}
                  onClick={(e) => {
                    if (item.isComingSoon) {
                      e.preventDefault();
                    }
                  }}
                  title={isCollapsed ? (item.isComingSoon ? \`\${label} (Sắp ra mắt)\` : label) : undefined}
                  className={\`flex items-center gap-3 py-2 rounded-2xl text-xs font-semibold transition-all \${
                    isCollapsed ? 'justify-center px-0' : 'px-3'
                  } \${
                    item.isComingSoon
                      ? "opacity-50 cursor-not-allowed text-gray-400"
                      : isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }\`}
                >
                  <span className="text-base shrink-0">{icon}</span>
                  {!isCollapsed && (
                    <div className="flex items-center justify-between gap-1.5 flex-1 min-w-0">
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{label}</span>
                      {item.isComingSoon && (
                        <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-bold rounded shrink-0">
                          Sắp ra mắt
                        </span>
                      )}
                    </div>
                  )}
                </Link>`;

navbarContent = navbarContent.replace(oldDesktopLinkRegex, newDesktopLink);

// Update Mobile links rendering
const oldMobileLinkRegex = /<Link\s+key=\{href \+ label\}\s+href=\{href\}[\s\S]*?<\/Link>/;
if (navbarContent.includes('const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));')) {
  // Replace the second occurrence for mobile
  const parts = navbarContent.split('{visibleNavItems.map(({ href, label, icon }) => {');
  if (parts.length > 2) {
    let secondPart = parts[2];
    const mobileLinkOldRegex = /<Link[\s\S]*?<\/Link>/;
    const newMobileLink = `<Link
                key={href + label}
                href={item.isComingSoon ? "#" : href}
                onClick={(e) => {
                  if (item.isComingSoon) e.preventDefault();
                }}
                className={\`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all select-none \${
                  item.isComingSoon
                    ? "opacity-50 cursor-not-allowed text-gray-400"
                    : isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50 border border-gray-100"
                }\`}
              >
                <span>{icon}</span>
                <span>{label}</span>
                {item.isComingSoon && (
                  <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[8px] font-bold rounded">
                    Soon
                  </span>
                )}
              </Link>`;
    parts[2] = secondPart.replace(mobileLinkOldRegex, newMobileLink);
    navbarContent = parts.join('{visibleNavItems.map((item) => {\n              const { href, label, icon } = item;');
  }
}

// Replace the first visibleNavItems map signature
navbarContent = navbarContent.replace(
  '{visibleNavItems.map(({ href, label, icon }) => {',
  '{visibleNavItems.map((item) => {\n              const { href, label, icon } = item;'
);

fs.writeFileSync(navbarPath, navbarContent, 'utf8');
console.log("Updated Navbar.tsx!");

// 3. Update src/app/admin/page.tsx to add dev menu switch
const adminPath = path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx');
let adminContent = fs.readFileSync(adminPath, 'utf8');

if (!adminContent.includes('useNavMenuSettings')) {
  adminContent = adminContent.replace(
    'import { SUPPORTED_LANGUAGES } from "@/hooks/useLanguageSetting";',
    'import { SUPPORTED_LANGUAGES } from "@/hooks/useLanguageSetting";\nimport { useNavMenuSettings } from "@/hooks/useNavMenuSettings";'
  );
}

const adminDevCard = `  const { devFeaturesEnabled, setDevFeaturesEnabled } = useNavMenuSettings();
`;

adminContent = adminContent.replace(
  'export default function AdminDashboardPage() {',
  `export default function AdminDashboardPage() {\n${adminDevCard}`
);

const oldAdminOverviewCards = `{/* Stats Overview Cards */}`;
const newAdminDevSection = `{/* System Settings & In-development Menu Switch */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🛠️</span>
              <h2 className="text-base font-bold text-gray-900">
                Tính Năng & Menu Đang Phát Triển
              </h2>
              <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                devFeaturesEnabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
              }\`}>
                {devFeaturesEnabled ? "Đang bật" : "Đang tắt"}
              </span>
            </div>
            <p className="text-xs text-gray-500 max-w-2xl">
              Khi bật tùy chọn này, người dùng sẽ nhìn thấy các mục menu đang thử nghiệm (như Voice AI Room, Phỏng vấn AI) trong thanh điều hướng và có thể tùy chỉnh bật/tắt trong trang Cài đặt.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDevFeaturesEnabled(!devFeaturesEnabled)}
            className={\`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out \${
              devFeaturesEnabled ? "bg-indigo-600" : "bg-gray-200"
            }\`}
          >
            <span
              className={\`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out \${
                devFeaturesEnabled ? "translate-x-5" : "translate-x-0"
              }\`}
            />
          </button>
        </div>
      </div>

      {/* Stats Overview Cards */}`;

adminContent = adminContent.replace(oldAdminOverviewCards, newAdminDevSection);
fs.writeFileSync(adminPath, adminContent, 'utf8');
console.log("Updated admin/page.tsx with Dev Features Switch!");

// 4. Update src/app/settings/page.tsx
const settingsPath = path.join(__dirname, '..', 'src', 'app', 'settings', 'page.tsx');
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

// 4A. Update CurriculumDisplaySettings to group by level
const oldCurriculumDisplayRegex = /function CurriculumDisplaySettings\(\) \{[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*\}/;

const newCurriculumDisplay = `function CurriculumDisplaySettings() {
  const { settings, saveSettings } = useFlashCardSettings();
  const { activeLanguage } = useLanguageSetting();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");

  useEffect(() => {
    async function loadDefaultBooks() {
      try {
        const repo = getCurriculumRepository();
        const data = await repo.getCurriculums(activeLanguage.code);
        setGroups(data);
      } catch (err) {
        console.error("Failed to load default curriculums for settings:", err);
      }
    }
    loadDefaultBooks();
  }, [activeLanguage.code]);

  const availableLevels = useMemo(() => {
    const list: string[] = [];
    groups.forEach((g) => {
      if (g.level && !list.includes(g.level)) {
        list.push(g.level);
      }
    });
    return list;
  }, [groups]);

  const filteredBooks = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();
    groups.forEach((g) => {
      if (selectedLevel !== "all" && g.level !== selectedLevel) return;
      (g.books || []).forEach((b: any) => {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          list.push({ ...b, level: g.level });
        }
      });
    });
    return list;
  }, [groups, selectedLevel]);

  const toggleCurriculum = (id: string) => {
    const hiddenIds = settings.hiddenCurriculumIds || [];
    const nextHiddenIds = hiddenIds.includes(id)
      ? hiddenIds.filter((x) => x !== id)
      : [...hiddenIds, id];
    
    let nextHideSuperMasterN5 = settings.hideSuperMasterN5;
    if (id === "default-n5-super-master-tango") {
      nextHideSuperMasterN5 = nextHiddenIds.includes(id);
    }

    saveSettings({
      ...settings,
      hideSuperMasterN5: nextHideSuperMasterN5,
      hiddenCurriculumIds: nextHiddenIds,
    });
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span>🙈</span> Quản Lý Hiển Thị Giáo Trình Mẫu
        </h2>
        <p className="text-xs text-gray-500">
          Tùy chỉnh ẩn/hiện các bộ giáo trình mẫu mặc định của {activeLanguage.name} theo từng cấp độ để giao diện gọn gàng hơn.
        </p>
      </div>

      {/* Level Filter Tabs */}
      {availableLevels.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedLevel("all")}
            className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
              selectedLevel === "all"
                ? "bg-indigo-600 text-white shadow-3xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }\`}
          >
            Tất cả cấp độ
          </button>
          {availableLevels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                selectedLevel === lvl
                  ? "bg-indigo-600 text-white shadow-3xs"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }\`}
            >
              Cấp độ {lvl}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {filteredBooks.map((book) => {
          const isHidden =
            (settings.hiddenCurriculumIds || []).includes(book.id) ||
            (book.id === "default-n5-super-master-tango" && settings.hideSuperMasterN5);

          return (
            <div
              key={book.id}
              className="bg-gray-50 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 border border-gray-100"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900">Ẩn giáo trình "{book.name}"</span>
                  {book.level && (
                    <span className="px-2 py-0.2 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      {book.level}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {book.description || \`Tạm thời ẩn bộ giáo trình \${book.name} khỏi trang học tập.\`}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleCurriculum(book.id)}
                className={\`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out \${
                  isHidden ? "bg-indigo-600" : "bg-gray-200"
                }\`}
              >
                <span
                  className={\`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out \${
                    isHidden ? "translate-x-5" : "translate-x-0"
                  }\`}
                />
              </button>
            </div>
          );
        })}
        {filteredBooks.length === 0 && (
          <p className="text-xs text-gray-400 italic py-4 text-center">Không có giáo trình mẫu nào cho cấp độ này.</p>
        )}
      </div>
    </div>
  );
}`;

settingsContent = settingsContent.replace(oldCurriculumDisplayRegex, newCurriculumDisplay);

// 4B. Update NavMenuSettingsPanel to display Dev Menu Items
const oldNavMenuSettingsPanelRegex = /function NavMenuSettingsPanel\(\) \{[\s\S]*?return \([\s\S]*?<\/div>\s*\);\s*\}/;

const newNavMenuSettingsPanel = `function NavMenuSettingsPanel() {
  const { activeLanguage, supportedLanguages } = useLanguageSetting();
  const { isVisible, toggleItem, resetLang, devFeaturesEnabled } = useNavMenuSettings();
  const [previewLang, setPreviewLang] = useState<string>(activeLanguage.code);

  const langItems = getNavItemsForLanguage(previewLang);
  const hiddenCount = langItems.filter((item) => !ALWAYS_VISIBLE.has(item.href) && !isVisible(previewLang, item.href)).length;

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📋</span> Tùy Chỉnh Hiển Thị Menu
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bật/tắt các mục menu trên thanh điều hướng cho {activeLanguage.name}.
          </p>
        </div>
        {hiddenCount > 0 && (
          <button
            onClick={() => resetLang(previewLang)}
            className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            Hiện lại tất cả
          </button>
        )}
      </div>

      {devFeaturesEnabled && (
        <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
          <span>💡</span>
          <span>Tính năng <strong>Menu Đang Phát Triển</strong> đang được kích hoạt từ Admin. Bạn có thể bật/tắt các menu thử nghiệm bên dưới.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {langItems.map((item) => {
          const isAlways = ALWAYS_VISIBLE.has(item.href);
          const visible = isAlways ? true : isVisible(previewLang, item.href);

          return (
            <div
              key={item.href}
              className={\`p-3.5 rounded-2xl border flex items-center justify-between gap-3 \${
                item.isDevOnly
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-gray-50/70 border-gray-100"
              }\`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">{item.icon}</span>
                <div className="truncate">
                  <span className="text-xs font-bold text-gray-800 block truncate">{item.label}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-mono truncate">{item.href}</span>
                    {item.isDevOnly && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                        Đang phát triển
                      </span>
                    )}
                    {item.isComingSoon && (
                      <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-600 text-[9px] font-bold">
                        Sắp ra mắt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isAlways ? (
                <span className="text-[10px] font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded-lg shrink-0">
                  Cố định
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleItem(previewLang, item.href)}
                  className={\`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out \${
                    visible ? "bg-indigo-600" : "bg-gray-200"
                  }\`}
                >
                  <span
                    className={\`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out \${
                      visible ? "translate-x-5" : "translate-x-0"
                    }\`}
                  />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}`;

settingsContent = settingsContent.replace(oldNavMenuSettingsPanelRegex, newNavMenuSettingsPanel);

// 4C. Remove "Xóa bộ nhớ tạm & Đồng bộ từ Cloud" block
const oldClearCacheAndSyncBlockRegex = /<div className="bg-indigo-50\/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-indigo-100">[\s\S]*?<\/div>\s*<\/div>\s*(?=<div className="bg-rose-50\/70)/;
settingsContent = settingsContent.replace(oldClearCacheAndSyncBlockRegex, '');

// Also remove handleClearLocalAndSync function
const oldClearLocalFnRegex = /  const handleClearLocalAndSync = async \(\) => \{[\s\S]*?  \};\n/m;
settingsContent = settingsContent.replace(oldClearLocalFnRegex, '');

// 4D. Disable clicking on coming_soon languages
const oldLangCardRegex = /<div\s+key=\{lang\.code\}\s+onClick=\{\(\) => selectDraftLanguage\(lang\.code\)\}\s+className=\{`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between \${[\s\S]*?`\}\s*>/;

const newLangCard = `<div
                  key={lang.code}
                  onClick={() => {
                    if (lang.status === "coming_soon") return;
                    selectDraftLanguage(lang.code);
                  }}
                  className={\`p-4 rounded-2xl border transition-all flex flex-col justify-between \${
                    lang.status === "coming_soon"
                      ? "opacity-60 cursor-not-allowed bg-gray-50/80 border-gray-200"
                      : isDraftSelected
                      ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-300 shadow-sm cursor-pointer"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50/50 cursor-pointer"
                  }\`}>`;

settingsContent = settingsContent.replace(oldLangCardRegex, newLangCard);

fs.writeFileSync(settingsPath, settingsContent, 'utf8');
console.log("Updated settings/page.tsx with grouped curriculums, removed cache sync, and disabled coming_soon languages!");
