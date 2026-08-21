"use client";

import { useState } from "react";
import { exportDataByScope, importScopedData, ImportResult } from "@/lib/storage";
import * as syncService from "@/lib/syncService";

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
  const [selectedScope, setSelectedScope] = useState<ExportScope>("all");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleExport = async () => {
    // Sync before export if logged in
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

        // Sync after import if logged in
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>💾</span> Sao Lưu & Phục Hồi Dữ Liệu (Backup & Restore)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Xuất hoặc nạp dữ liệu (Sổ tay, Giáo trình, Tiến độ học, Lịch sử luyện tập) linh hoạt theo từng ngôn ngữ hoặc toàn bộ hệ thống.
          </p>
        </div>
      </div>

      {/* Scope Selector Tabs */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
          1. Chọn phạm vi ngôn ngữ muốn sao lưu (Export Scope):
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

      {/* Action Buttons */}
      <div className="pt-2 border-t border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExport}
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
            <span className="text-[10px] text-gray-500 font-bold uppercase pl-1">Chế độ nạp:</span>
            <button
              type="button"
              onClick={() => setImportMode("merge")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                importMode === "merge" ? "bg-indigo-600 text-white shadow-3xs" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Gộp dữ liệu (Khuyên dùng)
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

        {/* Success / Error Feedback Card */}
        {importResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <span>✓</span>
              <span>Nạp thành công dữ liệu [{importResult.scopeName}]!</span>
            </div>
            <div className="text-[11px] text-emerald-700">
              Đã khôi phục: <strong>{importResult.notebookCount}</strong> sổ tay, <strong>{importResult.vocabCount}</strong> từ vựng và <strong>{importResult.practiceCount}</strong> lượt luyện tập. Hãy tải lại trang để áp dụng toàn diện.
            </div>
          </div>
        )}

        {importError && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            ⚠️ {importError}
          </div>
        )}
      </div>

      <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
        <p className="font-bold text-gray-600 mb-1">💡 Hướng dẫn & Lưu ý:</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-500">
          <li><strong>Gộp dữ liệu (Smart Merge)</strong>: Tự động cộng gộp sổ tay và lịch sử của ngôn ngữ được nạp mà không xóa mất dữ liệu các ngôn ngữ khác.</li>
          <li><strong>Ghi đè (Replace)</strong>: Thay thế toàn bộ dữ liệu trên máy bằng dữ liệu trong file backup.</li>
          <li>Nên xuất file backup định kỳ để bảo vệ dữ liệu học tập cá nhân.</li>
        </ul>
      </div>
    </div>
  );
}
