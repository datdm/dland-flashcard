"use client";

import { useEffect, useState, useRef } from "react";

import QuickTranslateModal from "@/components/QuickTranslateModal";

interface SelectionLookupTooltipProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  disabled?: boolean;
  onLookup: (word: string, furigana?: string, meaning?: string) => void;
  onTranslate?: (text: string) => void;
}

export default function SelectionLookupTooltip({
  containerRef,
  disabled = false,
  onLookup,
  onTranslate,
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

  const [translateModalText, setTranslateModalText] = useState<string>("");
  const [isTranslateOpen, setIsTranslateOpen] = useState<boolean>(false);

  const tooltipRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);
  const isMouseDownRef = useRef<boolean>(false);

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
          el.getAttribute("aria-modal") === "true" ||
          el.getAttribute("data-modal") === "true" ||
          (el.classList &&
            (el.classList.contains("modal-overlay") ||
              el.classList.contains("modal-container") ||
              (el.classList.contains("fixed") && el.classList.contains("inset-0"))))
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

      // Check input or textarea element
      const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
      const targetEl = (targetElement && (targetElement.nodeName === "INPUT" || targetElement.nodeName === "TEXTAREA"))
        ? (targetElement as HTMLInputElement | HTMLTextAreaElement)
        : activeEl;

      if (
        targetEl &&
        (targetEl.tagName === "INPUT" || targetEl.tagName === "TEXTAREA") &&
        targetEl.type !== "password" &&
        typeof targetEl.selectionStart === "number" &&
        typeof targetEl.selectionEnd === "number" &&
        targetEl.selectionStart !== targetEl.selectionEnd
      ) {
        if (isInsideModal(targetEl)) {
          setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
          return;
        }

        const rawText = targetEl.value.substring(targetEl.selectionStart, targetEl.selectionEnd);
        const selectedText = rawText.replace(/[\r\n]+/g, " ").trim();
        if (!selectedText || selectedText.length > 200) {
          setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
          return;
        }

        const rect = targetEl.getBoundingClientRect();
        if (rect && (rect.width > 0 || rect.height > 0)) {
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;

          setTooltip({
            visible: true,
            text: selectedText,
            x: rect.left + scrollX + rect.width / 2,
            y: Math.max(10, rect.top + scrollY - 12),
          });
          return;
        }
      }

      // Standard DOM selection
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

      const rawText = selection.toString();
      const selectedText = rawText.replace(/[\r\n]+/g, " ").trim();
      // Only trigger for meaningful selections (1-200 chars)
      if (!selectedText || selectedText.length > 200) {
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
        let rect = range.getBoundingClientRect();

        if (!rect || (rect.width === 0 && rect.height === 0)) {
          const rects = range.getClientRects();
          if (rects && rects.length > 0) {
            rect = rects[0];
          } else if (range.startContainer && range.startContainer.parentElement) {
            rect = range.startContainer.parentElement.getBoundingClientRect();
          }
        }

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
      isMouseDownRef.current = false;
      setTimeout(() => {
        processSelection(e.target as Node);
      }, 10);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      isMouseDownRef.current = false;
      const target = e.target as Node;
      if (tooltipRef.current && tooltipRef.current.contains(target)) {
        return;
      }

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
          // Do not interrupt active dragging while mouse is down
          if (!isMouseDownRef.current) {
            processSelection(selection.anchorNode);
          }
        }
      }, 200);
    };

    const handlePointerDown = (e: Event) => {
      isMouseDownRef.current = true;
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };

    const handleWindowBlur = () => {
      isMouseDownRef.current = false;
    };

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchend", handleTouchEnd);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("selectionchange", handleSelectionChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("selectionchange", handleSelectionChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [containerRef, disabled]);

  const triggerLookup = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const word = tooltip.text;
    setTooltip({ visible: false, text: "", x: 0, y: 0 });
    window.getSelection()?.removeAllRanges();
    onLookup(word, tooltip.furigana, tooltip.meaning);
  };

  const triggerTranslate = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const selectedText = tooltip.text;
    setTooltip({ visible: false, text: "", x: 0, y: 0 });
    window.getSelection()?.removeAllRanges();

    if (onTranslate) {
      onTranslate(selectedText);
    } else {
      setTranslateModalText(selectedText);
      setIsTranslateOpen(true);
    }
  };

  return (
    <>
      {tooltip.visible && tooltip.text && !disabled && (
        <div
          ref={tooltipRef}
          style={{
            position: "absolute",
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
          className="animate-in fade-in zoom-in-90 duration-150 pointer-events-auto select-none touch-manipulation flex flex-col items-center"
        >
          <div className="flex items-center gap-1.5 p-1 bg-gray-900/90 text-white rounded-full shadow-2xl backdrop-blur-md border border-white/20">
            <button
              type="button"
              onClick={triggerLookup}
              onTouchEnd={triggerLookup}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-full text-xs font-extrabold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>🔍</span>
              <span>Tra Mazii</span>
            </button>

            <button
              type="button"
              onClick={triggerTranslate}
              onTouchEnd={triggerTranslate}
              className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-full text-xs font-extrabold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>🌐</span>
              <span>Dịch Tiếng Việt</span>
            </button>
          </div>

          {/* Arrow indicator */}
          <div className="w-2 h-2 bg-gray-900/90 rotate-45 mx-auto -mt-1 border-r border-b border-white/20" />
        </div>
      )}

      {/* Quick Translate Modal */}
      <QuickTranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        text={translateModalText}
      />
    </>
  );
}
