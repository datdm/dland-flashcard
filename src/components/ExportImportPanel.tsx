"use client";

import { useState } from "react";
import { exportDataByScope, importScopedData, ImportResult } from "@/lib/storage";
import * as syncService from "@/lib/syncService";
import { useAuth } from "@/context/AuthContext";

interface ExportImportPanelProps {
  onImportSuccess?: () => void;
}

type ExportScope = "all" | "ja" | "en" | "de" | "ko" | "zh";

const SCOPE_OPTIONS: { id: ExportScope; name: string; icon: string; desc: string }[] = [
  { id: "all", name: "Tất cả ngôn ngữ", icon: "🌐", desc: "Toàn bộ sổ tay, giáo trình, tiến độ và lịch sử mọi ngôn ngữ" },
  { id: "ja", name: "Tiếng Nhật (JP)", icon: "🇯🇵", desc: "Sổ tay Nhật, Kaiwa, JLPT N5-N2, Ngữ pháp & Lịch sử JP" },
  { id: "en", name: "Tiếng Anh (EN)", icon: "🇬🇧", desc: "Sổ tay Anh, IELTS 7.0 52 tuần, IPA & Lịch sử EN" },
  { id: "de", name: "Tiếng Đức (DE)", icon: "🇩🇪", desc: "Sổ tay Đức, Giáo trình Goethe A1-A2 & Lịch sử DE" },
  { id: "ko", name: "Tiếng Hàn (KO)", icon: "🇰🇷", desc: "Sổ tay Hàn & Giáo trình TOPIK" },
  { id: "zh", name: "Tiếng Trung (ZH)", icon: "🇨🇳", desc: "Sổ tay Trung & Giáo trình HSK" },
];

export default function ExportImportPanel({ onImportSuccess }: ExportImportPanelProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"scope" | "full_db">("scope");
  const [selectedScope, setSelectedScope] = useState<ExportScope>("all");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullDbMsg, setFullDbMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!user && !syncService.checkAuthStatus()) {
    return null;
  }

  const handleExportScope = async () => {
    if (syncService.checkAuthStatus()) {
      const shouldSync = confirm('Bạn đã đăng nhập. Bạn có muốn đồng bộ dữ liệu lên server trước khi export không?');
      if (shouldSync) {
        try {
          await syncService.uploadToServer();
        } catch (err) {
          console.error('Sync before export failed:', err);
        }
      }
    }

    const data = exportDataByScope(selectedScope);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dland-backup-${selectedScope}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportFullDatabase = async () => {
    setIsProcessing(true);
    setFullDbMsg(null);
    try {
      const res = await syncService.exportFullDatabase();
      if (!res.success || !res.data) {
        setFullDbMsg({ type: "error", text: res.error || "Không thể xuất toàn bộ database" });
        return;
      }

      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dland-FULL-DATABASE-DUMP-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setFullDbMsg({
        type: "success",
        text: `Đã xuất file Full Database Dump thành công (${res.data.metadata?.totalDataKeys || 0} bảng dữ liệu, ${res.data.metadata?.totalBackups || 0} bản snapshot)!`,
      });
    } catch (err: any) {
      setFullDbMsg({ type: "error", text: err?.message || "Lỗi khi xuất toàn bộ database" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFullDatabaseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullDbMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const res = await syncService.importFullDatabase(text, importMode);
        if (!res.success) {
          setFullDbMsg({ type: "error", text: res.error || "File database không hợp lệ" });
          return;
        }

        setFullDbMsg({
          type: "success",
          text: res.message || "Đã phục hồi toàn bộ Database thành công!",
        });
        onImportSuccess?.();
      } catch (err: any) {
        setFullDbMsg({ type: "error", text: err?.message || "Lỗi khi nạp file database" });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleFullSyncNow = async () => {
    if (!syncService.checkAuthStatus()) {
      alert("Vui lòng đăng nhập tài khoản để sử dụng tính năng Đồng bộ Cloud!");
      return;
    }

    setIsProcessing(true);
    setFullDbMsg(null);
    try {
      const upRes = await syncService.uploadToServer();
      if (!upRes.success) {
        throw new Error(upRes.error || "Tải dữ liệu lên máy chủ thất bại");
      }

      const downRes = await syncService.downloadFromServer();
      if (!downRes.success) {
        throw new Error(downRes.error || "Tải dữ liệu từ máy chủ về máy thất bại");
      }

      setFullDbMsg({
        type: "success",
        text: "Đồng bộ 2 chiều toàn bộ Database với Cloud Server thành công 100%!",
      });
      onImportSuccess?.();
    } catch (err: any) {
      setFullDbMsg({ type: "error", text: err?.message || "Lỗi đồng bộ dữ liệu" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMigrateLocalStorage = async () => {
    if (!syncService.checkAuthStatus()) {
      alert("Vui lòng đăng nhập tài khoản để chuyển dữ liệu lên Database!");
      return;
    }

    if (!confirm("Hệ thống sẽ quét toàn bộ dữ liệu đang lưu trên trình duyệt (LocalStorage) và đẩy lên Database máy chủ PostgreSQL. Bạn có muốn tiếp tục?")) {
      return;
    }

    setIsProcessing(true);
    setFullDbMsg(null);
    try {
      const res = await syncService.migrateAllLocalStorageToDatabase();
      if (!res.success) {
        throw new Error(res.error || "Lỗi khi chuyển dữ liệu lên Database");
      }
      setFullDbMsg({
        type: "success",
        text: res.message || `Đã chuyển toàn bộ ${res.totalKeys} nhóm dữ liệu LocalStorage lên Database thành công!`,
      });
      onImportSuccess?.();
    } catch (err: any) {
      setFullDbMsg({ type: "error", text: err?.message || "Lỗi khi chuyển dữ liệu" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const res = importScopedData(text, importMode);
        
        if (!res.success) {
          setImportError(res.error || "File không hợp lệ. Vui lòng chọn đúng file backup JSON.");
          return;
        }

        setImportResult(res);
        onImportSuccess?.();

        if (syncService.checkAuthStatus()) {
          const shouldSync = confirm(`Import thành công dữ liệu [${res.scopeName}]! Bạn có muốn đồng bộ ngay lên server không?`);
          if (shouldSync) {
            try {
              await syncService.uploadToServer();
            } catch (err) {
              console.error('Sync after import failed:', err);
            }
          }
        }
      } catch {
        setImportError("File không hợp lệ. Vui lòng chọn đúng file backup JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const activeOption = SCOPE_OPTIONS.find((o) => o.id === selectedScope) || SCOPE_OPTIONS[0];

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>💾</span> Sao Lưu, Phục Hồi & Đồng Bộ Database
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Quản lý xuất/nạp dữ liệu theo từng ngôn ngữ hoặc sao lưu trọn gói toàn bộ Database.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("scope")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "scope" ? "bg-white text-indigo-900 shadow-3xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            🌐 Theo Ngôn Ngữ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("full_db")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "full_db" ? "bg-indigo-600 text-white shadow-3xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📦 Toàn Bộ Database
          </button>
        </div>
      </div>

      {/* TAB 1: SCOPED EXPORT/IMPORT */}
      {activeTab === "scope" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              1. Chọn phạm vi ngôn ngữ muốn sao lưu:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCOPE_OPTIONS.map((opt) => {
                const isSelected = selectedScope === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedScope(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-300 shadow-3xs"
                        : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
                      <span>{opt.icon}</span>
                      <span>{opt.name}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportScope}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold hover:opacity-95 transition-all shadow-md shadow-indigo-200 cursor-pointer"
                >
                  <span>↓</span>
                  <span>Xuất Dữ Liệu: {activeOption.name}</span>
                </button>

                <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold cursor-pointer hover:border-indigo-500 hover:text-indigo-600 transition-all bg-white shadow-3xs">
                  <span>↑</span>
                  <span>Nạp File Backup (Import)</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="sr-only"
                    onChange={handleImportFile}
                  />
                </label>
              </div>

              {/* Import Mode Toggle */}
              <div className="flex items-center gap-2 text-xs bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 font-bold uppercase pl-1">Chế độ:</span>
                <button
                  type="button"
                  onClick={() => setImportMode("merge")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    importMode === "merge" ? "bg-indigo-600 text-white shadow-3xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Gộp dữ liệu
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode("replace")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    importMode === "replace" ? "bg-amber-600 text-white shadow-3xs" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Ghi đè
                </button>
              </div>
            </div>

            {importResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <span>✓</span>
                    <span>Nạp thành công dữ liệu [{importResult.scopeName}]!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-3xs cursor-pointer"
                  >
                    🔄 Tải lại trang ngay
                  </button>
                </div>
                <div className="text-[11px] text-emerald-800 leading-relaxed">
                  Đã đồng bộ lên trình duyệt: <strong>{importResult.notebookCount}</strong> sổ tay, <strong>{importResult.vocabCount}</strong> từ vựng và <strong>{importResult.practiceCount}</strong> lượt luyện tập.
                </div>
              </div>
            )}

            {importError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                ⚠️ {importError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FULL DATABASE BACKUP & SYNC */}
      {activeTab === "full_db" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed">
            <p className="font-bold mb-1">📦 Tính năng Sao lưu Toàn bộ Database (Full Database Dump):</p>
            <p className="text-indigo-800">
              Xuất hoặc nhập toàn bộ dữ liệu máy chủ PostgreSQL và LocalStorage gồm: toàn bộ sổ tay mọi ngôn ngữ, kho từ vựng, tiến độ lộ trình IELTS / JLPT / Goethe, lịch sử luyện tập, chuỗi streak và lịch sử sao lưu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleMigrateLocalStorage}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-md shadow-blue-200 transition-all cursor-pointer disabled:opacity-50"
                title="Quét và tải toàn bộ mọi dữ liệu trong LocalStorage lên máy chủ PostgreSQL"
              >
                <span>🚀</span>
                <span>Chuyển LocalStorage Lên Database</span>
              </button>

              <button
                type="button"
                onClick={handleExportFullDatabase}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 text-white text-xs font-extrabold shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>📥</span>
                <span>Xuất File Database (.json)</span>
              </button>

              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-extrabold cursor-pointer transition-all shadow-3xs">
                <span>📤</span>
                <span>Nạp Full Database</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={handleImportFullDatabaseFile}
                  disabled={isProcessing}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleFullSyncNow}
              disabled={isProcessing}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-md shadow-emerald-200 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span>🔄</span>
              <span>Đồng Bộ 2 Chiều Cloud</span>
            </button>
          </div>

          {/* Full DB Notification Card */}
          {fullDbMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed animate-in zoom-in-95 flex items-center justify-between gap-3 ${
                fullDbMsg.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{fullDbMsg.type === "success" ? "✓" : "⚠️"}</span>
                <span>{fullDbMsg.text}</span>
              </div>
              {fullDbMsg.type === "success" && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  Tải lại trang
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
        <p className="font-bold text-gray-600 mb-1">💡 Hướng dẫn & Lưu ý:</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-500">
          <li><strong>Gộp dữ liệu (Smart Merge)</strong>: Tự động cộng gộp sổ tay và lịch sử mà không ghi đè mất mát dữ liệu đang có.</li>
          <li><strong>Toàn bộ Database</strong>: Dùng khi chuyển sang máy tính mới hoặc muốn sao lưu toàn diện cả máy chủ và trình duyệt.</li>
        </ul>
      </div>
    </div>
  );
}
