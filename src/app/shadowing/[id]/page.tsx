"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getShadowingVideoById } from "@/lib/shadowingStorage";
import { ShadowingVideo } from "@/types/shadowing";
import YouTubeShadowingPlayer from "@/components/shadowing/YouTubeShadowingPlayer";
import Link from "next/link";

export default function ShadowingStudioPage() {
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<ShadowingVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    const v = getShadowingVideoById(params.id);
    setVideo(v);
    setLoading(false);
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 max-w-md mx-auto space-y-4">
        <span className="text-5xl">📭</span>
        <h2 className="text-lg font-bold text-gray-800">Không tìm thấy video này</h2>
        <Link
          href="/shadowing"
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-700 transition-colors"
        >
          ← Quay lại danh sách video
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-h-screen pb-28 space-y-6">
      <YouTubeShadowingPlayer video={video} />
    </div>
  );
}
