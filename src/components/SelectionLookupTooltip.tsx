"use client";

import { useEffect, useState, useRef } from "react";

interface SelectionLookupTooltipProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
  onLookup: (word: string, furigana?: string, meaning?: string) => void;
}

export default function SelectionLookupTooltip({
  containerRef,
  disabled = false,
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
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (disabled) {
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }

    const isInsideModal = (node: Node | null): boolean => {
      if (!node) return false;
      let el: HTMLElement | null =
        node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
      while (el) {
        if (
          el.getAttribute("role") === "dialog" ||
          el.getAttribute("data-modal") === "true" ||
          (el.classList && (el.classList.contains("fixed") || el.classList.contains("z-50")))
        ) {
          return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const processSelection = (targetElement?: Node | null) => {
      // If tapping inside the tooltip itself, do nothing
      if (targetElement && tooltipRef.current && tooltipRef.current.contains(targetElement)) {
        return;
      }

      if (disabled) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const anchorNode = selection.anchorNode;
      // Do NOT show tooltip if text was selected inside a modal/dialog or floating container
      if (isInsideModal(anchorNode) || isInsideModal(targetElement || null)) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const selectedText = selection.toString().trim();
      // Only trigger for meaningful Japanese/word selections (1-30 chars, no linebreaks)
      if (!selectedText || selectedText.length > 30 || selectedText.includes("\n")) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      // Check if selection is within target container (if containerRef is provided)
      if (containerRef && containerRef.current) {
        if (anchorNode && !containerRef.current.contains(anchorNode)) {
          setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
          return;
        }
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect && (rect.width > 0 || rect.height > 0)) {
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;

          setTooltip({
            visible: true,
            text: selectedText,
            x: rect.left + scrollX + rect.width / 2,
            y: Math.max(10, rect.top + scrollY - 12),
          });
        }
      } catch (err) {
        console.error("Error calculating selection rect:", err);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      processSelection(e.target as Node);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const target = e.target as Node;
      if (tooltipRef.current && tooltipRef.current.contains(target)) {
        return;
      }

      // Short delay to let mobile OS finish text selection range adjustment
      setTimeout(() => {
        processSelection(target);
      }, 150);
    };

    const handleSelectionChange = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
          setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        } else {
          processSelection(selection.anchorNode);
        }
      }, 200);
    };

    const handlePointerDown = (e: Event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [containerRef, disabled]);

  if (disabled || !tooltip.visible || !tooltip.text) return null;

  const triggerLookup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const word = tooltip.text;
    setTooltip({ visible: false, text: "", x: 0, y: 0 });
    // Clear text selection
    window.getSelection()?.removeAllRanges();
    onLookup(word, tooltip.furigana, tooltip.meaning);
  };

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
      className="animate-in fade-in zoom-in-90 duration-150 pointer-events-auto select-none touch-manipulation"
    >
      <button
        type="button"
        onClick={triggerLookup}
        onTouchEnd={triggerLookup}
        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-full text-xs font-extrabold shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-300/40 backdrop-blur-md"
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
