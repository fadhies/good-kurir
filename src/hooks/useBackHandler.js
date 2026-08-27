// Global stack of "dismissal" handlers for the native hardware back button.
// Components register a handler (e.g. close an open modal) while a modal/dropdown
// is open; the BackHandlerManager in App.jsx pops the topmost handler on a
// native 'backbutton' event so modals close before navigating back.
import { useEffect, useRef } from "react";

const stack = [];

export function popBackHandler() {
  if (stack.length) {
    const fn = stack[stack.length - 1];
    try { fn(); } catch (_) {}
    return true;
  }
  return false;
}

export function useBackHandler(handler, active) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const entry = () => ref.current();
    stack.push(entry);
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active]);
}