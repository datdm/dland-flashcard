"use client";

import { useState, useRef, useMemo } from "react";
import { useLessons } from "@/hooks/useLessons";
import { LessonsData, Lesson, Vocabulary, JLPT_LEVELS } from "@/types";
import ExportImportPanel from "@/components/ExportImportPanel";
import Link from "next/link";

interface ParseResult {
  valid: boolean;
  lessons?: Lesson[];
  error?: string;
  warnings?: string[];
}

function parseUploadedJson(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { valid: false, error: "Không thể parse JSON. Kiểm tra lại định dạng file." };
  }

  const data = raw as LessonsData;
  if (!data || !Array.isArray(data.lessons)) {
    return { valid: false, error: 'JSON phải có trường "lessons" là một mảng.' };
  }

  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const lessons: Lesson[] = [];

  for (const lesson of data.lessons) {
    if (!lesson.id || !lesson.name) {
      return { valid: false, error: `Bài học thiếu trường "id" hoặc "name".` };
    }
    if (!Array.isArray(lesson.vocabulary)) {
      return { valid: false, error: `Bài "${lesson.name}" thiếu trường "vocabulary".` };
    }
    const vocab: Vocabulary[] = [];
    for (const v of lesson.vocabulary) {
      if (!v.id) {
        return { valid: false, error: `Từ vựng trong bài "${lesson.name}" thiếu trường "id".` };
      }
      if (seenIds.has(v.id)) {
        warnings.push(`ID trùng lặp: "${v.id}" — dữ liệu cũ sẽ bị ghi đè.`);
      }
      seenIds.add(v.id);
      vocab.push(v as Vocabulary);
    }
    lessons.push({ ...lesson, vocabulary: vocab });
  }

  return { valid: true, lessons, warnings };
}

export default function UploadPage() {
  const { addLessons, deleteLesson, lessons } = useLessons();
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Group existing lessons by level
  const groupedLessons = useMemo(() => {
    const groups: Record<string, Lesson[]> = {};
    for (const lesson of lessons) {
      const key = lesson.level || "Chưa phân cấp";
      if (!groups[key]) groups[key] = [];
      groups[key].push(lesson);
    }
    // Sort: JLPT standard order first, then custom, then ungrouped
    const sortedKeys = [
      ...JLPT_LEVELS.filter((l) => groups[l]),
      ...Object.keys(groups).filter(
        (k) => !(JLPT_LEVELS as readonly string[]).includes(k) && k !== "Chưa phân cấp"
      ).sort(),
      ...(groups["Chưa phân cấp"] ? ["Chưa phân cấp"] : []),
    ];
    return { groups, sortedKeys };
  }, [lessons]);

  const handleParsePaste = () => {
    setSaved(false);
    const result = parseUploadedJson(pasteText);
    setPreview(result);
    if (result.valid) setPendingText(pasteText);
  };

  const processFile = (file: File) => {
    setSaved(false);
    setPreview(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseUploadedJson(text);
      setPreview(result);
      if (result.valid) setPendingText(text);
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleSave = () => {
    if (!preview?.valid || !preview.lessons) return;
    addLessons(preview.lessons);
    setSaved(true);
    setPreview(null);
    setPendingText(null);
  };

  const exampleJson = JSON.stringify(
    {
      lessons: [
        {
          id: "n5-bai-1",
          name: "Bài 1 - Chào hỏi",
          level: "N5",
          description: "Từ vựng cơ bản",
          vocabulary: [
            { id: "n5-001", kanji: "日本語", hiragana: "にほんご", onyomi: "ニホンゴ", meaning: "Tiếng Nhật", phonetic: "nihongo" },
            { id: "n5-002", kanji: "学生", hiragana: "がくせい", onyomi: "ガクセイ", meaning: "Học sinh", phonetic: "gakusei" }
          ]
        }
      ]
    },
    null,
    2
  );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Upload từ vựng</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
      </div>

      {/* Input mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setPasteMode(false); setPreview(null); }}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
            !pasteMode ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"
          }`}
        >
          📁 Chọn file / Kéo thả
        </button>
        <button
          onClick={() => { setPasteMode(true); setPreview(null); }}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
            pasteMode ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"
          }`}
        >
          📋 Dán JSON (mobile)
        </button>
      </div>

      {/* Drop zone */}
      {!pasteMode && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
          }`}
        >
          <input ref={inputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileInput} />
          <p className="text-gray-500">Kéo thả file JSON vào đây hoặc <span className="text-indigo-600 underline">chọn file</span></p>
          <p className="text-xs text-gray-400 mt-1">Chỉ hỗ trợ định dạng JSON</p>
        </div>
      )}

      {/* Paste textarea (mobile-friendly) */}
      {pasteMode && (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={`Dán nội dung JSON vào đây...\n\nVí dụ:\n{\n  "lessons": [{\n    "id": "bai-1",\n    "name": "Bài 1",\n    "level": "N5",\n    "vocabulary": [...]\n  }]\n}`}
            className="w-full h-48 rounded-2xl border border-gray-300 p-4 text-sm font-mono text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
          />
          <button
            onClick={handleParsePaste}
            disabled={!pasteText.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Kiểm tra JSON
          </button>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className={`rounded-2xl border p-4 ${preview.valid ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          {preview.valid ? (
            <>
              <p className="font-semibold text-emerald-700 mb-2">✓ File hợp lệ — {preview.lessons!.length} bài học</p>
              {preview.warnings && preview.warnings.length > 0 && (
                <ul className="text-xs text-amber-600 mb-3 space-y-1">
                  {preview.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
                </ul>
              )}
              <ul className="text-sm text-gray-700 space-y-1 mb-4">
                {preview.lessons!.map((l) => (
                  <li key={l.id}>• <strong>{l.name}</strong> ({l.vocabulary.length} từ)</li>
                ))}
              </ul>
              <button
                onClick={handleSave}
                className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Lưu vào ứng dụng
              </button>
            </>
          ) : (
            <p className="text-red-600 text-sm">✗ {preview.error}</p>
          )}
        </div>
      )}

      {saved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-emerald-700 font-semibold">✓ Đã lưu thành công!</p>
          <Link href="/" className="text-indigo-600 underline text-sm mt-1 inline-block">Xem danh sách bài học →</Link>
        </div>
      )}

      {/* Existing lessons grouped by level */}
      {lessons.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-700 mb-3">Bài học hiện tại</h2>
          <div className="space-y-4">
            {groupedLessons.sortedKeys.map((key) => (
              <div key={key}>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-2">{key}</p>
                <div className="space-y-2">
                  {groupedLessons.groups[key].map((l) => (
                    <div key={l.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                      <span className="text-sm text-gray-700 font-medium">{l.name} <span className="text-gray-400">({l.vocabulary.length} từ)</span></span>
                      <button
                        onClick={() => { if (confirm(`Xoá bài "${l.name}"?`)) deleteLesson(l.id); }}
                        className="text-red-400 hover:text-red-600 text-sm transition-colors min-h-[44px] px-2"
                      >
                        Xoá
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export / Import */}
      <ExportImportPanel onImportSuccess={() => window.location.reload()} />

      {/* Example */}
      <details className="border border-gray-200 rounded-2xl">
        <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-gray-600 hover:text-indigo-600">
          Xem cấu trúc JSON mẫu
        </summary>
        <pre className="p-4 text-xs text-gray-600 bg-gray-50 overflow-x-auto rounded-b-2xl">{exampleJson}</pre>
      </details>
    </div>
  );
}