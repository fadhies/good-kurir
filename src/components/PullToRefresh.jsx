import React, { useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { getScrollEl } from "@/lib/appScroll";

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const pullRef = useRef(0);

  function onStart(e) {
    if (refreshing) return;
    if ((getScrollEl()?.scrollTop ?? 0) > 0) return;
    active.current = true;
    startY.current = e.touches[0].clientY;
  }

  function onMove(e) {
    if (!active.current || refreshing) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0 || (getScrollEl()?.scrollTop ?? 0) > 0) {
      if (pullRef.current !== 0) {
        pullRef.current = 0;
        setPull(0);
      }
      return;
    }
    pullRef.current = Math.min(dy * 0.5, 100);
    setPull(pullRef.current);
  }

  async function onEnd() {
    if (!active.current) return;
    active.current = false;
    if (pullRef.current >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        pullRef.current = 0;
        setPull(0);
      }
    } else {
      pullRef.current = 0;
      setPull(0);
    }
  }

  return (
    <div
      onTouchStart={onStart}
      onTouchMove={onMove}
      onTouchEnd={onEnd}
      style={{ touchAction: "pan-y" }}
    >
      <div
        style={{ height: pull, overflow: "hidden" }}
        className="flex items-center justify-center"
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : pull >= THRESHOLD ? (
          <ArrowDown className="w-5 h-5 text-primary" />
        ) : pull > 0 ? (
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        ) : null}
      </div>
      {children}
    </div>
  );
}