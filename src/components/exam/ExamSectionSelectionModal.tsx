"use client";

import React, { useState, useEffect } from "react";
import { StoredExam, ExamMajorSection } from "@/types/exam";
import { getStructuredMajorSections } from "@/lib/examUtils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  exam: StoredExam | null;
  initialSelectedIds?: string[];
  hasDraft?: boolean;
  onConfirm: (selectedSectionIds: string[]) => void;
}

export default function ExamSectionSelectionModal({
  isOpen,
  onClose,
  exam,
  initialSelectedIds,
  hasDraft = false,
  onConfirm,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (exam && isOpen) {
      const sections = getStructuredMajorSections(exam.data);
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(initialSelectedIds);
      } else {
        setSelectedIds(sections.map((s) => s.id));
      }
    }
  }, [exam, isOpen, initialSelectedIds]);

  if (!isOpen || !exam) return null;

  const majorSections = getStructuredMajorSections(exam.data);

  // Calculate questions count per section
  const getSectionQCount = (sec: ExamMajorSection) => {
    const passageMap = new Map<string, any>();
    (exam.data.passages || []).forEach((p) => passageMap.set(p.id, p));

    let count = 0;
    sec.mondais.forEach((m) => {
      count += m.questionIds?.length || 0;
      (m.passageIds || []).forEach((pid) => {
        const pg = passageMap.get(pid);
        if (pg) count += pg.questions?.length || 0;
      });
    });
    return count;
  };

  const sectionCounts = majorSections.map((sec) => ({
    sec,
    qCount: getSectionQCount(sec),
  }));

  const totalQuestionsAll = sectionCounts.reduce((acc, s) => acc + s.qCount, 0);

  const selectedQCount = sectionCounts
    .filter((s) => selectedIds.includes(s.sec.id))
    .reduce((acc, s) => acc + s.qCount, 0);

  // Proportional estimated time limit
  const estimatedTimeMins =
    totalQuestionsAll > 0
      ? Math.round((selectedQCount / totalQuestionsAll) * Math.round(exam.data.meta.timeLimit / 60))
      : 0;

  const toggleSection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAll = () => {
    setSelectedIds(majorSections.map((s) => s.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất 1 phần thi để làm bài.");
      return;
    }
    onConfirm(selectedIds);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
            title="Đóng"
          >
            ✕
          </button>
          
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-200 border border-rose-400/30">
              JLPT {exam.data.meta.level}
            </span>
            {exam.data.meta.year && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">
                📅 {exam.data.meta.year}
              </span>
            )}
          </div>
          
          <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug text-white">
            {exam.data.meta.title}
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            Chọn các phần thi bạn muốn thực hiện trong đợt thi này:
          </p>
        </div>

        {/* Section List Body */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[11px]">
              Danh sách phần thi ({majorSections.length} phần):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Chọn tất cả
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs text-gray-400 hover:text-gray-600 font-medium cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {sectionCounts.map(({ sec, qCount }) => {
              const isChecked = selectedIds.includes(sec.id);
              return (
                <div
                  key={sec.id}
                  onClick={() => toggleSection(sec.id)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                    isChecked
                      ? "bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent onClick
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer shrink-0"
                    />
                    <span className="text-xl shrink-0">{sec.icon}</span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-gray-900 truncate">
                        {sec.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                        {sec.japaneseName}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    <div className="text-xs font-bold text-indigo-600">
                      {qCount} câu
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium">
                      {sec.mondais.length} Mondai
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metrics summary banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 flex items-center justify-between text-xs mt-2 border border-slate-800">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                Phần thi đã chọn
              </div>
              <div className="font-black text-sm text-indigo-200 mt-0.5">
                {selectedIds.length}/{majorSections.length} phần ({selectedQCount} câu hỏi)
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase">
                Thời gian dự kiến
              </div>
              <div className="font-black text-sm text-amber-300 mt-0.5">
                ⏱️ ~{estimatedTimeMins} phút
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-98 ${
              selectedIds.length > 0
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span>{hasDraft ? "▶️" : "🚀"}</span>
            <span>{hasDraft ? "Tiếp Tục Làm Bài" : "Vào Làm Bài Thi →"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
