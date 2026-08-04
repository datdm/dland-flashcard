"use client";

import { useState, useEffect } from "react";
import { KanjiItem } from "@/lib/repositories/types";

interface Props {
  kanji: KanjiItem;
}

export default function KanjiStrokeViewer({ kanji }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "strokes">("info");
  const [svgStrokes, setSvgStrokes] = useState<string[]>(kanji.svgStrokes || []);
  const [fetchingStrokes, setFetchingStrokes] = useState(false);

  useEffect(() => {
    if (kanji.svgStrokes && kanji.svgStrokes.length > 0) {
      setSvgStrokes(kanji.svgStrokes);
      return;
    }

    let active = true;
    async function fetchStrokes() {
      setFetchingStrokes(true);
      try {
        const char = kanji.kanji;
        if (!char) return;
        const codePoint = char.charCodeAt(0).toString(16).padStart(5, '0');
        const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${codePoint}.svg`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Not found");
        const svgText = await res.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const paths = Array.from(doc.getElementsByTagName("path"))
          .filter(p => p.id && p.id.includes("-s"))
          .map(p => p.getAttribute("d") || "")
          .filter(Boolean);

        if (active && paths.length > 0) {
          setSvgStrokes(paths);
        }
      } catch (err) {
        console.error("Failed to load SVG strokes for:", kanji.kanji, err);
      } finally {
        if (active) setFetchingStrokes(false);
      }
    }

    fetchStrokes();
    return () => {
      active = false;
    };
  }, [kanji.kanji, kanji.svgStrokes]);

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md">
            {kanji.kanji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">{kanji.hanViet}</span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700">
                {kanji.level}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{kanji.meaning}</p>
            <p className="text-xs text-gray-400 mt-1">
              Bộ thủ: <span className="font-medium text-gray-700">{kanji.radical}</span> • {kanji.strokeCount} nét
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === "info" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Đọc & Từ ghép
          </button>
          {(svgStrokes.length > 0 || fetchingStrokes) && (
            <button
              onClick={() => setActiveTab("strokes")}
              className={`px-3 py-1 rounded-lg transition-colors ${
                activeTab === "strokes" ? "bg-white text-indigo-700 shadow-xs font-semibold" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {fetchingStrokes ? "Đang tải nét..." : "Nét vẽ SVG"}
            </button>
          )}
        </div>
      </div>

      {activeTab === "info" ? (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <h4 className="font-semibold text-gray-500 mb-1">Âm Đọc (Readings)</h4>
            <div className="space-y-1">
              <p>
                <span className="text-purple-600 font-medium">Âm On (音読み):</span>{" "}
                {kanji.onyomi.length > 0 ? kanji.onyomi.join(", ") : "-"}
              </p>
              <p>
                <span className="text-emerald-600 font-medium">Âm Kun (訓読み):</span>{" "}
                {kanji.kunyomi.length > 0 ? kanji.kunyomi.join(", ") : "-"}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-500 mb-1">Từ ghép (Compounds)</h4>
            {kanji.compounds.length > 0 ? (
              <div className="space-y-1">
                {kanji.compounds.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{c.kanji}</span>
                    <span className="text-indigo-600 font-mono">({c.hiragana})</span>
                    <span className="text-gray-600">: {c.meaning}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Đang cập nhật từ ghép</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="font-semibold text-gray-500 text-xs mb-2">Thứ tự các nét vẽ (Stroke Order)</h4>
          {fetchingStrokes ? (
            <div className="text-xs text-indigo-600 animate-pulse py-2">
              Đang tải nét vẽ động từ KanjiVG...
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {svgStrokes.map((strokeD, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-14 h-14 border border-indigo-200 bg-indigo-50/50 rounded-xl p-1 shadow-2xs"
                  >
                    {/* Grid background */}
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#e5e7eb" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeDasharray="3 3" />
                    {/* Previous strokes */}
                    {svgStrokes.slice(0, idx).map((prev, pIdx) => (
                      <path key={pIdx} d={prev} fill="none" stroke="#9ca3af" strokeWidth="4" strokeLinecap="round" />
                    ))}
                    {/* Active stroke */}
                    <path d={strokeD} fill="none" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                  <span className="text-[10px] text-gray-400 mt-1">Nét {idx + 1}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
