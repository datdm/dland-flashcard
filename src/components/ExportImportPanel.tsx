"use client";

import { useState } from "react";
import { exportAllData, importAllData } from "@/lib/storage";

interface ExportImportPanelProps {
  onImportSuccess?: () => void;
}

export default function ExportImportPanel({ onImportSuccess }: ExportImportPanelProps) {
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flashcash-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        importAllData(text);
        setImportSuccess(true);
        onImportSuccess?.();
      } catch {
        setImportError("File không hợp lệ. Vui lòng chọn đúng file backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="border border-gray-200 rounded-2xl p-5 space-y-4">
      <h2 className="font-bold text-gray-800">Đồng bộ dữ liệu</h2>
      <p className="text-sm text-gray-500">
        Export toàn bộ dữ liệu (sổ tay, giáo trình, tiến độ, cài đặt) ra file JSON để chuyển sang thiết bị/trình duyệt khác, sau đó Import lại.
      </p>

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          ↓ Export toàn bộ
        </button>

        <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-medium cursor-pointer hover:border-indigo-400 hover:text-indigo-600 transition-colors">
          ↑ Import backup
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleImportFile}
          />
        </label>
      </div>

      {importSuccess && (
        <p className="text-sm text-emerald-600 font-medium">
          ✓ Import thành công! Tải lại trang để xem dữ liệu.
        </p>
      )}
      {importError && <p className="text-sm text-red-500">{importError}</p>}
      
      <div className="text-xs text-gray-400 border-t border-gray-100 pt-3 mt-3">
        <p className="font-medium text-gray-600 mb-1">⚠️ Chú ý:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>File backup bao gồm: Sổ tay, Giáo trình, Tiến độ học, Cài đặt</li>
          <li>Import sẽ ghi đè dữ liệu hiện tại</li>
          <li>Nên export đều đặn để backup dữ liệu</li>
        </ul>
      </div>
    </div>
  );
}
