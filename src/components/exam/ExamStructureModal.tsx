"use client";

import React, { useState } from "react";
import { JLPT_STRUCTURES, getJLPTLevelStructure } from "@/data/jlptStructure";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialLevel?: string;
}

export default function ExamStructureModal({
  isOpen,
  onClose,
  initialLevel = "N2",
}: Props) {
  const [activeLevel, setActiveLevel] = useState<string>(
    initialLevel.toUpperCase()
  );

  if (!isOpen) return null;

  const structure = getJLPTLevelStructure(activeLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black">
                CẤU TRÚC ĐỀ THI JLPT CHUẨN QUỐC TẾ
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Phân bổ thời gian, số câu hỏi và mục tiêu kỹ năng chi tiết từng Mondai
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Level Switcher Tabs */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200/80 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Chọn cấp độ:</span>
            {["N1", "N2", "N3", "N4", "N5"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveLevel(lvl)}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  activeLevel === lvl
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                JLPT {lvl}
              </button>
            ))}
          </div>

          <div className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/60">
            ⏱️ Tổng thời gian thi: {structure.totalExamTimeMinutes} phút
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {structure.sections.map((sec, sIdx) => (
            <div
              key={sIdx}
              className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs"
            >
              {/* Exam Section Title Header */}
              <div className="bg-indigo-950 text-white px-4 py-3 flex items-center justify-between">
                <span className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                  <span>🎯</span>
                  <span>{sec.name}</span>
                </span>
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                  Thời gian thi: {sec.timeMinutes} phút
                </span>
              </div>

              {/* Major Sections Table */}
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[680px] text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-emerald-900/90 text-white font-bold uppercase tracking-wider text-[11px]">
                      <th className="p-3 w-32 border-r border-emerald-800 text-center">
                        Mục Lớn
                      </th>
                      <th className="p-3 w-48 border-r border-emerald-800">
                        Tiêu Đề Mondai
                      </th>
                      <th className="p-3 w-16 border-r border-emerald-800 text-center">
                        Số Câu
                      </th>
                      <th className="p-3 border-r border-emerald-800">
                        Mục Tiêu & Kỹ Năng Đánh Giá
                      </th>
                      <th className="p-3 w-28 text-center">
                        Gợi Ý Thời Gian
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                    {sec.majorSections.map((major) =>
                      major.mondais.map((m, mIdx) => (
                        <tr
                          key={m.mondaiNumber}
                          className="hover:bg-indigo-50/40 transition-colors"
                        >
                          {/* Major Section Col (merged) */}
                          {mIdx === 0 && (
                            <td
                              rowSpan={major.mondais.length}
                              className="p-3 text-center align-middle bg-emerald-50/60 border-r border-gray-200 font-black text-emerald-950"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-2xl">{major.icon}</span>
                                <span className="text-xs leading-tight font-extrabold">
                                  {major.name}
                                </span>
                                {major.totalTimeMinutes && (
                                  <span className="text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-bold mt-1">
                                    ~{major.totalTimeMinutes} phút
                                  </span>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Mondai Title */}
                          <td className="p-3 border-r border-gray-200">
                            <div className="font-extrabold text-indigo-950">
                              {m.title}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                              {m.subTitle}
                            </div>
                          </td>

                          {/* Question Count */}
                          <td className="p-3 border-r border-gray-200 text-center font-black text-indigo-600 bg-gray-50/50">
                            {m.questionCount}
                          </td>

                          {/* Target Description */}
                          <td className="p-3 border-r border-gray-200 leading-relaxed text-gray-700">
                            {m.targetDescription}
                          </td>

                          {/* Suggested Time */}
                          <td className="p-3 text-center text-gray-600 font-semibold bg-gray-50/30">
                            {m.suggestedTimeMinutes
                              ? `${m.suggestedTimeMinutes} phút`
                              : major.totalTimeMinutes
                              ? `Trong ~${major.totalTimeMinutes}p`
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Tips and Advice Footer */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
            <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
              <span>💡</span>
              <span>Chiến Thuật Phân Bổ Thời Gian Thi JLPT {activeLevel}:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-amber-900/90 pl-1 leading-relaxed">
              <li>
                <strong>文字・語彙 (Kanji & Từ vựng)</strong>: Làm dứt khoát trong <strong>15 phút</strong>. Mỗi câu không nên dừng quá 30 giây.
              </li>
              <li>
                <strong>文法 (Ngữ pháp)</strong>: Hoàn thành trong <strong>15 phút</strong> để dành trọn vẹn ~70+ phút cho phần Đọc hiểu.
              </li>
              <li>
                <strong>読解 (Đọc hiểu)</strong>: Đọc lướt câu hỏi và từ khóa trước, sau đó đọc văn bản tìm ý. Dành <strong>2 phút cuối</strong> kiểm tra lại toàn bộ phiếu trả lời.
              </li>
              <li>
                <strong>聴解 (Nghe hiểu)</strong>: Tận dụng các khoảng nghỉ trước khi phát bài nghe để gạch chân từ khóa trong các đáp án.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
