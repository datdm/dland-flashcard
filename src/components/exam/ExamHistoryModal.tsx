"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ExamResult, StoredExam } from "@/types/exam";
import { deleteExamResult } from "@/lib/examStorage";

interface ExamHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam?: StoredExam | null;
  results: ExamResult[];
  onRetakeExam?: (examId: string) => void;
}

export default function ExamHistoryModal({
  isOpen,
  onClose,
  exam,
  results,
  onRetakeExam,
}: ExamHistoryModalProps) {
  const [filterLevel, setFilterLevel] = useState<string>("all");

  if (!isOpen) return null;

  // Filter results by specific exam if provided, otherwise show all
  const filteredResults = results
    .filter((r) => {
      if (exam) return r.examId === exam.id;
      if (filterLevel !== "all") return r.level?.toUpperCase() === filterLevel.toUpperCase();
      return true;
    })
    .sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime());

  const totalAttempts = filteredResults.length;
  const passedCount = filteredResults.filter((r) => r.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;
  const highestScore = filteredResults.reduce(
    (max, r) => Math.max(max, r.scorePercentage),
    0
  );

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins > 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleDelete = (e: React.MouseEvent, resultId: string) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa lượt làm bài thi này khỏi lịch sử không?")) {
      deleteExamResult(resultId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📜</span>
              <h2 className="text-base sm:text-lg font-black text-gray-900">
                {exam ? `Lịch Sử Thi: ${exam.data.meta.title}` : "Tất Cả Lịch Sử Thi JLPT"}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {exam
                ? `Xem lại tất cả ${totalAttempts} lần bạn đã thi đề này.`
                : `Tổng hợp tất cả ${totalAttempts} lượt làm bài thi trên hệ thống.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="p-3.5 bg-gray-50 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-3xs">
            <span className="text-gray-400 font-bold block text-[10px] uppercase">Tổng lượt thi</span>
            <span className="text-sm font-black text-gray-900">{totalAttempts} lần</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-3xs">
            <span className="text-gray-400 font-bold block text-[10px] uppercase">Kết quả Đạt</span>
            <span className="text-sm font-black text-emerald-600">
              {passedCount}/{totalAttempts} ({passRate}%)
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-3xs">
            <span className="text-gray-400 font-bold block text-[10px] uppercase">Điểm cao nhất</span>
            <span className="text-sm font-black text-amber-600">{highestScore}%</span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-gray-200/80 shadow-3xs flex items-center justify-center">
            {exam && onRetakeExam ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRetakeExam(exam.id);
                }}
                className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-extrabold text-xs shadow-xs transition-all active:scale-95"
              >
                ✍️ Thi lại ngay
              </button>
            ) : (
              <span className="text-gray-500 font-semibold text-[11px]">Đã cập nhật tự động</span>
            )}
          </div>
        </div>

        {/* Global Filter Tabs if showing all exams */}
        {!exam && (
          <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-gray-500 shrink-0 mr-1">Cấp độ:</span>
            {["all", "N1", "N2", "N3", "N4", "N5"].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setFilterLevel(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  filterLevel === lvl
                    ? "bg-indigo-600 text-white shadow-3xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {lvl === "all" ? "Tất cả" : lvl}
              </button>
            ))}
          </div>
        )}

        {/* Attempt History Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-3xl block mb-2">📋</span>
              <p className="text-xs font-bold text-gray-600">Chưa có dữ liệu lịch sử thi nào.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Hãy tham gia thi thử để lưu kết quả bài làm của bạn!
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const attemptNumber = filteredResults.length - idx;
              const dateStr = new Date(item.finishedAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
              const timeStr = new Date(item.finishedAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/80 shadow-2xs hover:border-indigo-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black text-xs shadow-3xs ${
                        item.passed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-rose-100 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <span>#{attemptNumber}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs text-gray-900">
                          Lần thi #{attemptNumber} — {item.examTitle}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            item.passed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.passed ? "✓ ĐẠT" : "✕ CHƯA ĐẠT"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium flex-wrap">
                        <span>📅 {dateStr} lúc {timeStr}</span>
                        <span>•</span>
                        <span>⏱️ {formatTime(item.timeTaken)}</span>
                        <span>•</span>
                        <span>
                          🎯 {item.correctCount}/{item.totalQuestions} câu ({item.scorePercentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      href={`/exam/result/${item.id}`}
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>👁️ Xem chi tiết</span>
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id)}
                      className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs"
                      title="Xóa lượt thi này"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
