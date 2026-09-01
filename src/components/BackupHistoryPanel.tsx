"use client";

import { useState, useEffect } from "react";
import * as syncService from "@/lib/syncService";
import type { BackupHistoryItem } from "@/lib/syncService";
import { useAuth } from "@/context/AuthContext";

export default function BackupHistoryPanel() {
  const { user } = useAuth();
  const [backups, setBackups] = useState<BackupHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  if (!user?.isAdmin) {
    return null;
  }

  const loadBackups = async () => {
    if (!syncService.checkAuthStatus()) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const history = await syncService.getBackupHistory();
      setBackups(history);
    } catch (err) {
      console.error("Failed to load backup history:", err);
      setError("Không thể tải lịch sử backup");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    setError(null);
    try {
      const res = await syncService.createManualBackup();
      if (res.success) {
        alert("✅ Đã tạo bản sao lưu snapshot thành công lên máy chủ!");
        await loadBackups();
      } else {
        setError(res.error || "Không thể tạo bản sao lưu.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối khi tạo bản sao lưu.");
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm("Bạn có chắc muốn khôi phục dữ liệu từ backup này? Dữ liệu hiện tại sẽ bị ghi đè.")) {
      return;
    }

    setRestoring(backupId);
    try {
      await syncService.restoreFromBackup(backupId);
      alert("✅ Đã khôi phục dữ liệu thành công! Trang sẽ tự động tải lại.");
      window.location.reload();
    } catch (err) {
      console.error("Failed to restore backup:", err);
      alert("❌ Lỗi khi khôi phục backup");
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm("Bạn có chắc muốn xóa backup này?")) {
      return;
    }

    try {
      await syncService.deleteBackup(backupId);
      await loadBackups(); // Reload list
    } catch (err) {
      console.error("Failed to delete backup:", err);
      alert("❌ Lỗi khi xóa backup");
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("⚠️ Bạn có chắc muốn xóa TẤT CẢ backup? Hành động này không thể hoàn tác!")) {
      return;
    }

    setDeletingAll(true);
    try {
      const result = await syncService.deleteAllBackups();
      if (result.success) {
        alert(`✅ Đã xóa ${result.deletedCount} backup`);
        await loadBackups(); // Reload list
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (err) {
      console.error("Failed to delete all backups:", err);
      alert("❌ Lỗi khi xóa tất cả backup");
    } finally {
      setDeletingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!syncService.checkAuthStatus()) {
    return null; // Don't show if not logged in
  }

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📦</span> Lịch Sử Bản Sao Lưu Cloud (Snapshots)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Dữ liệu cũ tự động sao lưu mỗi khi đồng bộ, hoặc bạn có thể tạo bản snapshot lưu trữ bất kỳ lúc nào.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Create Backup Button */}
          <button
            onClick={handleCreateBackup}
            disabled={loading || isCreatingBackup}
            className="text-xs px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isCreatingBackup ? "⏳" : "💾"}</span>
            <span>{isCreatingBackup ? "Đang sao lưu..." : "Sao lưu ngay"}</span>
          </button>

          <button
            onClick={loadBackups}
            disabled={loading || isCreatingBackup}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "⏳ Đang tải..." : "🔄 Tải lại"}
          </button>

          {backups.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={loading || deletingAll || isCreatingBackup}
              className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
            >
              {deletingAll ? "⏳" : "🗑️ Xóa tất cả"}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Mỗi lần đồng bộ lên server, dữ liệu cũ sẽ được backup tự động. Bạn có thể khôi phục từ các backup này.
      </p>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
          {error}
        </div>
      )}

      {loading && backups.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          Đang tải lịch sử backup...
        </div>
      )}

      {!loading && backups.length === 0 && !error && (
        <div className="text-sm text-gray-500 text-center py-4">
          Chưa có backup nào. Backup sẽ được tạo tự động khi bạn đồng bộ dữ liệu.
        </div>
      )}

      {backups.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="border border-gray-200 rounded-xl p-3 hover:border-indigo-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatDate(backup.created_at)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                      {backup.backup_type === "auto" ? "Tự động" : "Thủ công"}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>Kích thước: {backup.data_size}</div>
                    {backup.data_keys && backup.data_keys.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {backup.data_keys.map((key, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs"
                          >
                            {key.replace("flashcash-", "")}
                          </span>
                        ))}
                      </div>
                    )}
                    {backup.note && (
                      <div className="text-gray-400 italic mt-1">{backup.note}</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleRestore(backup.id)}
                    disabled={restoring === backup.id}
                    className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {restoring === backup.id ? "⏳" : "↩️ Khôi phục"}
                  </button>
                  <button
                    onClick={() => handleDelete(backup.id)}
                    disabled={restoring === backup.id}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    🗑️ Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">
        <p className="font-medium text-gray-600 mb-1">ℹ️ Lưu ý:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Backup được tạo tự động trước mỗi lần đồng bộ lên server</li>
          <li>Khôi phục sẽ ghi đè toàn bộ dữ liệu hiện tại trên server</li>
          <li>Chỉ hiển thị 50 backup gần nhất</li>
        </ul>
      </div>
    </div>
  );
}
