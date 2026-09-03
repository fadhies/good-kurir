// Tracks the route stored at each WebView history index.
// The bottom nav uses this to navigate BACK to a tab that already sits in the
// history instead of pushing a new entry. Keeping the history short means a
// hardware back press on the Home screen reaches the end of the WebView
// history, where the native shell minimizes/exits the app. Previously every
// tab switch pushed a new entry, so back on Home just walked through old tabs.

let stack = [];

export function recordLocation(idx, pathname) {
  if (idx == null) {
    // Fresh document (app start / full reload) — history starts at this entry.
    stack = [pathname];
    return;
  }
  if (idx >= stack.length) {
    // Push navigation: align any gap, then append the new route.
    while (stack.length < idx) stack.push(stack[stack.length - 1] || pathname);
    stack.push(pathname);
  } else {
    // Pop or replace: keep the target route fresh and drop what's after it.
    stack[idx] = pathname;
    stack.length = idx + 1;
  }
}

// Steps to go back to the nearest EARLIER history entry showing `pathname`,
// or 0 when there is none behind the current position.
export function nearestTabDistance(pathname) {
  const idx = window.history.state?.idx;
  if (idx == null) return 0;
  for (let i = idx - 1; i >= 0; i--) {
    if (stack[i] === pathname) return idx - i;
  }
  return 0;
}