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
      {/* Full-screen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/10 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-white text-xs font-bold mt-4 tracking-wider uppercase">Đang đồng bộ dữ liệu...</p>
            <p className="text-white/60 text-[10px] mt-1">Vui lòng đợi trong giây lát</p>
          </div>
        </div>
      )}

      {/* Toast Notification Container in Top-Right */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
