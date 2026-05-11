"use client";

import { useState } from "react";
import { use } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useProgress } from "@/hooks/useProgress";
import LessonListItem from "@/components/LessonListItem";
import Link from "next/link";

export default function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getCurriculumById, addLesson, updateLesson, deleteLesson } = useCurriculums();
  const { progress } = useProgress();
  const curriculum = getCurriculumById(id);

  const [showAddModal, setShowAddModal] = useState(false);
  const [lessonName, setLessonName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  if (!curriculum) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 p-4">
        <p className="text-gray-500">Không tìm thấy giáo trình.</p>
        <Link href="/curriculums" className="text-indigo-600 underline text-sm">
          ← Giáo trình
        </Link>
      </div>
    );
  }

  const handleAddLesson = () => {
    if (!lessonName.trim()) return;
    addLesson(id, lessonName);
    setLessonName("");
    setShowAddModal(false);
  };

  const handleSaveEdit = () => {
    if (!editName.trim() || !editingId) return;
    updateLesson(id, editingId, editName);
    setEditingId(null);
    setEditName("");
  };

  const startEdit = (lessonId: string, name: string) => {
    setEditingId(lessonId);
    setEditName(name);
  };

  const filteredLessons = curriculum.lessons.filter((l) => {
    if (!searchQuery.trim()) return true;
    return l.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/curriculums" className="text-sm text-indigo-600 hover:underline">
          ← Giáo trình
        </Link>
        {curriculum.lessons.length > 0 && (
          <Link
            href={`/flashcard/curriculum/${id}`}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Flashcard →
          </Link>
        )}
      </div>
      <h1 className="text-xl font-bold text-gray-800 mb-1">{curriculum.name}</h1>
      <p className="text-xs text-gray-400 mb-4">{curriculum.lessons.length} bài</p>
      <div className="flex items-center justify-between mb-4">
        <div />
        <button
          onClick={() => setShowAddModal(true)}
          className="text-sm bg-indigo-600 text-white rounded-xl px-3 py-1.5 font-semibold hover:bg-indigo-700 transition-colors"
        >
          + Thêm bài
        </button>
      </div>

      {/* Search */}
      {curriculum.lessons.length > 0 && (
        <div className="mb-4 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bài..."
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

      {/* Lessons List */}
      {curriculum.lessons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-gray-400">Chưa có bài nào</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-indigo-600 underline text-sm font-semibold"
          >
            Tạo bài đầu tiên
          </button>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p>Không tìm thấy bài nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson) => (
            <LessonListItem
              key={lesson.id}
              lesson={lesson}
              curriculumId={id}
              progress={progress}
              onEdit={startEdit}
              onDelete={(lessonId, lessonName) => {
                if (confirm(`Xóa bài "${lessonName}"?`)) {
                  deleteLesson(id, lessonId);
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Add Lesson Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 my-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thêm bài mới</h2>
            <input
              type="text"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              placeholder="Tên bài"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-indigo-400"
              onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLessonName("");
                  setShowAddModal(false);
                }}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddLesson}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lesson Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 my-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Chỉnh sửa bài</h2>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Tên bài"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm mb-4 focus:outline-none focus:border-indigo-400"
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
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
