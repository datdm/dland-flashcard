"use client";

import Link from "next/link";
import UploadPanel from "@/components/UploadPanel";
import ExportImportPanel from "@/components/ExportImportPanel";
import BackupHistoryPanel from "@/components/BackupHistoryPanel";

export default function UploadPage() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📤 Upload từ vựng</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
      </div>

      {/* Upload Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <UploadPanel />
      </div>

      {/* Format examples */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Định dạng hỗ trợ</h2>

        <div className="space-y-3">
          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📚 Giáo trình (Curriculum)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">{`{
  "curriculum": "N5 Super Master 語彙",
  "lessons": [
    {
      "name": "Bài 1 - Chào hỏi",
      "vocabulary": [
        {
          "kanji": "日本語",
          "hiragana": "にほんご",
          "onyomi": "ニホンゴ",
          "meaning": "Tiếng Nhật",
          "phonetic": "nihongo"
        }
      ]
    }
  ]
}`}</pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📓 Sổ tay đơn (Single Notebook)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">{`{
  "notebook": {
    "name": "Từ vựng hay nhầm",
    "vocabulary": [
      {
        "kanji": "日本語",
        "hiragana": "にほんご",
        "onyomi": "ニホンゴ",
        "meaning": "Tiếng Nhật",
        "phonetic": "nihongo"
      }
    ]
  }
}`}</pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📚 Nhiều sổ tay (Multiple Notebooks)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">{`{
  "notebooks": [
    {
      "name": "Sổ tay 1",
      "vocabulary": [
        {
          "kanji": "日本語",
          "hiragana": "にほんご",
          "meaning": "Tiếng Nhật"
        }
      ]
    },
    {
      "name": "Sổ tay 2",
      "vocabulary": [
        {
          "kanji": "学生",
          "hiragana": "がくせい",
          "meaning": "Học sinh"
        }
      ]
    }
  ]
}`}</pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📖 Ngữ pháp (Grammar Collection)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">{`{
  "collection": {
    "name": "N5 Ngữ pháp cơ bản",
    "description": "Các điểm ngữ pháp quan trọng N5",
    "grammarPoints": [
      {
        "structure": "～ている",
        "meaning": "Đang làm, vừa làm xong",
        "explanation": "Mô tả hành động đang diễn ra hoặc trạng thái kết quả",
        "mnemonic": "Tư duy: 'ing form' trong tiếng Anh",
        "level": "N5",
        "examples": [
          {
            "sentence": "私は今、本を読んでいます。",
            "romaji": "Watashi wa ima, hon wo yonde imasu.",
            "meaning": "Tôi đang đọc sách lúc này.",
            "breakdown": "読ん (yom - đọc) + でいます (ing form)"
          }
        ],
        "notes": "Có thể diễn tả hành động hoặc trạng thái"
      }
    ]
  }
}`}</pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📚 Nhiều bộ ngữ pháp (Multiple Grammar Collections)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">{`{
  "collections": [
    {
      "name": "N5 Ngữ pháp cơ bản",
      "grammarPoints": [
        {
          "structure": "～です/～ます",
          "meaning": "Hình thức lịch sự",
          "level": "N5",
          "examples": [
            {
              "sentence": "私は学生です。",
              "meaning": "Tôi là học sinh.",
              "breakdown": "です (to be - polite form)"
            }
          ]
        }
      ]
    },
    {
      "name": "N4 Ngữ pháp nâng cao",
      "grammarPoints": [
        {
          "structure": "～のに",
          "meaning": "Mặc dù, bất chập, để làm",
          "level": "N4",
          "examples": []
        }
      ]
    }
  ]
}`}</pre>
          </details>
        </div>
      </div>

      {/* Backup History */}
      <BackupHistoryPanel />

      {/* Export/Import panel */}
      <ExportImportPanel />
    </div>
  );
}
