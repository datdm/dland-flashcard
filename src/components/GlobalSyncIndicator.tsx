"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
  type?: "error" | "success" | "loading";
}

export default function GlobalSyncIndicator() {
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleLoadingStart = () => setIsLoading(true);
    const handleLoadingStop = () => setIsLoading(false);

    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: number; message: string; type?: "error" | "success" | "loading" }>;
      const { id, message, type = "error" } = customEvent.detail;

      setToasts((prev) => {
        const exists = prev.some((t) => t.id === id);
        if (exists) {
          return prev.map((t) => (t.id === id ? { ...t, message, type } : t));
        }
        return [...prev, { id, message, type }];
      });

      // Auto-remove non-loading toasts after 4 seconds
      if (type !== "loading") {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
      }
    };

    const handleRemoveToast = (e: Event) => {
      const customEvent = e as CustomEvent<{ id: number }>;
      const { id } = customEvent.detail;
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      const message = customEvent.detail.message;
      const id = Date.now() + Math.random();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { id, message, type: "error" },
        })
      );
    };

    window.addEventListener("sync-loading-start", handleLoadingStart);
    window.addEventListener("sync-loading-stop", handleLoadingStop);
    window.addEventListener("sync-error", handleError);
    window.addEventListener("show-toast", handleShowToast);
    window.addEventListener("remove-toast", handleRemoveToast);

    return () => {
      window.removeEventListener("sync-loading-start", handleLoadingStart);
      window.removeEventListener("sync-loading-stop", handleLoadingStop);
      window.removeEventListener("sync-error", handleError);
      window.removeEventListener("show-toast", handleShowToast);
      window.removeEventListener("remove-toast", handleRemoveToast);
    };
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {/* Top Progress Loading Bar & Floating Sync Badge */}
      {isLoading && (
        <>
          <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 z-[99999] animate-pulse shadow-xs" />
          
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[99999] bg-gray-900/90 text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md border border-white/20 flex items-center gap-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-none tracking-wide">
            <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin shrink-0" />
            <span>⚡ Đang kết nối & tải dữ liệu từ Server...</span>
          </div>
        </>
      )}

      {/* Toast Notification Container in Top-Right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          let bgClass = "bg-rose-50 border-rose-200 text-rose-800";
          let icon = "⚠️";

          if (toast.type === "success") {
            bgClass = "bg-emerald-50 border-emerald-250 text-emerald-800";
            icon = "✅";
          } else if (toast.type === "loading") {
            bgClass = "bg-indigo-50 border-indigo-200 text-indigo-800";
            icon = "⏳";
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto border px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 transition-all duration-300 ${bgClass}`}
            >
              <div className="flex items-center gap-2">
                {toast.type === "loading" ? (
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin shrink-0"></div>
                ) : (
                  <span className="text-base shrink-0">{icon}</span>
                )}
                <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
              </div>
              {toast.type !== "loading" && (
                <button
                  onClick={() => removeToast(toast.id)}
                  className="hover:opacity-75 font-extrabold text-sm shrink-0 opacity-50"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
