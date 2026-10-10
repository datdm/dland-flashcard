"use client";

import { useEffect, useState } from "react";
import FullScreenLoading from "./FullScreenLoading";

/**
 * Theo dõi mọi lần gọi `fetch` tới API (route nội bộ `/api/*` và server) và
 * tự hiển thị loading toàn màn hình nếu có request chờ quá 5 giây.
 * Thêm header `X-Silent-Loading: 1` vào request để bỏ qua (request nền).
 */
export default function GlobalApiLoading() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const originalFetch = window.fetch;

    const isTracked = (input: RequestInfo | URL, init?: RequestInit): boolean => {
      try {
        const headers = new Headers(
          init?.headers ?? (input instanceof Request ? input.headers : undefined)
        );
        if (headers.has("x-silent-loading")) return false;

        const rawUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const url = new URL(rawUrl, window.location.origin);
        return url.pathname.startsWith("/api/") || url.pathname.includes("/api/");
      } catch {
        return false;
      }
    };

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!isTracked(input, init)) return originalFetch(input, init);

      setPending((n) => n + 1);
      try {
        return await originalFetch(input, init);
      } finally {
        setPending((n) => Math.max(0, n - 1));
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <FullScreenLoading
      show={pending > 0}
      delayMs={5000}
      title="Đang chờ phản hồi từ máy chủ..."
      subtitle="Yêu cầu đã vượt quá 5 giây và vẫn chưa hoàn tất, vui lòng kiên nhẫn chờ trong giây lát."
    />
  );
}
