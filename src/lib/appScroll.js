// The main app scroll container (set on the AnimatePresence motion.div in App.jsx).
// Centralised so ScrollToTop / PullToRefresh / TabKeepAlive all target the same
// element instead of window, which is required once the page wrapper became the
// scroll container for the directional slide transitions.
export function getScrollEl() {
  return (
    (typeof document !== "undefined" && document.getElementById("app-scroll")) ||
    (typeof document !== "undefined" && document.scrollingElement) ||
    (typeof document !== "undefined" && document.body) ||
    null
  );
}