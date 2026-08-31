"use client";

import React, { useState } from "react";
import { ExamData } from "@/types/exam";
import { saveCustomExam } from "@/lib/examStorage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (examId: string) => void;
}

export default function ExamUploadModal({ isOpen, onClose, onSuccess }: Props) {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setJsonText(text);
        setError("");
      } catch (err) {
        setError("Không thể đọc tệp JSON này.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    setError("");
    if (!jsonText.trim()) {
      setError("Vui lòng nhập hoặc tải lên nội dung đề thi dạng JSON.");
      return;
    }

    try {
      setLoading(true);
      const parsed = JSON.parse(jsonText);
      const examData: ExamData = parsed.data ? parsed.data : parsed;

      if (!examData.meta || !examData.questions || !Array.isArray(examData.questions)) {
        throw new Error("Cấu trúc JSON không hợp lệ. Cần có trường 'meta' và 'questions'.");
      }

      const stored = saveCustomExam(examData);
      setLoading(false);
      onSuccess(stored.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Lỗi xử lý file JSON. Vui lòng kiểm tra lại cấu trúc.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          ✕
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl text-indigo-600 shadow-sm">
            📥
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">
            Nhập Đề Thi Mới (JSON)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Tải lên file JSON hoặc dán mã đề thi tương thích với hệ thống Dland Quiz / JLPT.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              1. Tải lên tệp JSON từ máy tính
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-gray-200 rounded-2xl p-1"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              2. Hoặc dán trực tiếp nội dung JSON vào đây
            </label>
            <textarea
              rows={8}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{\n  "meta": {\n    "title": "Đề thi JLPT N2...",\n    "level": "N2",\n    ...\n  },\n  "questions": [...]\n}'
              className="w-full font-mono text-[11px] p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-gray-800"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleImport}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "📥 Thêm đề thi vào thư viện"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
