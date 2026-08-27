import React, { Suspense, useState, useLayoutEffect, useRef } from "react";
import { lazy } from "react";
import { getScrollEl } from "@/lib/appScroll";

// Tab pages are kept mounted and toggled via display so switching bottom tabs
// preserves component state and scroll position instead of remounting.
const Home = lazy(() => import("@/pages/Home"));
const NewOrder = lazy(() => import("@/pages/NewOrder"));
const MyOrders = lazy(() => import("@/pages/MyOrders"));
const DriverDashboard = lazy(() => import("@/pages/DriverDashboard"));
const DriverWallet = lazy(() => import("@/pages/DriverWallet"));

const TABS = {
  home: Home,
  pesan: NewOrder,
  "pesanan-saya": MyOrders,
  driver: DriverDashboard,
  "driver-dompet": DriverWallet,
};

const Spinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

export default function TabKeepAlive({ active }) {
  const [mounted, setMounted] = useState(() => new Set([active]));
  const scrollRef = useRef({});
  const activeRef = useRef(active);

  // Lazily mount a tab the first time it is visited, then keep it alive.
  useLayoutEffect(() => {
    setMounted((prev) => {
      if (prev.has(active)) return prev;
      const next = new Set(prev);
      next.add(active);
      return next;
    });
  }, [active]);

  // Save the outgoing tab's scroll position and restore the incoming tab's.
  useLayoutEffect(() => {
    const prev = activeRef.current;
    if (prev !== active) {
      const el = getScrollEl();
      if (el) scrollRef.current[prev] = el.scrollTop;
      activeRef.current = active;
    }
    const y = scrollRef.current[active] ?? 0;
    requestAnimationFrame(() => {
      const el = getScrollEl();
      if (el) el.scrollTo(0, y);
    });
  }, [active]);

  return (
    <Suspense fallback={<Spinner />}>
      {Object.entries(TABS).map(([key, Comp]) => {
        if (!mounted.has(key)) return null;
        const isActive = key === active;
        return (
          <div key={key} className={isActive ? "contents" : "hidden"} aria-hidden={!isActive}>
            <Comp />
          </div>
        );
      })}
    </Suspense>
  );
}