"use client";

import { useState } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useProgress } from "@/hooks/useProgress";
import CurriculumCard from "@/components/CurriculumCard";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function CurriculumsPage() {
  const { curriculums, addCurriculum, updateCurriculum, deleteCurriculum, exportCurriculum, exportAllCurriculums } = useCurriculums();
  const { progress } = useProgress();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [curriculumName, setCurriculumName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAdd = () => {
    if (!curriculumName.trim()) return;
    addCurriculum(curriculumName);
    setCurriculumName("");
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    updateCurriculum(editingId, editName);
    setEditingId(null);
    setEditName("");
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const filteredCurriculums = curriculums.filter((c) => {
    if (!searchQuery.trim()) return true;
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      {/* Header */}
      <div className="mb-4">
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Trang chủ
        </Link>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Giáo trình</h1>
          <p className="text-xs text-gray-400 mt-0.5">{curriculums.length} giáo trình</p>
        </div>
        <div className="flex gap-2">
          {user?.isAdmin && curriculums.length > 0 && (
            <button
              onClick={() => {
                const json = exportAllCurriculums();
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                const date = new Date().toISOString().split('T')[0];
                a.download = `all-curriculums-${date}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-sm text-emerald-600 border border-emerald-300 rounded-xl px-3 py-1.5 hover:bg-emerald-50 transition-colors"
            >
              Export tất cả
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm bg-indigo-600 text-white rounded-xl px-3 py-1.5 font-semibold hover:bg-indigo-700 transition-colors"
          >
            + Thêm giáo trình
          </button>
        </div>
      </div>

      {/* Search */}
      {curriculums.length > 0 && (
        <div className="mb-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm giáo trình..."
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-indigo-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Curriculum List - 1 column layout */}
      {curriculums.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-gray-400">Chưa có giáo trình nào</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-indigo-600 underline text-sm font-semibold"
          >
            Tạo giáo trình đầu tiên
          </button>
        </div>
      ) : filteredCurriculums.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Không tìm thấy giáo trình nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCurriculums.map((curriculum) => (
            <CurriculumCard key={curriculum.id} curriculum={curriculum} progress={progress} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">Thêm giáo trình</h2>
            <input
              type="text"
              value={curriculumName}
              onChange={(e) => setCurriculumName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Tên giáo trình"
              autoFocus
              className="w-full rounded-xl border border-gray-300 px-4 py-2 mb-4 focus:outline-none focus:border-indigo-400"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="font-bold text-lg mb-4">Sửa tên giáo trình</h2>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              autoFocus
              className="w-full rounded-xl border border-gray-300 px-4 py-2 mb-4 focus:outline-none focus:border-indigo-400"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
