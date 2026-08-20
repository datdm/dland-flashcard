"use client";

import { useEffect, useState, useRef } from "react";

interface SelectionLookupTooltipProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  onLookup: (word: string, furigana?: string, meaning?: string) => void;
}

export default function SelectionLookupTooltip({
  containerRef,
  onLookup,
}: SelectionLookupTooltipProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    text: string;
    furigana?: string;
    meaning?: string;
    x: number;
    y: number;
  }>({
    visible: false,
    text: "",
    x: 0,
    y: 0,
  });

  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If clicking inside the tooltip itself, don't close it immediately
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const selectedText = selection.toString().trim();
      if (!selectedText || selectedText.length > 30) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Check if selection is within target container (if containerRef is provided)
      if (containerRef && containerRef.current) {
        const anchorNode = selection.anchorNode;
        if (anchorNode && !containerRef.current.contains(anchorNode)) {
          setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
          return;
        }
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (rect && (rect.width > 0 || rect.height > 0)) {
          // Calculate tooltip position (centered above selection)
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;
          
          setTooltip({
            visible: true,
            text: selectedText,
            x: rect.left + scrollX + rect.width / 2,
            y: Math.max(10, rect.top + scrollY - 10),
          });
        }
      } catch (err) {
        console.error("Error calculating selection rect:", err);
      }
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef]);

  if (!tooltip.visible || !tooltip.text) return null;

  return (
    <div
      ref={tooltipRef}
      style={{
        position: "absolute",
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: "translate(-50%, -100%)",
        zIndex: 9999,
      }}
      className="animate-in fade-in zoom-in-90 duration-150 pointer-events-auto select-none"
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const word = tooltip.text;
          setTooltip((prev) => ({ ...prev, visible: false }));
          // Clear selection
          window.getSelection()?.removeAllRanges();
          onLookup(word, tooltip.furigana, tooltip.meaning);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-full text-xs font-extrabold shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40 backdrop-blur-md"
      >
        <span className="text-sm">🔍</span>
        <span>Tra Mazii: <span className="underline decoration-amber-200">{tooltip.text}</span></span>
        <span className="text-[10px] text-amber-200 font-bold ml-0.5">↗</span>
      </button>

      {/* Little arrow indicator */}
      <div 
        className="w-2 h-2 bg-amber-700 rotate-45 mx-auto -mt-1 border-r border-b border-amber-400/40"
      />
    </div>
  );
}
