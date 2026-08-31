"use client";

import React from "react";
import { ExamSection, ExamPassageGroup } from "@/types/exam";

interface Props {
  sections: ExamSection[];
  passages?: ExamPassageGroup[];
  answers: Record<number, number[]>;
  currentQuestionId: number | null;
  onNavigate: (qid: number) => void;
  onNavigatePassage?: (pid: string) => void;
  resultsMap?: Record<number, boolean>; // for review mode
}

export default function ExamSectionNav({
  sections,
  passages = [],
  answers,
  currentQuestionId,
  onNavigate,
  onNavigatePassage,
  resultsMap,
}: Props) {
  return (
    <div className="space-y-4">
      {sections.map((section, sIdx) => (
        <div
          key={sIdx}
          className="bg-gray-50/80 rounded-2xl p-3.5 border border-gray-100 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
              <span>📌</span> {section.name}
            </span>
            {section.mondai && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                {section.mondai}
              </span>
            )}
          </div>

          {/* Standalone questions */}
          {(section.questionIds || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {section.questionIds.map((qid) => {
                const isAnswered = answers[qid]?.length > 0;
                const isCurrent = currentQuestionId === qid;
                const isReview = resultsMap !== undefined;
                const isCorrect = resultsMap?.[qid];

                let badgeColor = "bg-white border-gray-200 text-gray-700 hover:border-indigo-300";

                if (isReview) {
                  if (isCorrect) {
                    badgeColor = "bg-emerald-500 border-emerald-600 text-white font-bold";
                  } else if (isAnswered) {
                    badgeColor = "bg-rose-500 border-rose-600 text-white font-bold";
                  } else {
                    badgeColor = "bg-gray-200 border-gray-300 text-gray-500";
                  }
                } else if (isCurrent) {
                  badgeColor = "bg-amber-500 border-amber-600 text-white font-bold ring-2 ring-amber-200";
                } else if (isAnswered) {
                  badgeColor = "bg-indigo-600 border-indigo-700 text-white font-bold";
                }

                return (
                  <button
                    key={qid}
                    type="button"
                    onClick={() => onNavigate(qid)}
                    className={`w-8 h-8 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer shadow-3xs active:scale-95 ${badgeColor}`}
                  >
                    {qid}
                  </button>
                );
              })}
            </div>
          )}

          {/* Passages and sub-questions */}
          {(section.passageIds || []).map((pid) => {
            const pg = passages.find((p) => p.id === pid);
            if (!pg) return null;

            return (
              <div key={pid} className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigatePassage?.(pid)}
                  className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer text-left"
                >
                  <span>📖</span>
                  <span>{pg.passageTitle || pid}</span>
                </button>
                <div className="flex flex-wrap gap-1.5 pl-2">
                  {pg.questions.map((q) => {
                    const isAnswered = answers[q.id]?.length > 0;
                    const isCurrent = currentQuestionId === q.id;
                    const isReview = resultsMap !== undefined;
                    const isCorrect = resultsMap?.[q.id];

                    let badgeColor = "bg-white border-gray-200 text-gray-700 hover:border-indigo-300";

                    if (isReview) {
                      if (isCorrect) {
                        badgeColor = "bg-emerald-500 border-emerald-600 text-white font-bold";
                      } else if (isAnswered) {
                        badgeColor = "bg-rose-500 border-rose-600 text-white font-bold";
                      } else {
                        badgeColor = "bg-gray-200 border-gray-300 text-gray-500";
                      }
                    } else if (isCurrent) {
                      badgeColor = "bg-amber-500 border-amber-600 text-white font-bold ring-2 ring-amber-200";
                    } else if (isAnswered) {
                      badgeColor = "bg-indigo-600 border-indigo-700 text-white font-bold";
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => onNavigate(q.id)}
                        className={`w-8 h-8 rounded-xl border text-xs flex items-center justify-center transition-all cursor-pointer shadow-3xs active:scale-95 ${badgeColor}`}
                      >
                        {q.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
