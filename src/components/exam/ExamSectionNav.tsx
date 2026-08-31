"use client";

import React, { useState } from "react";
import { ExamData, ExamMajorSection, ExamPassageGroup } from "@/types/exam";
import { getStructuredMajorSections } from "@/lib/examUtils";

interface Props {
  examData?: ExamData;
  answers: Record<number, number[]>;
  currentQuestionId: number | null;
  onNavigate: (qid: number) => void;
  onNavigatePassage?: (pid: string) => void;
  onNavigateMondai?: (mondaiId: string) => void;
  resultsMap?: Record<number, boolean>; // for review mode
}

export default function ExamSectionNav({
  examData,
  answers,
  currentQuestionId,
  onNavigate,
  onNavigatePassage,
  onNavigateMondai,
  resultsMap,
}: Props) {
  if (!examData) return null;

  const majorSections: ExamMajorSection[] = getStructuredMajorSections(examData);
  const passages: ExamPassageGroup[] = examData.passages || [];

  return (
    <div className="space-y-4">
      {majorSections.map((major) => {
        // Calculate progress for this major section
        let totalMajorQ = 0;
        let answeredMajorQ = 0;
        let correctMajorQ = 0;

        major.mondais.forEach((m) => {
          (m.questionIds || []).forEach((qid) => {
            totalMajorQ++;
            if (answers[qid]?.length > 0) answeredMajorQ++;
            if (resultsMap?.[qid]) correctMajorQ++;
          });
          (m.passageIds || []).forEach((pid) => {
            const pg = passages.find((p) => p.id === pid);
            if (pg) {
              pg.questions.forEach((q) => {
                totalMajorQ++;
                if (answers[q.id]?.length > 0) answeredMajorQ++;
                if (resultsMap?.[q.id]) correctMajorQ++;
              });
            }
          });
        });

        return (
          <div
            key={major.id}
            className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs space-y-3"
          >
            {/* Major Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                <span>{major.icon}</span>
                <span>{major.name}</span>
              </span>
              <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/60">
                {resultsMap !== undefined
                  ? `${correctMajorQ}/${totalMajorQ} Đúng`
                  : `${answeredMajorQ}/${totalMajorQ}`}
              </span>
            </div>

            {/* Mondai Sub-sections */}
            <div className="space-y-3">
              {major.mondais.map((mondai, mIdx) => (
                <div
                  key={mIdx}
                  className="bg-gray-50/70 rounded-xl p-2.5 border border-gray-100/80 space-y-2"
                >
                  {/* Mondai Title Button */}
                  <button
                    type="button"
                    onClick={() => onNavigateMondai?.(mondai.id)}
                    className="w-full flex items-center justify-between text-left cursor-pointer group"
                  >
                    <span className="text-[11px] font-bold text-gray-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      <span className="text-indigo-600 font-extrabold">▸</span>
                      <span>{mondai.title}</span>
                    </span>
                  </button>

                  {/* Standalone questions in this Mondai */}
                  {(mondai.questionIds || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {mondai.questionIds.map((qid) => {
                        const isAnswered = answers[qid]?.length > 0;
                        const isCurrent = currentQuestionId === qid;
                        const isReview = resultsMap !== undefined;
                        const isCorrect = resultsMap?.[qid];

                        let badgeColor =
                          "bg-white border-gray-200 text-gray-700 hover:border-indigo-300";

                        if (isReview) {
                          if (isCorrect) {
                            badgeColor =
                              "bg-emerald-500 border-emerald-600 text-white font-bold";
                          } else if (isAnswered) {
                            badgeColor =
                              "bg-rose-500 border-rose-600 text-white font-bold";
                          } else {
                            badgeColor = "bg-gray-200 border-gray-300 text-gray-500";
                          }
                        } else if (isCurrent) {
                          badgeColor =
                            "bg-amber-500 border-amber-600 text-white font-bold ring-2 ring-amber-200";
                        } else if (isAnswered) {
                          badgeColor =
                            "bg-indigo-600 border-indigo-700 text-white font-bold";
                        }

                        return (
                          <button
                            key={qid}
                            type="button"
                            onClick={() => onNavigate(qid)}
                            className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer shadow-3xs active:scale-95 ${badgeColor}`}
                          >
                            {qid}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Passages in this Mondai */}
                  {(mondai.passageIds || []).map((pid) => {
                    const pg = passages.find((p) => p.id === pid);
                    if (!pg) return null;

                    return (
                      <div key={pid} className="space-y-1 pt-1 border-t border-gray-200/50">
                        <button
                          type="button"
                          onClick={() => onNavigatePassage?.(pid)}
                          className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer text-left"
                        >
                          <span>📖</span>
                          <span className="line-clamp-1">
                            {pg.passageTitle && !pg.passageTitle.startsWith("passage-")
                              ? pg.passageTitle
                              : `Đoạn văn (Câu ${pg.questions.map((q) => q.id).join(", ")})`}
                          </span>
                        </button>

                        <div className="flex flex-wrap gap-1.5 pl-1.5">
                          {pg.questions.map((q) => {
                            const isAnswered = answers[q.id]?.length > 0;
                            const isCurrent = currentQuestionId === q.id;
                            const isReview = resultsMap !== undefined;
                            const isCorrect = resultsMap?.[q.id];

                            let badgeColor =
                              "bg-white border-gray-200 text-gray-700 hover:border-indigo-300";

                            if (isReview) {
                              if (isCorrect) {
                                badgeColor =
                                  "bg-emerald-500 border-emerald-600 text-white font-bold";
                              } else if (isAnswered) {
                                badgeColor =
                                  "bg-rose-500 border-rose-600 text-white font-bold";
                              } else {
                                badgeColor =
                                  "bg-gray-200 border-gray-300 text-gray-500";
                              }
                            } else if (isCurrent) {
                              badgeColor =
                                "bg-amber-500 border-amber-600 text-white font-bold ring-2 ring-amber-200";
                            } else if (isAnswered) {
                              badgeColor =
                                "bg-indigo-600 border-indigo-700 text-white font-bold";
                            }

                            return (
                              <button
                                key={q.id}
                                type="button"
                                onClick={() => onNavigate(q.id)}
                                className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer shadow-3xs active:scale-95 ${badgeColor}`}
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
          </div>
        );
      })}
    </div>
  );
}
