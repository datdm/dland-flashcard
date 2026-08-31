"use client";

import React, { useEffect, useState, useRef } from "react";

interface Props {
  initialSeconds: number;
  onTimeUp: () => void;
  onTick?: (remainingSeconds: number) => void;
}

export default function ExamTimer({ initialSeconds, onTimeUp, onTick }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;
  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUpRef.current();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = prev - 1;
        if (onTickRef.current) onTickRef.current(next);
        if (next <= 0) {
          clearInterval(timer);
          onTimeUpRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const isLowTime = seconds <= 180; // 3 mins
  const isWarningTime = seconds <= 600 && seconds > 180; // 10 mins

  let badgeStyle = "bg-indigo-50 border-indigo-200 text-indigo-700";
  if (isLowTime) {
    badgeStyle = "bg-rose-100 border-rose-300 text-rose-700 animate-pulse";
  } else if (isWarningTime) {
    badgeStyle = "bg-amber-100 border-amber-300 text-amber-800";
  }

  return (
    <div
      className={`px-3.5 py-1.5 rounded-2xl border text-xs font-black flex items-center gap-1.5 shadow-2xs tracking-wider font-mono ${badgeStyle}`}
    >
      <span>⏱️</span>
      <span>{formatTime(seconds)}</span>
    </div>
  );
}
