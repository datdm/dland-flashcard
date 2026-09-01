"use client";

import React from "react";
import { ExamPassageGroup } from "@/types/exam";
import ExamQuestionCard from "./ExamQuestionCard";

interface Props {
  passage: ExamPassageGroup;
  startIndex: number;
  answers: Record<number, number[]>;
  onChange: (qid: number, selected: number[]) => void;
  showResult?: boolean;
  onOpenMazii?: (word: string) => void;
}

export default function ExamPassageCard({
  passage,
  startIndex,
  answers,
  onChange,
  showResult = false,
  onOpenMazii,
}: Props) {
  return (
    <div id={`passage-${passage.id}`} className="mb-8 scroll-mt-24">
      {/* Passage Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-base">📖</span>
        <span className="font-extrabold text-sm text-indigo-900">
          {passage.mondai ? `${passage.mondai} — ` : ""}
          {passage.passageTitle && !passage.passageTitle.startsWith("passage-")
            ? passage.passageTitle
            : `Đoạn văn (Câu ${passage.questions.map((q) => q.id).join(", ")})`}
        </span>
        <span className="text-xs font-semibold text-gray-400">
          ({passage.questions.length} câu hỏi)
        </span>
      </div>

      {/* Split layout: Passage left, Sub-questions right */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Passage Text Box (Sticky on Desktop) */}
        <div className="w-full lg:w-1/2 shrink-0">
          <div className="lg:sticky lg:top-24 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100">
              <span className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>📄</span> Văn bản Đọc hiểu (読解本文)
              </span>
              <span className="text-[10px] sm:text-[11px] text-gray-400 font-medium">Bôi đen chữ để tra từ</span>
            </div>

            <div className="max-h-[45vh] sm:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <p className="whitespace-pre-wrap text-sm sm:text-base leading-loose text-gray-900 font-medium tracking-wide select-text">
                {passage.passageText}
              </p>
            </div>
          </div>
        </div>

        {/* Passage Questions */}
        <div className="w-full lg:w-1/2 flex-1 space-y-3">
          {passage.questions.map((q, idx) => (
            <ExamQuestionCard
              key={q.id}
              question={q}
              index={startIndex + idx}
              selected={answers[q.id] || []}
              onChange={onChange}
              showResult={showResult}
              onOpenMazii={onOpenMazii}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
