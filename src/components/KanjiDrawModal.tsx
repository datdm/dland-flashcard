"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface KanjiDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKanji: (kanji: string, shouldAppend?: boolean) => void;
}

interface Stroke {
  x: number[];
  y: number[];
}

export default function KanjiDrawModal({ isOpen, onClose, onSelectKanji }: KanjiDrawModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const currentStrokeRef = useRef<{ x: number[]; y: number[] }>({ x: [], y: [] });
  const [candidates, setCandidates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const canvasSize = 280;

  // Draw grid background and existing strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background fill
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw grid guide lines (dashed lines in center)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, canvasSize / 2);
    ctx.lineTo(canvasSize, canvasSize / 2);
    ctx.stroke();

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(canvasSize / 2, 0);
    ctx.lineTo(canvasSize / 2, canvasSize);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // Draw strokes
    ctx.strokeStyle = "#1e1b4b"; // Dark indigo stroke
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    strokes.forEach((stroke) => {
      if (stroke.x.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.x[0], stroke.y[0]);
      for (let i = 1; i < stroke.x.length; i++) {
        ctx.lineTo(stroke.x[i], stroke.y[i]);
      }
      ctx.stroke();
    });
  }, [strokes]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(redrawCanvas, 50);
    } else {
      setStrokes([]);
      setCandidates([]);
    }
  }, [isOpen, redrawCanvas]);

  useEffect(() => {
    redrawCanvas();
  }, [strokes, redrawCanvas]);

  // Request candidates from handwriting API
  const recognizeStrokes = useCallback(async (currentStrokes: Stroke[]) => {
    if (currentStrokes.length === 0) {
      setCandidates([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/handwriting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strokes: currentStrokes,
          width: canvasSize,
          height: canvasSize,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (e) {
      console.error("Failed to recognize Kanji:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const coords = getCanvasCoords(e);
    currentStrokeRef.current = { x: [coords.x], y: [coords.y] };

    // Draw initial point
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e1b4b";
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    currentStrokeRef.current.x.push(coords.x);
    currentStrokeRef.current.y.push(coords.y);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1e1b4b";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        const len = currentStrokeRef.current.x.length;
        if (len > 1) {
          ctx.beginPath();
          ctx.moveTo(currentStrokeRef.current.x[len - 2], currentStrokeRef.current.y[len - 2]);
          ctx.lineTo(coords.x, coords.y);
          ctx.stroke();
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    setIsDrawing(false);
    const newStroke = { ...currentStrokeRef.current };
    if (newStroke.x.length > 0) {
      const nextStrokes = [...strokes, newStroke];
      setStrokes(nextStrokes);
      recognizeStrokes(nextStrokes);
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = strokes.slice(0, -1);
    setStrokes(nextStrokes);
    recognizeStrokes(nextStrokes);
  };

  const handleClear = () => {
    setStrokes([]);
    setCandidates([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖌️</span>
            <div>
              <h3 className="font-extrabold text-sm">Vẽ Tra Kanji</h3>
              <p className="text-[10px] text-indigo-100">Nhận diện nét vẽ tay chữ Hán</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 flex flex-col items-center">
          {/* Canvas Box */}
          <div className="relative border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50 touch-none">
            <canvas
              ref={canvasRef}
              width={canvasSize}
              height={canvasSize}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="cursor-crosshair block"
            />
            {strokes.length === 0 && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs font-semibold text-gray-300">
                Vẽ chữ Hán vào đây...
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between w-full max-w-[280px] gap-2">
            <button
              type="button"
              disabled={strokes.length === 0}
              onClick={handleUndo}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>↩️</span>
              <span>Lùi 1 nét</span>
            </button>
            <button
              type="button"
              disabled={strokes.length === 0}
              onClick={handleClear}
              className="flex-1 py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 disabled:opacity-40 text-rose-700 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              <span>🧹</span>
              <span>Xóa bảng</span>
            </button>
          </div>

          {/* Recognition Candidate Grid */}
          <div className="w-full max-w-[280px] space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 px-1">
              <span>Gợi ý Kanji nhận diện được:</span>
              {loading && <span className="text-indigo-600 animate-pulse">Đang nhận diện...</span>}
            </div>

            {candidates.length > 0 ? (
              <div className="grid grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                {candidates.slice(0, 10).map((char, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectKanji(char, false);
                      onClose();
                    }}
                    className="p-2 bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200/80 rounded-xl text-lg font-black text-gray-900 transition-all cursor-pointer shadow-3xs hover:scale-105 active:scale-95 flex items-center justify-center"
                    title={`Chọn "${char}" để tra cứu`}
                  >
                    {char}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                {strokes.length > 0 ? "Không tìm thấy Kanji tương ứng" : "Vẽ trên ô để xem từ gợi ý"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
