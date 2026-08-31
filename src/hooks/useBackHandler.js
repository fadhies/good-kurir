// Global stack of "dismissal" handlers for the native hardware back button.
// Components register a handler (e.g. close an open modal) while a modal/dropdown
// is open. The document 'backbutton' listener is registered ONLY while the stack
// is non-empty, so when no modal is open the native default runs — which on
// Android navigates the WebView back, and closes/minimizes the app at the root.
import { useEffect, useRef } from "react";

const stack = [];
let listenerActive = false;

export function popBackHandler() {
  if (stack.length) {
    const fn = stack[stack.length - 1];
    try { fn(); } catch (_) {}
    return true;
  }
  return false;
}

function onDocBack(e) {
  if (popBackHandler()) {
    // A modal/dropdown was open — dismiss it and suppress the native default
    // so the back press doesn't also navigate away.
    try { e && e.preventDefault && e.preventDefault(); } catch (_) {}
  }
  syncListener();
}

function syncListener() {
  const need = stack.length > 0;
  if (need && !listenerActive) {
    document.addEventListener("backbutton", onDocBack, false);
    listenerActive = true;
  } else if (!need && listenerActive) {
    document.removeEventListener("backbutton", onDocBack, false);
    listenerActive = false;
  }
}

export function useBackHandler(handler, active) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const entry = () => ref.current();
    stack.push(entry);
    syncListener();
    return () => {
      const i = stack.indexOf(entry);
      if (i >= 0) stack.splice(i, 1);
      syncListener();
    };
  }, [active]);
}