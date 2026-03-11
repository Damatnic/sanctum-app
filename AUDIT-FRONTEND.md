# Frontend Audit Report — Sanctum App
**Date:** 2026-03-11  
**Auditor:** Nyx (Frontend/UI Subagent)  
**Build Status:** ✅ Passes cleanly after all fixes

---

## Summary

Full audit of all 7 pages (`/`, `/habits`, `/goals`, `/focus`, `/journal`, `/projects`, `/deadlines`) plus shared components. **8 bugs found, all fixed.**

---

## Issues Found & Fixed

### 🔴 CRITICAL: All Sub-pages Had Zero Mobile Support
**Affected:** `/habits`, `/goals`, `/focus`, `/journal`, `/projects`, `/deadlines`  
**Severity:** Critical — pages completely unusable on mobile  
**Root Cause:** All sub-page sidebars used `position: fixed` with `zIndex: 10` but the main content used `marginLeft: '220px'` unconditionally — on mobile this hid content behind or overlapped the fixed sidebar with no way to dismiss it.  
**Fix Applied to all 6 sub-pages:**
- Added `isMobile` state with `window.resize` listener  
- Added mobile header (56px fixed bar) with hamburger `☰` toggle button  
- Added sidebar overlay backdrop (click-to-close)  
- `Sidebar` component updated to accept `isOpen`, `isMobile` props — hides by default on mobile  
- Sidebar `zIndex` raised from `10` → `70` (above mobile header at 60, overlay at 65)  
- Main `marginLeft` switches to `0` on mobile; padding switches to `72px 16px 24px` (accounts for header)

---

### 🔴 CRITICAL: Heatmap Overflows Horizontally on Mobile
**Affected:** `/habits` — 12-week heatmap  
**Severity:** Critical layout break — 84 cells × 15px = ~1260px wide on any screen  
**Root Cause:** Grid used `gridTemplateColumns: 'repeat(84, 1fr)'` which on narrow screens would either crush cells or overflow  
**Fix Applied:**
- Wrapped heatmap grid in `<div style={{ overflowX: 'auto' }}>`  
- Changed grid to `repeat(84, 12px)` fixed-width columns (ensures cells render correctly at 12px each)

---

### 🟡 MEDIUM: Focus Timer Stale Closure Bug
**Affected:** `/focus` — timer completion  
**Severity:** Medium — incorrect data after multiple sessions in one page visit  
**Root Cause:** `focusMinutes` and `totalFocusSessions` were captured by closure when the `useEffect` was created (deps: `[timerRunning, timerPreset]`). After the first session completes, subsequent sessions would compute `newMinutes = focusMinutes + timerPreset` using the stale initial value instead of the current accumulated value.

```js
// BEFORE (broken): stale closure
const newMinutes = focusMinutes + timerPreset;
const newTotal = totalFocusSessions + 1;
setFocusMinutes(newMinutes);
setTotalFocusSessions(newTotal);

// AFTER (fixed): functional updates chain to always use latest values
setFocusMinutes(m => {
  const newMinutes = m + timerPreset;
  setTotalFocusSessions(n => {
    const newTotal = n + 1;
    saveData(updated, newMinutes, newTotal);
    return newTotal;
  });
  return newMinutes;
});
```

---

### 🟡 MEDIUM: Focus Page Showed "Press Space" Hint but Had No Keyboard Handler
**Affected:** `/focus`  
**Severity:** Medium — misleading UI, feature didn't work  
**Root Cause:** The keyboard spacebar listener existed in `page.tsx` (dashboard) but was never added to the dedicated `/focus` page, even though the page displays a "Press Space to start/pause" hint at the bottom.  
**Fix Applied:** Added `useEffect` keyboard handler on the `/focus` page:
```js
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
      e.preventDefault();
      setTimerRunning(r => !r);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

---

### 🟡 MEDIUM: AI Chat Panel Overflows Viewport on Mobile
**Affected:** `page.tsx` (dashboard)  
**Severity:** Medium — chat panel unusable on small phones  
**Root Cause:** Chat panel had fixed `width: '360px', right: '24px'` which overflows a 375px wide phone screen  
**Fix Applied:** Chat panel now uses full available width on mobile:
```js
right: isMobile ? '8px' : '24px',
left: isMobile ? '8px' : 'auto',
width: isMobile ? 'auto' : '360px',
```

---

### 🟡 MEDIUM: Dashboard Header Stats Pills Overflow on Mobile
**Affected:** `page.tsx` — header stat pills row  
**Severity:** Medium — pills overflow off-screen on mobile  
**Root Cause:** All 4 `<Pill>` components were always shown in a `display: flex` row with no wrap  
**Fix Applied:** Pills are now hidden entirely on mobile (the mobile header already has "Syncing..." indicator; stat pills take too much space on 375px wide screens). Gap reduced to `8px` and `flexWrap: 'wrap'` added for tablet widths.

---

### 🟢 MINOR: Stats Grids Not Responsive on Sub-pages
**Affected:** `/habits`, `/goals`, `/journal` (3-column), `/projects`, `/deadlines` (4-column)  
**Severity:** Minor — cramped but functional on tablet  
**Fix Applied:**
- 3-column grids → single column on mobile (`isMobile ? '1fr' : 'repeat(3, 1fr)'`)
- 4-column grids → 2-column on mobile (`isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'`)
- Goals/Focus page content grids → single column on mobile

---

### 🟢 MINOR: Sidebar z-index Too Low on Sub-pages
**Affected:** All sub-pages  
**Severity:** Minor — would cause sidebar to appear behind modals if both were open  
**Fix Applied:** Changed sidebar `zIndex` from `10` → `70` to maintain proper stacking context (modal overlays are at z-100, sidebars sit between page content and modals)

---

## No Issues Found

The following were inspected and are working correctly:

- ✅ **All modals open/close properly** — ✕ button works, Cancel buttons work, Escape key closes on dashboard. Sub-pages close modal on Cancel/Save/Delete.
- ✅ **All click handlers verified** — toggleHabit, incrementGoal, toggleDeadline, addHabit, addGoal, etc. all have correct optimistic update patterns with API fallback
- ✅ **Loading states** — `isLoaded` guard prevents render until data is available; dashboard shows animated splash screen while `isLoading`
- ✅ **Error states** — API errors are caught and logged; optimistic UI updates ensure users aren't blocked by API failures
- ✅ **Toast notifications** — working correctly on all pages with proper cleanup
- ✅ **Confetti animation** — fires on habit streak milestones and goal completion
- ✅ **Timer on dashboard** — preset switching, start/pause/reset all work correctly
- ✅ **Notification permission request** — correctly checks Notification API before requesting
- ✅ **Deadline urgency coloring** — overdue/today/soon/future color coding is correct
- ✅ **Journal search + mood filter** — filtering and search work correctly
- ✅ **localStorage ↔ API sync** — dashboard loads localStorage first for instant display, then fetches API and merges

---

## Build Verification

```
npx tsc --noEmit  → 0 errors
npm run build     → All 7 pages + 14 API routes compiled successfully
```

---

## Recommendations (Not Fixed — Out of Scope)

1. **Data model divergence**: Sub-pages use `id: number` (Date.now()) while dashboard uses `id: string` (from API). If a user creates items via sub-pages, those items get numeric IDs that the API won't recognize. Consider migrating sub-pages to also use the API (or at least use string IDs).
2. **Sub-pages don't fetch from API**: Sub-pages only read localStorage. Users who navigate directly to `/habits` without visiting dashboard first won't see API-synced data. Consider adding API calls to sub-pages.
3. **No Escape key handler on sub-pages**: Sub-pages don't have a keyboard Escape listener to close modals (though the ✕ button works).
4. **WebkitBoxOrient TS cast**: `journal/page.tsx` uses `WebkitBoxOrient: 'vertical' as any` — minor type hack, functionally fine.
