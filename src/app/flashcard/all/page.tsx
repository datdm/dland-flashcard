"use client";

import { useState, useMemo } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import FlashCardViewer from "@/components/FlashCardViewer";
import Link from "next/link";

type SourceFilter = "all" | string; // "all" | curriculum-id | notebook-id

export default function FlashCardAllPage() {
  const { curriculums } = useCurriculums();
  const { notebooks } = useNotebooks();
  const [source, setSource] = useState<SourceFilter>("all");

  // Get all vocabulary based on filter
  const allVocab = useMemo(() => {
    if (source === "all") {
      const curriculumVocab = curriculums.flatMap((c) => c.lessons.flatMap((l) => l.vocabulary || []));
      const notebookVocab = notebooks.flatMap((nb) => nb.vocabulary || []);
      return [...curriculumVocab, ...notebookVocab];
    }
    
    // Check if it's a curriculum ID
    const curriculum = curriculums.find((c) => c.id === source);
    if (curriculum) {
      return curriculum.lessons.flatMap((l) => l.vocabulary || []);
    }
    
    // Otherwise it's a notebook ID
    const notebook = notebooks.find((nb) => nb.id === source);
    if (notebook) {
      return notebook.vocabulary || [];
    }
    
    return [];
  }, [source, curriculums, notebooks]);

  if (curriculums.length === 0 && notebooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 max-w-2xl mx-auto mt-8">
        <div className="text-5xl mb-2">📭</div>
        <p className="text-gray-500 font-medium">Chưa có từ vựng nào. Hãy thêm từ vựng hoặc đổi nguồn học.</p>
        <Link href="/curriculum" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors">
          Đến trang Giáo trình
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold tracking-widest uppercase">
                Flashcard
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ôn Tập Từ Vựng Toàn Diện
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-2">
              Lọc và ôn tập tất cả từ vựng theo giáo trình hoặc từng sổ tay cá nhân của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-2xs mb-8">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🎯</span> Chọn nguồn ôn tập
        </h2>

        <div className="space-y-5">
          {/* All button */}
          <div>
            <button
              onClick={() => setSource("all")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                source === "all"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-indigo-300"
              }`}
            >
              🌟 Tất cả từ vựng
            </button>
          </div>
          
          {/* Curriculum buttons */}
          {curriculums.length > 0 && (
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>📚</span> Giáo trình
              </p>
              <div className="flex flex-wrap gap-2">
                {curriculums.map((c) => {
                  const isSelected = source === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSource(c.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all shadow-xs ${
                        isSelected
                          ? "bg-emerald-600 text-white border-transparent shadow-emerald-200"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-emerald-300"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Notebook buttons */}
          {notebooks.length > 0 && (
            <div>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>📓</span> Sổ tay cá nhân
              </p>
              <div className="flex flex-wrap gap-2">
                {notebooks.map((nb) => {
                  const isSelected = source === nb.id;
                  return (
                    <button
                      key={nb.id}
                      onClick={() => setSource(nb.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all shadow-xs ${
                        isSelected
                          ? "bg-purple-600 text-white border-transparent shadow-purple-200"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-300"
                      }`}
                    >
                      {nb.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Flashcard Viewer Section */}
      <div className="mt-8">
        {allVocab.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-3xl border border-gray-100 shadow-2xs p-8 text-center max-w-xl mx-auto">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Không có từ vựng nào</h3>
            <p className="text-sm text-gray-500">Nguồn được chọn chưa có bất kỳ từ vựng nào.</p>
          </div>
        ) : (
          <FlashCardViewer 
            vocabulary={allVocab} 
            title={
              source === "all" 
                ? "Ôn tập tổng hợp" 
                : curriculums.find(c => c.id === source)?.name || notebooks.find(nb => nb.id === source)?.name || "Ôn tập"
            } 
          />
        )}
      </div>
    </div>
  );
}
