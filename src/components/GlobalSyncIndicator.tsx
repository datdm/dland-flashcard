"use client";

import { useEffect, useState } from "react";

interface Toast {
  id: number;
  message: string;
}

export default function GlobalSyncIndicator() {
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handleLoadingStart = () => setIsLoading(true);
    const handleLoadingStop = () => setIsLoading(false);
    const handleError = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      const message = customEvent.detail.message;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message }]);

      // Auto-remove toast after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener("sync-loading-start", handleLoadingStart);
    window.addEventListener("sync-loading-stop", handleLoadingStop);
    window.addEventListener("sync-error", handleError);

    return () => {
      window.removeEventListener("sync-loading-start", handleLoadingStart);
      window.removeEventListener("sync-loading-stop", handleLoadingStop);
      window.removeEventListener("sync-error", handleError);
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
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl shadow-lg flex items-center justify-between gap-3 transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <span className="text-base shrink-0">⚠️</span>
              <span className="text-xs font-bold leading-relaxed">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-rose-400 hover:text-rose-600 font-extrabold text-sm shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
